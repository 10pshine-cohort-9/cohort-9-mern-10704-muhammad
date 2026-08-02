const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema(
  {
    noteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Note',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    resourceType: { type: String, default: 'image' },
    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Attachment', attachmentSchema);
