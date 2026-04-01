const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const Product = require('../../src/models/product');
const Category = require('../../src/models/category');

describe('Product Routes', () => {
  let category;

  beforeEach(async () => {
    category = await Category.create({
      name: 'Frutas',
      description: 'Frutas frescas',
    });
  });

  describe('GET /api/products', () => {
    it('deve retornar lista vazia quando não há produtos', async () => {
      const res = await request(app).get('/api/products');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
      expect(res.body.count).toBe(0);
    });

    it('deve retornar todos os produtos', async () => {
      await Product.create([
        { name: 'Banana', price: 5, quantity: 10, category: category._id },
        { name: 'Maçã', price: 8, quantity: 20, category: category._id },
      ]);

      const res = await request(app).get('/api/products');

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(2);
      expect(res.body.data).toHaveLength(2);
    });

    it('deve filtrar produtos por busca', async () => {
      await Product.create([
        { name: 'Banana Prata', price: 5, quantity: 10, category: category._id },
        { name: 'Maçã Fuji', price: 8, quantity: 20, category: category._id },
      ]);

      const res = await request(app).get('/api/products?search=banana');

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(1);
      expect(res.body.data[0].name).toBe('Banana Prata');
    });

    it('deve filtrar produtos ativos', async () => {
      await Product.create([
        { name: 'Ativo', price: 5, quantity: 10, category: category._id, active: true },
        { name: 'Inativo', price: 8, quantity: 20, category: category._id, active: false },
      ]);

      const res = await request(app).get('/api/products?active=true');

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(1);
      expect(res.body.data[0].name).toBe('Ativo');
    });

    it('deve popular categoria nos produtos', async () => {
      await Product.create({
        name: 'Banana',
        price: 5,
        quantity: 10,
        category: category._id,
      });

      const res = await request(app).get('/api/products');

      expect(res.body.data[0].category.name).toBe('Frutas');
    });
  });

  describe('GET /api/products/:id', () => {
    it('deve retornar um produto por ID', async () => {
      const product = await Product.create({
        name: 'Banana',
        price: 5.99,
        quantity: 100,
        category: category._id,
      });

      const res = await request(app).get(`/api/products/${product._id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Banana');
      expect(res.body.data.price).toBe(5.99);
    });

    it('deve retornar 404 para ID inexistente', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app).get(`/api/products/${fakeId}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('deve retornar 400 para ID inválido', async () => {
      const res = await request(app).get('/api/products/invalid-id');

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/products/category/:categoryName', () => {
    it('deve retornar produtos por nome da categoria', async () => {
      await Product.create([
        { name: 'Banana', price: 5, quantity: 10, category: category._id },
        { name: 'Maçã', price: 8, quantity: 20, category: category._id },
      ]);

      const res = await request(app).get('/api/products/category/Frutas');

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(2);
    });

    it('deve ser case-insensitive', async () => {
      await Product.create({
        name: 'Banana',
        price: 5,
        quantity: 10,
        category: category._id,
      });

      const res = await request(app).get('/api/products/category/frutas');

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(1);
    });

    it('deve retornar lista vazia para categoria inexistente', async () => {
      const res = await request(app).get('/api/products/category/Inexistente');

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(0);
      expect(res.body.data).toEqual([]);
    });

    it('deve retornar apenas produtos ativos', async () => {
      await Product.create([
        { name: 'Ativo', price: 5, quantity: 10, category: category._id, active: true },
        { name: 'Inativo', price: 8, quantity: 20, category: category._id, active: false },
      ]);

      const res = await request(app).get('/api/products/category/Frutas');

      expect(res.body.count).toBe(1);
      expect(res.body.data[0].name).toBe('Ativo');
    });
  });

  describe('POST /api/products', () => {
    it('deve criar um novo produto', async () => {
      const productData = {
        name: 'Banana',
        description: 'Banana prata',
        price: 5.99,
        quantity: 100,
        category: category._id.toString(),
      };

      const res = await request(app).post('/api/products').send(productData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Banana');
      expect(res.body.data.category.name).toBe('Frutas');
    });

    it('deve retornar erro sem campos obrigatórios', async () => {
      const res = await request(app).post('/api/products').send({ name: 'Teste' });

      expect([400, 422]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });

    it('deve retornar erro para categoria inexistente', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app).post('/api/products').send({
        name: 'Teste',
        price: 10,
        quantity: 5,
        category: fakeId.toString(),
      });

      expect(res.status).toBe(404);
    });

    it('deve retornar erro para categoria com ID inválido', async () => {
      const res = await request(app).post('/api/products').send({
        name: 'Teste',
        price: 10,
        quantity: 5,
        category: 'invalid-id',
      });

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/products/:id', () => {
    it('deve atualizar um produto', async () => {
      const product = await Product.create({
        name: 'Banana',
        price: 5,
        quantity: 10,
        category: category._id,
      });

      const res = await request(app)
        .put(`/api/products/${product._id}`)
        .send({ name: 'Banana Premium', price: 7.99 });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Banana Premium');
      expect(res.body.data.price).toBe(7.99);
    });

    it('deve retornar 404 para ID inexistente', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .put(`/api/products/${fakeId}`)
        .send({ name: 'Teste' });

      expect(res.status).toBe(404);
    });

    it('deve atualizar categoria do produto', async () => {
      const newCategory = await Category.create({ name: 'Carnes' });
      const product = await Product.create({
        name: 'Teste',
        price: 10,
        quantity: 5,
        category: category._id,
      });

      const res = await request(app)
        .put(`/api/products/${product._id}`)
        .send({ category: newCategory._id.toString() });

      expect(res.status).toBe(200);
      expect(res.body.data.category.name).toBe('Carnes');
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('deve deletar um produto', async () => {
      const product = await Product.create({
        name: 'Banana',
        price: 5,
        quantity: 10,
        category: category._id,
      });

      const res = await request(app).delete(`/api/products/${product._id}`);

      expect(res.status).toBe(204);

      const deleted = await Product.findById(product._id);
      expect(deleted).toBeNull();
    });

    it('deve retornar 404 para ID inexistente', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app).delete(`/api/products/${fakeId}`);

      expect(res.status).toBe(404);
    });
  });
});
