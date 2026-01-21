const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// IMPORTANT: Order matters! More specific routes must come before generic ones
// Preferences routes - must come BEFORE /:userId
router.get('/preferences/:userId', notificationController.getPreferences);
router.put('/preferences/:userId', notificationController.updatePreferences);

// Unread count - must come BEFORE /:userId
router.get('/:userId/unread-count', notificationController.getUnreadCount);

// Mark all as read - must come BEFORE /:notificationId
router.put('/read-all/:userId', notificationController.markAllAsRead);

// Individual notification operations
router.put('/:notificationId/read', notificationController.markAsRead);
router.delete('/:notificationId', notificationController.deleteNotification);

// Get notifications list - should be last among /:userId patterns
router.get('/:userId', notificationController.getNotifications);

module.exports = router;