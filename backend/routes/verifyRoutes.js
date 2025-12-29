// backend/routes/verifyRoutes.js
const express = require('express');
const router = express.Router();
const verifyController = require('../controllers/verifyController');
const { authenticate } = require('../middleware/authMiddleWare');

router.post(
  '/extract-matric',
  authenticate,
  verifyController.uploadMatricCard,
  verifyController.extractMatricNumber
);

router.post(
  '/submit',
  authenticate,
  verifyController.uploadMatricCard,
  verifyController.submitVerification
);

router.get(
  '/pending',
  authenticate,
  verifyController.getPendingVerifications
);

router.post(
  '/flag',
  authenticate,
  verifyController.flagVerification
);

router.post(
  '/approve',
  authenticate,
  verifyController.approveVerification
);

router.post(
  '/reject',
  authenticate,
  verifyController.rejectVerification
);

module.exports = router;