const express = require('express');
const router = express.Router();
const helpCenterController = require('../controllers/helpCenterController');
const upload = require('../middleware/upload');

// FAQ routes
router.get('/categories', helpCenterController.getCategories);
router.get('/faq', helpCenterController.getFAQs);
router.get('/faq/:faqId', helpCenterController.getFAQDetail);
router.post('/faq/:faqId/helpful', helpCenterController.voteFAQ);

// Support ticket routes
router.post('/tickets', upload.single('attachment'), helpCenterController.createTicket);
router.get('/tickets/:userId', helpCenterController.getTickets);
router.get('/tickets/detail/:ticketId', helpCenterController.getTicketDetail);
router.put('/tickets/:ticketId/status', helpCenterController.updateTicketStatus);

// Guides routes
router.get('/guides', helpCenterController.getGuides);
router.get('/guides/:guideId', helpCenterController.getGuideDetail);

module.exports = router;