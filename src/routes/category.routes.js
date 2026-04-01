const express = require('express');

const router = express.Router();
const categoryController = require('../controllers/category.controller');
const validateObjectId = require('../middlewares/validateObjectId');

// Rotas de categorias
router.get('/', categoryController.getAll);
router.post('/', categoryController.create);
router.get('/:id', validateObjectId(), categoryController.getById);
router.put('/:id', validateObjectId(), categoryController.update);
router.delete('/:id', validateObjectId(), categoryController.delete);

module.exports = router;
