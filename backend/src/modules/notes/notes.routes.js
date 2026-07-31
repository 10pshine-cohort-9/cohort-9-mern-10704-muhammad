const express = require('express');
const router = express.Router();

const authGuard = require('../../common/middleware/authGuard');
const validate = require('../../common/middleware/validate');
const asyncHandler = require('../../common/utils/asyncHandler');
const { createNoteSchema, updateNoteSchema, queryNoteSchema } = require('./notes.schema');

const repository = require('./notes.repository');
const createNotesService = require('./notes.service');
const createNotesController = require('./notes.controller');

const service = createNotesService(repository);
const controller = createNotesController(service);

router.use(authGuard);

router.get('/', validate(queryNoteSchema, 'query'), asyncHandler(controller.getAll));
router.post('/', validate(createNoteSchema), asyncHandler(controller.create));
router.get('/:id', asyncHandler(controller.getById));
router.patch('/:id', validate(updateNoteSchema), asyncHandler(controller.update));
router.delete('/:id', asyncHandler(controller.delete));

router.post('/:id/pin', asyncHandler(controller.togglePin));
router.post('/:id/archive', asyncHandler(controller.archive));
router.post('/:id/unarchive', asyncHandler(controller.unarchive));
router.post('/:id/restore', asyncHandler(controller.restore));
router.delete('/:id/permanent', asyncHandler(controller.deletePermanent));

module.exports = router;
