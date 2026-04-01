const mongoose = require('mongoose');
const Category = require('../../src/models/category');

describe('Category Model', () => {
  describe('Validação', () => {
    it('deve criar uma categoria válida', async () => {
      const categoryData = {
        name: 'Frutas',
        description: 'Frutas frescas',
      };

      const category = new Category(categoryData);
      const savedCategory = await category.save();

      expect(savedCategory._id).toBeDefined();
      expect(savedCategory.name).toBe(categoryData.name);
      expect(savedCategory.description).toBe(categoryData.description);
      expect(savedCategory.active).toBe(true);
      expect(savedCategory.createdAt).toBeDefined();
      expect(savedCategory.updatedAt).toBeDefined();
    });

    it('deve falhar sem nome', async () => {
      const category = new Category({ description: 'Sem nome' });

      await expect(category.save()).rejects.toThrow();
    });

    it('deve falhar com nome duplicado', async () => {
      await Category.create({ name: 'Duplicado' });

      const duplicate = new Category({ name: 'Duplicado' });

      await expect(duplicate.save()).rejects.toThrow();
    });

    it('deve falhar com nome maior que 50 caracteres', async () => {
      const category = new Category({
        name: 'a'.repeat(51),
      });

      await expect(category.save()).rejects.toThrow();
    });

    it('deve aplicar trim no nome', async () => {
      const category = await Category.create({ name: '  Carnes  ' });

      expect(category.name).toBe('Carnes');
    });

    it('deve ter valores default corretos', async () => {
      const category = await Category.create({ name: 'Grãos' });

      expect(category.active).toBe(true);
      expect(category.image).toBe('default-category.jpg');
    });
  });

  describe('Virtual products', () => {
    it('deve ter virtual products definido', () => {
      const category = new Category({ name: 'Test' });
      expect(category.schema.virtuals.products).toBeDefined();
    });
  });
});
