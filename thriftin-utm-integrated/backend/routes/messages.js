const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { upload } = require('../middleware/upload');
const { authenticate } = require('../middleware/authMiddleWare');

router.get('/:conversationId', authenticate, messageController.getMessages);
router.post('/', authenticate, upload.single('attachment'), messageController.sendMessage); 
router.put('/:messageId/read', authenticate, messageController.markAsRead);
router.delete('/:messageId', authenticate, messageController.deleteMessage);
router.get('/search/:userId', authenticate, messageController.searchMessages);

module.exports = router;