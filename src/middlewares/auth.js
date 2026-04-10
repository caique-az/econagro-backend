const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Token não fornecido'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('name email role');

    if (!user) {
      return next(new UnauthorizedError('Usuário não encontrado'));
    }

    req.user = user;
    next();
  } catch {
    next(new UnauthorizedError('Token inválido ou expirado'));
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('Acesso negado'));
    }
    next();
  };
};

module.exports = { authenticate, authorize };
