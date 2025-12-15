const express = require('express');
const router = express.Router();
const verifyController = require('../controllers/verifyController');
const authMiddleWare = require('../middleware/authMiddleWare');

//Extract matric number from uploaded image (OCR)
router.post(
  '/extract-matric',
  authMiddleWare,
  verifyController.uploadMatricCard,
  verifyController.extractMatricNumber
);

//Submit verification with matric card
router.post(
  '/submit',
  authMiddleWare,
  verifyController.uploadMatricCard,
  verifyController.submitVerification
);

//Get all pending verifications (Admin only)
router.get(
  '/pending',
  authMiddleWare,
  verifyController.getPendingVerifications
);

//Flag a verification for manual review (Admin only)
router.post(
  '/flag',
  authMiddleWare,
  verifyController.flagVerification
);

//Approve a verification (Admin only)
router.post(
  '/approve',
  authMiddleWare,
  verifyController.approveVerification
);

//Reject a verification (Admin only)
router.post(
  '/reject',
  authMiddleWare,
  verifyController.rejectVerification
);

module.exports = router;