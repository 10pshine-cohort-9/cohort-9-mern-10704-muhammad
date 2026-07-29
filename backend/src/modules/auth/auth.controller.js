const env = require('../../config/env');
const { sendSuccess } = require('../../common/utils/response');
const { AuthError } = require('../../common/errors');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

const CLEAR_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
};

const createAuthController = (service) => {
  return {
    async register(req, res) {
      const result = await service.register(req.body);
      res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);
      return sendSuccess(res, {
        statusCode: 201,
        message: 'Registered successfully',
        data: {
          accessToken: result.accessToken,
          user: result.user,
        },
      });
    },

    async login(req, res) {
      const result = await service.login(req.body);
      res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);
      return sendSuccess(res, {
        statusCode: 200,
        message: 'Logged in successfully',
        data: {
          accessToken: result.accessToken,
          user: result.user,
        },
      });
    },

    async logout(req, res) {
      await service.logout(req.user.id);
      res.clearCookie('refreshToken', CLEAR_COOKIE_OPTIONS);
      return res.status(204).send();
    },

    async refresh(req, res) {
      const token = req.cookies && req.cookies.refreshToken;
      if (!token) {
        throw new AuthError('Refresh token missing');
      }

      const result = await service.refreshAccessToken(token);
      return sendSuccess(res, {
        statusCode: 200,
        data: {
          accessToken: result.accessToken,
        },
      });
    },

    async me(req, res) {
      const user = await service.getMe(req.user.id);
      return sendSuccess(res, {
        statusCode: 200,
        data: user,
      });
    },

    async forgotPassword(req, res) {
      await service.forgotPassword(req.body.email);
      return sendSuccess(res, {
        statusCode: 200,
        message: 'If that email exists, a reset link has been sent',
      });
    },

    async resetPassword(req, res) {
      await service.resetPassword(req.body);
      return sendSuccess(res, {
        statusCode: 200,
        message: 'Password reset successfully',
      });
    },
  };
};

module.exports = createAuthController;
