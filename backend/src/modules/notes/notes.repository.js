const Note = require('./notes.model');

const createNote = async (data) => {
  const note = await Note.create(data);
  return note.toObject();
};

const findNoteById = async (id, userId) => {
  return await Note.findOne({ _id: id, userId }).lean();
};

const findNotesByUser = async ({ userId, query = {}, page = 1, limit = 20, sort = '-updatedAt' }) => {
  const filter = { userId, ...query };

  const [notes, total] = await Promise.all([
    Note.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Note.countDocuments(filter),
  ]);

  return { notes, total };
};

const updateNote = async (id, userId, updates) => {
  return await Note.findOneAndUpdate({ _id: id, userId }, updates, { new: true }).lean();
};

const deleteNote = async (id, userId) => {
  return await Note.findOneAndDelete({ _id: id, userId }).lean();
};

module.exports = {
  createNote,
  findNoteById,
  findNotesByUser,
  updateNote,
  deleteNote,
};
