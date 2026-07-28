const { NotFoundError, BadRequestError, ConflictError } = require('../../common/errors');

const buildTree = (folders, parentId = null) => {
  return folders
    .filter((f) => String(f.parentId || '') === String(parentId || ''))
    .map((f) => ({
      ...f,
      children: buildTree(folders, f._id),
    }));
};

const createFoldersService = (repository) => {
  return {
    async createFolder(userId, { name, color, parentId }) {
      if (parentId) {
        const parent = await repository.findFolderById(parentId, userId);
        if (!parent) throw new NotFoundError('Parent folder not found');
      }

      try {
        return await repository.createFolder({ name, color, parentId: parentId || null, userId });
      } catch (err) {
        if (err.code === 11000) throw new ConflictError('Folder with this name already exists in target location');
        throw err;
      }
    },

    async getAllFolders(userId) {
      return await repository.findAllFoldersByUser(userId);
    },

    async getFolderTree(userId) {
      const folders = await repository.findAllFoldersByUser(userId);
      return buildTree(folders, null);
    },

    async updateFolder(userId, id, updates) {
      const folder = await repository.findFolderById(id, userId);
      if (!folder) throw new NotFoundError('Folder not found');

      if (updates.parentId) {
        if (String(updates.parentId) === String(id)) {
          throw new BadRequestError('Folder cannot be its own parent');
        }
        const parent = await repository.findFolderById(updates.parentId, userId);
        if (!parent) throw new NotFoundError('Parent folder not found');
      }

      try {
        return await repository.updateFolder(id, userId, updates);
      } catch (err) {
        if (err.code === 11000) throw new ConflictError('Folder with this name already exists in target location');
        throw err;
      }
    },

    async deleteFolder(userId, id) {
      const folder = await repository.findFolderById(id, userId);
      if (!folder) throw new NotFoundError('Folder not found');
      return await repository.deleteFolder(id, userId);
    },
  };
};

module.exports = createFoldersService;
