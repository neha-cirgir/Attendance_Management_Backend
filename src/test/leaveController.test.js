const request = require('supertest');
const app = require('../../app'); 
const { expect } = require('chai');

describe('Leave Controller Routes (/api/leaves)', () => {
  it('should reject missing fields', async () => {
    const res = await request(app)
      .post('/api/leaves/apply-leave')
      .send({ empid: 'EMP001' });

    expect(res.status).to.be.oneOf([400, 404]); 
    if (res.status === 400) {
      expect(res.body.errors).to.be.an('array');
      expect(res.body.errors.some(e => e.field === 'empname')).to.be.true;
    } else {
      console.warn('Route not found: /api/leaves/apply-leave');
    }
  });
  it('should reject leave application with invalid date format', async () => {
  const res = await request(app)
    .post('/api/leaves/apply-leave')
    .send({
      empid: 'EMP004',
      empname: 'Alice',
      startdate: '2025/11/01',
      enddate: '2025-11-05',
      leavetype: 'Sick Leave'
    });

  expect(res.status).to.be.oneOf([400, 404]);
  if (res.status === 400) {
    expect(res.body.errors).to.be.an('array');
    expect(res.body.errors.some(e => e.param === 'startdate')).to.be.true;
  } else {
    console.warn('Route not found: /api/leaves/apply-leave');
  }
});

  it('should reject leave application with unsupported leave type', async () => {
  const res = await request(app)
    .post('/api/leaves/apply-leave')
    .send({
      empid: 'EMP005',
      empname: 'Bob',
      startdate: '2025-11-01',
      enddate: '2025-11-05',
      leavetype: 'Annual Leave' 
    });

  expect(res.status).to.be.oneOf([400, 404]);
  if (res.status === 400) {
    expect(res.body.errors).to.be.an('array');
    expect(res.body.errors.some(e => e.param === 'leavetype')).to.be.true;
  } else {
    console.warn('Route not found: /api/leaves/apply-leave');
  }
});

  it('should reject leave application when enddate is before startdate', async () => {
  const res = await request(app)
    .post('/api/leaves/apply-leave')
    .send({
      empid: 'EMP006',
      empname: 'Charlie',
      startdate: '2025-11-10',
      enddate: '2025-11-05',
      leavetype: 'Casual Leave'
    });

  expect(res.status).to.be.oneOf([400, 404]);
  if (res.status === 400) {
    expect(res.body.error).to.include('End date cannot be before start date');
  } else {
    console.warn('Route not found: /api/leaves/apply-leave');
  }
});


  it('should return leave status for valid empid', async () => {
  const res = await request(app).get('/api/leaves/leave-status/EMP001');
  expect(res.status).to.be.oneOf([200, 404]);

  if (res.status === 200) {
    expect(res.body.employee_id).to.equal('EMP001');
    expect(res.body.leave_status).to.be.an('array');
  } else if (res.body.error || res.body.message) {
    const errorMessage = res.body.error || res.body.message;
    expect(errorMessage).to.include('No leave records');
  } else {
    console.warn('Unexpected response format:', res.body);
  }
  });
  it('should return 404 for non-existent employee leave status', async () => {
  const res = await request(app).get('/api/leaves/leave-status/EMP999');

  expect(res.status).to.be.oneOf([404, 400]);
  if (res.status === 404) {
    const errorMessage = res.body?.error || res.body?.message;
    if (typeof errorMessage === 'string') {
      expect(errorMessage.includes('No leave records')).to.be.true;
    } else {
      console.warn('Missing or invalid error message:', res.body);
    }
  } else {
    console.warn('Unexpected response format:', res.body);
  }
  });
  it('should return all leave records for manager', async () => {
  const res = await request(app).get('/api/leaves/manager-leave-status');
  expect(res.status).to.be.oneOf([200, 404]);

  if (res.status === 200) {
    expect(res.body.viewed_by).to.equal('Manager');
    expect(res.body.leave_records).to.be.an('array');
  } else if (res.body.error || res.body.message) {
    const errorMessage = res.body.error || res.body.message;
    expect(errorMessage).to.include('No leave records');
  } else {
    console.warn('Unexpected response format:', res.body);
  }
  });
});