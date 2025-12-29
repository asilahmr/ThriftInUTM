// backend/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/adminController');
const { authenticate, requireAdmin } = require('../middleware/authMiddleWare');

router.use(authenticate);
router.use(requireAdmin);

router.get('/flagged-submissions', controller.getFlaggedSubmissions);
router.get('/all-submissions', controller.getAllSubmissions); 
router.get('/student-history/:userId', controller.getStudentHistory);
router.post('/approve-submission/:id', controller.approveSubmission);
router.post('/reject-submission/:id', controller.rejectSubmission);
router.post('/flag-submission/:id', controller.flagSubmission);

module.exports = router;