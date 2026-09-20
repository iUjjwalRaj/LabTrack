const express = require('express');
const router = express.Router();
const Asset = require('../models/Asset');
const Request = require('../models/Request');
const { requireLogin } = require('../middleware/auth');

// GET: Dashboard statistics & summary
router.get('/dashboard', requireLogin, async (req, res) => {
  try {
    // 1. Total Assets count
    const totalAssets = await Asset.countDocuments();

    // 2. Fetch all assets to calculate total available units
    const assets = await Asset.find();
    const totalAvailableUnits = assets.reduce((sum, a) => sum + a.availableQuantity, 0);

    // 3. Fetch currently Issued requests to calculate issued units and overdue returns
    const issuedRequests = await Request.find({ status: 'Issued' })
      .populate('asset')
      .populate('requester');

    const totalIssuedUnits = issuedRequests.reduce((sum, r) => sum + r.quantity, 0);

    // 4. Overdue returns calculation: current date > expectedReturnDate
    const now = new Date();
    const overdueRequests = issuedRequests.filter(r => new Date(r.expectedReturnDate) < now);
    const overdueCount = overdueRequests.length;

    // 5. Damaged or Lost assets count and list
    const damagedOrLostAssets = await Asset.find({ condition: { $in: ['Damaged', 'Lost'] } });

    // 6. Recent requests for quick overview
    let recentRequestsQuery = {};
    if (req.session.user.role === 'requester') {
      // Requesters only see their own recent requests
      recentRequestsQuery = { requester: req.session.user.id };
    }
    const recentRequests = await Request.find(recentRequestsQuery)
      .populate('asset')
      .populate('requester')
      .sort({ createdAt: -1 })
      .limit(6);

    res.render('dashboard', {
      title: 'Lab Dashboard',
      user: req.session.user,
      stats: {
        totalAssets,
        totalAvailableUnits,
        totalIssuedUnits,
        overdueCount,
        damagedOrLostCount: damagedOrLostAssets.length
      },
      overdueRequests,
      damagedOrLostAssets,
      recentRequests
    });
  } catch (error) {
    console.error('Dashboard calculation error:', error);
    res.render('error', {
      title: 'Error',
      message: 'Failed to load dashboard statistics.',
      user: req.session.user
    });
  }
});

module.exports = router;
