const express = require('express');
const router = express.Router();
const Request = require('../models/Request');
const Asset = require('../models/Asset');
const { requireLogin, requireRole } = require('../middleware/auth');

// Require login and staff roles (lab_incharge or admin)
router.use(requireLogin);
router.use(requireRole('lab_incharge', 'admin'));

// GET: View all requests (with filter option)
router.get('/requests', async (req, res) => {
  const { status } = req.query;

  try {
    const filter = status ? { status } : {};
    const requests = await Request.find(filter)
      .populate('asset')
      .populate('requester')
      .sort({ createdAt: -1 });

    const now = new Date();

    // Mark overdue requests: current date > expectedReturnDate and status is not Returned
    const requestsWithOverdue = requests.map(r => {
      const isOverdue = now > new Date(r.expectedReturnDate) && r.status !== 'Returned' && r.status !== 'Rejected';
      return {
        ...r.toObject(),
        isOverdue
      };
    });

    res.render('requests', {
      title: 'Manage Equipment Requests',
      requests: requestsWithOverdue,
      user: req.session.user,
      isStaffView: true,
      currentFilter: status || 'All',
      error: req.query.error || null,
      success: req.query.success || null
    });
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.redirect('/dashboard');
  }
});

// POST: Approve a pending request
router.post('/requests/:id/approve', async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.redirect('/requests?error=Request+not+found');
    }

    if (request.status !== 'Pending') {
      return res.redirect('/requests?error=Only+Pending+requests+can+be+approved');
    }

    // CHECK: requested quantity <= available quantity
    const asset = await Asset.findById(request.asset);
    if (!asset) {
      return res.redirect('/requests?error=Associated+asset+not+found');
    }

    if (request.quantity > asset.availableQuantity) {
      return res.redirect(`/requests?error=Cannot+approve:+Requested+quantity+(${request.quantity})+exceeds+available+stock+(${asset.availableQuantity})`);
    }

    request.status = 'Approved';
    await request.save();

    res.redirect('/requests?success=Request+approved+successfully');
  } catch (error) {
    console.error('Error approving request:', error);
    res.redirect('/requests?error=Failed+to+approve+request');
  }
});

// POST: Reject a request
router.post('/requests/:id/reject', async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.redirect('/requests?error=Request+not+found');
    }

    if (request.status === 'Issued' || request.status === 'Returned') {
      return res.redirect('/requests?error=Cannot+reject+an+already+issued+or+returned+request');
    }

    request.status = 'Rejected';
    await request.save();

    res.redirect('/requests?success=Request+rejected');
  } catch (error) {
    console.error('Error rejecting request:', error);
    res.redirect('/requests?error=Failed+to+reject+request');
  }
});

// POST: Issue equipment to requester
router.post('/requests/:id/issue', async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.redirect('/requests?error=Request+not+found');
    }

    if (request.status !== 'Approved' && request.status !== 'Pending') {
      return res.redirect('/requests?error=Request+must+be+Pending+or+Approved+to+issue');
    }

    const asset = await Asset.findById(request.asset);
    if (!asset) {
      return res.redirect('/requests?error=Associated+asset+not+found');
    }

    // CHECK: requested quantity <= available quantity
    if (request.quantity > asset.availableQuantity) {
      return res.redirect(`/requests?error=Cannot+issue:+Requested+quantity+(${request.quantity})+exceeds+available+stock+(${asset.availableQuantity})`);
    }

    // Deduct available quantity
    asset.availableQuantity -= request.quantity;
    await asset.save();

    // Update request state
    request.status = 'Issued';
    request.issuedAt = new Date();
    await request.save();

    res.redirect('/requests?success=Equipment+issued+successfully.+Stock+updated.');
  } catch (error) {
    console.error('Error issuing equipment:', error);
    res.redirect('/requests?error=Failed+to+issue+equipment');
  }
});

// POST: Record equipment return
router.post('/requests/:id/return', async (req, res) => {
  const { returnCondition } = req.body;

  try {
    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.redirect('/requests?error=Request+not+found');
    }

    if (request.status !== 'Issued') {
      return res.redirect('/requests?error=Only+issued+equipment+can+be+marked+returned');
    }

    const asset = await Asset.findById(request.asset);
    if (!asset) {
      return res.redirect('/requests?error=Associated+asset+not+found');
    }

    // Restore available quantity
    asset.availableQuantity += request.quantity;

    // If returned in Damaged or Lost condition, update asset condition so it is tracked on dashboard
    if (returnCondition === 'Damaged' || returnCondition === 'Lost') {
      asset.condition = returnCondition;
    }
    await asset.save();

    // Mark request as Returned
    request.status = 'Returned';
    request.returnedAt = new Date();
    request.returnCondition = returnCondition || 'OK';
    await request.save();

    res.redirect('/requests?success=Equipment+return+recorded+successfully.+Stock+restored.');
  } catch (error) {
    console.error('Error recording return:', error);
    res.redirect('/requests?error=Failed+to+record+return');
  }
});

module.exports = router;
