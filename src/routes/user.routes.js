const express = require('express');

const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const validateObjectId = require('../middlewares/validateObjectId');

router.patch('/:id/role', authenticate, authorize('admin'), validateObjectId(), userController.updateRole);

module.exports = router;
