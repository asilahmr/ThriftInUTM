const { query } = require('../config/db');
const notificationHelper = require('../utils/notificationHelper');
require('dotenv').config();

const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId, limit = 50, offset = 0, all } = req.query;

    let sql = `
      SELECT 
        m.*,
        COALESCE(s.name, u.email, 'User') as sender_name,
        COALESCE(s.name, u.email, 'User') as sender_full_name,
        s.profile_image as sender_picture
      FROM messages m
      LEFT JOIN user u ON m.sender_id = u.id
      LEFT JOIN students s ON m.sender_id = s.user_id
      WHERE m.conversation_id = ?
      ORDER BY m.created_at ASC
    `;

    const params = [conversationId];

    if (!all) {
      sql += ` LIMIT ? OFFSET ?`;
      params.push(parseInt(limit), parseInt(offset));
    }

    const messages = await query(sql, params);

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

    await query(`
      UPDATE conversations 
      SET updated_at = CURRENT_TIMESTAMP
      WHERE conversation_id = ?
    `, [conversation_id]);

    // 2️⃣ Check if AI conversation
    const convo = await query(
      `SELECT is_ai_conversation, participant_1_id, participant_2_id 
       FROM conversations WHERE conversation_id = ?`,
      [conversation_id]
    );

    let aiMessage = null;

    if (convo[0]?.is_ai_conversation) {
      console.log('🤖 Generating AI response with Gemini...');

      // Get user's product count
      const sellerInfo = await query(`
        SELECT COUNT(*) AS product_count
        FROM products
        WHERE seller_id = ? AND status = 'active'
      `, [sender_id]);

      const productCount = sellerInfo[0]?.product_count || 0;

      // ✅ Get available products BEFORE try-catch
      // ✅ Get available products BEFORE try-catch
      const availableProducts = await query(`
        SELECT name, price, category, \`condition\`
        FROM products
        WHERE status = 'active'
        ORDER BY view_count DESC
        LIMIT 30
      `);

      
      let aiText = ''; 

      try {
        console.log('🔧 Attempting Gemini API call...');
        console.log('📦 Available products count:', availableProducts.length);
        
        const model = genAI.getGenerativeModel({ 
          model: 'gemini-flash-latest', 
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          }
        });

        const productList = availableProducts.length > 0
          ? availableProducts.map(p => 
              `• ${p.name} - RM${p.price} (${p.condition}, ${p.category})`
            ).join('\n')
          : 'No products currently available.';

        console.log('📝 Product list for AI:', productList.substring(0, 200) + '...');

        const systemPrompt = `STRICT INSTRUCTIONS:
          1. You are a database search engine for "ThriftIn UTM".
          2. DO NOT mention store hours, locations, "Comet gear", "UTD", or donation policies.
          3. USE ONLY the "CURRENT INVENTORY" list below to answer.
          4. If the user asks for items under a certain price (e.g., RM50), filter the list and show them.
          5. If no items match, say: "I couldn't find any items matching your request in our current database."
          6. Format your answer as a clean list.

          CURRENT INVENTORY FROM DATABASE:
          ${productList}

          USER CONTEXT:
          - User Status: ${productCount > 0 ? 'Seller' : 'Buyer'}

          STUDENT'S QUESTION:
          ${message_text}

          RESPONSE (Keep it under 100 words and focus ONLY on items):`;

        const result = await model.generateContent(systemPrompt);
        
        console.log('🔍 Checking response structure...');
        
     
        try {
          aiText = result.response.text();
          console.log('✅ Method 1 (response.text()) success, length:', aiText.length);
        } catch (e) {
          console.log('⚠️ Method 1 failed:', e.message);
        }
        
        if (!aiText || aiText.trim() === '') {
          console.log('⚠️ Trying method 2 (candidates)...');
          if (result.response.candidates && result.response.candidates[0]) {
            const candidate = result.response.candidates[0];
            if (candidate.content && candidate.content.parts) {
              aiText = candidate.content.parts.map(part => part.text || '').join('');
              console.log('✅ Method 2 success, length:', aiText.length);
            }
          }
        }
        
        if (!aiText || aiText.trim() === '') {
          console.error('❌ Both methods failed');
          throw new Error('Empty response from Gemini API');
        }

        console.log('✅ Gemini response generated successfully');

      } catch (geminiError) {
        console.error('❌ Gemini API Error Details:', {
          message: geminiError.message,
        });
        console.warn('⚠️ Using fallback response');
        
        aiText = getFallbackResponse(message_text, availableProducts);
        console.log('📄 Fallback response preview:', aiText.substring(0, 100) + '...');
      }

      if (!aiText) {
        aiText = "Sorry, I'm having trouble processing that request right now.";
      }


      // 3️⃣ Determine AI sender ID
      const aiSenderId = convo[0].participant_1_id === sender_id 
        ? convo[0].participant_2_id 
        : convo[0].participant_1_id;

      // 4️⃣ Save AI message
      console.log('💾 About to save AI message:');
      console.log('   Conversation ID:', conversation_id);
      console.log('   AI Sender ID:', aiSenderId);
      console.log('   Message text length:', aiText?.length);
      console.log('   Message text:', aiText);
      const aiResult = await query(`
        INSERT INTO messages (conversation_id, sender_id, message_text, message_type)
        VALUES (?, ?, ?, 'text')
      `, [conversation_id, aiSenderId, aiText]);

      aiMessage = (await query(
        `SELECT * FROM messages WHERE message_id = ?`,
        [aiResult.insertId]
      ))[0];
      console.log('💾 AI message saved with ID:', aiResult.insertId);
    }
      

    // 5️⃣ Return messages
    const userMessage = (await query(
      `SELECT * FROM messages WHERE message_id = ?`,
      [userMessageResult.insertId]
    ))[0];

    res.json({ userMessage, aiMessage });

  } catch (error) {
    console.error('❌ SEND MESSAGE ERROR', error);
    res.status(500).json({
      error: 'Failed to send message',
      details: error.message
    });
  }
};

