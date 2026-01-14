require('dotenv').config();
const OpenAI = require('openai');
const db = require('../config/db');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function getRelevantProducts(userMessage) {
  const keywords = userMessage
    .toLowerCase()
    .match(/algorithm|programming|data|calculator|book|python|math/g);

  let sql = `
    SELECT name, price, category, \`condition\`
    FROM products
    WHERE status = 'active'
  `;
  const params = [];

  if (keywords && keywords.length > 0) {
    sql += ` AND (${keywords.map(() => 'name LIKE ?').join(' OR ')})`;
    keywords.forEach(k => params.push(`%${k}%`));
  }

  sql += ` ORDER BY view_count DESC LIMIT 5`;

  const [rows] = await db.query(sql, params);
  return rows;
}

async function generateAIReply(userId, userMessage) {
  const products = await getRelevantProducts(userMessage);

  const productContext = products.length
    ? products.map(p =>
        `• ${p.name} (RM${p.price}, ${p.condition})`
      ).join('\n')
    : 'No matching products found.';

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are an AI shopping assistant for a university thrift marketplace.
Give helpful, concise buying advice.`
      },
      {
        role: 'user',
        content: userMessage
      },
      {
        role: 'assistant',
        content: `Here are some relevant products from the marketplace:\n${productContext}`
      }
    ]
  });

  return completion.choices[0].message.content;
}

module.exports = {
  generateAIReply
};
