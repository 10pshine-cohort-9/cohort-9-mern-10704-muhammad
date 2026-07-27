const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const authRoutes = require('./modules/auth/auth.routes');
const { sendSuccess } = require('./common/utils/response');
const { NotFoundError } = require('./common/errors');
const errorHandler = require('./common/middleware/errorHandler');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());

// Auth Module Routes
app.use('/api/v1/auth', authRoutes);

// Health Check Endpoint
app.get('/api/v1/health', (req, res) => {
  return sendSuccess(res, {
    statusCode: 200,
    message: 'NotesHub API is healthy',
    data: {
      status: 'UP',
      timestamp: new Date().toISOString(),
    },
  });
});

// Handle 404 for unknown endpoints
app.use((req, res, next) => {
  next(new NotFoundError(`Endpoint ${req.originalUrl} not found`));
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
