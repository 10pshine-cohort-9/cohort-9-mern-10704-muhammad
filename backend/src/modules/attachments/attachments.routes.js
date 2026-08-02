const express = require('express');
const multer = require('multer');

const router = express.Router();
const authGuard = require('../../common/middleware/authGuard');
const asyncHandler = require('../../common/utils/asyncHandler');

const repository = require('./attachments.repository');
const notesRepository = require('../notes/notes.repository');
const createAttachmentsService = require('./attachments.service');
const createAttachmentsController = require('./attachments.controller');

const { MAX_SIZE_BYTES } = require('./attachments.service');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_SIZE_BYTES } });

const service = createAttachmentsService(repository, notesRepository);
const controller = createAttachmentsController(service);

// POST /api/v1/notes/:noteId/attachments
router.post('/notes/:noteId/attachments', authGuard, upload.single('file'), asyncHandler(controller.upload));

// GET /api/v1/notes/:noteId/attachments
router.get('/notes/:noteId/attachments', authGuard, asyncHandler(controller.listByNote));

// DELETE /api/v1/attachments/:id
router.delete('/attachments/:id', authGuard, asyncHandler(controller.remove));

module.exports = router;
