const { z } = require('zod');

const hexColorRegex = /^#([0-9a-fA-F]{3}){1,2}$/;

const createTagSchema = z.object({
  name: z.string().trim().min(1, 'Tag name is required').max(50, 'Name max 50 chars'),
  color: z.string().regex(hexColorRegex, 'Invalid hex color').optional(),
});

const updateTagSchema = createTagSchema.partial();

module.exports = {
  createTagSchema,
  updateTagSchema,
};
