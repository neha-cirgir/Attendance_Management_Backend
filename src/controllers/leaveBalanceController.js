const mongoose = require('mongoose');
const LeaveManagement = require('../models/leaveManagementModel');
const Employee = require('../models/employeeModel');
const Leave = require('../models/leaveBalanceModel');
const LeavePolicy = require('../models/leaveBalanceModel');

// Apply leave
exports.applyLeave = async (req, res) => {
    try {
        const { empId, leaveType, startDate, endDate, appliedDays } = req.body;
        const empObjectId = new mongoose.Types.ObjectId(empId);

        const employee = await Employee.findById(empObjectId);
        if (!employee) return res.status(404).json({ error: 'Employee not found' });

        const leavePolicy = await Leave.findOne();
        if (!leavePolicy) return res.status(500).json({ error: 'Leave policy not found' });

        const currentTaken = leaveType === 'Sick Leave'
            ? employee.totalSickLeaveTaken
            : employee.totalCasualLeaveTaken;

        const maxAllowed = leaveType === 'Sick Leave'
            ? leavePolicy.sick.total
            : leavePolicy.casual.total;

        if (currentTaken + appliedDays > maxAllowed) {
            return res.status(400).json({ error: 'Insufficient leave balance' });
        }

        // Always set status to 'pending'
        const newLeave = new LeaveManagement({
            empId: empObjectId,
            leaveRefId: leavePolicy._id,
            startDate,
            endDate,
            leaveType,
            appliedDays,
            status: 'pending'
        });

        await newLeave.save();

        // Update counters
        if (leaveType === 'Sick Leave') {
            employee.totalSickLeaveTaken += appliedDays;
        } else {
            employee.totalCasualLeaveTaken += appliedDays;
        }

        // Link leave record to employee
        employee.leave_id.push(newLeave._id);
        await employee.save();

        res.status(201).json({ message: 'Leave applied successfully', data: newLeave });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update leave status
exports.updateLeaveStatus = async (req, res) => {
    try {
        const leaveManagementId = req.params.leaveManagementId.trim();
        const { status } = req.body;

        const leaveRequest = await LeaveManagement.findById(leaveManagementId);
        if (!leaveRequest) return res.status(404).json({ error: 'Leave request not found' });

        const employee = await Employee.findById(leaveRequest.empId);
        if (!employee) return res.status(404).json({ error: 'Employee not found' });

        // Adjust counters only if rejecting a previously non-rejected leave
        if (leaveRequest.status !== 'rejected' && status === 'rejected') {
            if (leaveRequest.leaveType === 'Sick Leave') {
                employee.totalSickLeaveTaken = Math.max(0, employee.totalSickLeaveTaken - leaveRequest.appliedDays);
            } else {
                employee.totalCasualLeaveTaken = Math.max(0, employee.totalCasualLeaveTaken - leaveRequest.appliedDays);
            }
            await employee.save();
        }

        leaveRequest.status = status;
        await leaveRequest.save();

        res.json({ message: 'Leave status updated', data: leaveRequest });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get leave balance
exports.getLeaveBalance = async (req, res) => {
    try {
        const empId = req.params.empId.trim();
        const empObjectId = new mongoose.Types.ObjectId(empId);

        const employee = await Employee.findById(empObjectId);
        if (!employee) return res.status(404).json({ error: 'Employee not found' });

        const leavePolicy = await Leave.findOne();
        if (!leavePolicy) return res.status(500).json({ error: 'Leave policy not found' });

        const sickUsed = employee.totalSickLeaveTaken || 0;
        const casualUsed = employee.totalCasualLeaveTaken || 0;

        const sickRemaining = leavePolicy.sick.total - sickUsed;
        const casualRemaining = leavePolicy.casual.total - casualUsed;

        res.json({
            empId,
            sickLeaveUsed: sickUsed,
            sickLeaveRemaining: sickRemaining,
            casualLeaveUsed: casualUsed,
            casualLeaveRemaining: casualRemaining
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get managed leave balances
exports.getManagedLeaveBalances = async (req, res, next) => {
    try {
        const { managerName } = req.params;

        const leavePolicy = await LeavePolicy.findOne({});
        if (!leavePolicy) {
            return res.status(500).json({ message: 'Leave policy configuration missing.' });
        }

        const totalSick = leavePolicy.sick.total;
        const totalCasual = leavePolicy.casual.total;

        const employees = await Employee.find({ managerName: managerName })
            .select('_id empName totalSickLeaveTaken totalCasualLeaveTaken');

        if (!employees || employees.length === 0) {
            return res.status(200).json([]);
        }

        const enrichedEmployees = employees.map(emp => {
            const sickTaken = emp.totalSickLeaveTaken || 0;
            const casualTaken = emp.totalCasualLeaveTaken || 0;

            return {
                _id: emp._id,
                empName: emp.empName,
                totalSickLeaveBalance: totalSick,
                sickLeaveTaken: sickTaken,
                sickLeaveLeft: totalSick - sickTaken,
                totalCasualLeaveBalance: totalCasual,
                casualLeaveTaken: casualTaken,
                casualLeaveLeft: totalCasual - casualTaken
            };
        });

        res.status(200).json(enrichedEmployees);
    } catch (error) {
        next(error);
    }
};
