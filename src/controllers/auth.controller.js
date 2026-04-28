const { StatusCodes } = require("http-status-codes");
const User = require("../models/user");
const {
  BadRequestError,
  UnauthorizedError,
  ValidationError,
} = require("../utils/errors");
const { signToken } = require("../utils/jwt");

class AuthController {
  async register(req, res, next) {
    try {
      const { name, email, password } = req.body;

      const existing = await User.findOne({ email });
      if (existing) {
        throw new BadRequestError("E-mail já cadastrado");
      }

      const user = await User.create({ name, email, password });
      const token = signToken(user.id, user.role);

      res.status(StatusCodes.CREATED).json({
        success: true,
        token,
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      if (error.name === "ValidationError" && !error.isOperational) {
        next(new ValidationError(error.message));
      } else {
        next(error);
      }
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new BadRequestError("E-mail e senha são obrigatórios");
      }

      const user = await User.findOne({ email }).select("+password");
      if (!user || !(await user.comparePassword(password))) {
        throw new UnauthorizedError("Credenciais inválidas");
      }

      const token = signToken(user.id, user.role);

      res.status(StatusCodes.OK).json({
        success: true,
        token,
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async me(req, res) {
    res.status(StatusCodes.OK).json({
      success: true,
      data: req.user,
    });
  }
}

module.exports = new AuthController();
