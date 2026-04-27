const requiredEnv = ["MONGODB_URI", "JWT_SECRET"];

function validateEnv() {
  const missing = requiredEnv.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Variáveis de ambiente obrigatórias ausentes: ${missing.join(", ")}`,
    );
  }
}

module.exports = validateEnv;
