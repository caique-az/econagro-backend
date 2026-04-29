const rateLimit = require("express-rate-limit");

const createAuthLimiter = (options = {}) =>
  rateLimit({
    windowMs: options.windowMs ?? 15 * 60 * 1000,
    max: options.max ?? 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: "Muitas tentativas. Tente novamente mais tarde.",
    },
  });

const createEmailLimiter = (options = {}) =>
  rateLimit({
    windowMs: options.windowMs ?? 60 * 60 * 1000,
    max: options.max ?? 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: "Muitas solicitações. Tente novamente mais tarde.",
    },
  });

const isTest = process.env.NODE_ENV === "test";

const authLimiter = createAuthLimiter({ max: isTest ? 1000 : 20 });
const emailLimiter = createEmailLimiter({ max: isTest ? 1000 : 5 });

module.exports = { authLimiter, emailLimiter, createAuthLimiter, createEmailLimiter };
