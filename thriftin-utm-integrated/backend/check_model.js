// check_model.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function test() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent("Hi");
    console.log("✅ Success! You CAN use 1.5-flash-latest");
  } catch (e) {
    console.log("❌ gemini-pro failed'");
  }
}
test();