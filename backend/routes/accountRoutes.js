// backend/routes/accountRoutes.js
const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');
const { authenticate, requireAdmin } = require('../middleware/authMiddleWare');

router.get(
  '/check-restrictions',
  authenticate,
  accountController.checkUserRestrictions
);

router.post(
  '/admin/suspend-temporary',
  authenticate,
  requireAdmin,
  accountController.suspendUserTemporarily
);

router.post(
  '/admin/suspend-permanent',
  authenticate,
  requireAdmin,
  accountController.suspendUserPermanently
);

router.post(
  '/admin/reinstate',
  authenticate,
  requireAdmin,
  accountController.reinstateUser
);

router.get(
  '/admin/report/:reportId',
  authenticate,
  requireAdmin,
  accountController.getReportDetails
);

router.get(
  '/admin/all-users',
  authenticate,
  requireAdmin,
  accountController.getAllUsers
);

router.get(
  '/admin/user/:userId',
  authenticate,
  requireAdmin,
  accountController.getUserDetails
);

router.get(
  '/admin/user/:userId/reports',
  authenticate,
  requireAdmin,
  accountController.getUserReports
);

module.exports = router;