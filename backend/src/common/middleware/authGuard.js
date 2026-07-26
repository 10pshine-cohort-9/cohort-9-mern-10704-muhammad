const jwt = require('jsonwebtoken');
const env = require('../../config/env');
const authRepository = require('../../modules/auth/auth.repository');
const { AuthError } = require('../errors');
const asyncHandler = require('../utils/asyncHandler');

const authGuard = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthError('Authentication required');
  }

  const token = authHeader.split(' ')[1];
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);

  const user = await authRepository.findUserById(payload.sub);
  if (!user) {
    throw new AuthError('User no longer exists');
  }

  const id = user._id ? user._id.toString() : user.id;

  req.user = {
    id,
    name: user.name,
    email: user.email,
    isVerified: user.isVerified ?? false,
  };

  next();
});

module.exports = authGuard;
