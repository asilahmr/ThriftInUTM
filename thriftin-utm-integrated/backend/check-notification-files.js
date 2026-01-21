// check-notification-files.js
// Save this in your backend folder and run: node check-notification-files.js

const fs = require('fs');
const path = require('path');

console.log('\n=== Checking Notification Module Files ===\n');

const files = [
  'routes/notifications.js',
  'controllers/notificationController.js',
  'helpers/notificationHelper.js'
];

let allFilesExist = true;

files.forEach(file => {
  const fullPath = path.join(__dirname, file);
  const exists = fs.existsSync(fullPath);
  
  if (exists) {
    console.log(`✅ ${file} - EXISTS`);
    
    // Check file size
    const stats = fs.statSync(fullPath);
    console.log(`   Size: ${stats.size} bytes`);
    
    // Try to require it
    try {
      const module = require(`./${file}`);
      console.log(`   ✅ Module loads successfully`);
      console.log(`   Type: ${typeof module}`);
      
      if (file === 'routes/notifications.js') {
        console.log(`   Has .stack: ${!!module.stack}`);
        console.log(`   Is Express Router: ${module.name === 'router' || !!module.stack}`);
      }
      
      if (file === 'controllers/notificationController.js') {
        const exports = Object.keys(module);
        console.log(`   Exported functions: ${exports.join(', ')}`);
      }
    } catch (error) {
      console.log(`   ❌ ERROR loading module: ${error.message}`);
      allFilesExist = false;
    }
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
  console.log('');
});

if (allFilesExist) {
  console.log('✅ All notification files exist and load correctly!\n');
  console.log('Next steps:');
  console.log('1. Make sure these lines are in server.js:');
  console.log('   const notificationRoutes = require(\'./routes/notifications\');');
  console.log('   app.use(\'/api/notifications\', notificationRoutes);');
  console.log('2. Restart your server');
  console.log('3. Test: http://localhost:3000/api/notifications/test\n');
} else {
  console.log('❌ Some files are missing or have errors.');
  console.log('Please create the missing files using the artifacts provided.\n');
}

// Check if server.js has the require statement
console.log('=== Checking server.js ===\n');
const serverPath = path.join(__dirname, 'server.js');
if (fs.existsSync(serverPath)) {
  const serverContent = fs.readFileSync(serverPath, 'utf8');
  
  const hasRequire = serverContent.includes('require(\'./routes/notifications\')');
  const hasMount = serverContent.includes('app.use(\'/api/notifications\'');
  
  console.log(`Has require statement: ${hasRequire ? '✅' : '❌'}`);
  console.log(`Has app.use mount: ${hasMount ? '✅' : '❌'}`);
  
  if (!hasRequire) {
    console.log('\n⚠️  Add this line to server.js imports section:');
    console.log('const notificationRoutes = require(\'./routes/notifications\');\n');
  }
  
  if (!hasMount) {
    console.log('\n⚠️  Add this line to server.js routes section:');
    console.log('app.use(\'/api/notifications\', notificationRoutes);\n');
  }
  
  if (hasRequire && hasMount) {
    console.log('\n✅ server.js looks good!\n');
  }
} else {
  console.log('❌ server.js not found in current directory\n');
}

console.log('=== Check Complete ===\n');