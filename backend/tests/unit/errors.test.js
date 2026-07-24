const { expect } = require('chai');
const {
  AppError,
  AuthError,
  NotFoundError,
  ConflictError,
  ValidationError,
  BadRequestError,
} = require('../../src/common/errors');

describe('Custom Error Classes Unit Tests', () => {
  it('AppError should instantiate with default values', () => {
    const err = new AppError('Server error');
    expect(err.message).to.equal('Server error');
    expect(err.statusCode).to.equal(500);
    expect(err.code).to.equal('INTERNAL_ERROR');
  });

  it('AuthError should have status 401 and code UNAUTHORIZED', () => {
    const err = new AuthError();
    expect(err.message).to.equal('Authentication required');
    expect(err.statusCode).to.equal(401);
    expect(err.code).to.equal('UNAUTHORIZED');
  });

  it('NotFoundError should have status 404 and code NOT_FOUND', () => {
    const err = new NotFoundError('Item missing');
    expect(err.message).to.equal('Item missing');
    expect(err.statusCode).to.equal(404);
    expect(err.code).to.equal('NOT_FOUND');
  });

  it('ConflictError should have status 409 and code CONFLICT', () => {
    const err = new ConflictError('Duplicate key');
    expect(err.statusCode).to.equal(409);
    expect(err.code).to.equal('CONFLICT');
  });

  it('ValidationError should have status 422 and code VALIDATION_ERROR', () => {
    const details = [{ field: 'email', message: 'Invalid format' }];
    const err = new ValidationError('Validation failed', details);
    expect(err.statusCode).to.equal(422);
    expect(err.code).to.equal('VALIDATION_ERROR');
    expect(err.details).to.deep.equal(details);
  });
});
