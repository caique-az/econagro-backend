const { validationResult } = require('express-validator');
const { ValidationError } = require('../utils/errors');

/**
 * Middleware para validar os resultados da validação do express-validator
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value,
    }));

    throw new ValidationError('Erro de validação', errorMessages);
  }

  next();
};

module.exports = {
  validate,
};
