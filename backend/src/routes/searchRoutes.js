const express = require('express');
const {
  searchPosts,
  getTrendingHashtags,
  getPostsByHashtag,
  searchUsers
} = require('../controllers/searchController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/posts', searchPosts);
router.get('/trending-hashtags', getTrendingHashtags);
router.get('/hashtag/:hashtag', getPostsByHashtag);
router.get('/users', searchUsers);

module.exports = router;