const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

router.post('/respond', aiController.generateResponse);
router.get('/quick-actions', aiController.getQuickActions);
router.post('/analyze-message', aiController.analyzeMessage);
router.get('/suggestions/:userId', aiController.getSuggestions);

module.exports = router;