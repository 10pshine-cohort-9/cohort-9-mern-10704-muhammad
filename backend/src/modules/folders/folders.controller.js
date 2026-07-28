const { sendSuccess } = require('../../common/utils/response');

const createFoldersController = (service) => {
  return {
    async create(req, res) {
      const folder = await service.createFolder(req.user.id, req.body);
      return sendSuccess(res, { statusCode: 201, data: folder });
    },

    async getAll(req, res) {
      const folders = await service.getAllFolders(req.user.id);
      return sendSuccess(res, { statusCode: 200, data: folders });
    },

    async getTree(req, res) {
      const tree = await service.getFolderTree(req.user.id);
      return sendSuccess(res, { statusCode: 200, data: tree });
    },

    async update(req, res) {
      const folder = await service.updateFolder(req.user.id, req.params.id, req.body);
      return sendSuccess(res, { statusCode: 200, data: folder });
    },

    async delete(req, res) {
      await service.deleteFolder(req.user.id, req.params.id);
      return sendSuccess(res, { statusCode: 200, message: 'Folder deleted successfully' });
    },
  };
};

module.exports = createFoldersController;
