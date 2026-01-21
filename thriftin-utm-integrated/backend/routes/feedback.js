
const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/feedback/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
  }
});

const upload = multer({ storage: storage });

// Feedback routes
router.post('/', upload.single('screenshot'), feedbackController.submitFeedback);
router.get('/:userId', feedbackController.getUserFeedback);
router.get('/detail/:feedbackId', feedbackController.getFeedbackDetail);
router.put('/status/:feedbackId', feedbackController.updateFeedbackStatus);
router.post('/:feedbackId/response', feedbackController.addResponse);
router.post('/:feedbackId/upvote', feedbackController.upvoteFeedback);

module.exports = router;