const { query } = require('../config/db');
const notificationHelper = require('../utils/notificationHelper');

exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId, limit = 50, offset = 0 } = req.query;
    
    const messages = await query(`
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
      await query(`
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
};

exports.sendMessage = async (req, res) => {
  try {
    const { conversation_id, sender_id, message_text, message_type = 'text' } = req.body;
    
    let attachment_url = null;
    let attachment_name = null;
    let attachment_size = null;
    
    if (req.file) {
      attachment_url = `/uploads/attachments/${req.file.filename}`;
      attachment_name = req.file.originalname;
      attachment_size = req.file.size;
    }
    
    const result = await query(`
      INSERT INTO messages (conversation_id, sender_id, message_text, message_type, attachment_url, attachment_name, attachment_size)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [conversation_id, sender_id, message_text, message_type, attachment_url, attachment_name, attachment_size]);

    // Update conversation timestamp
    await query(`
      UPDATE conversations 
      SET updated_at = CURRENT_TIMESTAMP, last_message_at = CURRENT_TIMESTAMP
      WHERE conversation_id = ?
    `, [conversation_id]);

    // Create notification
    await notificationHelper.createMessageNotification(
      conversation_id, 
      sender_id, 
      result.insertId, 
      message_text || attachment_name
    );

    const newMessage = await query(`
      SELECT m.*, u.username as sender_name, u.profile_picture as sender_picture
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.user_id
      WHERE m.message_id = ?
    `, [result.insertId]);

    res.json(newMessage[0]);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    
    await query(`
      UPDATE messages 
      SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
      WHERE message_id = ?
    `, [messageId]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId } = req.query;
    
    const message = await query('SELECT sender_id FROM messages WHERE message_id = ?', [messageId]);
    
    if (message.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    if (message[0].sender_id !== parseInt(userId)) {
      return res.status(403).json({ error: 'Not authorized to delete this message' });
    }
    
    await query(`
      UPDATE messages 
      SET is_deleted = TRUE, deleted_at = CURRENT_TIMESTAMP, message_text = 'This message was deleted'
      WHERE message_id = ?
    `, [messageId]);
    
    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
};

exports.searchMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const { query: searchQuery } = req.query;
    
    if (!searchQuery || searchQuery.trim().length < 2) {
      return res.json([]);
    }
    
    const results = await query(`
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
    `, [userId, userId, userId, searchQuery]);
    
    res.json(results);
  } catch (error) {
    console.error('Error searching messages:', error);
    res.status(500).json({ error: 'Failed to search messages' });
  }
};