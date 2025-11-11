// routes/authRoutes.js
const express = require('express');
const passport = require('passport');
const { login, welcome, logout } = require('../controllers/authController');
const { loginValidators } = require('../validators/authValidators');
const { rejectBlacklistedTokens, ensureTokenMatchesActive } = require('../middleware/rejectBlacklistedTokens');
 
const router = express.Router();
 
router.post('/login', loginValidators, login);
 
router.get(
  '/welcome',
  rejectBlacklistedTokens,
  passport.authenticate('jwt', { session: false }),
  ensureTokenMatchesActive,
  welcome
);
 
router.post(
  '/logout',
  rejectBlacklistedTokens,
  passport.authenticate('jwt', { session: false }),
  ensureTokenMatchesActive,
  logout
);
 
module.exports = router;