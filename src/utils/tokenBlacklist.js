// utils/tokenBlacklist.js
const blacklist = new Set();
function add(token) { blacklist.add(token); }
function has(token) { return blacklist.has(token); }
module.exports = { add, has };