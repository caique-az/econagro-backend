const { StatusCodes } = require('http-status-codes');
const mongoose = require('mongoose');
const { Product, Category } = require('../models');
const { NotFoundError, BadRequestError, ValidationError } = require('../utils/errors');

/**
 * @swagger
 * tags:
 *   name: Produtos
 *   description: Gerenciamento de produtos
 */
class ProductController {
  /**
   * @swagger
   * /products:
   *   get:
   *     summary: Lista todos os produtos
   *     tags: [Produtos]
   *     parameters:
   *       - in: query
   *         name: category
   *         schema:
   *           type: string
   *         description: Categoria do produto
   *     responses:
   *       200:
   *         description: Lista de produtos
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 count:
   *                   type: integer
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Product'
   */
  async getAll(req, res, next) {
    try {
      const { category, search, active } = req.query;
      const filter = {};

      if (category) {
        filter.category = category;
      }

      if (active !== undefined) {
        filter.active = active === 'true';
      }

      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      const products = await Product.find(filter)
        .populate('category', 'name description')
        .sort({ createdAt: -1 });

      res.status(StatusCodes.OK).json({
        success: true,
        count: products.length,
        data: products,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /products/{id}:
   *   get:
   *     summary: Obtém um produto pelo ID
   *     tags: [Produtos]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID do produto
   *     responses:
   *       200:
   *         description: Dados do produto
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Product'
   *       404:
   *         description: Produto não encontrado
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new BadRequestError('ID inválido');
      }

      const product = await Product.findById(id).populate('category', 'name description');

      if (!product) {
        throw new NotFoundError('Produto não encontrado');
      }

      res.status(StatusCodes.OK).json({
        success: true,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /products:
   *   post:
   *     summary: Cria um novo produto
   *     tags: [Produtos]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Product'
   *     responses:
   *       201:
   *         description: Produto criado com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Product'
   *       422:
   *         description: Erro de validação
   */
  async create(req, res, next) {
    try {
      const { name, description, price, quantity, category, image, active } = req.body;

      // Verifica se categoria existe
      if (category) {
        if (!mongoose.Types.ObjectId.isValid(category)) {
          throw new BadRequestError('ID da categoria inválido');
        }
        const categoryExists = await Category.findById(category);
        if (!categoryExists) {
          throw new NotFoundError('Categoria não encontrada');
        }
      }

      const product = new Product({
        name,
        description,
        price,
        quantity,
        category,
        image,
        active,
      });

      await product.save();
      await product.populate('category', 'name description');

      res.status(StatusCodes.CREATED).json({
        success: true,
        data: product,
      });
    } catch (error) {
      if (error.name === 'ValidationError') {
        next(new ValidationError(error.message));
      } else {
        next(error);
      }
    }
  }

  /**
   * @swagger
   * /products/{id}:
   *   put:
   *     summary: Atualiza um produto existente
   *     tags: [Produtos]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID do produto
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Product'
   *     responses:
   *       200:
   *         description: Produto atualizado com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Product'
   *       404:
   *         description: Produto não encontrado
   *       422:
   *         description: Erro de validação
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { name, description, price, quantity, category, image, active } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new BadRequestError('ID inválido');
      }

      // Verifica se categoria existe (se fornecida)
      if (category) {
        if (!mongoose.Types.ObjectId.isValid(category)) {
          throw new BadRequestError('ID da categoria inválido');
        }
        const categoryExists = await Category.findById(category);
        if (!categoryExists) {
          throw new NotFoundError('Categoria não encontrada');
        }
      }

      const product = await Product.findByIdAndUpdate(
        id,
        { name, description, price, quantity, category, image, active },
        { new: true, runValidators: true }
      ).populate('category', 'name description');

      if (!product) {
        throw new NotFoundError('Produto não encontrado');
      }

      res.status(StatusCodes.OK).json({
        success: true,
        data: product,
      });
    } catch (error) {
      if (error.name === 'ValidationError') {
        next(new ValidationError(error.message));
      } else {
        next(error);
      }
    }
  }

  /**
   * @swagger
   * /products/{id}:
   *   delete:
   *     summary: Remove um produto
   *     tags: [Produtos]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID do produto
   *     responses:
   *       204:
   *         description: Produto removido com sucesso
   *       404:
   *         description: Produto não encontrado
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new BadRequestError('ID inválido');
      }

      const product = await Product.findByIdAndDelete(id);

      if (!product) {
        throw new NotFoundError('Produto não encontrado');
      }

      res.status(StatusCodes.NO_CONTENT).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /products/category/{categoryName}:
   *   get:
   *     summary: Busca produtos por nome da categoria
   *     tags: [Produtos]
   *     parameters:
   *       - in: path
   *         name: categoryName
   *         required: true
   *         schema:
   *           type: string
   *         description: Nome da categoria
   *     responses:
   *       200:
   *         description: Lista de produtos da categoria
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 count:
   *                   type: integer
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Product'
   */
  async getByCategory(req, res, next) {
    try {
      const { categoryName } = req.params;

      // Busca categoria pelo nome (case-insensitive)
      const category = await Category.findOne({
        name: { $regex: new RegExp(`^${categoryName}$`, 'i') },
      });

      if (!category) {
        return res.status(StatusCodes.OK).json({
          success: true,
          count: 0,
          data: [],
        });
      }

      const products = await Product.find({ category: category._id, active: true })
        .populate('category', 'name description')
        .sort({ createdAt: -1 });

      res.status(StatusCodes.OK).json({
        success: true,
        count: products.length,
        data: products,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProductController();
