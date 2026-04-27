const { StatusCodes } = require('http-status-codes');

const errorHandler = (err, req, res, _next) => {
  console.error('Error:', err);

  // Default error response
  const response = {
    success: false,
    message: err.message || 'Erro interno do servidor',
  };

  // Handle custom API errors first (before Mongoose checks, pois ValidationError é nome compartilhado)
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors && { errors: err.errors }),
    });
  }

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

  // Handle MongoDB duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(StatusCodes.CONFLICT).json({
      success: false,
      message: `Já existe um registro com este ${field}`,
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
