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

exports.getNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const { type, limit = 50 } = req.query;
    
    console.log('📥 Fetching notifications for user:', userId);
    
    let sql = `
      SELECT 
        n.*,
        u.username as sender_name,
        u.full_name as sender_full_name,
        u.profile_picture as sender_picture
      FROM notifications n
      LEFT JOIN user u ON n.sender_id = u.id
      WHERE n.user_id = ?
    `;
    
    const params = [userId];
    
    if (type) {
      sql += ` AND n.notification_type = ?`;
      params.push(type);
    }
    
    sql += ` ORDER BY n.created_at DESC LIMIT ?`;
    params.push(parseInt(limit));
    
    const notifications = await query(sql, params);
    console.log(`✅ Found ${notifications.length} notifications`);
    res.json(notifications);
  } catch (error) {
    console.error('❌ Error fetching notifications:', error);
    res.status(500).json({ 
      error: 'Failed to fetch notifications',
      message: error.message 
    });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('📊 Fetching unread count for user:', userId);
    
    const result = await query(`
      SELECT COUNT(*) as count
      FROM notifications
      WHERE user_id = ? AND is_read = FALSE
    `, [userId]);
    
    const count = result[0].count;
    console.log(`✅ Unread count: ${count}`);
    res.json({ count });
  } catch (error) {
    console.error('❌ Error fetching unread count:', error);
    res.status(500).json({ 
      error: 'Failed to fetch unread count',
      message: error.message 
    });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    console.log('✓ Marking notification as read:', notificationId);
    
    await query(`
      UPDATE notifications
      SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
      WHERE notification_id = ?
    `, [notificationId]);
    
    console.log('✅ Notification marked as read');
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    res.status(500).json({ 
      error: 'Failed to mark as read',
      message: error.message 
    });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('✓ Marking all notifications as read for user:', userId);
    
    const result = await query(`
      UPDATE notifications
      SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND is_read = FALSE
    `, [userId]);
    
    console.log(`✅ Marked ${result.affectedRows} notifications as read`);
    res.json({ success: true, count: result.affectedRows });
  } catch (error) {
    console.error('❌ Error marking all as read:', error);
    res.status(500).json({ 
      error: 'Failed to mark all as read',
      message: error.message 
    });
  }
};

exports.getPreferences = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('⚙️ Fetching preferences for user:', userId);
    
    let prefs = await query(`
      SELECT * FROM user_notification_preferences WHERE user_id = ?
    `, [userId]);

    // If no preferences exist, create default ones
    if (prefs.length === 0) {
      console.log('📝 Creating default preferences for user:', userId);
      
      await query(`
        INSERT INTO user_notification_preferences (
          user_id,
          new_messages_enabled,
          system_updates_enabled,
          push_enabled,
          email_enabled,
          report_updates_enabled,
          feedback_responses_enabled,
          price_alerts_enabled,
          new_listings_enabled,
          quiet_hours_enabled,
          quiet_hours_start,
          quiet_hours_end
        ) VALUES (?, 1, 1, 1, 0, 1, 1, 0, 0, 0, '22:00:00', '08:00:00')
      `, [userId]);
      
      prefs = await query(`
        SELECT * FROM user_notification_preferences WHERE user_id = ?
      `, [userId]);
    }
    
    console.log('✅ Preferences retrieved');
    res.json(prefs[0]);
  } catch (error) {
    console.error('❌ Error fetching preferences:', error);
    res.status(500).json({ 
      error: 'Failed to fetch preferences',
      message: error.message 
    });
  }
};

exports.updatePreferences = async (req, res) => {
  try {
    const { userId } = req.params;
    const prefs = req.body;
    
    console.log('💾 Updating preferences for user:', userId);
    console.log('📝 New preferences:', prefs);
   
    // Check if preferences exist
    const existing = await query(`
      SELECT * FROM user_notification_preferences WHERE user_id = ?
    `, [userId]);

    if (existing.length === 0) {
      // INSERT new record
      console.log('📝 Creating new preferences record');
      
      await query(`
        INSERT INTO user_notification_preferences (
          user_id,
          new_messages_enabled,
          system_updates_enabled,
          push_enabled,
          email_enabled,
          report_updates_enabled,
          feedback_responses_enabled,
          price_alerts_enabled,
          new_listings_enabled,
          quiet_hours_enabled,
          quiet_hours_start,
          quiet_hours_end
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userId,
        prefs.new_messages_enabled ?? true,
        prefs.system_updates_enabled ?? true,
        prefs.push_enabled ?? true,
        prefs.email_enabled ?? false,
        prefs.report_updates_enabled ?? true,
        prefs.feedback_responses_enabled ?? true,
        prefs.price_alerts_enabled ?? false,
        prefs.new_listings_enabled ?? false,
        prefs.quiet_hours_enabled ?? false,
        prefs.quiet_hours_start ?? '22:00:00',
        prefs.quiet_hours_end ?? '08:00:00'
      ]);
    } else {
      // UPDATE existing record
      console.log('💾 Updating existing preferences');
      
      await query(`
        UPDATE user_notification_preferences
        SET new_messages_enabled = ?,
            system_updates_enabled = ?,
            push_enabled = ?,
            email_enabled = ?,
            report_updates_enabled = ?,
            feedback_responses_enabled = ?,
            price_alerts_enabled = ?,
            new_listings_enabled = ?,
            quiet_hours_enabled = ?,
            quiet_hours_start = ?,
            quiet_hours_end = ?
        WHERE user_id = ?
      `, [
        prefs.new_messages_enabled ?? existing[0].new_messages_enabled,
        prefs.system_updates_enabled ?? existing[0].system_updates_enabled,
        prefs.push_enabled ?? existing[0].push_enabled,
        prefs.email_enabled ?? existing[0].email_enabled,
        prefs.report_updates_enabled ?? existing[0].report_updates_enabled,
        prefs.feedback_responses_enabled ?? existing[0].feedback_responses_enabled,
        prefs.price_alerts_enabled ?? existing[0].price_alerts_enabled,
        prefs.new_listings_enabled ?? existing[0].new_listings_enabled,
        prefs.quiet_hours_enabled ?? existing[0].quiet_hours_enabled,
        prefs.quiet_hours_start ?? existing[0].quiet_hours_start,
        prefs.quiet_hours_end ?? existing[0].quiet_hours_end,
        userId
      ]);
    }
    
    console.log('✅ Preferences updated successfully');
    res.json({ success: true, message: 'Settings saved' });
  } catch (error) {
    console.error('❌ Error updating preferences:', error);
    res.status(500).json({ 
      error: 'Failed to update preferences',
      message: error.message 
    });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    console.log('🗑️ Deleting notification:', notificationId);
    
    await query(`DELETE FROM notifications WHERE notification_id = ?`, [notificationId]);
    
    console.log('✅ Notification deleted');
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('❌ Error deleting notification:', error);
    res.status(500).json({ 
      error: 'Failed to delete notification',
      message: error.message 
    });
  }
};