const { StatusCodes } = require("http-status-codes");
const { BadRequestError, ServiceUnavailableError } = require("../utils/errors");
const emailService = require("../services/email.service");

class ContactController {
  async send(req, res, next) {
    try {
      const { name, email, message } = req.body;

      const trimmedName = typeof name === "string" ? name.trim() : "";
      const normalizedEmail =
        typeof email === "string" ? email.trim().toLowerCase() : "";
      const trimmedMessage = typeof message === "string" ? message.trim() : "";

      if (!trimmedName || trimmedName.length < 3) {
        throw new BadRequestError(
          "Nome é obrigatório e deve ter pelo menos 3 caracteres",
        );
      }

      if (trimmedName.length > 100) {
        throw new BadRequestError("Nome deve ter no máximo 100 caracteres");
      }

      if (!normalizedEmail || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
        throw new BadRequestError("E-mail inválido ou não informado");
      }

      if (normalizedEmail.length > 254) {
        throw new BadRequestError("E-mail deve ter no máximo 254 caracteres");
      }

      if (!trimmedMessage || trimmedMessage.length < 10) {
        throw new BadRequestError(
          "Mensagem é obrigatória e deve ter pelo menos 10 caracteres",
        );
      }

      if (trimmedMessage.length > 5000) {
        throw new BadRequestError("Mensagem deve ter no máximo 5000 caracteres");
      }

      try {
        await emailService.sendContactEmail({
          name: trimmedName,
          email: normalizedEmail,
          message: trimmedMessage,
        });
      } catch (_emailError) {
        throw new ServiceUnavailableError(
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
