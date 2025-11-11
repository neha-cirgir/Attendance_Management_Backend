const express = require('express');
const { validationResult } = require('express-validator');
const router = express.Router();
 
const { applyLeaveSchema } = require('../validators/applyLeaveSchema');
const {
  applyLeave,
  updateLeaveStatus,
  getLeaveBalance,
  getManagedLeaveBalances
} = require('../controllers/leaveBalanceController');


// Apply for leave with validation
router.post('/leave-management/apply', applyLeaveSchema, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  applyLeave(req, res);
});
 
// Update leave status (approve/reject)
router.patch('/leave-management/status/:leaveManagementId', updateLeaveStatus);
 
// Get leave balance for an employee
router.get('/leave-management/balance/:empId', getLeaveBalance);

router.get('/leave-management/mgr_leave_balance/:managerName', getManagedLeaveBalances);
 
module.exports = router;
 
 