const Tag = require('./tags.model');

const createTag = async (data) => {
  const tag = await Tag.create(data);
  return tag.toObject();
};

const findTagById = async (id, userId) => {
  return await Tag.findOne({ _id: id, userId }).lean();
};

const findTagByName = async (name, userId) => {
  return await Tag.findOne({ name, userId }).lean();
};

const findAllTagsByUser = async (userId) => {
  return await Tag.find({ userId }).sort({ name: 1 }).lean();
};

const updateTag = async (id, userId, updates) => {
  return await Tag.findOneAndUpdate({ _id: id, userId }, updates, { new: true }).lean();
};

const deleteTag = async (id, userId) => {
  return await Tag.findOneAndDelete({ _id: id, userId }).lean();
};

module.exports = {
  createTag,
  findTagById,
  findTagByName,
  findAllTagsByUser,
  updateTag,
  deleteTag,
};
