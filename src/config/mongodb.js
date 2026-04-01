const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Skip connection if already connected (tests use memory server)
    if (mongoose.connection.readyState === 1) {
      return;
    }

    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI não está definida nas variáveis de ambiente');
    }

    mongoose.set('strictQuery', true);

    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`MongoDB conectado: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`Erro ao conectar ao MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
