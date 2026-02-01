// backend/routes/reports.js
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ========================================
// DIRECTORY SETUP
// ========================================

// Ensure uploads directory exists
const evidenceDir = path.join(__dirname, '..', 'uploads', 'evidence');
if (!fs.existsSync(evidenceDir)) {
  fs.mkdirSync(evidenceDir, { recursive: true });
  console.log('✅ Created uploads/evidence directory:', evidenceDir);
} else {
  console.log('✅ Evidence directory exists:', evidenceDir);
}

// ========================================
// MULTER CONFIGURATION
// ========================================

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log('📁 Saving file to:', evidenceDir);
    cb(null, evidenceDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = 'evidence-' + uniqueSuffix + path.extname(file.originalname);
    console.log('📝 Generated filename:', filename);
    cb(null, filename);
  }
});

// File filter
const fileFilter = function (req, file, cb) {
  console.log('🔍 Checking file type:', file.mimetype);
  
  const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    console.log('✅ File type allowed');
    return cb(null, true);
  } else {
    console.log('❌ File type not allowed:', file.mimetype);
    cb(new Error('Only images and documents are allowed (jpg, png, pdf, doc, docx)'));
  }
};

// Configure multer
const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only 1 file at a time
  },
  fileFilter: fileFilter
});

// ========================================
// ROUTES
// ========================================

// Test endpoint - verify server is working
router.get('/test', reportController.testEndpoint);

// Submit report with optional evidence
router.post('/submit', (req, res, next) => {
  console.log('📥 POST /api/reports/submit received');
  console.log('📋 Headers:', req.headers);
  next();
}, upload.single('evidence'), (req, res, next) => {
  console.log('📦 After multer - Body:', req.body);
  console.log('📎 File:', req.file ? 'Present' : 'None');
  next();
}, reportController.submitReport);

// Report user (simple version)
router.post('/user', reportController.reportUser);

// Block user
router.post('/block', reportController.blockUser);

// Get blocked users list
router.get('/blocked/:userId', reportController.getBlockedUsers);

// Unblock user
router.put('/unblock/:blockId', reportController.unblockUser);

// Get user's reports
router.get('/user/:userId', reportController.getUserReports);

// Update report status (admin)
router.put('/status/:reportId', reportController.updateReportStatus);

// ========================================
// ERROR HANDLING
// ========================================

// Multer error handler - must be AFTER routes
router.use((error, req, res, next) => {
  console.error('❌ Route error:', error);
  
  if (error instanceof multer.MulterError) {
    console.error('❌ Multer error:', error.code, error.message);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: 'File too large', 
        details: 'Maximum file size is 5MB' 
      });
    }
    
    return res.status(400).json({ 
      error: 'Upload error', 
      details: error.message 
    });
  }
  
  if (error.message) {
    return res.status(500).json({ 
      error: error.message 
    });
  }
  
  res.status(500).json({ 
    error: 'Internal server error' 
  });
});

// ========================================
// LOGGING
// ========================================

// Log routes on startup
console.log('📋 ==========================================');
console.log('📋 Reports Routes Registered:');
console.log('📋 ==========================================');
console.log('  GET    /api/reports/test');
console.log('  POST   /api/reports/submit (with file upload)');
console.log('  POST   /api/reports/user');
console.log('  POST   /api/reports/block');
console.log('  GET    /api/reports/blocked/:userId');
console.log('  PUT    /api/reports/unblock/:blockId');
console.log('  GET    /api/reports/user/:userId');
console.log('  PUT    /api/reports/status/:reportId');
console.log('📋 ==========================================');

module.exports = router;