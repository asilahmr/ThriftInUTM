const express = require('express');
const router = express.Router();
const controller = require('../controllers/profileController');
const authMiddleWare = require('../middleware/authMiddleWare'); 

router.get('/me', authMiddleWare, controller.getProfile);

router.put('/me', authMiddleWare, controller.updateProfile);

router.post('/upload-image', 
  authMiddleWare, 
  controller.uploadProfileImage, 
  controller.updateProfileImage
);

module.exports = router;