const { z } = require('zod');

const objectIdRegex = /^[a-fA-F0-9]{24}$/;

const createNoteSchema = z.object({
  title: z.string().trim().max(200, 'Title max 200 chars').optional().default('Untitled'),
  content: z.string().optional().default(''),
  format: z.enum(['richtext', 'markdown']).optional().default('richtext'),
  folderId: z.string().regex(objectIdRegex, 'Invalid folder ID').nullable().optional(),
  tags: z.array(z.string().regex(objectIdRegex, 'Invalid tag ID')).optional().default([]),
  isPinned: z.boolean().optional().default(false),
  isArchived: z.boolean().optional().default(false),
  templateId: z.string().nullable().optional(),
});

const updateNoteSchema = createNoteSchema.partial();

const queryNoteSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  sort: z.enum(['updatedAt', '-updatedAt', 'createdAt', '-createdAt', 'title', '-title']).optional().default('-updatedAt'),
  folderId: z.string().optional(),
  tagId: z.string().optional(),
  search: z.string().optional(),
  status: z.enum(['active', 'archived', 'trashed']).optional().default('active'),
  pinned: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
  createdAfter: z.string().datetime({ offset: true }).or(z.string()).optional(),
  createdBefore: z.string().datetime({ offset: true }).or(z.string()).optional(),
  updatedAfter: z.string().datetime({ offset: true }).or(z.string()).optional(),
  updatedBefore: z.string().datetime({ offset: true }).or(z.string()).optional(),
});

module.exports = {
  createNoteSchema,
  updateNoteSchema,
  queryNoteSchema,
};
