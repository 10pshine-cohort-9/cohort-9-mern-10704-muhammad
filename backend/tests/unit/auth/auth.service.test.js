const { expect } = require('chai');
const sinon = require('sinon');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const env = require('../../../src/config/env');
const createAuthService = require('../../../src/modules/auth/auth.service');
const {
  AuthError,
  ConflictError,
  NotFoundError,
  BadRequestError,
} = require('../../../src/common/errors');

describe('AuthService Unit Tests', () => {
  let mockRepository;
  let authService;

  beforeEach(() => {
    mockRepository = {
      createUser: sinon.stub(),
      findUserByEmail: sinon.stub(),
      findUserById: sinon.stub(),
      updateUser: sinon.stub(),
      incrementRefreshTokenVersion: sinon.stub(),
      setPasswordResetToken: sinon.stub(),
      findUserByResetToken: sinon.stub(),
      clearPasswordResetToken: sinon.stub(),
      consumePasswordResetToken: sinon.stub(),
    };
    authService = createAuthService(mockRepository);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('register', () => {
    it('should register a new user successfully and return tokens', async () => {
      const registerData = { name: 'Test User', email: 'test@example.com', password: 'password123' };

      mockRepository.findUserByEmail.resolves(null);
      mockRepository.createUser.resolves({
        _id: 'user123',
        name: registerData.name,
        email: registerData.email,
        isVerified: false,
        refreshTokenVersion: 0,
      });

      const result = await authService.register(registerData);

      expect(result).to.have.property('accessToken');
      expect(result).to.have.property('refreshToken');
      expect(result.user).to.deep.equal({
        id: 'user123',
        name: registerData.name,
        email: registerData.email,
        isVerified: false,
      });
      expect(mockRepository.findUserByEmail.calledWith(registerData.email)).to.be.true;
      expect(mockRepository.createUser.calledOnce).to.be.true;
    });

    it('should throw ConflictError if email is already registered', async () => {
      const registerData = { name: 'Test User', email: 'existing@example.com', password: 'password123' };
      mockRepository.findUserByEmail.resolves({ _id: 'user123', email: registerData.email });

      try {
        await authService.register(registerData);
        expect.fail('Should have thrown ConflictError');
      } catch (err) {
        expect(err).to.be.instanceOf(ConflictError);
        expect(err.message).to.equal('Email already registered');
      }
    });

    it('should throw ConflictError on Mongo duplicate key error (E11000)', async () => {
      const registerData = { name: 'Test User', email: 'concurrent@example.com', password: 'password123' };
      mockRepository.findUserByEmail.resolves(null);
      const mongoError = new Error('E11000 duplicate key error');
      mongoError.code = 11000;
      mockRepository.createUser.rejects(mongoError);

      try {
        await authService.register(registerData);
        expect.fail('Should have thrown ConflictError');
      } catch (err) {
        expect(err).to.be.instanceOf(ConflictError);
        expect(err.message).to.equal('Email already registered');
      }
    });
  });

  describe('login', () => {
    it('should log in existing user with correct password', async () => {
      const loginData = { email: 'test@example.com', password: 'password123' };
      const hashedPassword = await bcrypt.hash(loginData.password, 10);

      mockRepository.findUserByEmail.resolves({
        _id: 'user123',
        name: 'Test User',
        email: loginData.email,
        passwordHash: hashedPassword,
        isVerified: false,
        refreshTokenVersion: 0,
      });

      const result = await authService.login(loginData);

      expect(result).to.have.property('accessToken');
      expect(result).to.have.property('refreshToken');
      expect(result.user.email).to.equal(loginData.email);
    });

    it('should throw AuthError on wrong email', async () => {
      mockRepository.findUserByEmail.resolves(null);

      try {
        await authService.login({ email: 'nonexistent@example.com', password: 'password123' });
        expect.fail('Should have thrown AuthError');
      } catch (err) {
        expect(err).to.be.instanceOf(AuthError);
        expect(err.message).to.equal('Invalid email or password');
      }
    });

    it('should throw AuthError on wrong password with same error message as wrong email', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 10);

      mockRepository.findUserByEmail.resolves({
        _id: 'user123',
        email: 'test@example.com',
        passwordHash: hashedPassword,
      });

      try {
        await authService.login({ email: 'test@example.com', password: 'wrongpassword' });
        expect.fail('Should have thrown AuthError');
      } catch (err) {
        expect(err).to.be.instanceOf(AuthError);
        expect(err.message).to.equal('Invalid email or password');
      }
    });
  });

  describe('logout', () => {
    it('should call incrementRefreshTokenVersion with correct userId', async () => {
      const userId = 'user123';
      mockRepository.incrementRefreshTokenVersion.resolves({ _id: userId, refreshTokenVersion: 1 });

      await authService.logout(userId);

      expect(mockRepository.incrementRefreshTokenVersion.calledWith(userId)).to.be.true;
    });
  });

  describe('refreshAccessToken', () => {
    it('should return new accessToken for valid refresh token', async () => {
      const userId = 'user123';
      const version = 0;
      const validRefreshToken = jwt.sign({ sub: userId, version }, env.JWT_REFRESH_SECRET);

      mockRepository.findUserById.resolves({ _id: userId, refreshTokenVersion: version });

      const result = await authService.refreshAccessToken(validRefreshToken);

      expect(result).to.have.property('accessToken');
    });

    it('should throw AuthError when refreshTokenVersion is mismatched', async () => {
      const userId = 'user123';
      const oldVersion = 0;
      const token = jwt.sign({ sub: userId, version: oldVersion }, env.JWT_REFRESH_SECRET);

      mockRepository.findUserById.resolves({ _id: userId, refreshTokenVersion: 1 });

      try {
        await authService.refreshAccessToken(token);
        expect.fail('Should have thrown AuthError');
      } catch (err) {
        expect(err).to.be.instanceOf(AuthError);
        expect(err.message).to.equal('Session expired');
      }
    });

    it('should throw AuthError when refresh token is malformed/invalid', async () => {
      try {
        await authService.refreshAccessToken('invalid-token');
        expect.fail('Should have thrown AuthError');
      } catch (err) {
        expect(err).to.be.instanceOf(AuthError);
        expect(err.message).to.equal('Session expired');
      }
    });
  });

  describe('forgotPassword', () => {
    it('should resolve for existing email', async () => {
      mockRepository.findUserByEmail.resolves({ _id: 'user123', email: 'test@example.com' });
      mockRepository.setPasswordResetToken.resolves({});

      const result = await authService.forgotPassword('test@example.com');
      expect(result).to.be.true;
      expect(mockRepository.setPasswordResetToken.calledOnce).to.be.true;
    });

    it('should resolve for non-existing email without throwing', async () => {
      mockRepository.findUserByEmail.resolves(null);

      const result = await authService.forgotPassword('unknown@example.com');
      expect(result).to.be.true;
      expect(mockRepository.setPasswordResetToken.called).to.be.false;
    });
  });

  describe('resetPassword', () => {
    it('should reset password for valid token', async () => {
      mockRepository.consumePasswordResetToken.resolves({ _id: 'user123' });

      try {
        const result = await authService.resetPassword({ token: 'valid-token', newPassword: 'newpassword123' });
        expect(result).to.be.true;
        expect(mockRepository.consumePasswordResetToken.calledOnce).to.be.true;
      } catch (err) {
        expect.fail(`Unexpected rejection: ${err.message}`);
      }
    });

    it('should throw BadRequestError for invalid or expired token', async () => {
      mockRepository.consumePasswordResetToken.resolves(null);

      try {
        await authService.resetPassword({ token: 'invalid-token', newPassword: 'newpassword123' });
        expect.fail('Should have thrown BadRequestError');
      } catch (err) {
        expect(err).to.be.instanceOf(BadRequestError);
        expect(err.message).to.equal('Invalid or expired reset token');
      }
    });
  });
});
