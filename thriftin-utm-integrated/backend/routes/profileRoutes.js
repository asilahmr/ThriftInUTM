// backend/routes/profileRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/profileController');
const { authenticate } = require('../middleware/authMiddleWare');

router.get('/me', authenticate, controller.getProfile);

router.put('/me', authenticate, controller.updateProfile);

router.post('/upload-image', 
  authenticate, 
  controller.uploadProfileImage, 
  controller.updateProfileImage
);

module.exports = router;