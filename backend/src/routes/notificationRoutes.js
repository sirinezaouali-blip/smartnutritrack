const express = require('express');
const {
  getNotifications,
  markAsRead
} = require('../controllers/notificationController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getNotifications);
router.put('/read', markAsRead);

module.exports = router;