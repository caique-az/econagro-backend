const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'O nome do produto é obrigatório'],
      trim: true,
      maxlength: [100, 'O nome não pode ter mais de 100 caracteres'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'A descrição não pode ter mais de 500 caracteres'],
    },
    price: {
      type: Number,
      required: [true, 'O preço é obrigatório'],
      min: [0.01, 'O preço deve ser maior que zero'],
    },
    quantity: {
      type: Number,
      required: [true, 'A quantidade é obrigatória'],
      min: [0, 'A quantidade não pode ser negativa'],
      default: 0,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'A categoria é obrigatória'],
    },
    image: {
      type: String,
      default: 'default-product.jpg',
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, active: 1 });

module.exports = mongoose.model('Product', productSchema);
