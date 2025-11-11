const { has } = require('../utils/tokenBlacklist');
const Login = require('../models/loginModel');
 
async function rejectBlacklistedTokens(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.split(' ')[1] : null;
  if (token && has(token)) return res.status(401).json({ error: 'Token blacklisted' });
 
  req._presentedToken = token;
  next();
}
 
function ensureTokenMatchesActive(req, res, next) {
  const token = req._presentedToken;
  if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });
  if (!req.user.activeToken) return res.status(401).json({ error: 'No active session' });
  if (req.user.activeToken !== token) return res.status(401).json({ error: 'Token mismatch' });
  next();
}
 
module.exports = { rejectBlacklistedTokens, ensureTokenMatchesActive };
 