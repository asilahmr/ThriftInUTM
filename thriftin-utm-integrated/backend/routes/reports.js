const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.post('/user', reportController.reportUser);
router.post('/block', reportController.blockUser);
router.get('/blocks/:userId', reportController.getBlockedUsers);
router.delete('/block/:blockId', reportController.unblockUser);
router.get('/reports/:userId', reportController.getUserReports);
router.put('/reports/:reportId/status', reportController.updateReportStatus);

module.exports = router;