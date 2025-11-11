const mongoose = require('mongoose');
 
const loginSchema = new mongoose.Schema({
  employee_id: {
    type: Number,
    required: true,
    unique: true
  },
  employee_ref_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  password: {
    type: String,
    required: true
  },
  activeToken: {
    type: String,
    default: null
  }
}, { collection: 'login' });
 
module.exports = mongoose.model('Login', loginSchema);