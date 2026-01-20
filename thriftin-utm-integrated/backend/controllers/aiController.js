const { query } = require('../config/db');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.generateResponse = async (req, res) => {
  try {
    const { message, userId } = req.body;

    const userInfo = await query(`SELECT s.*, u.email FROM students s JOIN user u ON s.user_id = u.id WHERE u.id = ?`, [userId]);

    const availableProducts = await query(`
      SELECT name, price, category, \`condition\`
      FROM products
      WHERE status = 'active'
      ORDER BY created_at DESC
      LIMIT 15
    `);

    const productList = availableProducts.length > 0
      ? availableProducts.map(p => `• ${p.name} - RM${p.price} (${p.category})`).join('\n')
      : 'No items currently available.';

    const productInfo = await query(`SELECT COUNT(*) as product_count FROM products WHERE seller_id = ? AND status = 'active'`, [userId]);
    const productCount = productInfo[0]?.product_count || 0;

    const systemPrompt = `You are an AI Shopping Assistant for ThriftIn UTM.
    
CRITICAL RULE: 
- DO NOT talk about donation policies, store hours, or general thrift tips.
- ONLY suggest items from the "REAL-TIME INVENTORY" list below.
- If an item is not in the list, say "I couldn't find that in our database."

REAL-TIME INVENTORY FROM DATABASE:
${productList}

USER CONTEXT:
- Role: ${productCount > 0 ? 'Seller' : 'Buyer'}
- Faculty: ${userInfo[0]?.faculty_code || 'Unknown'}

Student's question: ${message}

Provide a concise, factual response based ONLY on the inventory list:`;

    try {
      // ✅ FIXED: Use correct model name
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-flash-latest',  
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 400,
        }
      });

      const result = await model.generateContent(systemPrompt);
      const response = await result.response;
      const aiResponse = response.text();

      res.json({ response: aiResponse });

    } catch (geminiError) {
      if (geminiError.message.includes('429')) {
        console.warn('⚠️ Gemini API Rate limit hit.');
      } else if (geminiError.message.includes('503')) {
        console.warn('⚠️ Gemini Service overloaded.');
      } else {
        console.error('❌ Gemini Error:', geminiError.message);
      }

      // ✅ UPDATED: Fallback response mentions all categories
      const errorMessage = 
        "I'm having trouble processing your request. Please try asking about:\n\n" +
        "• Finding items (Books, Electronics, Fashion, Furniture, Others)\n" +
        "• Pricing advice\n" +
        "• How to buy or sell\n\n" +
        "Or check back in a moment!";
      
      res.json({ response: errorMessage });
    }

  } catch (error) {
    console.error('Error generating AI response:', error);
    
    const fallbackResponse = 
      "I'm currently unavailable. Please try again or browse our marketplace directly!";
    
    res.json({ response: fallbackResponse });
  }
};

exports.getQuickActions = async (req, res) => {
  try {
    // ✅ UPDATED: Quick actions now include different categories
    const quickActions = [
      { id: 1, text: "Find items under RM50", type: "find_books", icon: "🔍" },
      { id: 2, text: "Help me negotiate a price", type: "negotiate", icon: "💰" },
      { id: 3, text: "Show me popular items", type: "popular", icon: "⭐" },
      { id: 4, text: "Browse categories", type: "categories", icon: "📦" }
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
    const lowerMessage = message.toLowerCase();
    
    const intents = {
      find_items: lowerMessage.includes('find') || lowerMessage.includes('search'),
      negotiate: lowerMessage.includes('negotiate') || lowerMessage.includes('price'),
      sell: lowerMessage.includes('sell'),
      help: lowerMessage.includes('help'),
      greeting: lowerMessage.includes('hello') || lowerMessage.includes('hi'),
      categories: lowerMessage.includes('categories') || lowerMessage.includes('browse')
    };
    
    const detected = Object.keys(intents).filter(key => intents[key]);
    
    // ✅ Check if product-related (broader than just books)
    const isProductRelated = 
      lowerMessage.includes('book') || 
      lowerMessage.includes('textbook') ||
      lowerMessage.includes('calculator') ||
      lowerMessage.includes('electronic') ||
      lowerMessage.includes('fashion') ||
      lowerMessage.includes('furniture') ||
      lowerMessage.includes('item') ||
      lowerMessage.includes('product');
    
    res.json({
      primary_intent: detected[0] || 'unknown',
      confidence: detected.length > 0 ? 0.8 : 0.3,
      is_product_related: isProductRelated
    });
  } catch (error) {
    console.error('Error analyzing message:', error);
    res.status(500).json({ error: 'Failed to analyze message' });
  }
};

exports.getSuggestions = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const conversations = await query(`
      SELECT c.*, 
             (SELECT message_text FROM messages 
              WHERE conversation_id = c.conversation_id 
              ORDER BY created_at DESC LIMIT 1) as last_message
      FROM conversations c
      WHERE (c.participant_1_id = ? OR c.participant_2_id = ?)
      AND c.is_ai_conversation = 0
      ORDER BY c.updated_at DESC
      LIMIT 5
    `, [userId, userId]);
    
    const suggestions = [
      "Tell me about the item's condition",
      "Can we meet on campus?",
      "Is the price negotiable?",
      "When are you available to meet?"
    ];
    
    res.json(suggestions);
  } catch (error) {
    console.error('Error getting suggestions:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
};