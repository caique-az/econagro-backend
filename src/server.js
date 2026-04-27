require("dotenv").config();
const validateEnv = require("./config/env");
const app = require("./app");
const connectDB = require("./config/mongodb");

validateEnv();

const { PORT = 3001, NODE_ENV } = process.env;

let server;

connectDB().then(() => {
  server = app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Ambiente: ${NODE_ENV || "development"}`);
    console.log(`${new Date().toLocaleString()}`);
  });
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});
