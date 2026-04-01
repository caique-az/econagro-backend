const { body, param, validationResult } = require('express-validator');
const { StatusCodes } = require('http-status-codes');

// Middleware de validação
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const extractedErrors = [];
  errors.array().map(err => extractedErrors.push({ [err.path]: err.msg }));

  return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
    success: false,
    errors: extractedErrors,
  });
};

// Regras de validação
const productValidationRules = {
  // Criar produto
  create: [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('O nome é obrigatório')
      .isLength({ min: 3, max: 100 })
      .withMessage('O nome deve ter entre 3 e 100 caracteres'),

    body('price')
      .notEmpty()
      .withMessage('O preço é obrigatório')
      .isFloat({ min: 0.01 })
      .withMessage('O preço deve ser maior que zero'),

    body('category').trim().notEmpty().withMessage('A categoria é obrigatória'),

    body('description').optional().isString().withMessage('A descrição deve ser um texto'),

    body('imageUrl').optional().isURL().withMessage('A URL da imagem deve ser válida'),
  ],

  // Atualizar produto
  update: [
    param('id').isInt().withMessage('ID inválido'),

    body('name')
      .optional()
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('O nome deve ter entre 3 e 100 caracteres'),

    body('price').optional().isFloat({ min: 0.01 }).withMessage('O preço deve ser maior que zero'),

    body('category').optional().trim().notEmpty().withMessage('A categoria não pode estar vazia'),

    body('description').optional().isString().withMessage('A descrição deve ser um texto'),

    body('imageUrl').optional().isURL().withMessage('A URL da imagem deve ser válida'),
  ],

  // Obter/Excluir por ID
  getById: [param('id').isInt().withMessage('ID inválido')],
};

module.exports = {
  validate,
  productValidationRules,
};
