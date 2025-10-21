const express = require('express');
const {
  updateOnboarding,
  calculateHealthMetrics,
  getProfile,
  updateProfile,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getFollowSuggestions
} = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// All routes are protected
router.use(authMiddleware);

// Profile routes
router.get('/me', getProfile);
router.patch('/onboarding', updateOnboarding);
router.post('/calculate-metrics', calculateHealthMetrics);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Social routes
router.post('/follow/:userId', followUser);
router.delete('/follow/:userId', unfollowUser);
router.get('/:userId/followers', getFollowers);
router.get('/:userId/following', getFollowing);
router.get('/follow-suggestions', getFollowSuggestions);

module.exports = router;
