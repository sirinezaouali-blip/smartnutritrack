const express = require('express');
const { 
  registerUser, 
  loginUser, 
  getMe, 
  verifyEmail, 
  verifySMS, 
  resendVerification,
  forgotPassword,
  resetPassword,
  updatePassword,
  deleteAccount
} = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify-email', verifyEmail);
router.post('/verify-sms', verifySMS);
router.post('/resend-verification', resendVerification);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', authMiddleware, getMe);
router.put('/password', authMiddleware, updatePassword);
router.delete('/account', authMiddleware, deleteAccount);

module.exports = router;
