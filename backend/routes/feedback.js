const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const upload = require('../middleware/upload');

router.post('/', upload.single('screenshot'), feedbackController.submitFeedback);
router.get('/:userId', feedbackController.getUserFeedback);
router.get('/detail/:feedbackId', feedbackController.getFeedbackDetail);
router.put('/:feedbackId/status', feedbackController.updateFeedbackStatus);
router.post('/:feedbackId/response', feedbackController.addResponse);
router.post('/:feedbackId/upvote', feedbackController.upvoteFeedback);

module.exports = router;