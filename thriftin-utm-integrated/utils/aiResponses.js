// ✅ UPDATED: Support all product categories, not just textbooks
const aiResponses = {
  // Main response generator
  getResponse: (message) => {
    const lowerMessage = message.toLowerCase();
    
    // Check if marketplace-related
    const isMarketplaceRelated = 
      lowerMessage.includes('book') || 
      lowerMessage.includes('textbook') || 
      lowerMessage.includes('calculator') ||
      lowerMessage.includes('electronic') ||
      lowerMessage.includes('fashion') ||
      lowerMessage.includes('furniture') ||
      lowerMessage.includes('item') ||
      lowerMessage.includes('product') ||
      lowerMessage.includes('buy') || 
      lowerMessage.includes('sell');
    
    // Finding items
    if ((lowerMessage.includes('find') || lowerMessage.includes('search') || 
         lowerMessage.includes('need') || lowerMessage.includes('looking')) && isMarketplaceRelated) {
      return aiResponses.findItemsResponse(message);
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
    
    // Categories
    if (lowerMessage.includes('categories') || lowerMessage.includes('browse')) {
      return aiResponses.categoriesResponse();
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
      return "You're welcome! Feel free to ask if you need anything else. Happy shopping! 🛍️";
    }
    
    // Marketplace-related but unclear
    if (isMarketplaceRelated) {
      return aiResponses.clarificationResponse();
    }
    
    // Not marketplace-related
    return "Sorry, this question is not related to the marketplace. Please ask about finding items, negotiation tips, or selling guidance. I'm here to help with your marketplace needs!";
  },
  
  // ✅ UPDATED: findBooksResponse → findItemsResponse
  findItemsResponse: (message) => {
    const priceMatch = message.match(/rm\s*(\d+)/i) || message.match(/(\d+)\s*ringgit/i);
    const price = priceMatch ? parseInt(priceMatch[1]) : 50;
    
    const lowerMessage = message.toLowerCase();
    let category = '';
    let examples = [];
    
    // Detect category
    if (lowerMessage.includes('book') || lowerMessage.includes('textbook')) {
      category = 'books';
      examples = [
        `Introduction to Programming - RM${Math.floor(price * 0.7)}`,
        `Mathematics for Beginners - RM${Math.floor(price * 0.8)}`,
        `English Grammar Basics - RM${Math.floor(price * 0.6)}`
      ];
    } else if (lowerMessage.includes('electronic') || lowerMessage.includes('calculator')) {
      category = 'electronics';
      examples = [
        `Scientific Calculator - RM${Math.floor(price * 0.7)}`,
        `USB Hub - RM${Math.floor(price * 0.5)}`,
        `Wireless Mouse - RM${Math.floor(price * 0.6)}`
      ];
    } else if (lowerMessage.includes('fashion') || lowerMessage.includes('cloth')) {
      category = 'fashion';
      examples = [
        `Denim Jacket - RM${Math.floor(price * 0.8)}`,
        `Long Skirt - RM${Math.floor(price * 0.5)}`,
        `Handbag - RM${Math.floor(price * 0.6)}`
      ];
    } else if (lowerMessage.includes('furniture') || lowerMessage.includes('desk')) {
      category = 'furniture';
      examples = [
        `Study Desk - RM${Math.floor(price * 0.9)}`,
        `Book Shelf - RM${Math.floor(price * 0.7)}`,
        `Office Chair - RM${Math.floor(price * 0.8)}`
      ];
    } else {
      category = 'items';
      examples = [
        `Study Materials - RM${Math.floor(price * 0.6)}`,
        `Campus Essentials - RM${Math.floor(price * 0.5)}`,
        `General Items - RM${Math.floor(price * 0.7)}`
      ];
    }
    
    return `I can help you find ${category} under RM${price}! Here are some options:\n\n` +
           examples.map((e, i) => `${i + 1}. ${e}`).join('\n') + '\n\n' +
           `Would you like more details on any of these?`;
  },
  
  negotiationResponse: () => {
    return "Here are some tips for negotiating prices:\n\n" +
           "1. Research the market price first\n" +
           "2. Be polite and friendly\n" +
           "3. Point out any wear and tear\n" +
           "4. Offer to meet at a convenient location\n" +
           "5. Be willing to compromise\n" +
           "6. Bundle multiple items for better deals\n\n" +
           "Good luck with your negotiation!";
  },
  
  // ✅ UPDATED: Selling all types of items
  sellingResponse: () => {
    return "Here's how selling on ThriftIn UTM works:\n\n" +
           "1. Take clear photos of your item\n" +
           "2. List the condition honestly\n" +
           "3. Choose the right category (Books, Electronics, Fashion, Furniture, Others)\n" +
           "4. Set a fair price based on condition\n" +
           "5. Respond to buyer inquiries promptly\n" +
           "6. Arrange safe meetup locations on campus\n\n" +
           "Need help with anything specific?";
  },
  
  // ✅ NEW: Categories response
  categoriesResponse: () => {
    return "Browse our marketplace categories:\n\n" +
           "📚 Books - Textbooks, novels, reference materials\n" +
           "🔌 Electronics - Calculators, gadgets, accessories\n" +
           "👔 Fashion - Clothing, shoes, bags\n" +
           "🪑 Furniture - Desks, chairs, shelves\n" +
           "📦 Others - General student items\n\n" +
           "Which category interests you?";
  },
  
  // ✅ UPDATED: Greetings mention all categories
  greetingResponse: () => {
    return "Hello! I'm your AI Shopping Assistant for ThriftIn UTM. I can help you:\n\n" +
           "• Find items in any category (Books, Electronics, Fashion, Furniture, Others)\n" +
           "• Negotiate better prices\n" +
           "• Answer questions about buying/selling\n\n" +
           "What would you like help with today?";
  },
  
  // ✅ UPDATED: Help response mentions all categories
  helpResponse: () => {
    return "I'm here to assist you! I can help with:\n\n" +
           "📦 Finding items in any category\n" +
           "💰 Negotiating prices effectively\n" +
           "📖 Information about products and sellers\n" +
           "🔍 Searching for specific items\n\n" +
           "Categories: Books, Electronics, Fashion, Furniture, Others\n\n" +
           "Just ask me anything about the marketplace!";
  },
  
  // ✅ UPDATED: Clarification mentions all categories
  clarificationResponse: () => {
    return "I can help you with that! Could you be more specific? You can ask me about:\n\n" +
           "📦 Finding items in your budget\n" +
           "💰 Tips for negotiating prices\n" +
           "📖 How to buy or sell items\n" +
           "🔍 Searching in specific categories\n\n" +
           "Categories: Books, Electronics, Fashion, Furniture, Others\n\n" +
           "What would you like to know?";
  },
  
  // Analyze message intent
  analyzeIntent: (message) => {
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
    
    // ✅ UPDATED: Check if any product-related
    const isProductRelated = 
      lowerMessage.includes('book') || 
      lowerMessage.includes('textbook') ||
      lowerMessage.includes('calculator') ||
      lowerMessage.includes('electronic') ||
      lowerMessage.includes('fashion') ||
      lowerMessage.includes('furniture') ||
      lowerMessage.includes('item') ||
      lowerMessage.includes('product');
    
    return {
      primary_intent: detected[0] || 'unknown',
      confidence: detected.length > 0 ? 0.8 : 0.3,
      is_product_related: isProductRelated
    };
  },
  
  // Generate suggestions based on conversation history
  generateSuggestions: (conversations) => {
    const suggestions = [
      "Tell me about the item's condition",
      "Can we meet on campus?",
      "Is the price negotiable?",
      "When are you available to meet?"
    ];
    
    return suggestions;
  }
};

module.exports = aiResponses;