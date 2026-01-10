const { query } = require('../config/db');

exports.getConversations = async (req, res) => {
  try {
    const { userId } = req.params;
    const { search, status = 'active' } = req.query;
    
    let sql = `
      SELECT 
        c.conversation_id,
        c.is_ai_conversation,
        c.conversation_status,
        c.updated_at,
        c.last_message_at,
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
      sql += ` AND (u1.username LIKE ? OR u2.username LIKE ? OR u1.full_name LIKE ? OR u2.full_name LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }
    
    sql += ` ORDER BY c.is_ai_conversation DESC, c.updated_at DESC`;
    
    const conversations = await query(sql, params);
    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
};

exports.createConversation = async (req, res) => {
  try {
    const { participant_1_id, participant_2_id, is_ai_conversation, book_id } = req.body;
    
    // Check if conversation already exists
    const existing = await query(`
      SELECT conversation_id FROM conversations
      WHERE (participant_1_id = ? AND participant_2_id = ?)
         OR (participant_1_id = ? AND participant_2_id = ?)
    `, [participant_1_id, participant_2_id, participant_2_id, participant_1_id]);

    if (existing.length > 0) {
      return res.json(existing[0]);
    }

    const result = await query(`
      INSERT INTO conversations (participant_1_id, participant_2_id, is_ai_conversation, book_id)
      VALUES (?, ?, ?, ?)
    `, [participant_1_id, participant_2_id, is_ai_conversation || false, book_id || null]);

    res.json({ 
      conversation_id: result.insertId,
      message: 'Conversation created successfully' 
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
};

exports.archiveConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    await query(`
      UPDATE conversations 
      SET conversation_status = 'archived'
      WHERE conversation_id = ?
    `, [conversationId]);
    
    res.json({ success: true, message: 'Conversation archived' });
  } catch (error) {
    console.error('Error archiving conversation:', error);
    res.status(500).json({ error: 'Failed to archive conversation' });
  }
};

exports.deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    await query(`
      UPDATE conversations 
      SET conversation_status = 'deleted'
      WHERE conversation_id = ?
    `, [conversationId]);
    
    res.json({ success: true, message: 'Conversation deleted' });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
};