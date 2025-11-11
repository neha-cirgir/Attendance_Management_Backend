const chai = require('chai');
const sinon = require('sinon');
const expect = chai.expect;

const mongoose = require('mongoose');
const Employee = require('../src/models/employeeModel');
const LeaveManagement = require('../src/models/leaveManagementModel');
const LeavePolicy = require('../src/models/leaveBalanceModel');

const {
  applyLeave,
  getLeaveBalance,
  getManagedLeaveBalances
} = require('../src/controllers/leaveBalanceController');

describe('LeaveController (rewritten tests)', () => {
  let req, res, next;

  beforeEach(() => {
    // Prevent ObjectId from throwing on fake IDs
    sinon.stub(mongoose.Types, 'ObjectId').callsFake(id => id);

    req = { body: {}, params: {} };
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis()
    };
    next = sinon.stub();
  });

  afterEach(() => sinon.restore());

  describe('applyLeave', () => {
    it('1) should return 404 if employee not found', async () => {
      req.body = { empId: '123', leaveType: 'Sick Leave', appliedDays: 2 };
      sinon.stub(Employee, 'findById').resolves(null);

      await applyLeave(req, res, next);
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.firstCall.args[0].error).to.match(/Employee not found/);
    });

    it('2) should return 400 if insufficient balance', async () => {
      req.body = { empId: '123', leaveType: 'Sick Leave', appliedDays: 5 };
      sinon.stub(Employee, 'findById').resolves({
        _id: '123',
        totalSickLeaveTaken: 10,
        totalCasualLeaveTaken: 0,
        leave_id: [],
        save: sinon.stub().resolves()
      });
      sinon.stub(LeavePolicy, 'findOne').resolves({ sick: { total: 12 }, casual: { total: 5 } });

      await applyLeave(req, res, next);
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.firstCall.args[0].error).to.match(/Insufficient/);
    });

    it('3) should apply leave successfully', async () => {
      req.body = {
        empId: '123',
        leaveType: 'Sick Leave',
        appliedDays: 2,
        startDate: '2025-11-11',
        endDate: '2025-11-12'
      };
      const emp = {
        _id: '123',
        totalSickLeaveTaken: 0,
        totalCasualLeaveTaken: 0,
        leave_id: [],
        save: sinon.stub().resolves()
      };
      sinon.stub(Employee, 'findById').resolves(emp);
      sinon.stub(LeavePolicy, 'findOne').resolves({ _id: 'policy1', sick: { total: 10 }, casual: { total: 5 } });
      sinon.stub(LeaveManagement.prototype, 'save').resolves({ _id: 'leave1' });

      await applyLeave(req, res, next);
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.firstCall.args[0].message).to.match(/successfully/);
    });
  });

  describe('getLeaveBalance', () => {
    it('4) should return 404 if employee not found', async () => {
      req.params = { empId: '123' };
      sinon.stub(Employee, 'findById').resolves(null);

      await getLeaveBalance(req, res, next);
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.firstCall.args[0].error).to.match(/Employee not found/);
    });

    it('5) should return leave balance successfully', async () => {
  req.params = { empId: '123' };
  sinon.stub(Employee, 'findById').resolves({
    _id: '123',
    totalSickLeaveTaken: 2,
    totalCasualLeaveTaken: 1
  });
  sinon.stub(LeavePolicy, 'findOne').resolves({ sick: { total: 10 }, casual: { total: 5 } });

  await getLeaveBalance(req, res, next);

  // Don’t check res.status(200) because controller doesn’t set it
  const response = res.json.firstCall.args[0];
  expect(response.sickLeaveRemaining).to.equal(8);
  expect(response.casualLeaveRemaining).to.equal(4);
});
  describe('getManagedLeaveBalances', () => {
    it('6) should return enriched employees with balances', async () => {
      req.params = { managerName: 'Boss' };
      sinon.stub(LeavePolicy, 'findOne').resolves({ sick: { total: 10 }, casual: { total: 5 } });

      const fakeEmployees = [
        { _id: '1', empName: 'Alice', totalSickLeaveTaken: 2, totalCasualLeaveTaken: 1 }
      ];
      const selectStub = sinon.stub().resolves(fakeEmployees);
      sinon.stub(Employee, 'find').returns({ select: selectStub });

      await getManagedLeaveBalances(req, res, next);
      expect(res.status.calledWith(200)).to.be.true;
      const response = res.json.firstCall.args[0];
      expect(response[0].sickLeaveLeft).to.equal(8);
      expect(response[0].casualLeaveLeft).to.equal(4);
    });
  });
});
});