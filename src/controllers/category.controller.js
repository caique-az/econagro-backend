const { StatusCodes } = require('http-status-codes');
const Category = require('../models/category');
const { NotFoundError, BadRequestError, ValidationError } = require('../utils/errors');

class CategoryController {

  async getAll(req, res, next) {
    try {
      const categories = await Category.find({}).sort({ name: 1 });

      return res.status(StatusCodes.OK).json({
        success: true,
        count: categories.length,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const category = await Category.findById(id).populate('products');

      if (!category) {
        throw new NotFoundError('Categoria não encontrada');
      }

      return res.status(StatusCodes.OK).json({
        success: true,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const { name } = req.body;

      const category = new Category({ name });

      await category.save();

      return res.status(StatusCodes.CREATED).json({
        success: true,
        data: category,
      });
    } catch (error) {
      if (error.name === 'ValidationError') {
        next(new ValidationError(error.message));
      } else if (error.code === 11000) {
        next(new BadRequestError('Já existe uma categoria com este nome'));
      } else {
        next(error);
      }
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { name } = req.body;

      const category = await Category.findByIdAndUpdate(
        id,
        { name },
        { new: true, runValidators: true },
      );

      if (!category) {
        throw new NotFoundError('Categoria não encontrada');
      }

      return res.status(StatusCodes.OK).json({
        success: true,
        data: category,
      });
    } catch (error) {
      if (error.name === 'ValidationError') {
        next(new ValidationError(error.message));
      } else if (error.code === 11000) {
        next(new BadRequestError('Já existe uma categoria com este nome'));
      } else {
        next(error);
      }
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;

      // Verificar se existem produtos associados a esta categoria
      const categoryWithProducts = await Category.findById(id).populate('products');

      if (!categoryWithProducts) {
        throw new NotFoundError('Categoria não encontrada');
      }

      if (categoryWithProducts.products && categoryWithProducts.products.length > 0) {
        throw new BadRequestError('Não é possível remover uma categoria com produtos associados');
      }

      await Category.findByIdAndDelete(id);

      return res.status(StatusCodes.NO_CONTENT).send();
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CategoryController();
