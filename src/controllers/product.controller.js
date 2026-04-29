const { StatusCodes } = require("http-status-codes");
const mongoose = require("mongoose");
const { Product, Category } = require("../models");
const {
  NotFoundError,
  BadRequestError,
  ValidationError,
} = require("../utils/errors");

class ProductController {
  async getAll(req, res, next) {
    try {
      const { category, search } = req.query;
      const filter = { active: true };

      if (category) {
        if (!mongoose.Types.ObjectId.isValid(category)) {
          throw new BadRequestError('ID da categoria inválido');
        }

        const categoryDoc = await Category.findOne({
          _id: category,
          active: true,
        });

        if (!categoryDoc) {
          return res.status(StatusCodes.OK).json({
            success: true,
            count: 0,
            data: [],
          });
        }

        filter.category = category;
      } else {
        const activeCategoryIds = await Category.find({ active: true }).distinct(
          "_id",
        );
        filter.category = { $in: activeCategoryIds };
      }

      const trimmedSearch = search?.trim();

      if (trimmedSearch) {
        filter.$text = { $search: trimmedSearch };
      }

      const projection = trimmedSearch
        ? { score: { $meta: "textScore" } }
        : undefined;

      let query = Product.find(filter, projection).populate("category", "name");

      if (trimmedSearch) {
        query = query.sort({ score: { $meta: "textScore" }, createdAt: -1 });
      } else {
        query = query.sort({ createdAt: -1 });
      }

      const products = await query;

      res.status(StatusCodes.OK).json({
        success: true,
        count: products.length,
        data: products,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;

      const product = await Product.findOne({ _id: id, active: true }).populate({
        path: "category",
        select: "name active",
        match: { active: true },
      });

      if (!product || !product.category) {
        throw new NotFoundError("Produto não encontrado");
      }

      res.status(StatusCodes.OK).json({
        success: true,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const { name, description, price, quantity, category, image, active } =
        req.body;

      if (category) {
        if (!mongoose.Types.ObjectId.isValid(category)) {
          throw new BadRequestError("ID da categoria inválido");
        }

        const categoryExists = await Category.findById(category);

        if (!categoryExists) {
          throw new NotFoundError("Categoria não encontrada");
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
      await product.populate("category", "name");

      res.status(StatusCodes.CREATED).json({
        success: true,
        data: product,
      });
    } catch (error) {
      if (error.name === "ValidationError") {
        next(new ValidationError(error.message));
      } else {
        next(error);
      }
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { category } = req.body;

      if (category) {
        if (!mongoose.Types.ObjectId.isValid(category)) {
          throw new BadRequestError("ID da categoria inválido");
        }

        const categoryExists = await Category.findById(category);

        if (!categoryExists) {
          throw new NotFoundError("Categoria não encontrada");
        }
      }

      const allowedFields = [
        "name",
        "description",
        "price",
        "quantity",
        "category",
        "image",
        "active",
      ];

      const updates = {};

      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }

      const product = await Product.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true,
      }).populate("category", "name");

      if (!product) {
        throw new NotFoundError("Produto não encontrado");
      }

      res.status(StatusCodes.OK).json({
        success: true,
        data: product,
      });
    } catch (error) {
      if (error.name === "ValidationError") {
        next(new ValidationError(error.message));
      } else {
        next(error);
      }
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;

      const product = await Product.findByIdAndDelete(id);

      if (!product) {
        throw new NotFoundError("Produto não encontrado");
      }

      res.status(StatusCodes.NO_CONTENT).send();
    } catch (error) {
      next(error);
    }
  }

  async getByCategory(req, res, next) {
    try {
      const { categoryName } = req.params;

      const category = await Category.findOne({
        name: categoryName,
        active: true,
      }).collation({
        locale: "pt",
        strength: 2,
      });

      if (!category) {
        return res.status(StatusCodes.OK).json({
          success: true,
          count: 0,
          data: [],
        });
      }

      const products = await Product.find({
        category: category._id,
        active: true,
      })
        .populate("category", "name")
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
