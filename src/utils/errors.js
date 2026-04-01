/* eslint-disable max-classes-per-file */
const { StatusCodes } = require('http-status-codes');

class ApiError extends Error {
  constructor(message, statusCode = StatusCodes.INTERNAL_SERVER_ERROR) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError extends ApiError {
  constructor(message = 'Recurso não encontrado') {
    super(message, StatusCodes.NOT_FOUND);
  }
}

class ValidationError extends ApiError {
  constructor(message = 'Erro de validação', errors = []) {
    super(message, StatusCodes.UNPROCESSABLE_ENTITY);
    this.errors = errors;
  }
}

class UnauthorizedError extends ApiError {
  constructor(message = 'Não autorizado') {
    super(message, StatusCodes.UNAUTHORIZED);
  }
}

class ForbiddenError extends ApiError {
  constructor(message = 'Acesso negado') {
    super(message, StatusCodes.FORBIDDEN);
  }
}

class BadRequestError extends ApiError {
  constructor(message = 'Requisição inválida') {
    super(message, StatusCodes.BAD_REQUEST);
  }
}

module.exports = {
  ApiError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  BadRequestError,
};
