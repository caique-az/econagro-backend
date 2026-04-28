const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/user');

const createAdminAndGetToken = async () => {
  const admin = await User.create({
    name: 'Admin Test',
    email: 'admin@test.com',
    password: 'password123',
    role: 'admin',
  });

  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@test.com', password: 'password123' });

  return { admin, token: res.body.token };
};

const createUserAndGetToken = async () => {
  const user = await User.create({
    name: 'User Test',
    email: 'user@test.com',
    password: 'password123',
    role: 'user',
  });

  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'user@test.com', password: 'password123' });

  return { user, token: res.body.token };
};

module.exports = { createAdminAndGetToken, createUserAndGetToken };

