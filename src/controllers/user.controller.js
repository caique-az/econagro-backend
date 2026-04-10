const { StatusCodes } = require('http-status-codes');
const User = require('../models/user');
const { NotFoundError, BadRequestError } = require('../utils/errors');

class UserController {
  async updateRole(req, res, next) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!['user', 'admin'].includes(role)) {
        throw new BadRequestError('Role inválida. Use "user" ou "admin"');
      }

      if (req.user._id.toString() === id) {
        throw new BadRequestError('Não é possível alterar a própria role');
      }

      const user = await User.findByIdAndUpdate(
        id,
        { role },
        { new: true }
      );

      if (!user) {
        throw new NotFoundError('Usuário não encontrado');
      }

      res.status(StatusCodes.OK).json({
        success: true,
        data: { id: user._id, name: user.name, email: user.email, role: user.role },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
