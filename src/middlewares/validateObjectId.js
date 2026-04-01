const mongoose = require('mongoose');
const { StatusCodes } = require('http-status-codes');

/**
 * Middleware para validar ObjectId do MongoDB
 * @param {string} paramName - Nome do parâmetro a ser validado (default: 'id')
 */
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: `${paramName} inválido`,
      });
    }

    next();
  };
};

module.exports = validateObjectId;
