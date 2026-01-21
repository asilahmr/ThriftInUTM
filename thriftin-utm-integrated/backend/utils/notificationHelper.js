// backend/helpers/notificationHelper.js
const db = require('../config/db');

const query = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) {
        console.error('Database query error:', err);
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

const notificationHelper = {
  // Create notification for new message
  createMessageNotification: async (conversationId, senderId, messageId, messageText) => {
    try {
      console.log(`📬 Creating notification for conversation ${conversationId}`);
      
      // Get conversation details
      const conversation = await query(`
        SELECT participant_1_id, participant_2_id, is_ai_conversation
        FROM conversations WHERE conversation_id = ?
      `, [conversationId]);

      if (conversation.length === 0) {
        console.log('⚠️  Conversation not found');
        return;
      }

      // Don't send notifications for AI conversations or if sender is system/AI
      if (conversation[0].is_ai_conversation || senderId === 1) {
        console.log('⚠️  Skipping notification (AI conversation or system sender)');
        return;
      }

      // Determine receiver
      const receiverId = conversation[0].participant_1_id === senderId
        ? conversation[0].participant_2_id
        : conversation[0].participant_1_id;

      console.log(`📨 Receiver ID: ${receiverId}`);

      // Check notification preferences
      const prefs = await query(`
        SELECT new_messages_enabled, quiet_hours_enabled, quiet_hours_start, quiet_hours_end
        FROM user_notification_preferences
        WHERE user_id = ?
      `, [receiverId]);

      // If no preferences exist or notifications disabled, don't send
      if (prefs.length === 0 || !prefs[0].new_messages_enabled) {
        console.log('⚠️  User has disabled message notifications');
        return;
      }

      // Check quiet hours
      if (prefs[0].quiet_hours_enabled) {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`;
        
        if (currentTime >= prefs[0].quiet_hours_start && currentTime <= prefs[0].quiet_hours_end) {
          console.log('⚠️  Quiet hours active - notification suppressed');
          return;
        }
      }

      // Get sender name
      const sender = await query('SELECT username FROM user WHERE id = ?', [senderId]);
      
      if (sender.length === 0) {
        console.log('⚠️  Sender not found');
        return;
      }

      const messagePreview = messageText.substring(0, 100);

      // Create notification
      await query(`
        INSERT INTO notifications (user_id, sender_id, conversation_id, message_id, notification_type, title, message_preview)
        VALUES (?, ?, ?, ?, 'new_message', ?, ?)
      `, [receiverId, senderId, conversationId, messageId, 
          `New message from ${sender[0].username}`, messagePreview]);

      console.log(`✅ Notification created for user ${receiverId}`);

    } catch (error) {
      console.error('❌ Error creating message notification:', error);
    }
  },

  // Create system notification
  createSystemNotification: async (userId, title, message, priority = 'normal') => {
    try {
      console.log(`📢 Creating system notification for user ${userId}`);
      
      await query(`
        INSERT INTO notifications (user_id, notification_type, title, message_preview, priority)
        VALUES (?, 'system_update', ?, ?, ?)
      `, [userId, title, message, priority]);

      console.log(`✅ System notification created`);
    } catch (error) {
      console.error('❌ Error creating system notification:', error);
    }
  },

  // Broadcast notification to all active users
  broadcastNotification: async (title, message, priority = 'normal') => {
    try {
      console.log(`📣 Broadcasting notification to all users`);
      
      const users = await query(`
        SELECT id FROM user 
        WHERE user_type = 'student' 
        AND id IN (SELECT user_id FROM students WHERE account_status = 'active')
      `);
      
      let count = 0;
      for (const user of users) {
        await notificationHelper.createSystemNotification(user.id, title, message, priority);
        count++;
      }
      
      console.log(`✅ Broadcast complete - sent to ${count} users`);
    } catch (error) {
      console.error('❌ Error broadcasting notification:', error);
    }
  },

  // Create notification for report update
  createReportUpdateNotification: async (userId, reportId, status, message) => {
    try {
      console.log(`📋 Creating report update notification for user ${userId}`);
      
      await query(`
        INSERT INTO notifications (user_id, notification_type, title, message_preview, priority)
        VALUES (?, 'report_update', ?, ?, 'high')
      `, [userId, `Report #${reportId} ${status}`, message]);

      console.log(`✅ Report update notification created`);
    } catch (error) {
      console.error('❌ Error creating report notification:', error);
    }
  },

  // Create notification for feedback response
  createFeedbackResponseNotification: async (userId, feedbackId, message) => {
    try {
      console.log(`💬 Creating feedback response notification for user ${userId}`);
      
      await query(`
        INSERT INTO notifications (user_id, notification_type, title, message_preview)
        VALUES (?, 'feedback_response', ?, ?)
      `, [userId, `Response to your feedback #${feedbackId}`, message]);

      console.log(`✅ Feedback response notification created`);
    } catch (error) {
      console.error('❌ Error creating feedback response notification:', error);
    }
  },

  // Create notification for price alert
  createPriceAlertNotification: async (userId, productId, productName, oldPrice, newPrice) => {
    try {
      console.log(`💰 Creating price alert notification for user ${userId}`);
      
      const message = `${productName} dropped from RM${oldPrice} to RM${newPrice}`;
      
      await query(`
        INSERT INTO notifications (user_id, notification_type, title, message_preview)
        VALUES (?, 'price_alert', ?, ?)
      `, [userId, 'Price Drop Alert!', message]);

      console.log(`✅ Price alert notification created`);
    } catch (error) {
      console.error('❌ Error creating price alert notification:', error);
    }
  },

  // Create notification for new listing
  createNewListingNotification: async (userId, productId, productName, category) => {
    try {
      console.log(`📚 Creating new listing notification for user ${userId}`);
      
      const message = `New ${category} listing: ${productName}`;
      
      await query(`
        INSERT INTO notifications (user_id, notification_type, title, message_preview)
        VALUES (?, 'new_listing', ?, ?)
      `, [userId, 'New Textbook Available', message]);

      console.log(`✅ New listing notification created`);
    } catch (error) {
      console.error('❌ Error creating new listing notification:', error);
    }
  }
};

module.exports = notificationHelper;