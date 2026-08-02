const { expect } = require('chai');
const sinon = require('sinon');
const cloudinary = require('../../../src/config/cloudinary');
const createAttachmentsService = require('../../../src/modules/attachments/attachments.service');

describe('AttachmentsService Unit Tests', () => {
  let service;
  let repository;
  let notesRepository;

  const userId = '507f191e810c19729de80001';
  const noteId = '507f191e810c19729de80002';
  const attachmentId = '507f191e810c19729de80003';

  const fakeFile = {
    originalname: 'test.png',
    mimetype: 'image/png',
    size: 1024,
    buffer: Buffer.from('fake'),
  };

  beforeEach(() => {
    repository = {
      createAttachment: sinon.stub(),
      findAttachmentById: sinon.stub(),
      findAttachmentsByNote: sinon.stub(),
      deleteAttachment: sinon.stub(),
    };
    notesRepository = {
      findNoteById: sinon.stub(),
    };
    service = createAttachmentsService(repository, notesRepository);
  });

  afterEach(() => sinon.restore());

  describe('upload', () => {
    it('should upload file and return attachment record', async () => {
      notesRepository.findNoteById.resolves({ _id: noteId, userId });

      const uploadStub = sinon.stub(cloudinary.uploader, 'upload_stream').callsFake((opts, cb) => {
        cb(null, { secure_url: 'https://res.cloudinary.com/test.png', public_id: 'noteshub/123' });
        return { end: sinon.stub() };
      });

      repository.createAttachment.resolves({
        _id: attachmentId,
        url: 'https://res.cloudinary.com/test.png',
        publicId: 'noteshub/123',
        filename: 'test.png',
        mimeType: 'image/png',
        size: 1024,
      });

      const result = await service.upload(userId, noteId, fakeFile);
      expect(result.url).to.equal('https://res.cloudinary.com/test.png');
      expect(repository.createAttachment.calledOnce).to.be.true;
      uploadStub.restore();
    });

    it('should throw NotFoundError if note does not exist', async () => {
      notesRepository.findNoteById.resolves(null);
      try {
        await service.upload(userId, noteId, fakeFile);
        throw new Error('Should have thrown');
      } catch (err) {
        expect(err.constructor.name).to.equal('NotFoundError');
      }
    });

    it('should throw BadRequestError for disallowed MIME type', async () => {
      notesRepository.findNoteById.resolves({ _id: noteId, userId });
      const badFile = { ...fakeFile, mimetype: 'application/exe' };
      try {
        await service.upload(userId, noteId, badFile);
        throw new Error('Should have thrown');
      } catch (err) {
        expect(err.constructor.name).to.equal('BadRequestError');
      }
    });

    it('should throw BadRequestError if file exceeds 10MB', async () => {
      notesRepository.findNoteById.resolves({ _id: noteId, userId });
      const bigFile = { ...fakeFile, size: 11 * 1024 * 1024 };
      try {
        await service.upload(userId, noteId, bigFile);
        throw new Error('Should have thrown');
      } catch (err) {
        expect(err.constructor.name).to.equal('BadRequestError');
      }
    });
  });

  describe('listByNote', () => {
    it('should return attachments for a valid note', async () => {
      notesRepository.findNoteById.resolves({ _id: noteId, userId });
      repository.findAttachmentsByNote.resolves([{ _id: attachmentId, filename: 'test.png' }]);

      const result = await service.listByNote(userId, noteId);
      expect(result).to.be.an('array').with.length(1);
    });

    it('should throw NotFoundError if note not owned by user', async () => {
      notesRepository.findNoteById.resolves(null);
      try {
        await service.listByNote(userId, noteId);
        throw new Error('Should have thrown');
      } catch (err) {
        expect(err.constructor.name).to.equal('NotFoundError');
      }
    });
  });

  describe('remove', () => {
    it('should destroy from Cloudinary and delete record', async () => {
      repository.findAttachmentById.resolves({ _id: attachmentId, publicId: 'noteshub/123' });
      const destroyStub = sinon.stub(cloudinary.uploader, 'destroy').resolves({ result: 'ok' });
      repository.deleteAttachment.resolves({ _id: attachmentId });

      await service.remove(userId, attachmentId);
      expect(destroyStub.calledOnce).to.be.true;
      expect(repository.deleteAttachment.calledOnce).to.be.true;
    });

    it('should throw NotFoundError if attachment not found', async () => {
      repository.findAttachmentById.resolves(null);
      try {
        await service.remove(userId, attachmentId);
        throw new Error('Should have thrown');
      } catch (err) {
        expect(err.constructor.name).to.equal('NotFoundError');
      }
    });
  });
});
