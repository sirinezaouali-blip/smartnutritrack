const express = require('express');
const {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  rateOrder,
  getOrderStats,
  getRecentOrders
} = require('../controllers/orderController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// All routes are protected
router.use(authMiddleware);

// @route   POST /api/orders
// @desc    Create new order with enhanced features
// @access  Private
router.post('/', createOrder);

// @route   GET /api/orders
// @desc    Get user orders with advanced filtering and pagination
// @access  Private
router.get('/', getUserOrders);

// @route   GET /api/orders/recent
// @desc    Get recent orders for dashboard
// @access  Private
router.get('/recent', getRecentOrders);

// @route   GET /api/orders/stats/overview
// @desc    Get comprehensive order statistics
// @access  Private
router.get('/stats/overview', getOrderStats);

// @route   GET /api/orders/:id
// @desc    Get order by ID with full details
// @access  Private
router.get('/:id', getOrderById);

// @route   PATCH /api/orders/:id/status
// @desc    Update order status
// @access  Private
router.patch('/:id/status', updateOrderStatus);

// @route   PATCH /api/orders/:id/cancel
// @desc    Cancel order
// @access  Private
router.patch('/:id/cancel', cancelOrder);

// @route   PATCH /api/orders/:id/rate
// @desc    Rate and review delivered order
// @access  Private
router.patch('/:id/rate', rateOrder);

module.exports = router;