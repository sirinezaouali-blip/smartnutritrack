const express = require('express');
const {
  getProfile,
  updateProfile,
  getAchievements,
  getUserPosts
} = require('../controllers/profileController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/:userId', getProfile);
router.put('/', updateProfile);
router.get('/:userId/achievements', getAchievements);
router.get('/:userId/posts', getUserPosts);

module.exports = router;