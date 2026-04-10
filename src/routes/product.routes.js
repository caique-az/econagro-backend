const express = require('express');

const router = express.Router();
const productController = require('../controllers/product.controller');
const validateObjectId = require('../middlewares/validateObjectId');
const { authenticate, authorize } = require('../middlewares/auth');

const adminOnly = [authenticate, authorize('admin')];

router.get('/', productController.getAll);
router.get('/category/:categoryName', productController.getByCategory);
router.get('/:id', validateObjectId(), productController.getById);
router.post('/', ...adminOnly, productController.create);
router.put('/:id', ...adminOnly, validateObjectId(), productController.update);
router.delete('/:id', ...adminOnly, validateObjectId(), productController.delete);

module.exports = router;
