const request = require('supertest');
const { expect } = require('chai');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const env = require('../../src/config/env');
const foldersRepository = require('../../src/modules/folders/folders.repository');
const tagsRepository = require('../../src/modules/tags/tags.repository');
const authRepository = require('../../src/modules/auth/auth.repository');

describe('Folders and Tags Integration Tests', () => {
  let token;
  const userId = '507f191e810c19729de80001';
  const folderId = '507f191e810c19729de80002';
  const tagId = '507f191e810c19729de80003';

  beforeEach(() => {
    token = jwt.sign({ sub: userId }, env.JWT_ACCESS_SECRET);
    sinon.stub(authRepository, 'findUserById').resolves({ _id: userId, id: userId, isVerified: true });
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('Folders Endpoints', () => {
    it('GET /api/v1/folders should return flat folder list', async () => {
      sinon.stub(foldersRepository, 'findAllFoldersByUser').resolves([
        { _id: folderId, name: 'Root', parentId: null },
      ]);

      const res = await request(app)
        .get('/api/v1/folders')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body.data).to.be.an('array');
      expect(res.body.data[0].name).to.equal('Root');
    });

    it('GET /api/v1/folders/tree should return 200 with folder tree', async () => {
      sinon.stub(foldersRepository, 'findAllFoldersByUser').resolves([
        { _id: folderId, name: 'Root', parentId: null },
      ]);

      const res = await request(app)
        .get('/api/v1/folders/tree')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body.data).to.be.an('array');
      expect(res.body.data[0].name).to.equal('Root');
      expect(res.body.data[0]).to.have.property('children');
    });

    it('POST /api/v1/folders should create folder', async () => {
      sinon.stub(foldersRepository, 'createFolder').resolves({
        _id: folderId,
        name: 'Work',
        color: '#64748b',
        parentId: null,
      });

      const res = await request(app)
        .post('/api/v1/folders')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Work' });

      expect(res.status).to.equal(201);
      expect(res.body.data.name).to.equal('Work');
    });

    it('PUT /api/v1/folders/:id should update folder', async () => {
      sinon.stub(foldersRepository, 'findFolderById').resolves({ _id: folderId, userId });
      sinon.stub(foldersRepository, 'updateFolder').resolves({ _id: folderId, name: 'Personal', color: '#64748b' });

      const res = await request(app)
        .put(`/api/v1/folders/${folderId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Personal' });

      expect(res.status).to.equal(200);
      expect(res.body.data.name).to.equal('Personal');
    });

    it('DELETE /api/v1/folders/:id should return 200 with envelope', async () => {
      sinon.stub(foldersRepository, 'findFolderById').resolves({ _id: folderId, userId });
      sinon.stub(foldersRepository, 'deleteFolder').resolves({ _id: folderId });

      const res = await request(app)
        .delete(`/api/v1/folders/${folderId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
    });
  });

  describe('Tags Endpoints', () => {
    it('GET /api/v1/tags should return all user tags', async () => {
      sinon.stub(tagsRepository, 'findAllTagsByUser').resolves([
        { _id: tagId, name: 'Urgent', color: '#ef4444' },
      ]);

      const res = await request(app)
        .get('/api/v1/tags')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body.data).to.be.an('array');
    });

    it('POST /api/v1/tags should create tag', async () => {
      sinon.stub(tagsRepository, 'createTag').resolves({
        _id: tagId,
        name: 'Urgent',
        color: '#ef4444',
      });

      const res = await request(app)
        .post('/api/v1/tags')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Urgent' });

      expect(res.status).to.equal(201);
      expect(res.body.data.name).to.equal('Urgent');
    });

    it('DELETE /api/v1/tags/:id should return 200 with envelope', async () => {
      sinon.stub(tagsRepository, 'findTagById').resolves({ _id: tagId, userId });
      sinon.stub(tagsRepository, 'deleteTag').resolves({ _id: tagId });

      const res = await request(app)
        .delete(`/api/v1/tags/${tagId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
    });
  });
});

