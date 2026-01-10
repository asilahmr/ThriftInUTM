const aiResponses = {
  // Main response generator
  getResponse: (message) => {
    const lowerMessage = message.toLowerCase();
    
    // Check if book-related
    const isBookRelated = lowerMessage.includes('book') || 
                          lowerMessage.includes('textbook') || 
                          lowerMessage.includes('study') || 
                          lowerMessage.includes('buy') || 
                          lowerMessage.includes('sell');
    
    // Finding books
    if ((lowerMessage.includes('find') || lowerMessage.includes('search') || 
         lowerMessage.includes('need') || lowerMessage.includes('looking')) && isBookRelated) {
      return aiResponses.findBooksResponse(message);
    }
    
    // Negotiation
    if (lowerMessage.includes('negotiate') || lowerMessage.includes('bargain') || 
        lowerMessage.includes('price') && lowerMessage.includes('lower')) {
      return aiResponses.negotiationResponse();
    }
    
    // Selling
    if (lowerMessage.includes('sell') || lowerMessage.includes('selling')) {
      return aiResponses.sellingResponse();
    }
    
    // Greetings
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || 
        lowerMessage.includes('hey')) {
      return aiResponses.greetingResponse();
    }
    
    // Help
    if (lowerMessage.includes('help') || lowerMessage.includes('what can')) {
      return aiResponses.helpResponse();
    }
    
    // Thanks
    if (lowerMessage.includes('thank')) {
      return "You're welcome! Feel free to ask if you need anything else. Happy book hunting! 📚";
    }
    
    // Book-related but unclear
    if (isBookRelated) {
      return aiResponses.clarificationResponse();
    }
    
    // Not book-related
    return "Sorry, this question is not related to textbook shopping. Please ask about finding textbooks, negotiation tips, or selling guidance. I'm here to help with your textbook marketplace needs!";
  },
  
  findBooksResponse: (message) => {
    // Extract price if mentioned
    const priceMatch = message.match(/rm\s*(\d+)/i) || message.match(/(\d+)\s*ringgit/i);
    const price = priceMatch ? parseInt(priceMatch[1]) : 50;
    
    return `I can help you find textbooks! Here are some options under RM${price}:\n\n` +
           `1. Introduction to Programming - RM${Math.floor(price * 0.7)}\n` +
           `2. Mathematics for Beginners - RM${Math.floor(price * 0.8)}\n` +
           `3. English Grammar Basics - RM${Math.floor(price * 0.6)}\n\n` +
           `Would you like more details on any of these?`;
  },
  
  negotiationResponse: () => {
    return "Here are some tips for negotiating textbook prices:\n\n" +
           "1. Research the market price first\n" +
           "2. Be polite and friendly\n" +
           "3. Point out any wear and tear\n" +
           "4. Offer to meet at a convenient location\n" +
           "5. Be willing to compromise\n" +
           "6. Bundle multiple books for better deals\n\n" +
           "Good luck with your negotiation!";
  },
  
  sellingResponse: () => {
    return "Here's how selling textbooks works:\n\n" +
           "1. Take clear photos of your textbook\n" +
           "2. List the condition honestly\n" +
           "3. Set a fair price based on condition\n" +
           "4. Respond to buyer inquiries promptly\n" +
           "5. Arrange safe meetup locations\n\n" +
           "Need help with anything specific?";
  },
  
  greetingResponse: () => {
    return "Hello! I'm your AI Shopping Assistant. I can help you:\n\n" +
           "• Find textbooks under specific prices\n" +
           "• Negotiate better prices\n" +
           "• Answer questions about buying/selling\n\n" +
           "What would you like help with today?";
  },
  
  helpResponse: () => {
    return "I'm here to assist you! I can help with:\n\n" +
           "📚 Finding textbooks based on your budget\n" +
           "💰 Negotiating prices effectively\n" +
           "📖 Information about books and sellers\n" +
           "🔍 Searching for specific subjects\n\n" +
           "Just ask me anything about textbook shopping!";
  },
  
  clarificationResponse: () => {
    return "I can help you with that! Could you be more specific? You can ask me about:\n\n" +
           "📚 Finding textbooks in your budget\n" +
           "💰 Tips for negotiating prices\n" +
           "📖 How to buy or sell textbooks\n" +
           "🔍 Searching for specific subjects\n\n" +
           "What would you like to know?";
  },
  
  // Analyze message intent
  analyzeIntent: (message) => {
    const lowerMessage = message.toLowerCase();
    
    const intents = {
      find_books: lowerMessage.includes('find') || lowerMessage.includes('search'),
      negotiate: lowerMessage.includes('negotiate') || lowerMessage.includes('price'),
      sell: lowerMessage.includes('sell'),
      help: lowerMessage.includes('help'),
      greeting: lowerMessage.includes('hello') || lowerMessage.includes('hi')
    };
    
    const detected = Object.keys(intents).filter(key => intents[key]);
    
    return {
      primary_intent: detected[0] || 'unknown',
      confidence: detected.length > 0 ? 0.8 : 0.3,
      is_book_related: lowerMessage.includes('book') || lowerMessage.includes('textbook')
    };
  },
  
  // Generate suggestions based on conversation history
  generateSuggestions: (conversations) => {
    const suggestions = [
      "Tell me about the book's condition",
      "Can we meet on campus?",
      "Is the price negotiable?",
      "When are you available to meet?"
    ];
    
    return suggestions;
  }
};

module.exports = aiResponses;
