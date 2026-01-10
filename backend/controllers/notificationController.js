const { query } = require('../config/db');

exports.getNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const { type, limit = 50 } = req.query;
    
    let sql = `
      SELECT 
        n.*,
        u.username as sender_name,
        u.full_name as sender_full_name,
        u.profile_picture as sender_picture
      FROM notifications n
      LEFT JOIN users u ON n.sender_id = u.user_id
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
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await query(`
      SELECT COUNT(*) as count
      FROM notifications
      WHERE user_id = ? AND is_read = FALSE
    `, [userId]);
    res.json({ count: result[0].count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    await query(`
      UPDATE notifications
      SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
      WHERE notification_id = ?
    `, [notificationId]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    await query(`
      UPDATE notifications
      SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND is_read = FALSE
    `, [userId]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
};

exports.getPreferences = async (req, res) => {
  try {
    const { userId } = req.params;
    let prefs = await query(`
      SELECT * FROM user_notification_preferences WHERE user_id = ?
    `, [userId]);

    if (prefs.length === 0) {
      await query(`INSERT INTO user_notification_preferences (user_id) VALUES (?)`, [userId]);
      prefs = await query(`SELECT * FROM user_notification_preferences WHERE user_id = ?`, [userId]);
    }
    res.json(prefs[0]);
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
};

exports.updatePreferences = async (req, res) => {
  try {
    const { userId } = req.params;
    const prefs = req.body;
    
    await query(`
      UPDATE user_notification_preferences
      SET new_messages_enabled = ?,
          system_updates_enabled = ?,
          push_enabled = ?,
          email_enabled = ?,
          report_updates_enabled = ?,
          feedback_responses_enabled = ?,
          price_alerts_enabled = ?,
          quiet_hours_enabled = ?,
          quiet_hours_start = ?,
          quiet_hours_end = ?
      WHERE user_id = ?
    `, [
      prefs.new_messages_enabled, 
      prefs.system_updates_enabled, 
      prefs.push_enabled,
      prefs.email_enabled, 
      prefs.report_updates_enabled, 
      prefs.feedback_responses_enabled,
      prefs.price_alerts_enabled, 
      prefs.quiet_hours_enabled, 
      prefs.quiet_hours_start,
      prefs.quiet_hours_end, 
      userId
    ]);
    
    res.json({ success: true, message: 'Settings saved' });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    await query(`DELETE FROM notifications WHERE notification_id = ?`, [notificationId]);
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
};
