const express = require('express');
const { login, verify } = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const router = express.Router();

router.post('/login', login);
router.get('/verify', auth, verify);

module.exports = router;