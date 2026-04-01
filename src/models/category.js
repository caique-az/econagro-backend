const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'O nome da categoria é obrigatório'],
      trim: true,
      unique: true,
      maxlength: [50, 'O nome não pode ter mais de 50 caracteres'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'A descrição não pode ter mais de 200 caracteres'],
    },
    image: {
      type: String,
      default: 'default-category.jpg',
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

categorySchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'category',
});

categorySchema.index({ name: 1 });

module.exports = mongoose.model('Category', categorySchema);
