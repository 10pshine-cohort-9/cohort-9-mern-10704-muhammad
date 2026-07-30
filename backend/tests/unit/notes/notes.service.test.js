const { expect } = require('chai');
const sinon = require('sinon');
const createNotesService = require('../../../src/modules/notes/notes.service');
const { NotFoundError } = require('../../../src/common/errors');

describe('NotesService Unit Tests', () => {
  let mockRepository;
  let notesService;
  const userId = 'user123';
  const noteId = 'note123';

  beforeEach(() => {
    mockRepository = {
      createNote: sinon.stub(),
      findNoteById: sinon.stub(),
      findNotesByUser: sinon.stub(),
      updateNote: sinon.stub(),
      deleteNote: sinon.stub(),
    };
    notesService = createNotesService(mockRepository);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('createNote', () => {
    it('should create a note and extract plain text from html content', async () => {
      const noteData = { title: 'Meeting Notes', content: '<h1>Agenda</h1><p>Discuss project</p>' };
      mockRepository.createNote.resolves({ _id: noteId, userId, ...noteData, contentPlainText: 'Agenda Discuss project' });

      const res = await notesService.createNote(userId, noteData);

      expect(res._id).to.equal(noteId);
      expect(mockRepository.createNote.calledOnce).to.be.true;
      const createdArgs = mockRepository.createNote.firstCall.args[0];
      expect(createdArgs.contentPlainText).to.equal('Agenda Discuss project');
    });
  });

  describe('getNotes', () => {
    it('should fetch notes with active status filter by default and format pagination meta', async () => {
      mockRepository.findNotesByUser.resolves({
        notes: [{ _id: noteId, title: 'Test Note' }],
        total: 1,
      });

      const res = await notesService.getNotes(userId, { page: 1, limit: 10 });

      expect(res).to.have.property('notes');
      expect(res).to.have.property('meta');
      expect(res.meta.total).to.equal(1);
      expect(res.meta.page).to.equal(1);
      expect(mockRepository.findNotesByUser.calledOnce).to.be.true;
      const callArgs = mockRepository.findNotesByUser.firstCall.args[0];
      expect(callArgs.query.isTrashed).to.be.false;
      expect(callArgs.query.isArchived).to.be.false;
    });

    it('should apply archived status filter when requested', async () => {
      mockRepository.findNotesByUser.resolves({ notes: [], total: 0 });

      await notesService.getNotes(userId, { status: 'archived' });

      const callArgs = mockRepository.findNotesByUser.firstCall.args[0];
      expect(callArgs.query.isArchived).to.be.true;
      expect(callArgs.query.isTrashed).to.be.false;
    });

    it('should apply search text filter when search string is provided', async () => {
      mockRepository.findNotesByUser.resolves({ notes: [], total: 0 });

      await notesService.getNotes(userId, { search: 'project' });

      const callArgs = mockRepository.findNotesByUser.firstCall.args[0];
      expect(callArgs.query.$text).to.deep.equal({ $search: 'project' });
    });
  });

  describe('getNoteById', () => {
    it('should return note if found and owned by user', async () => {
      mockRepository.findNoteById.resolves({ _id: noteId, userId, title: 'Note 1' });

      const res = await notesService.getNoteById(userId, noteId);

      expect(res._id).to.equal(noteId);
    });

    it('should throw NotFoundError if note does not exist or not owned', async () => {
      mockRepository.findNoteById.resolves(null);

      try {
        await notesService.getNoteById(userId, 'nonexistent');
        expect.fail('Should throw NotFoundError');
      } catch (err) {
        expect(err).to.be.instanceOf(NotFoundError);
      }
    });
  });

  describe('updateNote', () => {
    it('should update note and re-extract plain text when content changes', async () => {
      mockRepository.findNoteById.resolves({ _id: noteId, userId });
      mockRepository.updateNote.resolves({ _id: noteId, content: '<p>Updated</p>', contentPlainText: 'Updated' });

      const res = await notesService.updateNote(userId, noteId, { content: '<p>Updated</p>' });

      expect(mockRepository.updateNote.calledOnce).to.be.true;
      const patch = mockRepository.updateNote.firstCall.args[2];
      expect(patch.contentPlainText).to.equal('Updated');
    });
  });

  describe('lifecycle toggles', () => {
    it('should toggle pin status', async () => {
      mockRepository.findNoteById.resolves({ _id: noteId, userId, isPinned: false });
      mockRepository.updateNote.resolves({ _id: noteId, isPinned: true });

      await notesService.togglePinNote(userId, noteId);

      expect(mockRepository.updateNote.calledWith(noteId, userId, { isPinned: true })).to.be.true;
    });

    it('should trash note and set deletedAt timestamp', async () => {
      mockRepository.findNoteById.resolves({ _id: noteId, userId, isTrashed: false });
      mockRepository.updateNote.resolves({ _id: noteId, isTrashed: true });

      await notesService.trashNote(userId, noteId);

      const updateCall = mockRepository.updateNote.firstCall.args[2];
      expect(updateCall.isTrashed).to.be.true;
      expect(updateCall.isPinned).to.be.false;
      expect(updateCall.deletedAt).to.be.instanceOf(Date);
    });

    it('should restore trashed note', async () => {
      mockRepository.findNoteById.resolves({ _id: noteId, userId, isTrashed: true });
      mockRepository.updateNote.resolves({ _id: noteId, isTrashed: false });

      await notesService.restoreNote(userId, noteId);

      expect(mockRepository.updateNote.calledWith(noteId, userId, { isTrashed: false, deletedAt: null })).to.be.true;
    });
  });
});
