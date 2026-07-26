const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const env = require('../../config/env');
const logger = require('../../logger');
const {
  AuthError,
  ConflictError,
  NotFoundError,
  BadRequestError,
} = require('../../common/errors');

const createAuthService = (repository) => {
  const getId = (user) => String(user._id || user.id);

  const generateAccessToken = (userId) =>
    jwt.sign({ sub: userId }, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    });

  const generateRefreshToken = (userId, version) =>
    jwt.sign({ sub: userId, version }, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    });

  const buildAuthResponse = (user, accessToken, refreshToken) => ({
    accessToken,
    refreshToken,
    user: {
      id: getId(user),
      name: user.name,
      email: user.email,
      isVerified: user.isVerified,
    },
  });

  return {
    async register({ name, email, password }) {
      const existingUser = await repository.findUserByEmail(email);
      if (existingUser) {
        throw new ConflictError('Email already registered');
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const user = await repository.createUser({ name, email, passwordHash });

      const userId = getId(user);
      const accessToken = generateAccessToken(userId);
      const refreshToken = generateRefreshToken(userId, user.refreshTokenVersion);

      logger.info({ userId }, 'User registered');
      return buildAuthResponse(user, accessToken, refreshToken);
    },

    async login({ email, password }) {
      const user = await repository.findUserByEmail(email, { includePassword: true });
      if (!user || !user.passwordHash) {
        throw new AuthError('Invalid email or password');
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        throw new AuthError('Invalid email or password');
      }

      const userId = getId(user);
      const accessToken = generateAccessToken(userId);
      const refreshToken = generateRefreshToken(userId, user.refreshTokenVersion);

      logger.info({ userId }, 'User logged in');
      return buildAuthResponse(user, accessToken, refreshToken);
    },

    async logout(userId) {
      await repository.incrementRefreshTokenVersion(userId);
      logger.info({ userId }, 'User logged out');
    },

    async refreshAccessToken(refreshToken) {
      const tokenPayload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
      const userId = tokenPayload.sub;

      const user = await repository.findUserById(userId);
      if (!user || user.refreshTokenVersion !== tokenPayload.version) {
        throw new AuthError('Session expired');
      }

      return { accessToken: generateAccessToken(userId) };
    },

    async getMe(userId) {
      const user = await repository.findUserById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      return {
        id: getId(user),
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    },

    async forgotPassword(email) {
      const user = await repository.findUserByEmail(email);

      if (user) {
        const rawToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
        const expires = new Date(Date.now() + 60 * 60 * 1000);

        await repository.setPasswordResetToken(getId(user), { token: hashedToken, expires });
      }

      logger.info({ email }, 'Password reset requested');
      return true;
    },

    async resetPassword({ token, newPassword }) {
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      const user = await repository.findUserByResetToken(hashedToken);

      if (!user) {
        throw new BadRequestError('Invalid or expired reset token');
      }

      const userId = getId(user);
      const passwordHash = await bcrypt.hash(newPassword, 12);

      await repository.updateUser(userId, { passwordHash });
      await repository.clearPasswordResetToken(userId);
      await repository.incrementRefreshTokenVersion(userId);

      logger.info({ userId }, 'Password reset completed');
      return true;
    },
  };
};

module.exports = createAuthService;
