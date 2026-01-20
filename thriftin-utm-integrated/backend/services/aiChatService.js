require('dotenv').config();
const OpenAI = require('openai');
const db = require('../config/db');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ✅ UPDATED: Expanded keyword matching for all categories
async function getRelevantProducts(userMessage) {
  const keywords = userMessage
    .toLowerCase()
    .match(/algorithm|programming|data|calculator|book|python|math|electronic|fashion|furniture|jacket|desk|chair|shelf|bag|handbag|skirt|cloth|gadget|mouse|hub|guide/g);

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

// ✅ UPDATED: OpenAI system prompt now mentions all categories
async function generateAIReply(userId, userMessage) {
  const products = await getRelevantProducts(userMessage);

  const productContext = products.length
    ? products.map(p =>
        `• ${p.name} (RM${p.price}, ${p.condition}, ${p.category})`
      ).join('\n')
    : 'No matching products found.';

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are an AI shopping assistant for ThriftIn UTM, a university marketplace for students.

MARKETPLACE CATEGORIES:
- Books (textbooks, novels, reference materials)
- Electronics (calculators, gadgets, accessories)
- Fashion (clothing, shoes, bags)
- Furniture (desks, chairs, shelves)
- Others (general student items)

YOUR ROLE:
- Help students find ANY products (not just textbooks)
- Provide pricing advice across all categories
- Give buying/selling guidance
- Suggest negotiation tips

GUIDELINES:
- Be helpful, friendly, and concise
- Support ALL product categories equally
- Focus on marketplace-related topics only`
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