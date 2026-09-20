const mongoose = require('mongoose');

// Request Schema for Equipment Issue and Return Workflow
const requestSchema = new mongoose.Schema({
  asset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    required: true
  },
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  purpose: {
    type: String,
    required: true,
    trim: true
  },
  expectedReturnDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Issued', 'Returned'],
    default: 'Pending'
  },
  issuedAt: {
    type: Date
  },
  returnedAt: {
    type: Date
  },
  returnCondition: {
    type: String,
    enum: ['OK', 'Damaged', 'Lost']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Request', requestSchema);
