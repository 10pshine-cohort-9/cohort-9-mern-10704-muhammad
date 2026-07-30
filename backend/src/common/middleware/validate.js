const { ValidationError } = require('../errors');

const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const formattedErrors = result.error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));
    return next(new ValidationError('Validation failed', formattedErrors));
  }
  req[source] = result.data;
  next();
};

module.exports = validate;
