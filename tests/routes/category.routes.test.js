const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const Category = require('../../src/models/category');
const Product = require('../../src/models/product');
const { createAdminAndGetToken, createUserAndGetToken } = require('../helpers/auth');

describe('Category Routes', () => {
  let adminToken;
  let userToken;

  beforeEach(async () => {
    ({ token: adminToken } = await createAdminAndGetToken());
    ({ token: userToken } = await createUserAndGetToken());
  });

  // ─── Rotas Públicas ───────────────────────────────────────────────

  describe('GET /api/categories', () => {
    it('deve retornar lista vazia quando não há categorias', async () => {
      const res = await request(app).get('/api/categories');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
      expect(res.body.count).toBe(0);
    });

    it('deve retornar apenas categorias ativas', async () => {
      await Category.create([
        { name: 'Frutas', active: true },
        { name: 'Carnes', active: true },
        { name: 'Inativa', active: false },
      ]);

      const res = await request(app).get('/api/categories');

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(2);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data.map((c) => c.name)).not.toContain('Inativa');
    });

    it('não deve expor categorias inativas via includeInactive na rota pública', async () => {
      await Category.create([
        { name: 'Ativa', active: true },
        { name: 'Inativa', active: false },
      ]);

      const res = await request(app).get('/api/categories?includeInactive=true');

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(1);
      expect(res.body.data.map((c) => c.name)).not.toContain('Inativa');
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
    it('deve retornar uma categoria ativa por ID', async () => {
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

    it('deve retornar 404 para categoria inativa por ID na rota pública', async () => {
      const category = await Category.create({
        name: 'Escondida',
        active: false,
      });

      const res = await request(app).get(`/api/categories/${category._id}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
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

  // ─── Rotas Admin ──────────────────────────────────────────────────

  describe('GET /api/categories/admin', () => {
    it('admin deve ver todas as categorias incluindo inativas', async () => {
      await Category.create([
        { name: 'Ativa', active: true },
        { name: 'Inativa', active: false },
      ]);

      const res = await request(app)
        .get('/api/categories/admin')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(2);
      expect(res.body.data.map((c) => c.name)).toContain('Inativa');
    });

    it('deve retornar 403 para usuário comum', async () => {
      const res = await request(app)
        .get('/api/categories/admin')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('deve retornar 401 sem token', async () => {
      const res = await request(app).get('/api/categories/admin');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/categories/admin/:id', () => {
    it('admin deve ver categoria inativa por ID', async () => {
      const category = await Category.create({
        name: 'Escondida',
        active: false,
      });

      const res = await request(app)
        .get(`/api/categories/admin/${category._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Escondida');
      expect(res.body.data.active).toBe(false);
    });

    it('deve retornar 403 para usuário comum', async () => {
      const category = await Category.create({ name: 'Teste' });

      const res = await request(app)
        .get(`/api/categories/admin/${category._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });

    it('deve retornar 401 sem token', async () => {
      const category = await Category.create({ name: 'Teste' });

      const res = await request(app)
        .get(`/api/categories/admin/${category._id}`);

      expect(res.status).toBe(401);
    });
  });

  // ─── CRUD Admin ───────────────────────────────────────────────────

  describe('POST /api/categories', () => {
    it('deve criar uma nova categoria com apenas nome', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
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
        .set('Authorization', `Bearer ${adminToken}`)
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
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Frutas' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('deve retornar 422 sem nome', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('deve retornar 401 sem token', async () => {
      const res = await request(app)
        .post('/api/categories')
        .send({ name: 'Teste' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('deve retornar 403 para usuário comum', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Teste' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/categories/:id', () => {
    it('deve atualizar o nome de uma categoria', async () => {
      const category = await Category.create({ name: 'Frutas' });

      const res = await request(app)
        .put(`/api/categories/${category._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Frutas Tropicais' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Frutas Tropicais');
    });

    it('deve atualizar image, active e order', async () => {
      const category = await Category.create({ name: 'Carnes' });

      const res = await request(app)
        .put(`/api/categories/${category._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
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
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Teste' });

      expect(res.status).toBe(404);
    });

    it('deve retornar erro para nome duplicado', async () => {
      await Category.create({ name: 'Frutas' });
      const category = await Category.create({ name: 'Carnes' });

      const res = await request(app)
        .put(`/api/categories/${category._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Frutas' });

      expect(res.status).toBe(400);
    });

    it('deve retornar 401 sem token', async () => {
      const category = await Category.create({ name: 'Teste' });

      const res = await request(app)
        .put(`/api/categories/${category._id}`)
        .send({ name: 'Novo' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('deve retornar 403 para usuário comum', async () => {
      const category = await Category.create({ name: 'Teste' });

      const res = await request(app)
        .put(`/api/categories/${category._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Novo' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/categories/:id', () => {
    it('deve deletar uma categoria sem produtos', async () => {
      const category = await Category.create({ name: 'Frutas' });

      const res = await request(app)
        .delete(`/api/categories/${category._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(204);

      const deleted = await Category.findById(category._id);
      expect(deleted).toBeNull();
    });

    it('deve retornar 400 ao tentar deletar categoria com produtos associados', async () => {
      const category = await Category.create({ name: 'Frutas' });
      await Product.create({
        name: 'Banana',
        price: 5,
        quantity: 10,
        category: category._id,
      });

      const res = await request(app)
        .delete(`/api/categories/${category._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/produtos associados/i);

      const stillExists = await Category.findById(category._id);
      expect(stillExists).not.toBeNull();
    });

    it('deve retornar 404 para ID inexistente', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .delete(`/api/categories/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    it('deve retornar 401 sem token', async () => {
      const category = await Category.create({ name: 'Teste' });

      const res = await request(app)
        .delete(`/api/categories/${category._id}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('deve retornar 403 para usuário comum', async () => {
      const category = await Category.create({ name: 'Teste' });

      const res = await request(app)
        .delete(`/api/categories/${category._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
