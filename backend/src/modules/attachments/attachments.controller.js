const { sendSuccess } = require('../../common/utils/response');

const createAttachmentsController = (service) => {
  return {
    async upload(req, res) {
      const attachment = await service.upload(req.user.id, req.params.noteId, req.file);
      return sendSuccess(res, { statusCode: 201, data: attachment });
    },

    async listByNote(req, res) {
      const attachments = await service.listByNote(req.user.id, req.params.noteId);
      return sendSuccess(res, { statusCode: 200, data: attachments });
    },

    async remove(req, res) {
      await service.remove(req.user.id, req.params.id);
      return sendSuccess(res, { statusCode: 200, message: 'Attachment deleted successfully' });
    },
  };
};

module.exports = createAttachmentsController;
