const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const authRoutes = require('./modules/auth/auth.routes');
const foldersRoutes = require('./modules/folders/folders.routes');
const tagsRoutes = require('./modules/tags/tags.routes');
const { sendSuccess } = require('./common/utils/response');
const { NotFoundError } = require('./common/errors');
const errorHandler = require('./common/middleware/errorHandler');

const app = express();

app.set('trust proxy', 1);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());

// Module Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/folders', foldersRoutes);
app.use('/api/v1/tags', tagsRoutes);

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
