const { expect } = require('chai');
const sinon = require('sinon');
const createFoldersService = require('../../../src/modules/folders/folders.service');
const { NotFoundError, BadRequestError, ConflictError } = require('../../../src/common/errors');

describe('FoldersService Unit Tests', () => {
  let mockRepository;
  let foldersService;

  beforeEach(() => {
    mockRepository = {
      createFolder: sinon.stub(),
      findFolderById: sinon.stub(),
      findAllFoldersByUser: sinon.stub(),
      updateFolder: sinon.stub(),
      deleteFolder: sinon.stub(),
    };
    foldersService = createFoldersService(mockRepository);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('createFolder', () => {
    it('should create root folder successfully', async () => {
      const folderData = { name: 'Work', color: '#64748b' };
      mockRepository.createFolder.resolves({ _id: 'f1', userId: 'u1', ...folderData, parentId: null });

      const res = await foldersService.createFolder('u1', folderData);
      expect(res._id).to.equal('f1');
    });

    it('should throw NotFoundError if parent folder does not exist', async () => {
      mockRepository.findFolderById.resolves(null);

      try {
        await foldersService.createFolder('u1', { name: 'Sub', parentId: 'nonexistent' });
        expect.fail('Should throw NotFoundError');
      } catch (err) {
        expect(err).to.be.instanceOf(NotFoundError);
      }
    });

    it('should throw ConflictError on duplicate folder name in same location', async () => {
      const err = new Error('E11000 duplicate key');
      err.code = 11000;
      mockRepository.createFolder.rejects(err);

      try {
        await foldersService.createFolder('u1', { name: 'Work' });
        expect.fail('Should throw ConflictError');
      } catch (e) {
        expect(e).to.be.instanceOf(ConflictError);
      }
    });
  });

  describe('getFolderTree', () => {
    it('should build hierarchical tree structure', async () => {
      const folders = [
        { _id: 'f1', name: 'Work', parentId: null },
        { _id: 'f2', name: 'Projects', parentId: 'f1' },
      ];
      mockRepository.findAllFoldersByUser.resolves(folders);

      const tree = await foldersService.getFolderTree('u1');
      expect(tree).to.have.lengthOf(1);
      expect(tree[0].name).to.equal('Work');
      expect(tree[0].children).to.have.lengthOf(1);
      expect(tree[0].children[0].name).to.equal('Projects');
    });
  });

  describe('updateFolder', () => {
    it('should throw BadRequestError if setting self as parent', async () => {
      mockRepository.findFolderById.resolves({ _id: 'f1', userId: 'u1' });

      try {
        await foldersService.updateFolder('u1', 'f1', { parentId: 'f1' });
        expect.fail('Should throw BadRequestError');
      } catch (err) {
        expect(err).to.be.instanceOf(BadRequestError);
      }
    });
  });
});
