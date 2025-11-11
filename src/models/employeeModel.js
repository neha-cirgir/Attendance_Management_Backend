
const mongoose = require('mongoose');
// 
const employeeSchema = new mongoose.Schema({
  empName: {
    type: String,
    required: true,
    trim: true,
    minlength: 3
  },
  isManager: {
    type: Boolean,
    default: false
  },
  managerName: {
    type: String,
    trim: true,
    required: function () {
      return !this.isManager;
    }
  },
  totalSickLeaveTaken: {
    type: Number,
    default: 0,
    min: 0
  },
  totalCasualLeaveTaken: {
    type: Number,
    default: 0,
    min: 0
  },
  attendance_id: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attendance'
  }],
  leave_id: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LeaveManagement'
  }]
}, { timestamps: true });

module.exports = mongoose.model('Employee', employeeSchema, 'employee');
