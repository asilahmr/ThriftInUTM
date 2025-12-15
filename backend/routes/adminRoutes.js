const express = require('express');
const router = express.Router();
const controller = require('../controllers/adminController');
const authMiddleWare = require('../middleware/authMiddleWare');

router.use(authMiddleWare);

router.get('/flagged-submissions', controller.getFlaggedSubmissions);

router.get('/all-submissions', controller.getAllSubmissions); 

router.get('/student-history/:userId', controller.getStudentHistory);

router.post('/approve-submission/:id', controller.approveSubmission);

router.post('/reject-submission/:id', controller.rejectSubmission);

router.post('/flag-submission/:id', controller.flagSubmission);

module.exports = router;