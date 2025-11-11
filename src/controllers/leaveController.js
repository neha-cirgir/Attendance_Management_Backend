const { v4: uuidv4 } = require('uuid');
const Employee = require('../models/employeeModel');
const LeaveManagement = require('../models/leaveManagementModel');


function calculateDays(start, end) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffTime = Math.abs(endDate - startDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

async function applyLeave(req, res) {
  const { empid, empname, startdate, enddate, leavetype } = req.body;

  if (!empid || !empname || !startdate || !enddate || !leavetype) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const normalizedLeaveType = leavetype.toLowerCase();
  if (!['sick', 'casual'].includes(normalizedLeaveType)) {
    return res.status(400).json({ error: 'Invalid leave type' });
  }

  const number_of_days = calculateDays(startdate, enddate);

  try {
    const newLeave = new LeaveManagement({
      leaveManagementId: uuidv4(),
      empId: empid,
      empName: empname,
      startDate: startdate,
      endDate: enddate,
      leaveRefId: uuidv4(),
      leaveType: normalizedLeaveType,
      appliedDays: number_of_days
    });

    await newLeave.save();
    res.status(201).json({
      message: 'Leave applied successfully',
      leave_id: newLeave.leaveManagementId
    });
  } catch (err) {
    console.error('Error applying leave:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getLeaveStatusByEmpId(req, res) {
  const { empid } = req.params;

  try {
    const records = await LeaveManagement.find({ empId: empid });

    if (records.length === 0) {
      return res.status(404).json({ error: 'No leave records found for this employee' });
    }

    const statusSummary = records.map(record => ({
      leave_id: record.leaveManagementId,
      leavetype: record.leaveType,
      startdate: record.startDate,
      enddate: record.endDate,
      status: record.status
    }));

    res.json({
      employee_id: empid,
      leave_status: statusSummary
    });
  } catch (err) {
    console.error('Error fetching leave status:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getLeaveStatusForManager(req, res) {
  const { managerName } = req.params;

  try {
    let data;
    if (managerName) {
      const employees = await Employee.find({ managerName });
      const empIds = employees.map(e => e._id);

      data = await LeaveManagement.find({
        empId: { $in: empIds },
        status: 'pending'
      }).populate('empId', 'empName');
    } else {
      data = await LeaveManagement.find({ status: 'pending' })
        .populate('empId', 'empName');
    }

    if (data.length === 0) {
      return res.status(404).json({ message: 'No pending leave records found' });
    }

    res.json({
      viewed_by: managerName || 'Manager',
      leave_records: data
    });
  } catch (err) {
    console.error('Error fetching manager leave status:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}


async function updateLeaveStatusByManager(req, res) {
  const { leaveId } = req.params;
  const { status } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status value. Must be "approved" or "rejected".' });
  }

  try {
    const leaveRecord = await LeaveManagement.findById(leaveId);
    if (!leaveRecord) {
      return res.status(404).json({ error: 'Leave record not found' });
    }

    const employee = await Employee.findById(leaveRecord.empId);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // If leave was previously pending or approved, and now rejected, adjust counters
    if (leaveRecord.status !== 'rejected' && status === 'rejected') {
      console.log('Rejecting leave, adjusting counters');

      if (leaveRecord.leaveType === 'sick') {
        employee.totalSickLeaveTaken = Math.max(0, employee.totalSickLeaveTaken - leaveRecord.appliedDays);
      } else if (leaveRecord.leaveType === 'casual') {
        employee.totalCasualLeaveTaken = Math.max(0, employee.totalCasualLeaveTaken - leaveRecord.appliedDays);
      }

      await employee.save();
    }

    leaveRecord.status = status;
    await leaveRecord.save();

    res.status(200).json({
      message: `Leave status updated to "${status}"`,
      updated_leave: {
        leave_id: leaveRecord._id,
        employee_id: leaveRecord.empId,
        employee_name: leaveRecord.empName,
        leave_type: leaveRecord.leaveType,
        start_date: leaveRecord.startDate,
        end_date: leaveRecord.endDate,
        status: leaveRecord.status
      }
    });
  } catch (error) {
    console.error(`Error updating leave status for leaveId ${leaveId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  applyLeave,
  getLeaveStatusByEmpId,
  getLeaveStatusForManager,
  updateLeaveStatusByManager
};
