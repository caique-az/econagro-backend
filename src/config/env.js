const baseRequired = ["MONGODB_URI", "JWT_SECRET"];

const emailRequired = [
  "FRONTEND_URL",
  "MAIL_FROM",
  "CONTACT_TO_EMAIL",
  "SMTP_HOST",
  "SMTP_USER",
  "SMTP_PASS",
];

function validateEnv() {
  const required =
    process.env.NODE_ENV === "production"
      ? [...baseRequired, ...emailRequired]
      : baseRequired;

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Variáveis de ambiente obrigatórias ausentes: ${missing.join(", ")}`,
    );
  }
}

module.exports = validateEnv;
