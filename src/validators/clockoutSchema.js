const { checkSchema } = require('express-validator');

const editClockOutTimeSchema = checkSchema({
    date: {
        in: ['body'],
        exists: {
            errorMessage: 'Attendance date is required.',
        },
        isISO8601: {
            options: { strict: true, strictSeparator: true },
            errorMessage: 'Date must be a valid ISO 8601 format (e.g., YYYY-MM-DD).'
        },
        toDate: true,
    },
    clock_out: {
        in: ['body'],
        exists: {
            errorMessage: 'Clock-out time is required.',
        },
        isISO8601: {
            options: { strict: true, strictSeparator: true },
            errorMessage: 'Clock-out time must be a valid ISO 8601 format (e.g., YYYY-MM-DDT17:00:00Z).'
        },
        toDate: true,
    },
    // Note: The check for clock_out > clock_in is handled in userController.editClockOutTime.
});

module.exports = {
    editClockOutTimeSchema,
};