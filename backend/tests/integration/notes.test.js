const request = require('supertest');
const { expect } = require('chai');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const env = require('../../src/config/env');
const notesRepository = require('../../src/modules/notes/notes.repository');
const authRepository = require('../../src/modules/auth/auth.repository');

describe('Notes Integration Tests', () => {
  let token;
  const userId = '507f191e810c19729de80001';
  const noteId = '507f191e810c19729de80009';

  beforeEach(() => {
    token = jwt.sign({ sub: userId }, env.JWT_ACCESS_SECRET);
    sinon.stub(authRepository, 'findUserById').resolves({ _id: userId, id: userId, isVerified: true });
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('POST /api/v1/notes', () => {
    it('should create note successfully and return 201', async () => {
      sinon.stub(notesRepository, 'createNote').resolves({
        _id: noteId,
        title: 'Meeting Notes',
        content: '<p>Discuss roadmap</p>',
        contentPlainText: 'Discuss roadmap',
        userId,
        isPinned: false,
        isArchived: false,
        isTrashed: false,
      });

      const res = await request(app)
        .post('/api/v1/notes')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Meeting Notes', content: '<p>Discuss roadmap</p>' });

      expect(res.status).to.equal(201);
      expect(res.body.success).to.be.true;
      expect(res.body.data.title).to.equal('Meeting Notes');
    });

    it('should return 401 when authorization header is missing', async () => {
      const res = await request(app)
        .post('/api/v1/notes')
        .send({ title: 'Unauthorized note' });

      expect(res.status).to.equal(401);
    });
  });

  describe('GET /api/v1/notes', () => {
    it('should return 200 with paginated notes list and metadata', async () => {
      sinon.stub(notesRepository, 'findNotesByUser').resolves({
        notes: [{ _id: noteId, title: 'Meeting Notes', userId }],
        total: 1,
      });

      const res = await request(app)
        .get('/api/v1/notes?page=1&limit=10')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body.data).to.be.an('array');
      expect(res.body.meta).to.have.property('total', 1);
      expect(res.body.meta).to.have.property('page', 1);
    });
  });

  describe('GET /api/v1/notes/:id', () => {
    it('should return 200 with note data', async () => {
      sinon.stub(notesRepository, 'findNoteById').resolves({
        _id: noteId,
        title: 'Meeting Notes',
        userId,
      });

      const res = await request(app)
        .get(`/api/v1/notes/${noteId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body.data.title).to.equal('Meeting Notes');
    });

    it('should return 404 when note is not found', async () => {
      sinon.stub(notesRepository, 'findNoteById').resolves(null);

      const res = await request(app)
        .get(`/api/v1/notes/${noteId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(404);
    });
  });

  describe('PATCH /api/v1/notes/:id', () => {
    it('should update note and return 200', async () => {
      sinon.stub(notesRepository, 'findNoteById').resolves({ _id: noteId, userId });
      sinon.stub(notesRepository, 'updateNote').resolves({
        _id: noteId,
        title: 'Updated Title',
        userId,
      });

      const res = await request(app)
        .patch(`/api/v1/notes/${noteId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated Title' });

      expect(res.status).to.equal(200);
      expect(res.body.data.title).to.equal('Updated Title');
    });
  });

  describe('DELETE /api/v1/notes/:id', () => {
    it('should soft-delete note to trash and return 200', async () => {
      sinon.stub(notesRepository, 'findNoteById').resolves({ _id: noteId, userId, isTrashed: false });
      sinon.stub(notesRepository, 'updateNote').resolves({ _id: noteId, isTrashed: true });

      const res = await request(app)
        .delete(`/api/v1/notes/${noteId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body.message).to.equal('Note moved to trash');
    });
  });

  describe('Lifecycle routes', () => {
    it('POST /api/v1/notes/:id/pin toggles pin', async () => {
      sinon.stub(notesRepository, 'findNoteById').resolves({ _id: noteId, userId, isPinned: false });
      sinon.stub(notesRepository, 'updateNote').resolves({ _id: noteId, isPinned: true });

      const res = await request(app)
        .post(`/api/v1/notes/${noteId}/pin`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body.data.isPinned).to.be.true;
    });

    it('POST /api/v1/notes/:id/archive archives note', async () => {
      sinon.stub(notesRepository, 'findNoteById').resolves({ _id: noteId, userId, isArchived: false });
      sinon.stub(notesRepository, 'updateNote').resolves({ _id: noteId, isArchived: true });

      const res = await request(app)
        .post(`/api/v1/notes/${noteId}/archive`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body.message).to.equal('Note archived successfully');
    });

    it('POST /api/v1/notes/:id/restore restores note from trash', async () => {
      sinon.stub(notesRepository, 'findNoteById').resolves({ _id: noteId, userId, isTrashed: true });
      sinon.stub(notesRepository, 'updateNote').resolves({ _id: noteId, isTrashed: false });

      const res = await request(app)
        .post(`/api/v1/notes/${noteId}/restore`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body.message).to.equal('Note restored from trash');
    });
  });
});
