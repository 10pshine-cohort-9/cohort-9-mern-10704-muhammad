const { ValidationError } = require('../errors');

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const formattedErrors = result.error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));
    return next(new ValidationError('Validation failed', formattedErrors));
  }
  req.body = result.data;
  next();
};

module.exports = validate;
