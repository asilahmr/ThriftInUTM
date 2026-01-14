const express = require('express');
const router = express.Router();

const analyticsController = require('../controllers/analyticsController');

router.get('/activity', analyticsController.getActivityAnalytics);

module.exports = router;
