const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      default: 'Untitled',
      maxlength: 200,
    },
    content: {
      type: String,
      default: '',
    },
    contentPlainText: {
      type: String,
      default: '',
    },
    format: {
      type: String,
      enum: ['richtext', 'markdown'],
      default: 'richtext',
    },
    folderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Folder',
      default: null,
      index: true,
    },
    tags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tag',
      },
    ],
    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    isTrashed: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    templateId: {
      type: String,
      default: null,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Full-text search index on title and plaintext content
noteSchema.index({ title: 'text', contentPlainText: 'text' });
noteSchema.index({ userId: 1, isTrashed: 1, isArchived: 1, isPinned: 1, updatedAt: -1 });

module.exports = mongoose.model('Note', noteSchema);
