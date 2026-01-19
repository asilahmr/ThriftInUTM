const { query } = require('../config/db');

exports.getConversations = async (req, res) => {
  try {
    const { userId } = req.params;
    const { search, status = 'active' } = req.query;

    console.log('🔍 Backend: Fetching conversations for userId:', userId);

    let sql = `
      SELECT 
        c.conversation_id,
        c.is_ai_conversation,
        c.updated_at,
        c.created_at,
        CASE 
          WHEN c.participant_1_id = ? THEN c.participant_2_id
          ELSE c.participant_1_id
        END as other_user_id,
        CASE 
          WHEN c.participant_1_id = ? THEN COALESCE(s2.name, 'Unknown User')
          ELSE COALESCE(s1.name, 'Unknown User')
        END as other_username,
        CASE 
          WHEN c.participant_1_id = ? THEN s2.profile_image
          ELSE s1.profile_image
        END as other_profile_picture,
        (SELECT message_text FROM messages 
         WHERE conversation_id = c.conversation_id 
         ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM messages 
         WHERE conversation_id = c.conversation_id 
         ORDER BY created_at DESC LIMIT 1) as last_message_time,
        (SELECT COUNT(*) FROM messages 
         WHERE conversation_id = c.conversation_id 
         AND sender_id != ? AND is_read = 0) as unread_count
      FROM conversations c
      LEFT JOIN students s1 ON c.participant_1_id = s1.user_id
      LEFT JOIN students s2 ON c.participant_2_id = s2.user_id
      WHERE (c.participant_1_id = ? OR c.participant_2_id = ?)
    `;

    const params = [userId, userId, userId, userId, userId, userId];

    if (search) {
      sql += ` AND (s1.name LIKE ? OR s2.name LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam);
    }

    sql += ` ORDER BY 
      CASE WHEN c.is_ai_conversation = 1 THEN 0 ELSE 1 END,
      COALESCE(
        (SELECT created_at FROM messages WHERE conversation_id = c.conversation_id ORDER BY created_at DESC LIMIT 1),
        c.updated_at
      ) DESC`;

    console.log('📋 SQL Query:', sql);
    console.log('📋 SQL Params:', params);

    const conversations = await query(sql, params);
    
    console.log('✅ Backend: Found conversations:', conversations.length);
    console.log('📋 Backend: Conversation data:', JSON.stringify(conversations, null, 2));

    res.json(conversations);
  } catch (error) {
    console.error('❌ Backend: Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations', details: error.message });
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
      INSERT INTO conversations (participant_1_id, participant_2_id, is_ai_conversation)
      VALUES (?, ?, ?)
    `, [participant_1_id, participant_2_id, is_ai_conversation || false]);

    res.json({
      conversation_id: result.insertId,
      message: 'Conversation created successfully'
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation', details: error.message });
  }
};

exports.archiveConversation = async (req, res) => {
  try {
    // const { conversationId } = req.params;
    // Database missing conversation_status column, skipping actual update for now
    res.json({ success: true, message: 'Conversation archived (mock)' });
  } catch (error) {
    console.error('Error archiving conversation:', error);
    res.status(500).json({ error: 'Failed to archive conversation' });
  }
};

exports.deleteConversation = async (req, res) => {
  try {
    // const { conversationId } = req.params;
    // Database missing conversation_status column, skipping actual update for now
    res.json({ success: true, message: 'Conversation deleted (mock)' });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
};