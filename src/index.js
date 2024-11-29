const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const dotenv = require('dotenv');

const app = express();
const apiRoutes = require('./routes/v1/index');
const appErrorHandler = require('./middleware/app-error-handler');
const errorHandler = require('./middleware/error-handler');
const responseHandler = require('./middleware/response-handler');
const { StatusCodes } = require('http-status-codes');

dotenv.config();

// Security headers
app.use(helmet());

// Logging
app.use(
  morgan(
    '[:date[iso]] :method :url :status :response-time ms - :res[content-length]'
  )
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  message: {
    status: 'error',
    message:
      'Too many requests from this IP, please try again after 15 minutes',
  },
});
app.use('/api/', limiter);

// CORS
app.use(cors());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Response handler
app.use(responseHandler);

// Routes
app.use('/api/v1/', apiRoutes);

// Error handling
app.use(appErrorHandler);
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
    message: 'Route not found',
    success: false,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is Running on Port ${PORT}`);
});
