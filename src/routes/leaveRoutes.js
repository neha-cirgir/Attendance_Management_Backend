const express = require('express');
const {
  applyLeave,
  getLeaveStatusForManager,
  getLeaveStatusByEmpId,
  updateLeaveStatusByManager
} = require('../controllers/leaveController');
const { applyLeaveSchema } = require('../validators/applyLeaveSchema');

const router = express.Router();

router.get('/leave-status/:empid', getLeaveStatusByEmpId);
router.get('/manager-leave-status', getLeaveStatusForManager);
router.get('/manager-leave-status/:managerName', getLeaveStatusForManager);
router.patch('/leave-management/status/:leaveId', updateLeaveStatusByManager);

module.exports = router;
