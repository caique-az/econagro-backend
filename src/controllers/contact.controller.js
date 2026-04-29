const { StatusCodes } = require("http-status-codes");
const { BadRequestError } = require("../utils/errors");
const emailService = require("../services/email.service");

class ContactController {
  async send(req, res, next) {
    try {
      const { name, email, message } = req.body;

      if (!name || typeof name !== "string" || name.trim().length < 3) {
        throw new BadRequestError(
          "Nome é obrigatório e deve ter pelo menos 3 caracteres",
        );
      }

      if (name.trim().length > 100) {
        throw new BadRequestError("Nome deve ter no máximo 100 caracteres");
      }

      if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        throw new BadRequestError("E-mail inválido ou não informado");
      }

      if (email.length > 254) {
        throw new BadRequestError("E-mail deve ter no máximo 254 caracteres");
      }

      if (
        !message ||
        typeof message !== "string" ||
        message.trim().length < 10
      ) {
        throw new BadRequestError(
          "Mensagem é obrigatória e deve ter pelo menos 10 caracteres",
        );
      }

      if (message.trim().length > 5000) {
        throw new BadRequestError("Mensagem deve ter no máximo 5000 caracteres");
      }

      try {
        await emailService.sendContactEmail({
          name: name.trim(),
          email,
          message: message.trim(),
        });
      } catch (_emailError) {
        throw new BadRequestError(
          "Falha ao enviar mensagem. Tente novamente mais tarde.",
        );
      }

      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Mensagem enviada com sucesso",
      });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new ContactController();
