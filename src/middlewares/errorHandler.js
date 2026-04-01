const { StatusCodes } = require('http-status-codes');

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error response
  const response = {
    success: false,
    message: err.message || 'Erro interno do servidor',
  };

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    response.message = 'Erro de validação';
    response.errors = Object.keys(err.errors).map(key => ({
      field: key,
      message: err.errors[key].message,
    }));
    return res.status(StatusCodes.BAD_REQUEST).json(response);
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: `Valor inválido para ${err.path}: ${err.value}`,
    });
  }

  // Handle not found errors (custom)
  if (err.name === 'NotFoundError') {
    return res.status(StatusCodes.NOT_FOUND).json({
      success: false,
      message: err.message || 'Recurso não encontrado',
    });
  }

  // Handle bad request errors (custom)
  if (err.name === 'BadRequestError') {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: err.message || 'Requisição inválida',
    });
  }

  // Handle MongoDB duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(StatusCodes.CONFLICT).json({
      success: false,
      message: `Já existe um registro com este ${field}`,
    });
  }

  // Handle custom API errors with statusCode
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors && { errors: err.errors }),
    });
  }

  // Default error
  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: 'Ocorreu um erro inesperado',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
