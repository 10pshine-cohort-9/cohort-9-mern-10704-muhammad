const { NotFoundError, ConflictError } = require('../../common/errors');

const createTagsService = (repository) => {
  return {
    async createTag(userId, { name, color }) {
      try {
        return await repository.createTag({ name, color, userId });
      } catch (err) {
        if (err.code === 11000) throw new ConflictError('Tag with this name already exists');
        throw err;
      }
    },

    async getAllTags(userId) {
      return await repository.findAllTagsByUser(userId);
    },

    async updateTag(userId, id, updates) {
      const tag = await repository.findTagById(id, userId);
      if (!tag) throw new NotFoundError('Tag not found');

      try {
        return await repository.updateTag(id, userId, updates);
      } catch (err) {
        if (err.code === 11000) throw new ConflictError('Tag with this name already exists');
        throw err;
      }
    },

    async deleteTag(userId, id) {
      const tag = await repository.findTagById(id, userId);
      if (!tag) throw new NotFoundError('Tag not found');
      return await repository.deleteTag(id, userId);
    },
  };
};

module.exports = createTagsService;
