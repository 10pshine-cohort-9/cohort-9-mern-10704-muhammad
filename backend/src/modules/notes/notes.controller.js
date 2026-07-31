const { sendSuccess } = require('../../common/utils/response');

const createNotesController = (service) => {
  return {
    async create(req, res) {
      const note = await service.createNote(req.user.id, req.body);
      return sendSuccess(res, { statusCode: 201, data: note });
    },

    async getAll(req, res) {
      const { notes, meta } = await service.getNotes(req.user.id, req.query);
      return sendSuccess(res, { statusCode: 200, data: notes, meta });
    },

    async getById(req, res) {
      const note = await service.getNoteById(req.user.id, req.params.id);
      return sendSuccess(res, { statusCode: 200, data: note });
    },

    async update(req, res) {
      const note = await service.updateNote(req.user.id, req.params.id, req.body);
      return sendSuccess(res, { statusCode: 200, data: note });
    },

    async delete(req, res) {
      const note = await service.trashNote(req.user.id, req.params.id);
      return sendSuccess(res, { statusCode: 200, message: 'Note moved to trash', data: note });
    },

    async togglePin(req, res) {
      const note = await service.togglePinNote(req.user.id, req.params.id);
      return sendSuccess(res, { statusCode: 200, data: note });
    },

    async archive(req, res) {
      const note = await service.archiveNote(req.user.id, req.params.id);
      return sendSuccess(res, { statusCode: 200, message: 'Note archived successfully', data: note });
    },

    async unarchive(req, res) {
      const note = await service.unarchiveNote(req.user.id, req.params.id);
      return sendSuccess(res, { statusCode: 200, message: 'Note unarchived successfully', data: note });
    },

    async restore(req, res) {
      const note = await service.restoreNote(req.user.id, req.params.id);
      return sendSuccess(res, { statusCode: 200, message: 'Note restored from trash', data: note });
    },

    async deletePermanent(req, res) {
      await service.deleteNotePermanently(req.user.id, req.params.id);
      return sendSuccess(res, { statusCode: 200, message: 'Note permanently deleted' });
    },
  };
};

module.exports = createNotesController;
