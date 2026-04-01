const express = require('express');

const router = express.Router();
const productController = require('../controllers/product.controller');
const validateObjectId = require('../middlewares/validateObjectId');

// Rotas de produtos
router.get('/', productController.getAll);
router.post('/', productController.create);
router.get('/category/:categoryName', productController.getByCategory);
router.get('/:id', validateObjectId(), productController.getById);
router.put('/:id', validateObjectId(), productController.update);
router.delete('/:id', validateObjectId(), productController.delete);

module.exports = router;
