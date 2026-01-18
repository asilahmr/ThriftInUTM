const { query } = require('../config/db');
const notificationHelper = require('../utils/notificationHelper');
require('dotenv').config();
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId, limit = 50, offset = 0 } = req.query;

    const messages = await query(`
      SELECT 
        m.*,
        COALESCE(s.name, u.email, 'User') as sender_name,
        COALESCE(s.name, u.email, 'User') as sender_full_name,
        s.profile_image as sender_picture
      FROM messages m
      JOIN user u ON m.sender_id = u.id
      LEFT JOIN students s ON m.sender_id = s.user_id
      WHERE m.conversation_id = ? 
      ORDER BY m.created_at ASC
      LIMIT ? OFFSET ?
    `, [conversationId, parseInt(limit), parseInt(offset)]);

    // Mark messages as read
    if (userId) {
      await query(`
        UPDATE messages 
        SET is_read = TRUE
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

    // 1️⃣ Save user message
    const userMessageResult = await query(`
      INSERT INTO messages (conversation_id, sender_id, message_text, message_type)
      VALUES (?, ?, ?, ?)
    `, [conversation_id, sender_id, message_text, message_type]);

    // Update conversation timestamp
    await query(`
      UPDATE conversations 
      SET updated_at = CURRENT_TIMESTAMP, last_message_at = CURRENT_TIMESTAMP
      WHERE conversation_id = ?
    `, [conversation_id]);

    // 2️⃣ Check if this is AI conversation
    const convo = await query(
      `SELECT is_ai_conversation FROM conversations WHERE conversation_id = ?`,
      [conversation_id]
    );

    let aiMessage = null;

    if (convo[0]?.is_ai_conversation) {
      // 3️⃣ Call OpenAI
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are an AI assistant for a university textbook marketplace. Be helpful, concise, and friendly.',
          },
          { role: 'user', content: message_text },
        ],
      });

      const aiText = completion.choices[0].message.content;

      // 4️⃣ Save AI reply as message
      const aiResult = await query(`
        INSERT INTO messages (conversation_id, sender_id, message_text, message_type)
        VALUES (?, ?, ?, ?)
      `, [
        conversation_id,
        0, // system / AI sender
        aiText,
        'ai',
      ]);

      aiMessage = await query(`
        SELECT * FROM messages WHERE message_id = ?
      `, [aiResult.insertId]);
    }

    // 5️⃣ Return user message + AI message (if any)
    const userMessage = await query(
      `SELECT * FROM messages WHERE message_id = ?`,
      [userMessageResult.insertId]
    );

    res.json({
      userMessage: userMessage[0],
      aiMessage: aiMessage ? aiMessage[0] : null,
    });
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
      SET is_read = TRUE
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
        COALESCE(s.name, u.email, 'User') as sender_name,
        CASE 
          WHEN c.participant_1_id = ? THEN COALESCE(s2.name, u2.email, 'User')
          ELSE COALESCE(s1.name, u1.email, 'User')
        END as other_username
      FROM messages m
      JOIN conversations c ON m.conversation_id = c.conversation_id
      JOIN user u ON m.sender_id = u.id
      LEFT JOIN students s ON m.sender_id = s.user_id
      LEFT JOIN user u1 ON c.participant_1_id = u1.id
      LEFT JOIN user u2 ON c.participant_2_id = u2.id
      LEFT JOIN students s1 ON c.participant_1_id = s1.user_id
      LEFT JOIN students s2 ON c.participant_2_id = s2.user_id
      WHERE (c.participant_1_id = ? OR c.participant_2_id = ?)
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