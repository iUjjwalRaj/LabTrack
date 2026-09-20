const express = require('express');
const router = express.Router();
const Asset = require('../models/Asset');
const Request = require('../models/Request');
const Maintenance = require('../models/Maintenance');
const { requireLogin, requireRole } = require('../middleware/auth');

// All admin routes require login
router.use(requireLogin);

// GET: View all assets (accessible to admin and lab_incharge)
router.get('/assets', async (req, res) => {
  try {
    const assets = await Asset.find().sort({ createdAt: -1 });
    res.render('assets', {
      title: 'Lab Assets Inventory',
      assets,
      user: req.session.user,
      error: req.query.error || null,
      success: req.query.success || null
    });
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.redirect('/dashboard');
  }
});

// GET: Form to add new asset (Admin only)
router.get('/assets/new', requireRole('admin'), (req, res) => {
  res.render('asset-form', {
    title: 'Add New Asset',
    action: '/assets/new',
    asset: {},
    isEdit: false,
    user: req.session.user,
    error: null
  });
});

// POST: Create new asset (Admin only)
router.post('/assets/new', requireRole('admin'), async (req, res) => {
  const { assetTag, name, category, location, condition, quantity } = req.body;

  try {
    // Check if asset tag already exists
    const existingAsset = await Asset.findOne({ assetTag: assetTag.trim().toUpperCase() });
    if (existingAsset) {
      return res.render('asset-form', {
        title: 'Add New Asset',
        action: '/assets/new',
        asset: req.body,
        isEdit: false,
        user: req.session.user,
        error: `Asset Tag "${assetTag}" already exists. Please use a unique tag.`
      });
    }

    const qty = parseInt(quantity, 10);
    const newAsset = new Asset({
      assetTag: assetTag.trim().toUpperCase(),
      name: name.trim(),
      category: category.trim(),
      location: location.trim(),
      condition: condition || 'OK',
      quantity: qty,
      availableQuantity: qty // Initially all are available
    });

    await newAsset.save();
    res.redirect('/assets?success=Asset+created+successfully');
  } catch (error) {
    console.error('Error creating asset:', error);
    res.render('asset-form', {
      title: 'Add New Asset',
      action: '/assets/new',
      asset: req.body,
      isEdit: false,
      user: req.session.user,
      error: 'Failed to create asset. Please check the inputs.'
    });
  }
});

// GET: Form to edit asset (Admin only)
router.get('/assets/edit/:id', requireRole('admin'), async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.redirect('/assets?error=Asset+not+found');
    }

    res.render('asset-form', {
      title: 'Edit Asset',
      action: `/assets/edit/${asset._id}`,
      asset,
      isEdit: true,
      user: req.session.user,
      error: null
    });
  } catch (error) {
    console.error('Error loading asset edit form:', error);
    res.redirect('/assets?error=Invalid+asset+ID');
  }
});

// POST: Update asset (Admin only)
router.post('/assets/edit/:id', requireRole('admin'), async (req, res) => {
  const { assetTag, name, category, location, condition, quantity } = req.body;

  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.redirect('/assets?error=Asset+not+found');
    }

    const newTotalQty = parseInt(quantity, 10);
    const difference = newTotalQty - asset.quantity;
    const newAvailableQty = Math.max(0, asset.availableQuantity + difference);

    asset.assetTag = assetTag.trim().toUpperCase();
    asset.name = name.trim();
    asset.category = category.trim();
    asset.location = location.trim();
    asset.condition = condition || asset.condition;
    asset.quantity = newTotalQty;
    asset.availableQuantity = newAvailableQty;

    await asset.save();
    res.redirect('/assets?success=Asset+updated+successfully');
  } catch (error) {
    console.error('Error updating asset:', error);
    res.redirect('/assets?error=Failed+to+update+asset');
  }
});

// POST: Delete asset (Admin only)
router.post('/assets/delete/:id', requireRole('admin'), async (req, res) => {
  try {
    // Check if any active requests exist for this asset
    const activeRequest = await Request.findOne({
      asset: req.params.id,
      status: { $in: ['Pending', 'Approved', 'Issued'] }
    });

    if (activeRequest) {
      return res.redirect('/assets?error=Cannot+delete+asset+with+active+or+issued+requests');
    }

    await Asset.findByIdAndDelete(req.params.id);
    res.redirect('/assets?success=Asset+deleted+successfully');
  } catch (error) {
    console.error('Error deleting asset:', error);
    res.redirect('/assets?error=Failed+to+delete+asset');
  }
});

// GET: Maintenance history & log form (Admin & Lab In-charge)
router.get('/maintenance', requireRole('admin', 'lab_incharge'), async (req, res) => {
  try {
    const logs = await Maintenance.find().populate('asset').sort({ serviceDate: -1 });
    const assets = await Asset.find().sort({ name: 1 });

    res.render('maintenance', {
      title: 'Equipment Maintenance Log',
      logs,
      assets,
      user: req.session.user,
      error: req.query.error || null,
      success: req.query.success || null
    });
  } catch (error) {
    console.error('Error fetching maintenance records:', error);
    res.redirect('/dashboard');
  }
});

// POST: Add new maintenance log (Admin & Lab In-charge)
router.post('/maintenance', requireRole('admin', 'lab_incharge'), async (req, res) => {
  const { asset, serviceDate, cost, nextServiceDue, notes } = req.body;

  try {
    const log = new Maintenance({
      asset,
      serviceDate: serviceDate || new Date(),
      cost: parseFloat(cost) || 0,
      nextServiceDue,
      notes: notes.trim()
    });

    await log.save();
    res.redirect('/maintenance?success=Maintenance+record+saved+successfully');
  } catch (error) {
    console.error('Error saving maintenance record:', error);
    res.redirect('/maintenance?error=Failed+to+save+maintenance+record');
  }
});

module.exports = router;
