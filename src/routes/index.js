const express = require('express');

const router = express.Router();
const productRoutes = require('./product.routes');
const categoryRoutes = require('./category.routes');

// Rotas de produtos
router.use('/products', productRoutes);

// Rotas de categorias
router.use('/categories', categoryRoutes);

// Rota de saúde da API
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'API está funcionando' });
});

module.exports = router;
