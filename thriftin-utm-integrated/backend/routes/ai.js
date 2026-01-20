const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticate } = require('../middleware/authMiddleWare');

router.post('/respond', authenticate, aiController.generateResponse);
router.get('/quick-actions', authenticate, aiController.getQuickActions);
router.post('/analyze-message', authenticate, aiController.analyzeMessage);
router.get('/suggestions/:userId', authenticate, aiController.getSuggestions);

module.exports = router;