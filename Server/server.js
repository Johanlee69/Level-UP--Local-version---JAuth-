const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');

dotenv.config();
process.noDeprecation = true;

// Debug log the environment variables
console.log('Environment variables loaded:');
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`MONGO_URI: ${process.env.MONGO_URI ? 'Set (value hidden)' : 'Not set'}`);
console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? 'Set (value hidden)' : 'Not set'}`);
console.log(`PORT: ${process.env.PORT}`);

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

connectDB();

const app = express();
app.use(express.json());
app.use(cookieParser());
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(cors({
  origin: ['https://level-up-local-version-jauth.onrender.com', 'https://level-up-35in.onrender.com','http://localhost:5173'],
  credentials: true
}));

const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api/auth', limiter);
const helmet = require('helmet');
app.use(helmet());
const xss = require('xss-clean');
app.use(xss());
const hpp = require('hpp');
app.use(hpp());

// Mount routers
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/chat', require('./routes/chat'));
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
console.log('PORT value after assignment:', PORT, 'Type:', typeof PORT);

const server = app.listen(
  PORT,
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);

process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = app;
