const mongoose = require('mongoose');

// Maintenance Schema for tracking equipment servicing and repairs
const maintenanceSchema = new mongoose.Schema({
  asset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    required: true
  },
  serviceDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  cost: {
    type: Number,
    required: true,
    min: 0
  },
  nextServiceDue: {
    type: Date,
    required: true
  },
  notes: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Maintenance', maintenanceSchema);
