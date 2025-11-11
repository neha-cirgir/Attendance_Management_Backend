const chai = require('chai');
const sinon = require('sinon');
const expect = chai.expect;

const mongoose = require('mongoose');
const Employee = require('../src/models/employeeModel');
const Attendance = require('../src/models/attendanceModel');

const {
  getManagedEmployees,
  getEmployeeWithAllAttendance,
  getLastFourDaysAttendance,
  clockIn,
  editClockOutTime
} = require('../src/controllers/userController');

describe('AttendanceController', () => {
  let req, res, next;

  beforeEach(() => {
    req = { params: {}, body: {}, headers: {}, user: {} };
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis()
    };
    next = sinon.stub();
  });

  afterEach(() => {
    sinon.restore();
  });

describe('getManagedEmployees', () => {
  it('should handle empty, enriched, and error cases', async () => {
  req.params = { managerName: 'Boss' };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const empDoc = {
    toObject: () => ({ _id: 'e1', empName: 'Alice' }),
    attendance_id: [{
      date: today,
      clock_in: new Date(today.getTime() + 9 * 3600 * 1000),
      clock_out: new Date(today.getTime() + 17 * 3600 * 1000),
      total_work_hours: '8h'
    }]
  };

  // --- Case 1: empty employees ---
  let populateStub = sinon.stub().resolves([empDoc]);
  let selectStub = sinon.stub().returns({ populate: populateStub });
  sinon.stub(Employee, 'find').returns({ select: selectStub });

  await getManagedEmployees(req, res, next);
  expect(res.status.calledWith(200)).to.be.true;
  expect(res.json.calledWith([])).to.be.true;

  sinon.restore();

  // --- Case 2: enriched employees ---
  populateStub = sinon.stub().resolves([empDoc]);
  selectStub = sinon.stub().returns({ populate: populateStub });
  sinon.stub(Employee, 'find').returns({ select: selectStub });

  await getManagedEmployees(req, res, next);
  expect(res.status.calledWith(200)).to.be.true;
  const payload = res.json.firstCall.args[0];
  expect(payload[0]._id).to.equal('e1');
  expect(payload[0].today_attendance.total_work_hours).to.equal('8h');

  sinon.restore();

  // --- Case 3: error thrown ---
  populateStub = sinon.stub().rejects(new Error('DB fail'));
  selectStub = sinon.stub().returns({ populate: populateStub });
  sinon.stub(Employee, 'find').returns({ select: selectStub });

  await getManagedEmployees(req, res, next);
  expect(next.calledOnce).to.be.true;
  expect(next.firstCall.args[0].message).to.equal('DB fail');
});
})
;

  describe('getEmployeeWithAllAttendance', () => {
    it('should return 400 for invalid ObjectId', async () => {
      req.params = { id: 'bad' };
      sinon.stub(mongoose.Types, 'ObjectId').value({ isValid: () => false });

      await getEmployeeWithAllAttendance(req, res, next);
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith({ message: 'Invalid Employee ID format' })).to.be.true;
    });

    it('should return 404 when employee not found', async () => {
      req.params = { id: '507f1f77bcf86cd799439011' };
      sinon.stub(mongoose.Types, 'ObjectId').value({ isValid: () => true });

      const populateStub = sinon.stub().returnsThis();
      sinon.stub(Employee, 'findById').returns({ populate: populateStub, exec: sinon.stub().resolves(null) });

      await getEmployeeWithAllAttendance(req, res, next);
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'Employee not found' })).to.be.true;
    });

    it('should return employee with attendance on success', async () => {
      req.params = { id: '507f1f77bcf86cd799439011' };
      sinon.stub(mongoose.Types, 'ObjectId').value({ isValid: () => true });

      const populateStub = sinon.stub().returnsThis();
      sinon.stub(Employee, 'findById').returns({ populate: populateStub, exec: sinon.stub().resolves({ _id: 'e1' }) });

      await getEmployeeWithAllAttendance(req, res, next);
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWith({ _id: 'e1' })).to.be.true;
    });

    it('should call next on error', async () => {
      req.params = { id: '507f1f77bcf86cd799439011' };
      sinon.stub(mongoose.Types, 'ObjectId').value({ isValid: () => true });

      const populateStub = sinon.stub().returnsThis();
      sinon.stub(Employee, 'findById').returns({ populate: populateStub, exec: sinon.stub().rejects(new Error('DB')) });

      await getEmployeeWithAllAttendance(req, res, next);
      expect(next.calledOnce).to.be.true;
      expect(next.firstCall.args[0].message).to.equal('DB');
    });
  });

  describe('getLastFourDaysAttendance', () => {
    it('should return 400 for invalid ObjectId', async () => {
      req.params = { id: 'bad' };
      sinon.stub(mongoose.Types, 'ObjectId').value({ isValid: () => false });

      await getLastFourDaysAttendance(req, res, next);
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith({ message: 'Invalid Employee ID format' })).to.be.true;
    });

    it('should return 404 when no records found', async () => {
      req.params = { id: '507f1f77bcf86cd799439011' };
      sinon.stub(mongoose.Types, 'ObjectId').value({ isValid: () => true });

      const populateStub = sinon.stub().returnsThis();
      sinon.stub(Employee, 'findById').returns({
        select: sinon.stub().returns({ populate: populateStub, exec: sinon.stub().resolves({ attendance_id: [] }) })
      });

      await getLastFourDaysAttendance(req, res, next);
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'No recent attendance records found for this employee' })).to.be.true;
    });

    it('should return most recent records', async () => {
      req.params = { id: '507f1f77bcf86cd799439011' };
      sinon.stub(mongoose.Types, 'ObjectId').value({ isValid: () => true });

      const populateStub = sinon.stub().returnsThis();
      sinon.stub(Employee, 'findById').returns({
        select: sinon.stub().returns({
          populate: populateStub,
          exec: sinon.stub().resolves({ attendance_id: [{ _id: 'a1' }, { _id: 'a2' }] })
        })
      });

      await getLastFourDaysAttendance(req, res, next);
      expect(res.status.calledWith(200)).to.be.true;
      const payload = res.json.firstCall.args[0];
      expect(payload.employee_id).to.equal('507f1f77bcf86cd799439011');
      expect(payload.most_recent_records.length).to.equal(2);
    });

    it('should call next on error', async () => {
      req.params = { id: '507f1f77bcf86cd799439011' };
      sinon.stub(mongoose.Types, 'ObjectId').value({ isValid: () => true });

      const populateStub = sinon.stub().returnsThis();
      sinon.stub(Employee, 'findById').returns({
        select: sinon.stub().returns({ populate: populateStub, exec: sinon.stub().rejects(new Error('DB')) })
      });

      await getLastFourDaysAttendance(req, res, next);
      expect(next.calledOnce).to.be.true;
    });
  });
  describe('clockIn', () => {
    beforeEach(() => {
      sinon.stub(mongoose.Types, 'ObjectId').value({ isValid: () => true });
    });
    afterEach(() => sinon.restore());

    it('should return 400 for invalid ObjectId', async () => {
      sinon.restore(); // override default
      sinon.stub(mongoose.Types, 'ObjectId').value({ isValid: () => false });
      req.params = { id: 'bad' };
      req.body = { date: '2025-11-11', clock_in: new Date().toISOString() };

      await clockIn(req, res, next);
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith({ message: 'Invalid Employee ID format' })).to.be.true;
    });

    it('should return 400 for missing fields', async () => {
      req.params = { id: '507f1f77bcf86cd799439011' };
      req.body = { date: '', clock_in: '' };

      await clockIn(req, res, next);
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith({ message: 'Missing required fields: date, clock_in' })).to.be.true;
    });

    it('should return 404 if employee not found', async () => {
      const populateStub = sinon.stub().resolves(null);
      sinon.stub(Employee, 'findById').returns({ populate: populateStub });

      req.params = { id: '507f1f77bcf86cd799439011' };
      req.body = { date: '2025-11-11', clock_in: new Date().toISOString() };

      await clockIn(req, res, next);
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'Employee not found' })).to.be.true;
    });

    it('should return 409 if already clocked in for date', async () => {
      const populateStub = sinon.stub().resolves({ attendance_id: [{}] });
      sinon.stub(Employee, 'findById').returns({ populate: populateStub });

      req.params = { id: '507f1f77bcf86cd799439011' };
      req.body = { date: '2025-11-11', clock_in: new Date().toISOString() };

      await clockIn(req, res, next);
      expect(res.status.calledWith(409)).to.be.true;
      expect(res.json.firstCall.args[0].message).to.match(/already clocked in/i);
    });

    it('should record clock-in and push Attendance id', async () => {
      const populateStub = sinon.stub().resolves({ attendance_id: [] });
      sinon.stub(Employee, 'findById').returns({ populate: populateStub });
      sinon.stub(Attendance.prototype, 'save').resolves();
      sinon.stub(Employee, 'findByIdAndUpdate').resolves({});

      req.params = { id: '507f1f77bcf86cd799439011' };
      req.body = { date: '2025-11-11', clock_in: new Date().toISOString() };

      await clockIn(req, res, next);
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.firstCall.args[0].message).to.match(/Clock-in recorded successfully/i);
    });
  });

  describe('editClockOutTime', () => {
    beforeEach(() => {
      sinon.stub(mongoose.Types, 'ObjectId').value({ isValid: () => true });
    });
    afterEach(() => sinon.restore());

    it('should return 400 for invalid ObjectId', async () => {
      sinon.restore();
      sinon.stub(mongoose.Types, 'ObjectId').value({ isValid: () => false });
      req.params = { id: 'bad' };
      req.body = { date: '2025-11-11', clock_out: new Date().toISOString() };

      await editClockOutTime(req, res, next);
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith({ message: 'Invalid Employee ID format' })).to.be.true;
    });

    it('should return 400 for missing fields', async () => {
      req.params = { id: '507f1f77bcf86cd799439011' };
      req.body = { date: '', clock_out: '' };

      await editClockOutTime(req, res, next);
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith({ message: 'Missing required fields: date, clock_out' })).to.be.true;
    });

    it('should return 404 if employee not found', async () => {
      const populateStub = sinon.stub().resolves(null);
      sinon.stub(Employee, 'findById').returns({ populate: populateStub });

      req.params = { id: '507f1f77bcf86cd799439011' };
      req.body = { date: '2025-11-11', clock_out: new Date().toISOString() };

      await editClockOutTime(req, res, next);
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'Employee not found' })).to.be.true;
    });

    it('should return 404 if attendance for date not found', async () => {
      const populateStub = sinon.stub().resolves({ attendance_id: [] });
      sinon.stub(Employee, 'findById').returns({ populate: populateStub });

      req.params = { id: '507f1f77bcf86cd799439011' };
      req.body = { date: '2025-11-11', clock_out: new Date().toISOString() };

      await editClockOutTime(req, res, next);
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.firstCall.args[0].message).to.match(/Attendance record not found/i);
    });

    it('should return 400 if clock_out is not after clock_in', async () => {
      const clockInTime = new Date('2025-11-11T10:00:00Z');
      const badOut = new Date('2025-11-11T09:00:00Z');
      const populateStub = sinon.stub().resolves({ attendance_id: [{ _id: 'a1', clock_in: clockInTime }] });
      sinon.stub(Employee, 'findById').returns({ populate: populateStub });

      req.params = { id: '507f1f77bcf86cd799439011' };
      req.body = { date: '2025-11-11', clock_out: badOut.toISOString() };

      await editClockOutTime(req, res, next);
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.firstCall.args[0].message).to.match(/must be after the recorded clock-in/i);
    });

    it('should update clock_out and total_work_hours', async () => {
      const clockInTime = new Date('2025-11-11T09:00:00Z');
      const clockOutTime = new Date('2025-11-11T17:00:00Z');
      const populateStub = sinon.stub().resolves({ attendance_id: [{ _id: 'a1', clock_in: clockInTime }] });
      sinon.stub(Employee, 'findById').returns({ populate: populateStub });
      sinon.stub(Attendance, 'findOneAndUpdate').resolves({
        _id: 'a1',
        clock_out: clockOutTime,
        total_work_hours: 8
      });

      req.params = { id: '507f1f77bcf86cd799439011' };
      req.body = { date: '2025-11-11', clock_out: clockOutTime.toISOString() };

      await editClockOutTime(req, res, next);
      expect(res.status.calledWith(200)).to.be.true;
      const payload = res.json.firstCall.args[0];
      expect(payload.message).to.match(/updated successfully/i);
      expect(payload.record.total_work_hours).to.equal(8);
    });
  });
});

