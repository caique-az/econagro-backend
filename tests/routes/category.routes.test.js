const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const Category = require('../../src/models/category');

describe('Category Routes', () => {
  describe('GET /api/categories', () => {
    it('deve retornar lista vazia quando não há categorias', async () => {
      const res = await request(app).get('/api/categories');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
      expect(res.body.count).toBe(0);
    });

    it('deve retornar todas as categorias', async () => {
      await Category.create([
        { name: 'Frutas' },
        { name: 'Carnes' },
        { name: 'Grãos' },
      ]);

      const res = await request(app).get('/api/categories');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(3);
      expect(res.body.data).toHaveLength(3);
    });

    it('deve retornar categorias ordenadas por nome', async () => {
      await Category.create([
        { name: 'Carnes' },
        { name: 'Frutas' },
        { name: 'Arroz' },
      ]);

      const res = await request(app).get('/api/categories');

      expect(res.body.data[0].name).toBe('Arroz');
      expect(res.body.data[1].name).toBe('Carnes');
      expect(res.body.data[2].name).toBe('Frutas');
    });
  });

  describe('GET /api/categories/:id', () => {
    it('deve retornar uma categoria por ID', async () => {
      const category = await Category.create({
        name: 'Frutas',
        description: 'Frutas frescas',
      });

      const res = await request(app).get(`/api/categories/${category._id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Frutas');
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
    it('deve criar uma nova categoria', async () => {
      const res = await request(app)
        .post('/api/categories')
        .send({ name: 'Frutas', description: 'Frutas frescas' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Frutas');

      const saved = await Category.findById(res.body.data._id);
      expect(saved).not.toBeNull();
    });

    it('deve retornar erro para nome duplicado', async () => {
      await Category.create({ name: 'Frutas' });

      const res = await request(app)
        .post('/api/categories')
        .send({ name: 'Frutas' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('deve retornar erro sem nome', async () => {
      const res = await request(app)
        .post('/api/categories')
        .send({ description: 'Sem nome' });

      expect([400, 422]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/categories/:id', () => {
    it('deve atualizar uma categoria', async () => {
      const category = await Category.create({ name: 'Frutas' });

      const res = await request(app)
        .put(`/api/categories/${category._id}`)
        .send({ name: 'Frutas Tropicais', description: 'Atualizado' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Frutas Tropicais');
      expect(res.body.data.description).toBe('Atualizado');
    });

    it('deve retornar 404 para ID inexistente', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .put(`/api/categories/${fakeId}`)
        .send({ name: 'Teste' });

      expect(res.status).toBe(404);
    });

    it('deve retornar erro para nome duplicado', async () => {
      await Category.create({ name: 'Frutas' });
      const category = await Category.create({ name: 'Carnes' });

      const res = await request(app)
        .put(`/api/categories/${category._id}`)
        .send({ name: 'Frutas' });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/categories/:id', () => {
    it('deve deletar uma categoria', async () => {
      const category = await Category.create({ name: 'Frutas' });

      const res = await request(app).delete(`/api/categories/${category._id}`);

      expect(res.status).toBe(204);

      const deleted = await Category.findById(category._id);
      expect(deleted).toBeNull();
    });

    it('deve retornar 404 para ID inexistente', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app).delete(`/api/categories/${fakeId}`);

      expect(res.status).toBe(404);
    });
  });
});
