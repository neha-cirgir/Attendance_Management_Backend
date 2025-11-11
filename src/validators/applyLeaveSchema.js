const { checkSchema } = require('express-validator');

const applyLeaveSchema = checkSchema({
  empId: {
    in: ['body'],
    exists: {
      errorMessage: 'Employee ID is required',
    },
    isMongoId: {
      errorMessage: 'Employee ID must be a valid MongoDB ObjectId',
    },
  },
  leaveType: {
    in: ['body'],
    exists: {
      errorMessage: 'Leave type is required',
    },
    isIn: {
      options: [['Sick Leave', 'Casual Leave']],
      errorMessage: 'Leave type must be either "Sick Leave" or "Casual Leave"',
    },
    trim: true,
  },
  startDate: {
    in: ['body'],
    exists: {
      errorMessage: 'Start date is required',
    },
    isISO8601: {
      errorMessage: 'Start date must be a valid ISO date',
    },
    trim: true,
  },
  endDate: {
    in: ['body'],
    exists: {
      errorMessage: 'End date is required',
    },
    isISO8601: {
      errorMessage: 'End date must be a valid ISO date',
    },
    trim: true,
    custom: {
      options: (value, { req }) => {
        const start = new Date(req.body.startDate);
        const end = new Date(value);
        if (start >= end) {
          throw new Error('End date must be after start date');
        }
        return true;
      },
    },
  },
  appliedDays: {
    in: ['body'],
    exists: {
      errorMessage: 'Applied days is required',
    },
    isInt: {
      options: { min: 1 },
      errorMessage: 'Applied days must be a positive integer',
    },
  },
});

module.exports = {
  applyLeaveSchema,
};
