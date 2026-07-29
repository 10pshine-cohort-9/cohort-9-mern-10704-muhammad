const { sendSuccess } = require('../../common/utils/response');

const createTagsController = (service) => {
  return {
    async create(req, res) {
      const tag = await service.createTag(req.user.id, req.body);
      return sendSuccess(res, { statusCode: 201, data: tag });
    },

    async getAll(req, res) {
      const tags = await service.getAllTags(req.user.id);
      return sendSuccess(res, { statusCode: 200, data: tags });
    },

    async update(req, res) {
      const tag = await service.updateTag(req.user.id, req.params.id, req.body);
      return sendSuccess(res, { statusCode: 200, data: tag });
    },

    async delete(req, res) {
      await service.deleteTag(req.user.id, req.params.id);
      return sendSuccess(res, { statusCode: 200, message: 'Tag deleted successfully' });
    },
  };
};

module.exports = createTagsController;
