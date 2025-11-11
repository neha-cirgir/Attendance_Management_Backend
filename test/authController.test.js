const chai = require('chai');
const sinon = require('sinon');
const expect = chai.expect;

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Login = require('../src/models/loginModel');
const { add: addToBlacklist } = require('../src/utils/tokenBlacklist');
const { login, welcome, logout } = require('../src/controllers/authController');

describe('AuthController', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, headers: {}, user: {} };
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis()
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('login', () => {
    it('should return 400 if employee_id or password missing', async () => {
      req.body = {};
      await login(req, res);
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith({ error: 'employee_id and password required' })).to.be.true;
    });

    it('should return 401 if loginDoc not found', async () => {
      req.body = { employee_id: '123', password: 'pass' };
      sinon.stub(Login, 'findOne').returns({ populate: () => ({ exec: () => null }) });
      await login(req, res);
      expect(res.status.calledWith(401)).to.be.true;
    });

    it('should return 401 if password does not match', async () => {
      req.body = { employee_id: '123', password: 'wrong' };
      const fakeDoc = { employee_id: '123', password: 'hashed', populate: () => ({ exec: () => fakeDoc }) };
      sinon.stub(Login, 'findOne').returns({ populate: () => ({ exec: () => fakeDoc }) });
      sinon.stub(bcrypt, 'compare').resolves(false);

      await login(req, res);
      expect(res.status.calledWith(401)).to.be.true;
    });

    it('should return 409 if already logged in with valid token', async () => {
      req.body = { employee_id: '123', password: 'pass' };
      const fakeDoc = { _id: 'id1', employee_id: '123', password: 'hashed', activeToken: 'token', employee_ref_id: { isManager: true } };
      sinon.stub(Login, 'findOne').returns({ populate: () => ({ exec: () => fakeDoc }) });
      sinon.stub(bcrypt, 'compare').resolves(true);
      sinon.stub(jwt, 'verify').returns(true);

      await login(req, res);
      expect(res.status.calledWith(409)).to.be.true;
    });

    it('should return 200 with token and user on success', async () => {
      req.body = { employee_id: '123', password: 'pass' };
      const fakeDoc = { 
        _id: 'id1', employee_id: '123', password: 'hashed', employee_ref_id: { _id: 'emp1', name: 'Alice', isManager: true } 
      };
      sinon.stub(Login, 'findOne').returns({ populate: () => ({ exec: () => fakeDoc }) });
      sinon.stub(bcrypt, 'compare').resolves(true);
      sinon.stub(jwt, 'sign').returns('newtoken');
      sinon.stub(Login, 'findOneAndUpdate').returns({ exec: () => fakeDoc });

      await login(req, res);
      expect(res.json.called).to.be.true;
      const response = res.json.firstCall.args[0];
      expect(response.message).to.equal('Login successful');
      expect(response.token).to.equal('newtoken');
      expect(response.user.employee.name).to.equal('Alice');
    });
  });

  describe('welcome', () => {
    it('should return welcome message with user info', () => {
      req.user = { employee_id: '123', employee_ref_id: { empName: 'Bob', isManager: true } };
      welcome(req, res);
      expect(res.json.called).to.be.true;
      const response = res.json.firstCall.args[0];
      expect(response.message).to.equal('Welcome 123');
      expect(response.user.name).to.equal('Bob');
      expect(response.user.isManager).to.be.true;
    });
  });

  describe('logout', () => {
    it('should return message if no token present', async () => {
      req.headers = {};
      await logout(req, res);
      expect(res.json.calledWith({ message: 'No token present' })).to.be.true;
    });

    it('should blacklist token and clear activeToken by user._id', async () => {
      req.headers.authorization = 'Bearer sometoken';
      req.user = { _id: 'id1' };
      sinon.stub(Login, 'findByIdAndUpdate').returns({ exec: () => {} });
      const addStub = sinon.stub().returns();
      sinon.replace(addToBlacklist, 'call', addStub);

      await logout(req, res);
      expect(res.json.calledWith({ message: 'Logout successful. Token blacklisted.' })).to.be.true;
    });

    it('should blacklist token and clear activeToken by token fallback', async () => {
      req.headers.authorization = 'Bearer sometoken';
      req.user = null;
      sinon.stub(Login, 'findOneAndUpdate').returns({ exec: () => {} });
      const addStub = sinon.stub().returns();
      sinon.replace(addToBlacklist, 'call', addStub);

      await logout(req, res);
      expect(res.json.calledWith({ message: 'Logout successful. Token blacklisted.' })).to.be.true;
    });
  });
});
