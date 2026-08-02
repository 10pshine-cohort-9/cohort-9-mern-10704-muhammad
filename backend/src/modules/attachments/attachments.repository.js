const Attachment = require('./attachments.model');

const createAttachment = async (data) => {
  const doc = await Attachment.create(data);
  return doc.toObject();
};

const findAttachmentById = async (id, userId) => {
  return await Attachment.findOne({ _id: id, userId }).lean();
};

const findAttachmentsByNote = async (noteId, userId) => {
  return await Attachment.find({ noteId, userId }).lean();
};

const deleteAttachment = async (id, userId) => {
  return await Attachment.findOneAndDelete({ _id: id, userId }).lean();
};

module.exports = { createAttachment, findAttachmentById, findAttachmentsByNote, deleteAttachment };
