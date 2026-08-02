const cloudinary = require('../../config/cloudinary');
const { NotFoundError, BadRequestError } = require('../../common/errors');

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const createAttachmentsService = (repository, notesRepository) => {
  return {
    async upload(userId, noteId, file) {
      const note = await notesRepository.findNoteById(noteId, userId);
      if (!note) throw new NotFoundError('Note not found');

      if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        throw new BadRequestError(`File type ${file.mimetype} is not allowed`);
      }
      if (file.size > MAX_SIZE_BYTES) {
        throw new BadRequestError('File exceeds the 10 MB size limit');
      }

      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: `noteshub/${userId}`, resource_type: 'auto' },
          (err, res) => (err ? reject(err) : resolve(res))
        );
        stream.end(file.buffer);
      });

      return await repository.createAttachment({
        noteId,
        userId,
        url: result.secure_url,
        publicId: result.public_id,
        filename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      });
    },

    async listByNote(userId, noteId) {
      const note = await notesRepository.findNoteById(noteId, userId);
      if (!note) throw new NotFoundError('Note not found');
      return await repository.findAttachmentsByNote(noteId, userId);
    },

    async remove(userId, id) {
      const attachment = await repository.findAttachmentById(id, userId);
      if (!attachment) throw new NotFoundError('Attachment not found');

      await cloudinary.uploader.destroy(attachment.publicId, { resource_type: 'auto' });
      return await repository.deleteAttachment(id, userId);
    },
  };
};

module.exports = createAttachmentsService;
module.exports.MAX_SIZE_BYTES = MAX_SIZE_BYTES;

