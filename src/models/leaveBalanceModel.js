const mongoose = require('mongoose');

const leaveTypeSchema = new mongoose.Schema({
  total: { type: Number, required: true, default: 0 }
});

const leaveSchema = new mongoose.Schema({
  leaveId: { type: mongoose.Schema.Types.ObjectId, required: true },
  sick: { type: leaveTypeSchema, required: true, default: () => ({ total: 0 }) },
  casual: { type: leaveTypeSchema, required: true, default: () => ({ total: 0 }) }
});

module.exports = mongoose.model('Leave', leaveSchema, 'leaveBalance');
