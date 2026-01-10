const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');

router.get('/:userId', conversationController.getConversations);
router.post('/', conversationController.createConversation);
router.put('/:conversationId/archive', conversationController.archiveConversation);
router.delete('/:conversationId', conversationController.deleteConversation);

module.exports = router;