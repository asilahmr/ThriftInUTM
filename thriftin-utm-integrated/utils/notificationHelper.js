const { query } = require('../config/db');

const notificationHelper = {
  // Create notification for new message
  createMessageNotification: async (conversationId, senderId, messageId, messageText) => {
    try {
      // Get conversation details
      const conversation = await query(`
        SELECT participant_1_id, participant_2_id, is_ai_conversation
        FROM conversations WHERE conversation_id = ?
      `, [conversationId]);

      if (conversation.length === 0 || conversation[0].is_ai_conversation || senderId === 1) {
        return;
      }

      const receiverId = conversation[0].participant_1_id === senderId
        ? conversation[0].participant_2_id
        : conversation[0].participant_1_id;

      // Check notification preferences
      const prefs = await query(`
        SELECT new_messages_enabled, quiet_hours_enabled, quiet_hours_start, quiet_hours_end
        FROM user_notification_preferences
        WHERE user_id = ?
      `, [receiverId]);

      if (prefs.length === 0 || !prefs[0].new_messages_enabled) {
        return;
      }

      // Check quiet hours
      if (prefs[0].quiet_hours_enabled) {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`;
        
        if (currentTime >= prefs[0].quiet_hours_start && currentTime <= prefs[0].quiet_hours_end) {
          return; // Don't send notification during quiet hours
        }
      }

      // Get sender name
      const sender = await query('SELECT username FROM users WHERE user_id = ?', [senderId]);
      const messagePreview = messageText.substring(0, 100);

      // Create notification
      await query(`
        INSERT INTO notifications (user_id, sender_id, conversation_id, message_id, notification_type, title, message_preview)
        VALUES (?, ?, ?, ?, 'new_message', ?, ?)
      `, [receiverId, senderId, conversationId, messageId, 
          `New message from ${sender[0].username}`, messagePreview]);

    } catch (error) {
      console.error('Error creating message notification:', error);
    }
  },

  // Create system notification
  createSystemNotification: async (userId, title, message, priority = 'normal') => {
    try {
      await query(`
        INSERT INTO notifications (user_id, notification_type, title, message_preview, priority)
        VALUES (?, 'system_update', ?, ?, ?)
      `, [userId, title, message, priority]);
    } catch (error) {
      console.error('Error creating system notification:', error);
    }
  },

  // Broadcast notification to all users
  broadcastNotification: async (title, message, priority = 'normal') => {
    try {
      const users = await query(`SELECT user_id FROM users WHERE account_status = 'active'`);
      
      for (const user of users) {
        await notificationHelper.createSystemNotification(user.user_id, title, message, priority);
      }
    } catch (error) {
      console.error('Error broadcasting notification:', error);
    }
  }
};

module.exports = notificationHelper;