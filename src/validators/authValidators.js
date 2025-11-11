// src/validators/authValidators.js
const { check, validationResult } = require('express-validator');
 
const loginValidators = [
  check('employee_id')
    .exists({ checkFalsy: true }).withMessage('employee_id is required')
    .bail()
    .isInt().withMessage('employee_id must be an integer'),
 
  check('password')
    .exists({ checkFalsy: true }).withMessage('password is required')
    .bail()
    .isString().withMessage('password must be a string')
    .bail()
    .isLength({ min: 6 }).withMessage('password must be at least 6 characters long'),
 
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  }
];
 
module.exports = { loginValidators };