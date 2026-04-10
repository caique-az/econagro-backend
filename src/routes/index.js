const express = require('express');

const router = express.Router();
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const productRoutes = require('./product.routes');
const categoryRoutes = require('./category.routes');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);

router.get('/health', (req, res) => {
  res.status(200).json({ status: 'API está funcionando' });
});

module.exports = router;
