const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { upload } = require('../middleware/upload');

router.get('/:conversationId', messageController.getMessages);
router.post('/', upload.single('attachment'), messageController.sendMessage);
router.put('/:messageId/read', messageController.markAsRead);
router.delete('/:messageId', messageController.deleteMessage);
router.get('/search/:userId', messageController.searchMessages);

module.exports = router;