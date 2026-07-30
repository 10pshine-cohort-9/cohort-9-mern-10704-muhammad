const { NotFoundError } = require('../../common/errors');
const { getPagination, formatPaginationMeta } = require('../../common/utils/pagination');

const extractPlainText = (content = '') => {
  if (!content) return '';
  return content
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const createNotesService = (repository) => {
  return {
    async createNote(userId, noteData) {
      const contentPlainText = extractPlainText(noteData.content || '');
      return await repository.createNote({
        ...noteData,
        userId,
        contentPlainText,
      });
    },

    async getNotes(userId, queryParams = {}) {
      const {
        page = 1,
        limit = 20,
        sort = '-updatedAt',
        folderId,
        tagId,
        search,
        status = 'active',
        pinned,
        createdAfter,
        createdBefore,
        updatedAfter,
        updatedBefore,
      } = queryParams;

      const { page: p, limit: l } = getPagination({ page, limit });

      const query = {};

      if (status === 'archived') {
        query.isTrashed = false;
        query.isArchived = true;
      } else if (status === 'trashed') {
        query.isTrashed = true;
      } else {
        query.isTrashed = false;
        query.isArchived = false;
      }

      if (folderId !== undefined) {
        query.folderId = folderId === 'null' || folderId === null ? null : folderId;
      }

      if (tagId) {
        query.tags = tagId;
      }

      if (pinned !== undefined) {
        query.isPinned = pinned === 'true' || pinned === true;
      }

      if (search && search.trim() !== '') {
        query.$text = { $search: search.trim() };
      }

      if (createdAfter || createdBefore) {
        query.createdAt = {};
        if (createdAfter) query.createdAt.$gte = new Date(createdAfter);
        if (createdBefore) query.createdAt.$lte = new Date(createdBefore);
      }

      if (updatedAfter || updatedBefore) {
        query.updatedAt = {};
        if (updatedAfter) query.updatedAt.$gte = new Date(updatedAfter);
        if (updatedBefore) query.updatedAt.$lte = new Date(updatedBefore);
      }

      const { notes, total } = await repository.findNotesByUser({
        userId,
        query,
        page: p,
        limit: l,
        sort,
      });

      const meta = formatPaginationMeta(total, p, l);
      return { notes, meta };
    },

    async getNoteById(userId, id) {
      const note = await repository.findNoteById(id, userId);
      if (!note) throw new NotFoundError('Note not found');
      return note;
    },

    async updateNote(userId, id, updates) {
      const patch = { ...updates };
      if (updates.content !== undefined) {
        patch.contentPlainText = extractPlainText(updates.content);
      }

      const updated = await repository.updateNote(id, userId, patch);
      if (!updated) throw new NotFoundError('Note not found');
      return updated;
    },

    async togglePinNote(userId, id) {
      const note = await repository.findNoteById(id, userId);
      if (!note) throw new NotFoundError('Note not found');
      return await repository.updateNote(id, userId, { isPinned: !note.isPinned });
    },

    async archiveNote(userId, id) {
      const updated = await repository.updateNote(id, userId, { isArchived: true, isPinned: false });
      if (!updated) throw new NotFoundError('Note not found');
      return updated;
    },

    async unarchiveNote(userId, id) {
      const updated = await repository.updateNote(id, userId, { isArchived: false });
      if (!updated) throw new NotFoundError('Note not found');
      return updated;
    },

    async trashNote(userId, id) {
      const updated = await repository.updateNote(id, userId, {
        isTrashed: true,
        deletedAt: new Date(),
        isPinned: false,
      });
      if (!updated) throw new NotFoundError('Note not found');
      return updated;
    },

    async restoreNote(userId, id) {
      const updated = await repository.updateNote(id, userId, { isTrashed: false, deletedAt: null });
      if (!updated) throw new NotFoundError('Note not found');
      return updated;
    },

    async deleteNotePermanently(userId, id) {
      const deleted = await repository.deleteNote(id, userId);
      if (!deleted) throw new NotFoundError('Note not found');
      return deleted;
    },
  };
};

module.exports = createNotesService;
