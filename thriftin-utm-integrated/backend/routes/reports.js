const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // ✅ CRITICAL: Added fs import

// Ensure uploads directory exists
const evidenceDir = path.join(__dirname, '..', 'uploads', 'evidence');
if (!fs.existsSync(evidenceDir)) {
  fs.mkdirSync(evidenceDir, { recursive: true });
  console.log('✅ Created uploads/evidence directory');
}

// Configure multer for evidence file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, evidenceDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'evidence-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and documents are allowed'));
    }
  }
});

// Report routes
router.post('/submit', upload.single('evidence'), reportController.submitReport);
router.post('/user', reportController.reportUser);
router.post('/block', reportController.blockUser);
router.get('/blocked/:userId', reportController.getBlockedUsers);
router.put('/unblock/:blockId', reportController.unblockUser);
router.get('/user/:userId', reportController.getUserReports);
router.put('/status/:reportId', reportController.updateReportStatus);

// Log routes on startup
console.log('📋 Reports routes registered:');
console.log('  POST   /api/reports/submit');
console.log('  POST   /api/reports/user');
console.log('  POST   /api/reports/block');
console.log('  GET    /api/reports/blocked/:userId');
console.log('  PUT    /api/reports/unblock/:blockId');
console.log('  GET    /api/reports/user/:userId');
console.log('  PUT    /api/reports/status/:reportId');

module.exports = router;