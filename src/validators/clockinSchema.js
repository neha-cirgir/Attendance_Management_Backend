const { checkSchema } = require('express-validator');

const clockInSchema = checkSchema({
    date: {
        in: ['body'],
        exists: {
            errorMessage: 'Attendance date is required.',
        },
        isISO8601: {
            // Ensures a strict ISO format, e.g., YYYY-MM-DD
            options: { strict: true, strictSeparator: true },
            errorMessage: 'Date must be a valid ISO 8601 format (e.g., YYYY-MM-DD).'
        },
        toDate: true, // Converts the string to a JavaScript Date object
    },
    clock_in: {
        in: ['body'],
        exists: {
            errorMessage: 'Clock-in time is required.',
        },
        isISO8601: {
            // Ensures a strict ISO format, e.g., YYYY-MM-DDT09:00:00.000Z
            options: { strict: true, strictSeparator: true },
            errorMessage: 'Clock-in time must be a valid ISO 8601 format (e.g., YYYY-MM-DDT09:00:00Z).'
        },
        toDate: true, // Converts the string to a JavaScript Date object
    },
    // Note: The unique record check is handled in userController.clockIn.
});

module.exports = {
    clockInSchema,
};