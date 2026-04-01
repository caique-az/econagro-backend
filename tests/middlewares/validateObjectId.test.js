const mongoose = require('mongoose');
const { StatusCodes } = require('http-status-codes');
const validateObjectId = require('../../src/middlewares/validateObjectId');

describe('validateObjectId Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = { params: {} };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  it('deve passar para next() com ObjectId válido', () => {
    const validId = new mongoose.Types.ObjectId().toString();
    mockReq.params.id = validId;

    validateObjectId()(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  it('deve retornar 400 para ObjectId inválido', () => {
    mockReq.params.id = 'invalid-id';

    validateObjectId()(mockReq, mockRes, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: 'id inválido',
    });
  });

  it('deve validar parâmetro customizado', () => {
    mockReq.params.categoryId = 'invalid';

    validateObjectId('categoryId')(mockReq, mockRes, mockNext);

    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: 'categoryId inválido',
    });
  });

  it('deve aceitar ObjectId de 24 caracteres hex', () => {
    mockReq.params.id = '507f1f77bcf86cd799439011';

    validateObjectId()(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('deve rejeitar string vazia', () => {
    mockReq.params.id = '';

    validateObjectId()(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
  });

  it('deve rejeitar ObjectId com caracteres inválidos', () => {
    mockReq.params.id = '507f1f77bcf86cd79943901g'; // 'g' inválido

    validateObjectId()(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
  });
});
