const crypto = require("crypto");
const { StatusCodes } = require("http-status-codes");
const User = require("../models/user");
const {
  BadRequestError,
  UnauthorizedError,
  ValidationError,
  ServiceUnavailableError,
} = require("../utils/errors");
const { signToken } = require("../utils/jwt");
const emailService = require("../services/email.service");

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

  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const normalizedEmail =
        typeof email === "string" ? email.trim().toLowerCase() : "";

      if (!normalizedEmail || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
        throw new BadRequestError("E-mail inválido ou não informado");
      }

      const genericResponse = {
        success: true,
        message:
          "Se o e-mail estiver cadastrado, enviaremos instruções de recuperação.",
      };

      const user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        return res.status(StatusCodes.OK).json(genericResponse);
      }

      const resetToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

      user.passwordResetToken = hashedToken;
      user.passwordResetExpires = Date.now() + 30 * 60 * 1000;
      await user.save({ validateBeforeSave: false });

      const resetUrl = `${process.env.FRONTEND_URL}/redefinir-senha?token=${resetToken}`;

      try {
        await emailService.sendPasswordResetEmail({ to: user.email, resetUrl });
      } catch (_emailError) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
        throw new ServiceUnavailableError(
          "Falha ao enviar e-mail. Tente novamente mais tarde.",
        );
      }

      return res.status(StatusCodes.OK).json(genericResponse);
    } catch (error) {
      return next(error);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        throw new BadRequestError("Token e senha são obrigatórios");
      }

      if (password.length < 6) {
        throw new BadRequestError("A senha deve ter pelo menos 6 caracteres");
      }

      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
      }).select("+passwordResetToken +passwordResetExpires");

      if (!user) {
        throw new BadRequestError("Token inválido ou expirado");
      }

      user.password = password;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Senha redefinida com sucesso",
      });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new AuthController();
