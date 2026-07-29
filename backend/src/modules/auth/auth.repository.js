const User = require('./auth.model');

const createUser = async ({ name, email, passwordHash }) => {
  const user = await User.create({ name, email, passwordHash });
  return user.toObject();
};

const findUserByEmail = async (email, { includePassword = false } = {}) => {
  return await User.findOne({ email })
    .select(includePassword ? '+passwordHash' : '')
    .lean();
};

const findUserById = async (id, { includePassword = false } = {}) => {
  return await User.findById(id)
    .select(includePassword ? '+passwordHash' : '')
    .lean();
};

const updateUser = async (id, updates) => {
  return await User.findByIdAndUpdate(id, updates, { new: true }).lean();
};

const incrementRefreshTokenVersion = async (userId) => {
  return await User.findByIdAndUpdate(userId, { $inc: { refreshTokenVersion: 1 } }, { new: true }).lean();
};

const setPasswordResetToken = async (userId, { token, expires }) => {
  return await User.findByIdAndUpdate(
    userId,
    { passwordResetToken: token, passwordResetExpires: expires },
    { new: true }
  ).lean();
};

const consumePasswordResetToken = async (hashedToken, newPasswordHash) => {
  try {
    return await User.findOneAndUpdate(
      {
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: new Date() },
      },
      {
        passwordHash: newPasswordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
        $inc: { refreshTokenVersion: 1 },
      },
      { new: true }
    ).lean();
  } catch (err) {
    throw err;
  }
};

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  updateUser,
  incrementRefreshTokenVersion,
  setPasswordResetToken,
  consumePasswordResetToken,
};
