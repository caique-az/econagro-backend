const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const errorHandler = require('./middlewares/errorHandler');
const routes = require('./routes');

class App {
  constructor() {
    this.app = express();
    this.middlewares();
    this.routes();
    this.errorHandling();
  }

  middlewares() {
    // Configurações de segurança básicas
    this.app.disable('x-powered-by');

    // Middlewares essenciais
    const allowedOrigins = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",")
          .map((origin) => origin.trim())
          .filter(Boolean)
      : ["http://localhost:3000"];
    this.app.use(cors({ origin: allowedOrigins, credentials: true }));
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Logs em desenvolvimento
    if (process.env.NODE_ENV !== 'production') {
      this.app.use(morgan('dev'));
    }
  }

  routes() {
    // Rotas da API
    this.app.use('/api', routes);

    // Rota raiz
    this.app.get('/', (req, res) => {
      res.json({
        name: 'EconAgro API',
        version: '1.0.0',
        status: 'online',
      });
    });

    // Rota para 404
    this.app.use((req, res) => {
      res.status(404).json({
        success: false,
        message: 'Rota não encontrada',
      });
    });
  }

  errorHandling() {
    // Middleware de tratamento de erros
    this.app.use(errorHandler);
  }
}

module.exports = new App().app;
