const { z } = require('zod');

const hexColorRegex = /^#([0-9a-fA-F]{3}){1,2}$/;
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const createFolderSchema = z.object({
  name: z.string().trim().min(1, 'Folder name is required').max(100, 'Name max 100 chars'),
  color: z.string().regex(hexColorRegex, 'Invalid hex color').optional(),
  parentId: z.string().regex(objectIdRegex, 'Invalid parent folder ID').nullable().optional(),
});

const updateFolderSchema = createFolderSchema.partial();

module.exports = {
  createFolderSchema,
  updateFolderSchema,
};
