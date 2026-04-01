const { StatusCodes } = require('http-status-codes');
const errorHandler = require('../../src/middlewares/errorHandler');
const {
  NotFoundError,
  BadRequestError,
  ValidationError,
} = require('../../src/utils/errors');

describe('Error Handler Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  it('deve tratar NotFoundError', () => {
    const error = new NotFoundError('Recurso não encontrado');

    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: 'Recurso não encontrado',
    });
  });

  it('deve tratar BadRequestError', () => {
    const error = new BadRequestError('Requisição inválida');

    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: 'Requisição inválida',
    });
  });

  it('deve tratar ValidationError com erros', () => {
    const error = new ValidationError('Erro de validação', [
      { field: 'name', message: 'Nome é obrigatório' },
    ]);

    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.UNPROCESSABLE_ENTITY);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: 'Erro de validação',
      errors: [{ field: 'name', message: 'Nome é obrigatório' }],
    });
  });

  it('deve tratar erro de chave duplicada do MongoDB (11000)', () => {
    const error = {
      code: 11000,
      keyValue: { name: 'Teste' },
    };

    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.CONFLICT);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: 'Já existe um registro com este name',
    });
  });

  it('deve tratar CastError do Mongoose', () => {
    const error = {
      name: 'CastError',
      path: '_id',
      value: 'invalid-id',
    };

    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: 'Valor inválido para _id: invalid-id',
    });
  });

  it('deve tratar ValidationError do Mongoose', () => {
    const error = {
      name: 'ValidationError',
      errors: {
        name: { message: 'O nome é obrigatório' },
        price: { message: 'O preço é obrigatório' },
      },
    };

    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Erro de validação',
      })
    );
  });

  it('deve tratar erro genérico', () => {
    const error = new Error('Erro desconhecido');

    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.INTERNAL_SERVER_ERROR);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: 'Ocorreu um erro inesperado',
    });
  });

  it('deve incluir stack em ambiente de desenvolvimento', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const error = new Error('Erro com stack');

    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        stack: expect.any(String),
      })
    );

    process.env.NODE_ENV = originalEnv;
  });
});
