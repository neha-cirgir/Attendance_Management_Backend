require('dotenv').config();

const express = require('express');
const cors = require('cors');
const passport = require('passport');
const cookieParser = require('cookie-parser');
 
const passportJwtConfig = require('./src/config/passportJwtConfig');
const authRoutes = require('./src/routes/authRoutes');
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');
const logger = require('./src/middleware/logger');
const leaveRoutes = require('./src/routes/leaveRoutes');
const userRoutes = require('./src/routes/userRoutes');
const leaveBalanceRoutes= require('./src/routes/leaveBalanceRoutes');
const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors()); 
app.use(express.json());
app.use(logger);  
app.use(cookieParser());  
app.use(passport.initialize());
passportJwtConfig(passport);

app.use('/api/auth', authRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/users', userRoutes);
app.use('/api', leaveBalanceRoutes);

connectDB(process.env.MONGO_URI).then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
