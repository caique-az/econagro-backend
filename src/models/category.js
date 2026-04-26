const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'O nome da categoria é obrigatório'],
      trim: true,
      unique: true,
      maxlength: [50, 'O nome não pode ter mais de 50 caracteres'],
    }
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

module.exports = mongoose.model('Category', categorySchema);
