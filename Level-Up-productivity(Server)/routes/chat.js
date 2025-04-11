const express = require('express');
const router = express.Router();
const { getChatResponse } = require('../controllers/chat');

router.post('/message', getChatResponse);

module.exports = router; 