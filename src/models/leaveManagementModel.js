const mongoose = require('mongoose');

const leaveManagementSchema = new mongoose.Schema({
  empId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Employee'
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  leaveRefId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Leave'
    // removed required: true
  },
  leaveType: {
    type: String,
    enum: ['Sick Leave', 'Casual Leave'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  appliedDays: {
    type: Number,
    required: true,
    min: 1
  }
});

module.exports = mongoose.model('LeaveManagement', leaveManagementSchema);
