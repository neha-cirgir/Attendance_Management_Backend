// src/config/passportJwtConfig.js
const { ExtractJwt, Strategy: JwtStrategy } = require('passport-jwt');
const Login = require('../models/loginModel');
require('dotenv').config();
 
module.exports = function(passport) {
  const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET || 'default_jwt_secret'
  };
 
  passport.use(new JwtStrategy(opts, async (payload, done) => {
    try {
      // payload.id is the login doc id
      const login = await Login.findById(payload.id).populate('employee_ref_id').exec();
      if (!login) return done(null, false);
 
      // attach login doc as req.user
      return done(null, login);
    } catch (err) {
      return done(err, false);
    }
  }));
};
 