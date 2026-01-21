// test-server.js
// Save in backend folder and run: node test-server.js
// This creates a minimal server just for testing notifications

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Database
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'admin123',
  database: process.env.DB_NAME || 'thriftin_utm'
});

// Test database
db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
  } else {
    console.log('✅ Database connected');
    connection.release();
  }
});

// Simple query helper
const query = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

// Test endpoint
app.get('/api/notifications/test', (req, res) => {
  console.log('📍 Test endpoint hit');
  res.json({ 
    success: true, 
    message: 'Notification routes are working!',
    timestamp: new Date().toISOString()
  });
});

// Get notifications
app.get('/api/notifications/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('📥 Getting notifications for user:', userId);
    
    const notifications = await query(`
      SELECT 
        n.*,
        u.username as sender_name
      FROM notifications n
      LEFT JOIN user u ON n.sender_id = u.id
      WHERE n.user_id = ?
      ORDER BY n.created_at DESC
      LIMIT 50
    `, [userId]);
    
    console.log(`✅ Found ${notifications.length} notifications`);
    res.json(notifications);
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get preferences
app.get('/api/notifications/preferences/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('⚙️ Getting preferences for user:', userId);
    
    let prefs = await query(`
      SELECT * FROM user_notification_preferences WHERE user_id = ?
    `, [userId]);
    
    if (prefs.length === 0) {
      console.log('📝 Creating default preferences');
      await query(`
        INSERT INTO user_notification_preferences (user_id) VALUES (?)
      `, [userId]);
      prefs = await query(`
        SELECT * FROM user_notification_preferences WHERE user_id = ?
      `, [userId]);
    }
    
    console.log('✅ Preferences retrieved');
    res.json(prefs[0]);
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update preferences
app.put('/api/notifications/preferences/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const prefs = req.body;
    console.log('💾 Updating preferences for user:', userId);
    
    const existing = await query(`
      SELECT * FROM user_notification_preferences WHERE user_id = ?
    `, [userId]);
    
    if (existing.length === 0) {
      await query(`
        INSERT INTO user_notification_preferences (
          user_id, new_messages_enabled, system_updates_enabled, push_enabled
        ) VALUES (?, ?, ?, ?)
      `, [userId, prefs.new_messages_enabled, prefs.system_updates_enabled, prefs.push_enabled]);
    } else {
      await query(`
        UPDATE user_notification_preferences
        SET new_messages_enabled = ?, system_updates_enabled = ?, push_enabled = ?
        WHERE user_id = ?
      `, [prefs.new_messages_enabled, prefs.system_updates_enabled, prefs.push_enabled, userId]);
    }
    
    console.log('✅ Preferences updated');
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get unread count
app.get('/api/notifications/:userId/unread-count', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await query(`
      SELECT COUNT(*) as count FROM notifications
      WHERE user_id = ? AND is_read = FALSE
    `, [userId]);
    res.json({ count: result[0].count });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mark as read
app.put('/api/notifications/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;
    await query(`
      UPDATE notifications SET is_read = TRUE WHERE notification_id = ?
    `, [notificationId]);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mark all as read
app.put('/api/notifications/read-all/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    await query(`
      UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE
    `, [userId]);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 404 handler
app.use((req, res) => {
  console.log('❌ 404:', req.method, req.url);
  res.status(404).json({ message: 'Route not found' });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`\n✅ Test server running on port ${PORT}`);
  console.log(`📡 Test it: http://localhost:${PORT}/api/notifications/test`);
  console.log(`📋 Get notifications: http://localhost:${PORT}/api/notifications/13`);
  console.log(`⚙️  Get preferences: http://localhost:${PORT}/api/notifications/preferences/13\n`);
});