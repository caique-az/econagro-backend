const express = require('express');

const router = express.Router();
const contactController = require('../controllers/contact.controller');
const { emailLimiter } = require('../middlewares/rateLimiters');

router.post('/', emailLimiter, contactController.send);

module.exports = router;
