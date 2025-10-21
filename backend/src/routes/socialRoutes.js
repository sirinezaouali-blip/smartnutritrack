const express = require('express');
const multer = require('multer');
const path = require('path');
const {
  createPost,
  getFeed,
  getMyPosts,
  toggleLike,
  addComment,
  deletePost,
  getPostById,
  sharePost,
  reportPost,
  updatePost,
  getTrendingPosts,
  getMostEngagedPosts,
  toggleCommentLike
} = require('../controllers/socialController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/social'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'social-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// All routes are protected
router.use(authMiddleware);

// Post management
router.post('/posts', createPost);
router.get('/feed', getFeed);
router.get('/posts/my', getMyPosts);
router.get('/posts/:id', getPostById);
router.put('/posts/:id', updatePost);
router.delete('/posts/:id', deletePost);

// Post interactions
router.post('/posts/:id/like', toggleLike);
router.post('/posts/:id/comment', addComment);
router.post('/posts/:id/share', sharePost);
router.post('/posts/:id/report', reportPost);

// Comment interactions
router.post('/posts/:postId/comments/:commentId/like', toggleCommentLike);

// Image upload
router.post('/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const imageUrl = `/uploads/social/${req.file.filename}`;

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: imageUrl,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error uploading image',
      error: error.message
    });
  }
});

// Trending and engagement
router.get('/trending', getTrendingPosts);
router.get('/most-engaged', getMostEngagedPosts);

module.exports = router;
