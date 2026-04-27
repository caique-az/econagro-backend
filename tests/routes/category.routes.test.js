const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const Category = require('../../src/models/category');
const { createAdminAndGetToken } = require('../helpers/auth');

describe('Category Routes', () => {
  let token;

  beforeEach(async () => {
    ({ token } = await createAdminAndGetToken());
  });

  describe('GET /api/categories', () => {
    it('deve retornar lista vazia quando não há categorias', async () => {
      const res = await request(app).get('/api/categories');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
      expect(res.body.count).toBe(0);
    });

    it('deve retornar apenas categorias ativas por padrão', async () => {
      await Category.create([
        { name: 'Frutas', active: true },
        { name: 'Carnes', active: true },
        { name: 'Inativa', active: false },
      ]);

      const res = await request(app).get('/api/categories');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data.map((c) => c.name)).not.toContain('Inativa');
    });

    it('deve retornar todas as categorias com includeInactive=true', async () => {
      await Category.create([
        { name: 'Frutas', active: true },
        { name: 'Inativa', active: false },
      ]);

      const res = await request(app).get('/api/categories?includeInactive=true');

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(2);
    });

    it('deve retornar categorias ordenadas por order e depois por nome', async () => {
      await Category.create([
        { name: 'Carnes', order: 2 },
        { name: 'Frutas', order: 1 },
        { name: 'Arroz', order: 1 },
      ]);

      const res = await request(app).get('/api/categories');

      expect(res.body.data[0].name).toBe('Arroz');
      expect(res.body.data[1].name).toBe('Frutas');
      expect(res.body.data[2].name).toBe('Carnes');
    });
  });

  describe('GET /api/categories/:id', () => {
    it('deve retornar uma categoria por ID', async () => {
      const category = await Category.create({
        name: 'Frutas',
        image: 'https://example.com/frutas.jpg',
        order: 1,
      });

      const res = await request(app).get(`/api/categories/${category._id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Frutas');
      expect(res.body.data.image).toBe('https://example.com/frutas.jpg');
      expect(res.body.data.order).toBe(1);
      expect(res.body.data.active).toBe(true);
    });

    it('deve retornar 404 para ID inexistente', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app).get(`/api/categories/${fakeId}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('deve retornar 400 para ID inválido', async () => {
      const res = await request(app).get('/api/categories/invalid-id');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/categories', () => {
    it('deve criar uma nova categoria com apenas nome', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Frutas' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Frutas');
      expect(res.body.data.image).toBe('');
      expect(res.body.data.active).toBe(true);
      expect(res.body.data.order).toBe(0);

      const saved = await Category.findById(res.body.data._id);
      expect(saved).not.toBeNull();
    });

    it('deve criar categoria com todos os campos', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Carnes',
          image: 'https://example.com/carnes.jpg',
          active: false,
          order: 3,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Carnes');
      expect(res.body.data.image).toBe('https://example.com/carnes.jpg');
      expect(res.body.data.active).toBe(false);
      expect(res.body.data.order).toBe(3);
    });

    it('deve retornar erro para nome duplicado', async () => {
      await Category.create({ name: 'Frutas' });

      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Frutas' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('deve retornar erro sem nome', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ });

      expect([400, 422]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/categories/:id', () => {
    it('deve atualizar o nome de uma categoria', async () => {
      const category = await Category.create({ name: 'Frutas' });

      const res = await request(app)
        .put(`/api/categories/${category._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Frutas Tropicais' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Frutas Tropicais');
    });

    it('deve atualizar image, active e order', async () => {
      const category = await Category.create({ name: 'Carnes' });

      const res = await request(app)
        .put(`/api/categories/${category._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          image: 'https://example.com/carnes-new.jpg',
          active: false,
          order: 10,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.image).toBe('https://example.com/carnes-new.jpg');
      expect(res.body.data.active).toBe(false);
      expect(res.body.data.order).toBe(10);
    });

    it('deve retornar 404 para ID inexistente', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .put(`/api/categories/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Teste' });

      expect(res.status).toBe(404);
    });

    it('deve retornar erro para nome duplicado', async () => {
      await Category.create({ name: 'Frutas' });
      const category = await Category.create({ name: 'Carnes' });

      const res = await request(app)
        .put(`/api/categories/${category._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Frutas' });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/categories/:id', () => {
    it('deve deletar uma categoria', async () => {
      const category = await Category.create({ name: 'Frutas' });

      const res = await request(app)
        .delete(`/api/categories/${category._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(204);

      const deleted = await Category.findById(category._id);
      expect(deleted).toBeNull();
    });

    it('deve retornar 404 para ID inexistente', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .delete(`/api/categories/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });
});
