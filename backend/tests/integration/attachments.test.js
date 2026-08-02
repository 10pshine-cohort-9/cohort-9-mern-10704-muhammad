const request = require('supertest');
const { expect } = require('chai');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const env = require('../../src/config/env');
const authRepository = require('../../src/modules/auth/auth.repository');
const notesRepository = require('../../src/modules/notes/notes.repository');
const attachmentsRepository = require('../../src/modules/attachments/attachments.repository');
const cloudinary = require('../../src/config/cloudinary');

describe('Attachments Integration Tests', () => {
  let token;
  const userId = '507f191e810c19729de80001';
  const noteId = '507f191e810c19729de80002';
  const attachmentId = '507f191e810c19729de80003';

  beforeEach(() => {
    token = jwt.sign({ sub: userId }, env.JWT_ACCESS_SECRET);
    sinon.stub(authRepository, 'findUserById').resolves({ _id: userId, id: userId, isVerified: true });
  });

  afterEach(() => sinon.restore());

  describe('POST /api/v1/notes/:noteId/attachments', () => {
    it('should upload attachment and return 201', async () => {
      sinon.stub(notesRepository, 'findNoteById').resolves({ _id: noteId, userId });
      sinon.stub(cloudinary.uploader, 'upload_stream').callsFake((opts, cb) => {
        cb(null, { secure_url: 'https://res.cloudinary.com/test.png', public_id: 'noteshub/abc' });
        return { end: sinon.stub() };
      });
      sinon.stub(attachmentsRepository, 'createAttachment').resolves({
        _id: attachmentId,
        url: 'https://res.cloudinary.com/test.png',
        publicId: 'noteshub/abc',
        filename: 'test.png',
        mimeType: 'image/png',
        size: 1024,
      });

      const res = await request(app)
        .post(`/api/v1/notes/${noteId}/attachments`)
        .set('Authorization', `Bearer ${token}`)
        .attach('file', Buffer.from('fake image'), { filename: 'test.png', contentType: 'image/png' });

      expect(res.status).to.equal(201);
      expect(res.body.data.url).to.equal('https://res.cloudinary.com/test.png');
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app)
        .post(`/api/v1/notes/${noteId}/attachments`)
        .attach('file', Buffer.from('fake'), { filename: 'test.png', contentType: 'image/png' });
      expect(res.status).to.equal(401);
    });

    it('should return 400 for disallowed MIME type', async () => {
      sinon.stub(notesRepository, 'findNoteById').resolves({ _id: noteId, userId });

      const res = await request(app)
        .post(`/api/v1/notes/${noteId}/attachments`)
        .set('Authorization', `Bearer ${token}`)
        .attach('file', Buffer.from('exe content'), { filename: 'virus.exe', contentType: 'application/exe' });

      expect(res.status).to.equal(400);
    });
  });

  describe('GET /api/v1/notes/:noteId/attachments', () => {
    it('should list attachments for a note', async () => {
      sinon.stub(notesRepository, 'findNoteById').resolves({ _id: noteId, userId });
      sinon.stub(attachmentsRepository, 'findAttachmentsByNote').resolves([
        { _id: attachmentId, filename: 'test.png', url: 'https://res.cloudinary.com/test.png' },
      ]);

      const res = await request(app)
        .get(`/api/v1/notes/${noteId}/attachments`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body.data).to.be.an('array').with.length(1);
    });
  });

  describe('DELETE /api/v1/attachments/:id', () => {
    it('should delete attachment and return 200', async () => {
      sinon.stub(attachmentsRepository, 'findAttachmentById').resolves({
        _id: attachmentId,
        publicId: 'noteshub/abc',
      });
      sinon.stub(cloudinary.uploader, 'destroy').resolves({ result: 'ok' });
      sinon.stub(attachmentsRepository, 'deleteAttachment').resolves({ _id: attachmentId });

      const res = await request(app)
        .delete(`/api/v1/attachments/${attachmentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
    });

    it('should return 404 for non-existent attachment', async () => {
      sinon.stub(attachmentsRepository, 'findAttachmentById').resolves(null);

      const res = await request(app)
        .delete(`/api/v1/attachments/${attachmentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(404);
    });
  });
});
