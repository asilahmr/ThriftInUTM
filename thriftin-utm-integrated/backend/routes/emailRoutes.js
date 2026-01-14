const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');

router.get('/verify', emailController.verifyEmail);
router.post('/resend', emailController.resendVerification);

module.exports = router;