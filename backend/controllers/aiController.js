const { query } = require('../config/db');
const aiResponses = require('../utils/aiResponses');

exports.generateResponse = async (req, res) => {
  try {
    const { message, userId } = req.body;
    const response = aiResponses.getResponse(message);
    res.json({ response });
  } catch (error) {
    console.error('Error generating AI response:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
};

exports.getQuickActions = async (req, res) => {
  try {
    const quickActions = [
      { id: 1, text: "Find textbooks under RM50", type: "find_books", icon: "📚" },
      { id: 2, text: "Help me negotiate a price", type: "negotiate", icon: "💰" },
      { id: 3, text: "Show me popular textbooks", type: "popular", icon: "⭐" },
      { id: 4, text: "How does selling work?", type: "help_sell", icon: "❓" }
    ];
    res.json(quickActions);
  } catch (error) {
    console.error('Error fetching quick actions:', error);
    res.status(500).json({ error: 'Failed to fetch quick actions' });
  }
};

exports.analyzeMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const analysis = aiResponses.analyzeIntent(message);
    res.json(analysis);
  } catch (error) {
    console.error('Error analyzing message:', error);
    res.status(500).json({ error: 'Failed to analyze message' });
  }
};

exports.getSuggestions = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get user's recent conversations to provide contextual suggestions
    const conversations = await query(`
      SELECT c.*, 
             (SELECT message_text FROM messages 
              WHERE conversation_id = c.conversation_id 
              ORDER BY created_at DESC LIMIT 1) as last_message
      FROM conversations c
      WHERE (c.participant_1_id = ? OR c.participant_2_id = ?)
      AND c.is_ai_conversation = FALSE
      ORDER BY c.updated_at DESC
      LIMIT 5
    `, [userId, userId]);
    
    const suggestions = aiResponses.generateSuggestions(conversations);
    res.json(suggestions);
  } catch (error) {
    console.error('Error getting suggestions:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
};