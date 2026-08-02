const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const env = require('./config/env');
const authRoutes = require('./modules/auth/auth.routes');
const foldersRoutes = require('./modules/folders/folders.routes');
const tagsRoutes = require('./modules/tags/tags.routes');
const notesRoutes = require('./modules/notes/notes.routes');
const attachmentsRoutes = require('./modules/attachments/attachments.routes');
const { sendSuccess } = require('./common/utils/response');
const { NotFoundError } = require('./common/errors');
const errorHandler = require('./common/middleware/errorHandler');

const app = express();

app.set('trust proxy', 1);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// Module Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/folders', foldersRoutes);
app.use('/api/v1/tags', tagsRoutes);
app.use('/api/v1/notes', notesRoutes);
app.use('/api/v1', attachmentsRoutes);

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
  next(new NotFoundError(`Endpoint ${req.path} not found`));
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
