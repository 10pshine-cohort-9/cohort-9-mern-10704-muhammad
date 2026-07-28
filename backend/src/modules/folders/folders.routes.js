const express = require('express');
const router = express.Router();

const authGuard = require('../../common/middleware/authGuard');
const validate = require('../../common/middleware/validate');
const asyncHandler = require('../../common/utils/asyncHandler');
const { createFolderSchema, updateFolderSchema } = require('./folders.schema');

const repository = require('./folders.repository');
const createFoldersService = require('./folders.service');
const createFoldersController = require('./folders.controller');

const service = createFoldersService(repository);
const controller = createFoldersController(service);

router.use(authGuard);

router.get('/tree', asyncHandler(controller.getTree));
router.get('/', asyncHandler(controller.getAll));
router.post('/', validate(createFolderSchema), asyncHandler(controller.create));
router.put('/:id', validate(updateFolderSchema), asyncHandler(controller.update));
router.delete('/:id', asyncHandler(controller.delete));

module.exports = router;