// 📌 UPDATED Fallback response function
function getFallbackResponse(message, products) {
  const lowerMessage = message.toLowerCase();
  
  // Greeting
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return "Hello! 👋 I'm your AI Shopping Assistant for ThriftIn UTM. I can help you:\n\n" +
           "• Find items within your budget\n" +
           "• Search by category (Books, Electronics, Fashion, Furniture, Others)\n" +
           "• Get pricing advice\n" +
           "• Learn about buying/selling\n\n" +
           "What would you like help with?";
  }
  
  // ✅ UPDATED: Finding items (not just books)
  if (lowerMessage.includes('find') || lowerMessage.includes('search') || lowerMessage.includes('looking')) {
    const priceMatch = message.match(/rm\s*(\d+)/i) || message.match(/(\d+)\s*ringgit/i);
    const maxPrice = priceMatch ? parseInt(priceMatch[1]) : 50;
    
    // ✅ Check for category filter
    let categoryFilter = null;
    if (lowerMessage.includes('book') || lowerMessage.includes('textbook')) {
      categoryFilter = 'Books';
    } else if (lowerMessage.includes('electronic') || lowerMessage.includes('calculator') || lowerMessage.includes('gadget')) {
      categoryFilter = 'Electronics';
    } else if (lowerMessage.includes('fashion') || lowerMessage.includes('cloth') || lowerMessage.includes('shirt')) {
      categoryFilter = 'Fashion';
    } else if (lowerMessage.includes('furniture') || lowerMessage.includes('desk') || lowerMessage.includes('chair')) {
      categoryFilter = 'Furniture';
    }
    
    let filteredProducts = products.filter(p => parseFloat(p.price) <= maxPrice);
    
    if (categoryFilter) {
      filteredProducts = filteredProducts.filter(p => p.category === categoryFilter);
    }
    
    if (filteredProducts.length > 0) {
      const categoryText = categoryFilter ? ` ${categoryFilter.toLowerCase()}` : '';
      let response = `I found ${filteredProducts.length}${categoryText} item${filteredProducts.length > 1 ? 's' : ''} under RM${maxPrice}:\n\n`;
      
      // ✅ FIX: Show all products"
      // const showCount = Math.min(filteredProducts.length, 5);
      filteredProducts.forEach((p, i) => {
        response += `${i + 1}. ${p.name}\n` +
              `   💰 RM${parseFloat(p.price).toFixed(2)} | ${p.condition} | ${p.category}\n\n`;
      });
      
      // if (filteredProducts.length > showCount) {
      //   response += `...and ${filteredProducts.length - showCount} more item${filteredProducts.length - showCount > 1 ? 's' : ''}!\n\n`;
      // }
      
      return response + "Would you like more details?";
    } else {
      const categoryText = categoryFilter ? ` ${categoryFilter.toLowerCase()}` : '';
      return `I couldn't find${categoryText} items under RM${maxPrice}. Try:\n• Increasing your budget\n• Checking other categories\n• Browsing all available products!`;
    }
  }
  
  // Popular products
  if (lowerMessage.includes('popular') || lowerMessage.includes('trending')) {
    if (products.length > 0) {
      let response = "Here are our most popular items:\n\n";
      products.slice(0, 3).forEach((p, i) => {
        response += `${i + 1}. ${p.name}\n   💰 RM${parseFloat(p.price).toFixed(2)} | ${p.condition} | ${p.category}\n\n`;
      });
      return response;
    }
  }
  
  // ✅ NEW: Category browsing
  if (lowerMessage.includes('categories') || lowerMessage.includes('what can i buy')) {
    const categoryCounts = {};
    products.forEach(p => {
      categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
    });
    
    let response = "Browse our categories:\n\n";
    Object.keys(categoryCounts).forEach(cat => {
      response += `📦 ${cat}: ${categoryCounts[cat]} items\n`;
    });
    response += "\nTell me which category interests you!";
    return response;
  }
  
  // Negotiation
  if (lowerMessage.includes('negotiate') || lowerMessage.includes('bargain')) {
    return "Here are tips for negotiating:\n\n" +
           "1. Research market prices first\n" +
           "2. Be polite and respectful\n" +
           "3. Point out any defects\n" +
           "4. Offer to meet conveniently\n" +
           "5. Be ready to compromise\n\n" +
           "Good luck!";
  }
  
  // Selling
  if (lowerMessage.includes('sell') || lowerMessage.includes('selling')) {
    return "To sell on ThriftIn UTM:\n\n" +
           "1. Take clear photos\n" +
           "2. Describe condition honestly\n" +
           "3. Set fair pricing\n" +
           "4. Choose the right category\n" +
           "5. Respond to inquiries quickly\n" +
           "6. Arrange safe meetups on campus\n\n" +
           "Need specific help?";
  }
  
  // Default
  return "I can help you with:\n\n" +
         "📦 Finding items in any category\n" +
         "💰 Pricing advice\n" +
         "🤝 Negotiation tips\n" +
         "📖 Buying/selling guidance\n\n" +
         "Categories: Books, Electronics, Fashion, Furniture, Others\n\n" +
         "What would you like to know?";
}

exports.markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    await query(`UPDATE messages SET is_read = TRUE WHERE message_id = ?`, [messageId]);
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
      SET message_text = 'This message was deleted'
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
      LEFT JOIN user u ON m.sender_id = u.id
      LEFT JOIN students s ON m.sender_id = s.user_id
      LEFT JOIN user u1 ON c.participant_1_id = u1.id
      LEFT JOIN user u2 ON c.participant_2_id = u2.id
      LEFT JOIN students s1 ON c.participant_1_id = s1.user_id
      LEFT JOIN students s2 ON c.participant_2_id = s2.user_id
      WHERE (c.participant_1_id = ? OR c.participant_2_id = ?)
      AND m.message_text LIKE ?
      ORDER BY m.created_at DESC
      LIMIT 50
    `, [userId, userId, userId, `%${searchQuery}%`]);

    res.json(results);
  } catch (error) {
    console.error('Error searching messages:', error);
    res.status(500).json({ error: 'Failed to search messages' });
  }
};