const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const User = require('../../src/models/user');
const { createAdminAndGetToken } = require('../helpers/auth');

describe('User Routes', () => {
  let adminToken;

  beforeEach(async () => {
    ({ token: adminToken } = await createAdminAndGetToken());
  });

  describe('PATCH /api/users/:id/role', () => {
    it('deve alterar a role de um usuário', async () => {
      const user = await User.create({
        name: 'Comum',
        email: 'comum@test.com',
        password: 'senha123',
      });

      const res = await request(app)
        .patch(`/api/users/${user._id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'admin' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe('admin');
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.name).toBe('Comum');
      expect(res.body.data.email).toBe('comum@test.com');
    });

    it('deve retornar 400 ao tentar alterar a própria role', async () => {
      const admin = await User.findOne({ email: 'admin@test.com' });

      const res = await request(app)
        .patch(`/api/users/${admin._id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'user' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('deve retornar 400 para role inválida', async () => {
      const user = await User.create({
        name: 'Comum',
        email: 'comum@test.com',
        password: 'senha123',
      });

      const res = await request(app)
        .patch(`/api/users/${user._id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'superadmin' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('deve retornar 404 para usuário inexistente', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .patch(`/api/users/${fakeId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'admin' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('deve retornar 403 quando usuário não-admin tenta alterar', async () => {
      await User.create({
        name: 'Regular',
        email: 'regular@test.com',
        password: 'senha123',
      });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'regular@test.com', password: 'senha123' });

      const userToken = loginRes.body.token;

      const target = await User.create({
        name: 'Target',
        email: 'target@test.com',
        password: 'senha123',
      });

      const res = await request(app)
        .patch(`/api/users/${target._id}/role`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ role: 'admin' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('deve retornar 401 sem token', async () => {
      const user = await User.create({
        name: 'Comum',
        email: 'comum@test.com',
        password: 'senha123',
      });

      const res = await request(app)
        .patch(`/api/users/${user._id}/role`)
        .send({ role: 'admin' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('deve retornar 400 para ID inválido', async () => {
      const res = await request(app)
        .patch('/api/users/invalid-id/role')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'admin' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
