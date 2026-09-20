const express = require('express');
const router = express.Router();
const Asset = require('../models/Asset');
const Request = require('../models/Request');
const { requireLogin } = require('../middleware/auth');

// All requester routes require login
router.use(requireLogin);

// GET: View available equipment for borrowing
router.get('/equipment', async (req, res) => {
  try {
    // Show assets that are in OK condition and have available stock
    const assets = await Asset.find({ condition: 'OK', availableQuantity: { $gt: 0 } }).sort({ name: 1 });

    res.render('equipment', {
      title: 'Available Equipment',
      assets,
      user: req.session.user
    });
  } catch (error) {
    console.error('Error loading equipment:', error);
    res.redirect('/dashboard');
  }
});

// GET: Equipment issue request form
router.get('/request/:assetId', async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.assetId);
    if (!asset || asset.availableQuantity <= 0) {
      return res.redirect('/equipment');
    }

    res.render('request-form', {
      title: 'Request Equipment',
      asset,
      user: req.session.user,
      error: null
    });
  } catch (error) {
    console.error('Error opening request form:', error);
    res.redirect('/equipment');
  }
});

// POST: Submit equipment request
router.post('/request', async (req, res) => {
  const { assetId, quantity, purpose, expectedReturnDate } = req.body;

  try {
    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.redirect('/equipment');
    }

    if (!quantity || !purpose || !expectedReturnDate) {
      return res.render('request-form', {
        title: 'Request Equipment',
        asset,
        user: req.session.user,
        error: 'Please fill in all required fields.'
      });
    }

    const requestedQty = parseInt(quantity, 10);

    // Validate requested quantity
    if (requestedQty <= 0 || requestedQty > asset.availableQuantity) {
      return res.render('request-form', {
        title: 'Request Equipment',
        asset,
        user: req.session.user,
        error: `Invalid quantity. Please enter between 1 and ${asset.availableQuantity} units.`
      });
    }

    // Validate expected return date
    if (!expectedReturnDate || new Date(expectedReturnDate) < new Date().setHours(0, 0, 0, 0)) {
      return res.render('request-form', {
        title: 'Request Equipment',
        asset,
        user: req.session.user,
        error: 'Expected return date cannot be in the past.'
      });
    }

    // Create new request with 'Pending' status
    const newRequest = new Request({
      asset: asset._id,
      requester: req.session.user.id,
      quantity: requestedQty,
      purpose: purpose.trim(),
      expectedReturnDate: new Date(expectedReturnDate),
      status: 'Pending'
    });

    await newRequest.save();

    res.redirect('/my-requests?success=Request+submitted+successfully');
  } catch (error) {
    console.error('Error submitting request:', error);
    res.redirect('/equipment');
  }
});

// GET: Requester's personal requests list
router.get('/my-requests', async (req, res) => {
  try {
    const requests = await Request.find({ requester: req.session.user.id })
      .populate('asset')
      .sort({ createdAt: -1 });

    const now = new Date();

    // Attach simple isOverdue flag to each request: current date > expectedReturnDate and status is not Returned
    const requestsWithOverdue = requests.map(r => {
      const isOverdue = now > new Date(r.expectedReturnDate) && r.status !== 'Returned' && r.status !== 'Rejected';
      return {
        ...r.toObject(),
        isOverdue
      };
    });

    res.render('requests', {
      title: 'My Equipment Requests',
      requests: requestsWithOverdue,
      user: req.session.user,
      isStaffView: false,
      error: req.query.error || null,
      success: req.query.success || null
    });
  } catch (error) {
    console.error('Error loading user requests:', error);
    res.redirect('/dashboard');
  }
});

module.exports = router;
