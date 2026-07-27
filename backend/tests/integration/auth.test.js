const request = require('supertest');
const { expect } = require('chai');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const authRepository = require('../../src/modules/auth/auth.repository');
const env = require('../../src/config/env');

describe('Auth Module Integration Tests', () => {
  const usersMap = new Map();
  let idCounter = 1;

  beforeEach(() => {
    usersMap.clear();
    idCounter = 1;

    sinon.stub(authRepository, 'createUser').callsFake(async ({ name, email, passwordHash }) => {
      const id = `507f191e810c19729de8${String(idCounter++).padStart(4, '0')}`;
      const user = {
        _id: id,
        id,
        name,
        email,
        passwordHash,
        isVerified: false,
        refreshTokenVersion: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      usersMap.set(id, user);
      return user;
    });

    sinon.stub(authRepository, 'findUserByEmail').callsFake(async (email, { includePassword = false } = {}) => {
      for (const user of usersMap.values()) {
        if (user.email === email) {
          const userCopy = { ...user };
          if (!includePassword) {
            delete userCopy.passwordHash;
          }
          return userCopy;
        }
      }
      return null;
    });

    sinon.stub(authRepository, 'findUserById').callsFake(async (id, { includePassword = false } = {}) => {
      const user = usersMap.get(id);
      if (!user) return null;
      const userCopy = { ...user };
      if (!includePassword) {
        delete userCopy.passwordHash;
      }
      return userCopy;
    });

    sinon.stub(authRepository, 'incrementRefreshTokenVersion').callsFake(async (userId) => {
      const user = usersMap.get(userId);
      if (!user) return null;
      user.refreshTokenVersion += 1;
      return { ...user };
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should return 201 and set refreshToken cookie on successful registration', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'password123',
        });

      expect(res.status).to.equal(201);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal('Logged in successfully');
      expect(res.body.data).to.have.property('accessToken');
      expect(res.body.data.user).to.include({
        name: 'Jane Doe',
        email: 'jane@example.com',
        isVerified: false,
      });
      expect(res.headers['set-cookie']).to.exist;
      expect(res.headers['set-cookie'][0]).to.include('refreshToken=');
    });

    it('should return 409 on duplicate email registration', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'password123',
        });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Jane Copy',
          email: 'jane@example.com',
          password: 'password123',
        });

      expect(res.status).to.equal(409);
      expect(res.body.success).to.be.false;
      expect(res.body.error.code).to.equal('CONFLICT');
    });

    it('should return 422 on invalid request body', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: '',
          email: 'invalid-email',
          password: '123',
        });

      expect(res.status).to.equal(422);
      expect(res.body.success).to.be.false;
      expect(res.body.error.code).to.equal('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'John Smith',
          email: 'john@example.com',
          password: 'password123',
        });
    });

    it('should return 200 on valid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'john@example.com',
          password: 'password123',
        });

      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.have.property('accessToken');
    });

    it('should return 401 on wrong credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'john@example.com',
          password: 'wrongpassword',
        });

      expect(res.status).to.equal(401);
      expect(res.body.success).to.be.false;
      expect(res.body.error.message).to.equal('Invalid email or password');
    });

    it('should return 422 on invalid body', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'notanemail',
        });

      expect(res.status).to.equal(422);
      expect(res.body.success).to.be.false;
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should return 204 with valid token', async () => {
      const regRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Logout User',
          email: 'logout@example.com',
          password: 'password123',
        });

      const token = regRes.body.data.accessToken;

      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(204);
      expect(res.headers['set-cookie']).to.exist;
      expect(res.headers['set-cookie'][0]).to.match(/refreshToken=;/);
    });

    it('should return 401 without token', async () => {
      const res = await request(app).post('/api/v1/auth/logout');
      expect(res.status).to.equal(401);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should return 200 with valid refreshToken cookie', async () => {
      const regRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Refresh User',
          email: 'refresh@example.com',
          password: 'password123',
        });

      const cookie = regRes.headers['set-cookie'];

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', cookie);

      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.have.property('accessToken');
    });

    it('should return 401 with missing cookie', async () => {
      const res = await request(app).post('/api/v1/auth/refresh');
      expect(res.status).to.equal(401);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return 200 with valid token', async () => {
      const regRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Me User',
          email: 'me@example.com',
          password: 'password123',
        });

      const token = regRes.body.data.accessToken;

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data.email).to.equal('me@example.com');
    });

    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).to.equal(401);
    });
  });
});
