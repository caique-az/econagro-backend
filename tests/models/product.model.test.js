const mongoose = require('mongoose');
const Product = require('../../src/models/product');
const Category = require('../../src/models/category');

describe('Product Model', () => {
  let category;

  beforeEach(async () => {
    category = await Category.create({
      name: 'Frutas',
      description: 'Frutas frescas',
    });
  });

  describe('Validação', () => {
    it('deve criar um produto válido', async () => {
      const productData = {
        name: 'Banana',
        description: 'Banana prata',
        price: 5.99,
        quantity: 100,
        category: category._id,
      };

      const product = await Product.create(productData);

      expect(product._id).toBeDefined();
      expect(product.name).toBe(productData.name);
      expect(product.price).toBe(productData.price);
      expect(product.quantity).toBe(productData.quantity);
      expect(product.category.toString()).toBe(category._id.toString());
      expect(product.active).toBe(true);
      expect(product.image).toBe('default-product.jpg');
    });

    it('deve falhar sem nome', async () => {
      const product = new Product({
        price: 10,
        quantity: 5,
        category: category._id,
      });

      await expect(product.save()).rejects.toThrow();
    });

    it('deve falhar sem preço', async () => {
      const product = new Product({
        name: 'Teste',
        quantity: 5,
        category: category._id,
      });

      await expect(product.save()).rejects.toThrow();
    });

    it('deve falhar sem categoria', async () => {
      const product = new Product({
        name: 'Teste',
        price: 10,
        quantity: 5,
      });

      await expect(product.save()).rejects.toThrow();
    });

    it('deve falhar com preço negativo', async () => {
      const product = new Product({
        name: 'Teste',
        price: -1,
        quantity: 5,
        category: category._id,
      });

      await expect(product.save()).rejects.toThrow();
    });

    it('deve falhar com quantidade negativa', async () => {
      const product = new Product({
        name: 'Teste',
        price: 10,
        quantity: -5,
        category: category._id,
      });

      await expect(product.save()).rejects.toThrow();
    });

    it('deve aceitar quantidade zero', async () => {
      const product = await Product.create({
        name: 'Sem estoque',
        price: 10,
        quantity: 0,
        category: category._id,
      });

      expect(product.quantity).toBe(0);
    });

    it('deve falhar com nome maior que 100 caracteres', async () => {
      const product = new Product({
        name: 'a'.repeat(101),
        price: 10,
        quantity: 5,
        category: category._id,
      });

      await expect(product.save()).rejects.toThrow();
    });

    it('deve aplicar trim no nome', async () => {
      const product = await Product.create({
        name: '  Maçã  ',
        price: 10,
        quantity: 5,
        category: category._id,
      });

      expect(product.name).toBe('Maçã');
    });
  });

  describe('Populate', () => {
    it('deve popular categoria corretamente', async () => {
      const product = await Product.create({
        name: 'Laranja',
        price: 8.5,
        quantity: 50,
        category: category._id,
      });

      const populated = await Product.findById(product._id).populate('category');

      expect(populated.category.name).toBe('Frutas');
    });
  });
});
