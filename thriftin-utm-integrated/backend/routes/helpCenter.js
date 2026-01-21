
const express = require('express');
const router = express.Router();
const helpCenterController = require('../controllers/helpCenterController');
const multer = require('multer');

// Configure multer
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

// Help Center routes
router.get('/categories', helpCenterController.getCategories);
router.get('/faq', helpCenterController.getFAQs);
router.get('/faq/:faqId', helpCenterController.getFAQDetail);
router.post('/faq/:faqId/vote', helpCenterController.voteFAQ);
router.post('/tickets', upload.single('attachment'), helpCenterController.createTicket);
router.get('/tickets/:userId', helpCenterController.getTickets);
router.get('/tickets/detail/:ticketId', helpCenterController.getTicketDetail);
router.put('/tickets/status/:ticketId', helpCenterController.updateTicketStatus);
router.get('/guides', helpCenterController.getGuides);
router.get('/guides/:guideId', helpCenterController.getGuideDetail);

module.exports = router;