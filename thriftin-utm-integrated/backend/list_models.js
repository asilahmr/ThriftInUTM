const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  try {
    console.log('🔍 Fetching available models...\n');
    
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models?key=' + process.env.GEMINI_API_KEY
    );
    
    const data = await response.json();
    
    if (data.models) {
      console.log('✅ Available models:');
      data.models.forEach(model => {
        console.log(`  • ${model.name}`);
        console.log(`    Supported methods: ${model.supportedGenerationMethods?.join(', ') || 'None'}`);
      });
    } else {
      console.log('❌ Error:', data);
    }
  } catch (error) {
    console.error('❌ Failed to fetch models:', error.message);
  }
}

listModels();