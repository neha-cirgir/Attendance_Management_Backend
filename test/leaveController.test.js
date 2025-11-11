const chai = require('chai');
const sinon = require('sinon');
const expect = chai.expect;

const Employee = require('../src/models/employeeModel');
const LeaveManagement = require('../src/models/leaveManagementModel');

const {
  getLeaveStatusByEmpId,
  getLeaveStatusForManager
} = require('../src/controllers/leaveController'); 

describe('LeaveStatusController', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {} };
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis()
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('getLeaveStatusByEmpId', () => {
    it('should return 404 if no records found', async () => {
      req.params = { empid: 'emp1' };
      sinon.stub(LeaveManagement, 'find').resolves([]);

      await getLeaveStatusByEmpId(req, res);
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ error: 'No leave records found for this employee' })).to.be.true;
    });

    it('should return leave status summary if records exist', async () => {
      req.params = { empid: 'emp1' };
      sinon.stub(LeaveManagement, 'find').resolves([
        { leaveManagementId: 'l1', leaveType: 'Sick Leave', startDate: '2025-11-10', endDate: '2025-11-12', status: 'pending' }
      ]);

      await getLeaveStatusByEmpId(req, res);
      expect(res.json.called).to.be.true;
      const response = res.json.firstCall.args[0];
      expect(response.employee_id).to.equal('emp1');
      expect(response.leave_status[0].leavetype).to.equal('Sick Leave');
    });

    it('should handle errors gracefully', async () => {
      req.params = { empid: 'emp1' };
      sinon.stub(LeaveManagement, 'find').rejects(new Error('DB error'));

      await getLeaveStatusByEmpId(req, res);
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWith({ error: 'Internal server error' })).to.be.true;
    });
  });

  describe('getLeaveStatusForManager', () => {
    it('should return 404 if no pending records found', async () => {
      req.params = { managerName: 'Boss' };
      sinon.stub(Employee, 'find').resolves([{ _id: 'emp1' }]);
      sinon.stub(LeaveManagement, 'find').returns({ populate: () => Promise.resolve([]) });

      await getLeaveStatusForManager(req, res);
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'No pending leave records found' })).to.be.true;
    });

    it('should return leave records for manager', async () => {
      req.params = { managerName: 'Boss' };
      sinon.stub(Employee, 'find').resolves([{ _id: 'emp1' }]);
      sinon.stub(LeaveManagement, 'find').returns({
        populate: () => Promise.resolve([
          { empId: { empName: 'Alice' }, leaveType: 'Casual Leave', status: 'pending' }
        ])
      });

      await getLeaveStatusForManager(req, res);
      expect(res.json.called).to.be.true;
      const response = res.json.firstCall.args[0];
      expect(response.viewed_by).to.equal('Boss');
      expect(response.leave_records[0].empId.empName).to.equal('Alice');
    });

    it('should return leave records when no managerName provided', async () => {
      req.params = {};
      sinon.stub(LeaveManagement, 'find').returns({
        populate: () => Promise.resolve([
          { empId: { empName: 'Bob' }, leaveType: 'Sick Leave', status: 'pending' }
        ])
      });

      await getLeaveStatusForManager(req, res);
      expect(res.json.called).to.be.true;
      const response = res.json.firstCall.args[0];
      expect(response.viewed_by).to.equal('Manager');
      expect(response.leave_records[0].empId.empName).to.equal('Bob');
    });

    it('should handle errors gracefully', async () => {
      req.params = { managerName: 'Boss' };
      sinon.stub(Employee, 'find').rejects(new Error('DB error'));

      await getLeaveStatusForManager(req, res);
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWith({ error: 'Internal server error' })).to.be.true;
    });
  });
});
