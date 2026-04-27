const Category = require('../../src/models/category');

describe('Category Model', () => {
  describe('Validação', () => {
    it('deve criar uma categoria válida com defaults', async () => {
      const category = await Category.create({ name: 'Frutas' });

      expect(category._id).toBeDefined();
      expect(category.name).toBe('Frutas');
      expect(category.image).toBe('');
      expect(category.active).toBe(true);
      expect(category.order).toBe(0);
      expect(category.createdAt).toBeDefined();
      expect(category.updatedAt).toBeDefined();
    });

    it('deve criar uma categoria com todos os campos', async () => {
      const categoryData = {
        name: 'Carnes',
        image: 'https://example.com/carnes.jpg',
        active: false,
        order: 5,
      };

      const category = await Category.create(categoryData);

      expect(category.name).toBe(categoryData.name);
      expect(category.image).toBe(categoryData.image);
      expect(category.active).toBe(false);
      expect(category.order).toBe(5);
    });

    it('deve falhar sem nome', async () => {
      const category = new Category({});
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

    it('deve aplicar trim na image', async () => {
      const category = await Category.create({
        name: 'Grãos',
        image: '  https://example.com/graos.jpg  ',
      });

      expect(category.image).toBe('https://example.com/graos.jpg');
    });

    it('deve falhar com order negativo', async () => {
      const category = new Category({
        name: 'Inválida',
        order: -1,
      });

      await expect(category.save()).rejects.toThrow();
    });

    it('deve aceitar order zero', async () => {
      const category = await Category.create({
        name: 'Zero',
        order: 0,
      });

      expect(category.order).toBe(0);
    });
  });

  describe('Virtual products', () => {
    it('deve ter virtual products definido', () => {
      const category = new Category({ name: 'Test' });
      expect(category.schema.virtuals.products).toBeDefined();
    });
  });
});
