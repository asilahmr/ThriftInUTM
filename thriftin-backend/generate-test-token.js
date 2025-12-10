// generate-test-token.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Test user data (matching the test user in database)
const testUser = {
  user_id: 1,
  email: 'testuser@graduate.utm.my',
  name: 'Test User',
  is_verified: true,
  role: 'student'
};

// Generate token that expires in 7 days
const token = jwt.sign(testUser, process.env.JWT_SECRET, { 
  expiresIn: '7d' 
});

console.log('='.repeat(60));
console.log('🔑 TEST JWT TOKEN GENERATED');
console.log('='.repeat(60));
console.log('\nCopy this token to use in Postman:\n');
console.log(token);
console.log('\n' + '='.repeat(60));
console.log('📋 How to use:');
console.log('1. Open Postman');
console.log('2. Go to Headers tab');
console.log('3. Add: Authorization: Bearer <paste_token_here>');
console.log('='.repeat(60));
console.log('\n✅ Token valid for 7 days');
console.log(`👤 Test user: ${testUser.name} (ID: ${testUser.user_id})`);
console.log('='.repeat(60));