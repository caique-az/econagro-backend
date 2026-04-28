const express = require('express');

const router = express.Router();
const categoryController = require('../controllers/category.controller');
const validateObjectId = require('../middlewares/validateObjectId');
const { authenticate, authorize } = require('../middlewares/auth');

const adminOnly = [authenticate, authorize('admin')];

// Rotas públicas
router.get('/', categoryController.getAll);
router.get('/admin', ...adminOnly, categoryController.getAllAdmin);
router.get('/admin/:id', ...adminOnly, validateObjectId(), categoryController.getByIdAdmin);
router.get('/:id', validateObjectId(), categoryController.getById);

// Rotas admin
router.post('/', ...adminOnly, categoryController.create);
router.put('/:id', ...adminOnly, validateObjectId(), categoryController.update);
router.delete('/:id', ...adminOnly, validateObjectId(), categoryController.delete);

module.exports = router;
