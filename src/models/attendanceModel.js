const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: [true, 'Attendance date is required.']
    },
    clock_in: {
        type: Date,
        required: [true, 'Clock-in time is required.']
    },
    clock_out: {
        type: Date,
    },
    total_work_hours: {
        type: Number,
        min: [0, 'Work hours cannot be negative.']
    },
},
    {
        timestamps: true
    });

module.exports = mongoose.model('attendance', attendanceSchema, 'attendance');
