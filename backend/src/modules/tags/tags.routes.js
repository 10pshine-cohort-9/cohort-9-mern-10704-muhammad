const express = require('express');
const router = express.Router();

const authGuard = require('../../common/middleware/authGuard');
const validate = require('../../common/middleware/validate');
const asyncHandler = require('../../common/utils/asyncHandler');
const { createTagSchema, updateTagSchema } = require('./tags.schema');

const repository = require('./tags.repository');
const createTagsService = require('./tags.service');
const createTagsController = require('./tags.controller');

const service = createTagsService(repository);
const controller = createTagsController(service);

router.use(authGuard);

router.get('/', asyncHandler(controller.getAll));
router.post('/', validate(createTagSchema), asyncHandler(controller.create));
router.patch('/:id', validate(updateTagSchema), asyncHandler(controller.update));
router.delete('/:id', asyncHandler(controller.delete));

module.exports = router;
