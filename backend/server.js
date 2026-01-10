// backend/server.js - Enhanced Complete Communication & Support System
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Ensure upload directories exist
const ensureDirectories = async () => {
  const dirs = ['uploads', 'uploads/attachments', 'uploads/feedback'];
  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      console.error(`Error creating ${dir}:`, error);
    }
  }
};
ensureDirectories();

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'textbook_chat',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = req.body.upload_type || 'attachments';
    cb(null, `uploads/${type}/`);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.random().toString(36).substring(7) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only images and documents are allowed!'));
    }
  }
});

// ============================================
// CHAT & MESSAGING ROUTES
// ============================================

// Get all conversations for a user
app.get('/api/conversations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { search, status = 'active' } = req.query;
    
    let query = `
      SELECT 
        c.conversation_id,
        c.is_ai_conversation,
        c.conversation_status,
        c.updated_at,
        CASE 
          WHEN c.participant_1_id = ? THEN u2.user_id
          ELSE u1.user_id
        END as other_user_id,
        CASE 
          WHEN c.participant_1_id = ? THEN u2.username
          ELSE u1.username
        END as other_username,
        CASE 
          WHEN c.participant_1_id = ? THEN u2.full_name
          ELSE u1.full_name
        END as other_full_name,
        CASE 
          WHEN c.participant_1_id = ? THEN u2.profile_picture
          ELSE u1.profile_picture
        END as other_profile_picture,
        CASE 
          WHEN c.participant_1_id = ? THEN u2.is_online
          ELSE u1.is_online
        END as other_is_online,
        CASE 
          WHEN c.participant_1_id = ? THEN u2.last_seen
          ELSE u1.last_seen
        END as other_last_seen,
        (SELECT message_text FROM messages 
         WHERE conversation_id = c.conversation_id 
         AND is_deleted = FALSE
         ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT message_type FROM messages 
         WHERE conversation_id = c.conversation_id 
         AND is_deleted = FALSE
         ORDER BY created_at DESC LIMIT 1) as last_message_type,
        (SELECT created_at FROM messages 
         WHERE conversation_id = c.conversation_id 
         AND is_deleted = FALSE
         ORDER BY created_at DESC LIMIT 1) as last_message_time,
        (SELECT COUNT(*) FROM messages 
         WHERE conversation_id = c.conversation_id 
         AND sender_id != ? AND is_read = FALSE AND is_deleted = FALSE) as unread_count
      FROM conversations c
      LEFT JOIN users u1 ON c.participant_1_id = u1.user_id
      LEFT JOIN users u2 ON c.participant_2_id = u2.user_id
      WHERE (c.participant_1_id = ? OR c.participant_2_id = ?)
      AND c.conversation_status = ?
      AND c.conversation_id NOT IN (
        SELECT conversation_id FROM conversations 
        WHERE (participant_1_id IN (SELECT blocked_id FROM blocked_users WHERE blocker_id = ? AND block_status = 'active')
        OR participant_2_id IN (SELECT blocked_id FROM blocked_users WHERE blocker_id = ? AND block_status = 'active'))
      )
    `;
    
    const params = [userId, userId, userId, userId, userId, userId, userId, userId, userId, status, userId, userId];
    
    if (search) {
      query += ` AND (u1.username LIKE ? OR u2.username LIKE ? OR u1.full_name LIKE ? OR u2.full_name LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }
    
    query += ` ORDER BY c.is_ai_conversation DESC, c.updated_at DESC`;
    
    const [conversations] = await pool.query(query, params);
    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get messages for a conversation
app.get('/api/messages/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId, limit = 50, offset = 0 } = req.query;
    
    const [messages] = await pool.query(`
      SELECT 
        m.*,
        u.username as sender_name,
        u.full_name as sender_full_name,
        u.profile_picture as sender_picture
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.user_id
      WHERE m.conversation_id = ? AND m.is_deleted = FALSE
      ORDER BY m.created_at ASC
      LIMIT ? OFFSET ?
    `, [conversationId, parseInt(limit), parseInt(offset)]);

    // Mark messages as read
    if (userId) {
      await pool.query(`
        UPDATE messages 
        SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
        WHERE conversation_id = ? AND sender_id != ? AND is_read = FALSE
      `, [conversationId, userId]);
    }

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send message with optional attachment
// ============================================
// FIX: REPLACES YOUR CURRENT POST /api/messages ROUTE
// ============================================

// Send message with optional attachment
app.post('/api/messages', upload.single('attachment'), async (req, res) => {
  try {
    // NOTE: Ensure your frontend sends 'receiver_id' if it's a new conversation!
    const { conversation_id, sender_id, receiver_id, message_text, message_type = 'text' } = req.body;
    
    let attachment_url = null;
    let attachment_name = null;
    let attachment_size = null;
    
    if (req.file) {
      attachment_url = `/uploads/attachments/${req.file.filename}`;
      attachment_name = req.file.originalname;
      attachment_size = req.file.size;
    }

    // ---------------------------------------------------------
    // STEP 1: RESOLVE CONVERSATION ID (The Fix)
    // ---------------------------------------------------------
    let finalConversationId = conversation_id;

    // Check if the conversation actually exists in the DB
    const [convCheck] = await pool.query(
      'SELECT conversation_id FROM conversations WHERE conversation_id = ?', 
      [conversation_id]
    );

    // If conversation doesn't exist, we must find an existing chat or create a new one
    if (convCheck.length === 0) {
      console.log(`Conversation ${conversation_id} not found. Checking for existing chat...`);

      // 1. Check if a chat already exists between these two users (User A <-> User B)
      // We check both directions: (p1=A & p2=B) OR (p1=B & p2=A)
      const [existingChat] = await pool.query(
        `SELECT conversation_id FROM conversations 
         WHERE (participant_1_id = ? AND participant_2_id = ?) 
         OR (participant_1_id = ? AND participant_2_id = ?)`, 
        [sender_id, receiver_id, receiver_id, sender_id]
      );

      if (existingChat.length > 0) {
        // Found a valid existing chat, use that ID instead
        finalConversationId = existingChat[0].conversation_id;
      } else {
        // 2. No chat exists at all. Create a NEW conversation.
        // We use 'participant_1_id' and 'participant_2_id' (Correct Column Names)
        if (!receiver_id) {
            return res.status(400).json({ error: 'receiver_id is required to start a new conversation' });
        }

        const [newConv] = await pool.query(
          `INSERT INTO conversations (participant_1_id, participant_2_id, created_at, updated_at, last_message_at) 
           VALUES (?, ?, NOW(), NOW(), NOW())`,
          [sender_id, receiver_id]
        );
        finalConversationId = newConv.insertId;
        console.log(`Created new conversation ID: ${finalConversationId}`);
      }
    }

    // ---------------------------------------------------------
    // STEP 2: INSERT THE MESSAGE
    // ---------------------------------------------------------
    const [result] = await pool.query(`
      INSERT INTO messages (conversation_id, sender_id, message_text, message_type, attachment_url, attachment_name, attachment_size, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `, [finalConversationId, sender_id, message_text, message_type, attachment_url, attachment_name, attachment_size]);

    // Update conversation timestamp
    await pool.query(`
      UPDATE conversations 
      SET updated_at = CURRENT_TIMESTAMP, last_message_at = CURRENT_TIMESTAMP
      WHERE conversation_id = ?
    `, [finalConversationId]);

    // ---------------------------------------------------------
    // STEP 3: NOTIFICATIONS
    // ---------------------------------------------------------
    const [conversation] = await pool.query(`
      SELECT participant_1_id, participant_2_id, is_ai_conversation
      FROM conversations WHERE conversation_id = ?
    `, [finalConversationId]);

    if (conversation.length > 0 && !conversation[0].is_ai_conversation) {
      // Determine who receives the notification
      const notifReceiverId = conversation[0].participant_1_id === parseInt(sender_id)
        ? conversation[0].participant_2_id
        : conversation[0].participant_1_id;

      const [prefs] = await pool.query(`
        SELECT new_messages_enabled FROM user_notification_preferences
        WHERE user_id = ?
      `, [notifReceiverId]);

      if (prefs.length === 0 || (prefs.length > 0 && prefs[0].new_messages_enabled)) {
        const [sender] = await pool.query('SELECT username FROM users WHERE user_id = ?', [sender_id]);
        
        const messagePreview = message_text ? message_text.substring(0, 100) : 
                               (attachment_name ? `Sent an attachment: ${attachment_name}` : 'Sent a message');
        
        await pool.query(`
          INSERT INTO notifications (user_id, sender_id, conversation_id, message_id, notification_type, title, message_preview)
          VALUES (?, ?, ?, ?, 'new_message', ?, ?)
        `, [notifReceiverId, sender_id, finalConversationId, result.insertId, 
            `New message from ${sender[0] ? sender[0].username : 'User'}`, messagePreview]);
      }
    }

    // Return the new message object
    const [newMessage] = await pool.query(`
      SELECT m.*, u.username as sender_name, u.profile_picture as sender_picture
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.user_id
      WHERE m.message_id = ?
    `, [result.insertId]);

    res.json({
        ...newMessage[0],
        conversationId: finalConversationId // Send back the ACTUAL ID used
    });

  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message: ' + error.message });
  }
});

// Delete message
app.delete('/api/messages/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId } = req.query;
    
    // Verify user owns the message
    const [message] = await pool.query('SELECT sender_id FROM messages WHERE message_id = ?', [messageId]);
    
    if (message.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    if (message[0].sender_id !== parseInt(userId)) {
      return res.status(403).json({ error: 'Not authorized to delete this message' });
    }
    
    await pool.query(`
      UPDATE messages 
      SET is_deleted = TRUE, deleted_at = CURRENT_TIMESTAMP, message_text = 'This message was deleted'
      WHERE message_id = ?
    `, [messageId]);
    
    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// Search messages
app.get('/api/messages/search/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { query } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.json([]);
    }
    
    const [results] = await pool.query(`
      SELECT 
        m.*,
        c.conversation_id,
        u.username as sender_name,
        CASE 
          WHEN c.participant_1_id = ? THEN u2.username
          ELSE u1.username
        END as other_username
      FROM messages m
      JOIN conversations c ON m.conversation_id = c.conversation_id
      JOIN users u ON m.sender_id = u.user_id
      LEFT JOIN users u1 ON c.participant_1_id = u1.user_id
      LEFT JOIN users u2 ON c.participant_2_id = u2.user_id
      WHERE (c.participant_1_id = ? OR c.participant_2_id = ?)
      AND m.is_deleted = FALSE
      AND MATCH(m.message_text) AGAINST(? IN NATURAL LANGUAGE MODE)
      ORDER BY m.created_at DESC
      LIMIT 50
    `, [userId, userId, userId, query]);
    
    res.json(results);
  } catch (error) {
    console.error('Error searching messages:', error);
    res.status(500).json({ error: 'Failed to search messages' });
  }
});

// ============================================
// AI ASSISTANT ROUTES
// ============================================

app.post('/api/ai/respond', async (req, res) => {
  try {
    const { message, userId } = req.body;
    let response = '';
    const lowerMessage = message.toLowerCase();

    const isBookRelated = lowerMessage.includes('book') || lowerMessage.includes('textbook') || 
                          lowerMessage.includes('study') || lowerMessage.includes('buy') || 
                          lowerMessage.includes('sell');

    if (lowerMessage.includes('find') || lowerMessage.includes('search') || lowerMessage.includes('need') || 
        (lowerMessage.includes('rm') && isBookRelated)) {
      response = "I can help you find textbooks! Here are some options under RM50:\n\n" +
                 "1. Introduction to Programming - RM35\n" +
                 "2. Mathematics for Beginners - RM40\n" +
                 "3. English Grammar Basics - RM28\n\n" +
                 "Would you like more details on any of these?";
    } else if (lowerMessage.includes('negotiate') || lowerMessage.includes('bargain') || 
               lowerMessage.includes('price')) {
      response = "Here are some tips for negotiating textbook prices:\n\n" +
                 "1. Research the market price first\n" +
                 "2. Be polite and friendly\n" +
                 "3. Point out any wear and tear\n" +
                 "4. Offer to meet at a convenient location\n" +
                 "5. Be willing to compromise\n" +
                 "6. Bundle multiple books for better deals\n\n" +
                 "Good luck with your negotiation!";
    } else if (lowerMessage.includes('sell') || lowerMessage.includes('selling')) {
      response = "Here's how selling textbooks works:\n\n" +
                 "1. Take clear photos of your textbook\n" +
                 "2. List the condition honestly\n" +
                 "3. Set a fair price based on condition\n" +
                 "4. Respond to buyer inquiries promptly\n" +
                 "5. Arrange safe meetup locations\n\n" +
                 "Need help with anything specific?";
    } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      response = "Hello! I'm your AI Shopping Assistant. I can help you:\n\n" +
                 "• Find textbooks under specific prices\n" +
                 "• Negotiate better prices\n" +
                 "• Answer questions about buying/selling\n\n" +
                 "What would you like help with today?";
    } else if (lowerMessage.includes('help') || lowerMessage.includes('what can')) {
      response = "I'm here to assist you! I can help with:\n\n" +
                 "📚 Finding textbooks based on your budget\n" +
                 "💰 Negotiating prices effectively\n" +
                 "📖 Information about books and sellers\n" +
                 "🔍 Searching for specific subjects\n\n" +
                 "Just ask me anything about textbook shopping!";
    } else if (lowerMessage.includes('thank')) {
      response = "You're welcome! Feel free to ask if you need anything else. Happy book hunting! 📚";
    } else if (isBookRelated) {
      response = "I can help you with that! Could you be more specific? You can ask me about:\n\n" +
                 "📚 Finding textbooks in your budget\n" +
                 "💰 Tips for negotiating prices\n" +
                 "📖 How to buy or sell textbooks\n\n" +
                 "What would you like to know?";
    } else {
      response = "Sorry, this question is not related to textbook shopping. Please ask about finding textbooks, negotiation tips, or selling guidance. I'm here to help with your textbook marketplace needs!";
    }

    res.json({ response });
  } catch (error) {
    console.error('Error generating AI response:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

app.get('/api/ai/quick-actions', async (req, res) => {
  const quickActions = [
    { id: 1, text: "Find textbooks under RM50", type: "find_books" },
    { id: 2, text: "Help me negotiate a price", type: "negotiate" },
    { id: 3, text: "Show me popular textbooks", type: "popular" },
    { id: 4, text: "How does selling work?", type: "help_sell" }
  ];
  res.json(quickActions);
});

// ============================================
// NOTIFICATION ROUTES
// ============================================

app.get('/api/notifications/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { type, limit = 50 } = req.query;
    
    let query = `
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
      query += ` AND n.notification_type = ?`;
      params.push(type);
    }
    
    query += ` ORDER BY n.created_at DESC LIMIT ?`;
    params.push(parseInt(limit));
    
    const [notifications] = await pool.query(query, params);
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

app.get('/api/notifications/:userId/unread-count', async (req, res) => {
  try {
    const { userId} = req.params;
    const [result] = await pool.query(`
      SELECT COUNT(*) as count
      FROM notifications
      WHERE user_id = ? AND is_read = FALSE
    `, [userId]);
    res.json({ count: result[0].count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

app.put('/api/notifications/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;
    await pool.query(`
      UPDATE notifications
      SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
      WHERE notification_id = ?
    `, [notificationId]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

app.put('/api/notifications/read-all/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    await pool.query(`
      UPDATE notifications
      SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND is_read = FALSE
    `, [userId]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

app.get('/api/notifications/preferences/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    let [prefs] = await pool.query(`
      SELECT * FROM user_notification_preferences WHERE user_id = ?
    `, [userId]);

    if (prefs.length === 0) {
      await pool.query(`INSERT INTO user_notification_preferences (user_id) VALUES (?)`, [userId]);
      [prefs] = await pool.query(`SELECT * FROM user_notification_preferences WHERE user_id = ?`, [userId]);
    }
    res.json(prefs[0]);
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

app.put('/api/notifications/preferences/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const prefs = req.body;
    
    await pool.query(`
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
    `, [prefs.new_messages_enabled, prefs.system_updates_enabled, prefs.push_enabled, 
        prefs.email_enabled, prefs.report_updates_enabled, prefs.feedback_responses_enabled,
        prefs.price_alerts_enabled, prefs.quiet_hours_enabled, prefs.quiet_hours_start,
        prefs.quiet_hours_end, userId]);
    
    res.json({ success: true, message: 'Settings saved' });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// ============================================
// HELP CENTER ROUTES
// ============================================

app.get('/api/help/categories', async (req, res) => {
  try {
    const [categories] = await pool.query(`
      SELECT 
        c.*,
        COUNT(f.faq_id) as faq_count
      FROM faq_categories c
      LEFT JOIN faq f ON c.category_id = f.category_id AND f.is_active = TRUE
      WHERE c.is_active = TRUE
      GROUP BY c.category_id
      ORDER BY c.display_order
    `);
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

app.get('/api/help/faq', async (req, res) => {
  try {
    const { category_id, search, featured } = req.query;
    
    let query = `SELECT * FROM faq WHERE is_active = TRUE`;
    const params = [];
    
    if (category_id) {
      query += ` AND category_id = ?`;
      params.push(category_id);
    }
    
    if (featured === 'true') {
      query += ` AND is_featured = TRUE`;
    }
    
    if (search) {
      query += ` AND MATCH(question, answer) AGAINST(? IN NATURAL LANGUAGE MODE)`;
      params.push(search);
    }
    
    query += ` ORDER BY display_order, is_featured DESC`;
    
    const [faqs] = await pool.query(query, params);
    res.json(faqs);
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    res.status(500).json({ error: 'Failed to fetch FAQs' });
  }
});

app.get('/api/help/faq/:faqId', async (req, res) => {
  try {
    const { faqId } = req.params;
    
    // Increment view count
    await pool.query(`UPDATE faq SET view_count = view_count + 1 WHERE faq_id = ?`, [faqId]);
    
    const [faq] = await pool.query(`SELECT * FROM faq WHERE faq_id = ?`, [faqId]);
    
    if (faq.length === 0) {
      return res.status(404).json({ error: 'FAQ not found' });
    }
    
    res.json(faq[0]);
  } catch (error) {
    console.error('Error fetching FAQ:', error);
    res.status(500).json({ error: 'Failed to fetch FAQ' });
  }
});

app.post('/api/help/faq/:faqId/helpful', async (req, res) => {
  try {
    const { faqId } = req.params;
    const { userId, isHelpful } = req.body;
    
    // Check if user already voted
    const [existing] = await pool.query(`
      SELECT * FROM faq_helpful WHERE faq_id = ? AND user_id = ?
    `, [faqId, userId]);
    
    if (existing.length > 0) {
      // Update existing vote
      await pool.query(`
        UPDATE faq_helpful SET is_helpful = ? WHERE helpful_id = ?
      `, [isHelpful, existing[0].helpful_id]);
    } else {
      // Insert new vote
      await pool.query(`
        INSERT INTO faq_helpful (faq_id, user_id, is_helpful) VALUES (?, ?, ?)
      `, [faqId, userId, isHelpful]);
    }
    
    // Update counts
    const [counts] = await pool.query(`
      SELECT 
        SUM(CASE WHEN is_helpful = TRUE THEN 1 ELSE 0 END) as helpful,
        SUM(CASE WHEN is_helpful = FALSE THEN 1 ELSE 0 END) as not_helpful
      FROM faq_helpful WHERE faq_id = ?
    `, [faqId]);
    
    await pool.query(`
      UPDATE faq 
      SET helpful_count = ?, not_helpful_count = ?
      WHERE faq_id = ?
    `, [counts[0].helpful, counts[0].not_helpful, faqId]);
    
    res.json({ success: true, helpful: counts[0].helpful, not_helpful: counts[0].not_helpful });
  } catch (error) {
    console.error('Error recording helpful vote:', error);
    res.status(500).json({ error: 'Failed to record vote' });
  }
});

app.post('/api/help/tickets', upload.single('attachment'), async (req, res) => {
  try {
    const { user_id, subject, description, category, priority = 'normal' } = req.body;
    
    // 1. Generate ticket number
    const ticket_number = 'TKT-' + new Date().getFullYear() + '-' + 
                          String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    
    let attachment_url = null;
    if (req.file) {
      attachment_url = `/uploads/feedback/${req.file.filename}`;
    }
    
    // 2. Insert into help_tickets table
    const [result] = await pool.query(`
      INSERT INTO help_tickets (user_id, ticket_number, subject, description, category, priority, attachment_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [user_id, ticket_number, subject, description, category, priority, attachment_url]);

    // ============================================================
    // 👇 NEW CODE START: Auto-Create Chat Message
    // ============================================================
    
    // Define the Support Agent ID (Usually ID 1 is the Admin/AI)
    const SUPPORT_AGENT_ID = 1; 

    // A. Check if a conversation already exists between this User and Support
    const [existingChat] = await pool.query(
        `SELECT conversation_id FROM conversations 
         WHERE (participant_1_id = ? AND participant_2_id = ?) 
            OR (participant_1_id = ? AND participant_2_id = ?) 
         LIMIT 1`,
        [user_id, SUPPORT_AGENT_ID, SUPPORT_AGENT_ID, user_id]
    );

    let conversationId;

    if (existingChat.length > 0) {
        conversationId = existingChat[0].conversation_id;
    } else {
        // B. If no chat exists, create one now
        const [newChat] = await pool.query(
            `INSERT INTO conversations (participant_1_id, participant_2_id, created_at, updated_at, last_message_at) 
             VALUES (?, ?, NOW(), NOW(), NOW())`,
            [user_id, SUPPORT_AGENT_ID]
        );
        conversationId = newChat.insertId;
    }

    // C. Insert the automatic confirmation message
    const autoMessage = `System: Ticket ${ticket_number} created.\nSubject: ${subject}\n\nWe have received your request and will respond shortly.`;
    
    await pool.query(
        `INSERT INTO messages (conversation_id, sender_id, message_text, message_type, created_at) 
         VALUES (?, ?, ?, 'text', NOW())`,
        [conversationId, SUPPORT_AGENT_ID, autoMessage]
    );

    // D. Update conversation timestamp so it moves to the top of the list
    await pool.query(
        `UPDATE conversations SET last_message_at = NOW() WHERE conversation_id = ?`,
        [conversationId]
    );

    // ============================================================
    // 👆 NEW CODE END
    // ============================================================
    
    // 3. Create Notification
    await pool.query(`
      INSERT INTO notifications (user_id, notification_type, title, message_preview, priority)
      VALUES (?, 'help_ticket', 'Support Ticket Created', ?, 'normal')
    `, [user_id, `Your ticket ${ticket_number} has been created. We'll respond within 24 hours.`]);
    
    res.json({ 
      success: true, 
      ticket_id: result.insertId, 
      ticket_number,
      message: 'Support ticket created successfully' 
    });

  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

app.get('/api/help/tickets/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;
    
    let query = `SELECT * FROM help_tickets WHERE user_id = ?`;
    const params = [userId];
    
    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }
    
    query += ` ORDER BY created_at DESC`;
    
    const [tickets] = await pool.query(query, params);
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// ============================================
// FEEDBACK ROUTES
// ============================================

app.post('/api/feedback', upload.single('screenshot'), async (req, res) => {
  try {
    const { user_id, feedback_type, title, description, rating, category, platform, app_version, device_info } = req.body;
    
    let screenshot_url = null;
    if (req.file) {
      screenshot_url = `/uploads/feedback/${req.file.filename}`;
    }
    
    const [result] = await pool.query(`
      INSERT INTO feedback (user_id, feedback_type, title, description, rating, category, platform, app_version, device_info, screenshot_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [user_id, feedback_type, title, description, rating, category, platform, app_version, device_info, screenshot_url]);
    
    res.json({ 
      success: true, 
      feedback_id: result.insertId,
      message: 'Feedback submitted successfully' 
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

app.get('/api/feedback/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { type, status } = req.query;
    
    let query = `SELECT * FROM feedback WHERE user_id = ?`;
    const params = [userId];
    
    if (type) {
      query += ` AND feedback_type = ?`;
      params.push(type);
    }
    
    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }
    
    query += ` ORDER BY created_at DESC`;
    
    const [feedback] = await pool.query(query, params);
    res.json(feedback);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

app.get('/api/feedback/detail/:feedbackId', async (req, res) => {
  try {
    const { feedbackId } = req.params;
    
    const [feedback] = await pool.query(`
      SELECT f.*, u.username, u.full_name
      FROM feedback f
      JOIN users u ON f.user_id = u.user_id
      WHERE f.feedback_id = ?
    `, [feedbackId]);
    
    if (feedback.length === 0) {
      return res.status(404).json({ error: 'Feedback not found' });
    }
    
    const [responses] = await pool.query(`
      SELECT r.*, u.username as responder_name, u.full_name as responder_full_name
      FROM feedback_responses r
      JOIN users u ON r.responder_id = u.user_id
      WHERE r.feedback_id = ?
      ORDER BY r.created_at ASC
    `, [feedbackId]);
    
    res.json({ ...feedback[0], responses });
  } catch (error) {
    console.error('Error fetching feedback detail:', error);
    res.status(500).json({ error: 'Failed to fetch feedback detail' });
  }
});

// ============================================
// REPORT & BLOCK ROUTES
// ============================================

app.post('/api/reports', async (req, res) => {
  try {
    const { reporter_id, reported_id, conversation_id, message_id, reason, additional_details } = req.body;
    
    const [result] = await pool.query(`
      INSERT INTO user_reports (reporter_id, reported_id, conversation_id, message_id, reason, additional_details)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [reporter_id, reported_id, conversation_id, message_id, reason, additional_details || '']);
    
    res.json({ 
      success: true, 
      message: 'Report submitted successfully',
      report_id: result.insertId 
    });
  } catch (error) {
    console.error('Error submitting report:', error);
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

app.post('/api/blocks', async (req, res) => {
  try {
    const { blocker_id, blocked_id, reason } = req.body;
    
    const [result] = await pool.query(`
      INSERT INTO blocked_users (blocker_id, blocked_id, reason)
      VALUES (?, ?, ?)
    `, [blocker_id, blocked_id, reason]);
    
    res.json({ 
      success: true, 
      message: 'User blocked successfully',
      block_id: result.insertId 
    });
  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).json({ error: 'Failed to block user' });
  }
});

app.get('/api/blocks/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const [blocks] = await pool.query(`
      SELECT b.*, u.username as blocked_username, u.full_name as blocked_full_name
      FROM blocked_users b
      JOIN users u ON b.blocked_id = u.user_id
      WHERE b.blocker_id = ? AND b.block_status = 'active'
      ORDER BY b.created_at DESC
    `, [userId]);
    
    res.json(blocks);
  } catch (error) {
    console.error('Error fetching blocks:', error);
    res.status(500).json({ error: 'Failed to fetch blocks' });
  }
});

app.delete('/api/blocks/:blockId', async (req, res) => {
  try {
    const { blockId } = req.params;
    
    await pool.query(`
      UPDATE blocked_users 
      SET block_status = 'removed', removed_at = CURRENT_TIMESTAMP
      WHERE block_id = ?
    `, [blockId]);
    
    res.json({ success: true, message: 'User unblocked successfully' });
  } catch (error) {
    console.error('Error unblocking user:', error);
    res.status(500).json({ error: 'Failed to unblock user' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  res.status(500).json({ error: error.message || 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`╔════════════════════════════════════════════════════════╗`);
  console.log(`║  UTM ThriftIn - Communication & Support System         ║`);
  console.log(`╠════════════════════════════════════════════════════════╣`);
  console.log(`║  Server running on port ${PORT}                           ║`);
  console.log(`║  ✓ Chat & Messaging Module                             ║`);
  console.log(`║  ✓ Notification & Alerts Module                        ║`);
  console.log(`║  ✓ Help Center & Support Module                        ║`);
  console.log(`║  ✓ Feedback System Module                              ║`);
  console.log(`╚════════════════════════════════════════════════════════╝`);
});