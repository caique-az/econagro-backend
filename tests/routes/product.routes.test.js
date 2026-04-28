const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const Product = require('../../src/models/product');
const Category = require('../../src/models/category');
const { createAdminAndGetToken } = require('../helpers/auth');

describe('Product Routes', () => {
  let category;
  let token;

  beforeEach(async () => {
    ({ token } = await createAdminAndGetToken());
    category = await Category.create({
      name: 'Frutas',
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

    it('deve retornar todos os produtos ativos de categorias ativas', async () => {
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

    it('não deve retornar produto inativo', async () => {
      await Product.create([
        { name: 'Ativo', price: 5, quantity: 10, category: category._id, active: true },
        { name: 'Inativo', price: 8, quantity: 20, category: category._id, active: false },
      ]);

      const res = await request(app).get('/api/products');

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(1);
      expect(res.body.data[0].name).toBe('Ativo');
      expect(res.body.data.map((p) => p.name)).not.toContain('Inativo');
    });

    it('não deve expor produto inativo ao passar ?active=false', async () => {
      await Product.create({
        name: 'Inativo',
        price: 8,
        quantity: 20,
        category: category._id,
        active: false,
      });

      const res = await request(app).get('/api/products?active=false');

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(0);
      expect(res.body.data).toEqual([]);
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

    it('não deve retornar produtos de categoria inativa', async () => {
      const inactiveCategory = await Category.create({
        name: 'Escondida',
        active: false,
      });

      await Product.create([
        { name: 'Visível', price: 5, quantity: 10, category: category._id },
        { name: 'Escondido', price: 8, quantity: 20, category: inactiveCategory._id },
      ]);

      const res = await request(app).get('/api/products');

      expect(res.body.count).toBe(1);
      expect(res.body.data[0].name).toBe('Visível');
      expect(res.body.data.map((p) => p.name)).not.toContain('Escondido');
    });

    it('deve retornar 400 para category ID inválido', async () => {
      const res = await request(app).get('/api/products?category=invalid-id');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('não deve retornar produtos ao filtrar por categoria inativa', async () => {
      const inactiveCategory = await Category.create({
        name: 'Escondida',
        active: false,
      });

      await Product.create({
        name: 'Produto',
        price: 5,
        quantity: 10,
        category: inactiveCategory._id,
      });

      const res = await request(app).get(`/api/products?category=${inactiveCategory._id}`);

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(0);
      expect(res.body.data).toEqual([]);
    });

    it('produtos devem reaparecer ao reativar categoria', async () => {
      const toggleCategory = await Category.create({
        name: 'Toggle',
        active: false,
      });

      await Product.create({
        name: 'Reaparecido',
        price: 5,
        quantity: 10,
        category: toggleCategory._id,
      });

      // Inativa — não aparece
      let res = await request(app).get('/api/products');
      expect(res.body.data.map((p) => p.name)).not.toContain('Reaparecido');

      // Reativar
      await Category.findByIdAndUpdate(toggleCategory._id, { active: true });

      // Ativa — aparece
      res = await request(app).get('/api/products');
      expect(res.body.data.map((p) => p.name)).toContain('Reaparecido');
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

    it('deve retornar 404 para produto inativo', async () => {
      const product = await Product.create({
        name: 'Inativo',
        price: 5,
        quantity: 10,
        category: category._id,
        active: false,
      });

      const res = await request(app).get(`/api/products/${product._id}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('deve retornar 404 para produto ativo em categoria inativa', async () => {
      const inactiveCategory = await Category.create({
        name: 'Inativa',
        active: false,
      });

      const product = await Product.create({
        name: 'Produto',
        price: 5,
        quantity: 10,
        category: inactiveCategory._id,
        active: true,
      });

      const res = await request(app).get(`/api/products/${product._id}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/products/category/:categoryName', () => {
    it('deve retornar produtos por nome da categoria ativa', async () => {
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

    it('deve retornar lista vazia para categoria inativa', async () => {
      const inactiveCategory = await Category.create({
        name: 'Escondida',
        active: false,
      });

      await Product.create({
        name: 'Produto',
        price: 5,
        quantity: 10,
        category: inactiveCategory._id,
      });

      const res = await request(app).get('/api/products/category/Escondida');

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(0);
      expect(res.body.data).toEqual([]);
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

      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Banana');
      expect(res.body.data.category.name).toBe('Frutas');
    });

    it('deve retornar 422 sem campos obrigatórios', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Teste' });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('deve retornar erro para categoria inexistente', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Teste',
          price: 10,
          quantity: 5,
          category: fakeId.toString(),
        });

      expect(res.status).toBe(404);
    });

    it('deve retornar erro para categoria com ID inválido', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Teste',
          price: 10,
          quantity: 5,
          category: 'invalid-id',
        });

      expect(res.status).toBe(400);
    });

    it('deve permitir criar produto em categoria inativa (uso admin)', async () => {
      const inactiveCategory = await Category.create({
        name: 'Inativa',
        active: false,
      });

      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Produto Admin',
          price: 10,
          quantity: 5,
          category: inactiveCategory._id.toString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Produto Admin');
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
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Banana Premium', price: 7.99 });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Banana Premium');
      expect(res.body.data.price).toBe(7.99);
    });

    it('deve retornar 404 para ID inexistente', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .put(`/api/products/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
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
        .set('Authorization', `Bearer ${token}`)
        .send({ category: newCategory._id.toString() });

      expect(res.status).toBe(200);
      expect(res.body.data.category.name).toBe('Carnes');
    });

    it('deve permitir mover produto para categoria inativa (uso admin)', async () => {
      const inactiveCategory = await Category.create({
        name: 'Inativa',
        active: false,
      });

      const product = await Product.create({
        name: 'Teste',
        price: 10,
        quantity: 5,
        category: category._id,
      });

      const res = await request(app)
        .put(`/api/products/${product._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ category: inactiveCategory._id.toString() });

      expect(res.status).toBe(200);
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

      const res = await request(app)
        .delete(`/api/products/${product._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(204);

      const deleted = await Product.findById(product._id);
      expect(deleted).toBeNull();
    });

    it('deve retornar 404 para ID inexistente', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .delete(`/api/products/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });
});
