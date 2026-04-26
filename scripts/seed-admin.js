require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/user');

const { MONGODB_URI, SEED_ADMIN_NAME, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD } = process.env;

if (!MONGODB_URI || !SEED_ADMIN_EMAIL || !SEED_ADMIN_PASSWORD) {
  console.error('Defina MONGODB_URI, SEED_ADMIN_EMAIL e SEED_ADMIN_PASSWORD no .env');
  process.exit(1);
}

const run = async () => {
  await mongoose.connect(MONGODB_URI);

  const existing = await User.findOne({ email: SEED_ADMIN_EMAIL });
  if (existing) {
    console.log(`Admin já existe: ${SEED_ADMIN_EMAIL}`);
    return;
  }

  await User.create({
    name: SEED_ADMIN_NAME || 'Admin',
    email: SEED_ADMIN_EMAIL,
    password: SEED_ADMIN_PASSWORD,
    role: 'admin',
  });

  console.log(`Admin criado: ${SEED_ADMIN_EMAIL}`);
};

run()
  .catch(err => {
    console.error(err.message);
    process.exit(1);
  })
  .finally(() => {
    mongoose.disconnect();
    process.exit(0);
  });
