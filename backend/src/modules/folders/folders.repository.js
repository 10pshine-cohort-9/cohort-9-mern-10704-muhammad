const Folder = require('./folders.model');

const createFolder = async (data) => {
  const folder = await Folder.create(data);
  return folder.toObject();
};

const findFolderById = async (id, userId) => {
  return await Folder.findOne({ _id: id, userId }).lean();
};

const findAllFoldersByUser = async (userId) => {
  return await Folder.find({ userId }).sort({ name: 1 }).lean();
};

const updateFolder = async (id, userId, updates) => {
  return await Folder.findOneAndUpdate({ _id: id, userId }, updates, { new: true }).lean();
};

const deleteFolder = async (id, userId) => {
  return await Folder.findOneAndDelete({ _id: id, userId }).lean();
};

module.exports = {
  createFolder,
  findFolderById,
  findAllFoldersByUser,
  updateFolder,
  deleteFolder,
};
