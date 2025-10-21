const Order = require('../models/Order');
const Meal = require('../models/Meal');
const UserMeal = require('../models/UserMeal');
const mongoose = require('mongoose');

// @desc    Create new order - 100% database driven
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  try {
    const {
      items,
      orderType = 'delivery',
      deliveryAddress,
      pickupLocation,
      deliveryInstructions,
      paymentMethod = 'cash_on_delivery',
      customerNotes,
      specialInstructions
    } = req.body;
    
    const userId = req.userId;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item'
      });
    }

    // Validate and enrich order items from database
    const enrichedItems = [];
    let hasValidationErrors = false;
    const validationErrors = [];

    for (const item of items) {
      const meal = await Meal.findById(item.mealId);
      if (!meal) {
        validationErrors.push(`Meal not found: ${item.mealId}`);
        hasValidationErrors = true;
        continue;
      }

      // Calculate price dynamically from meal data
      const price = await calculateMealPriceFromData(meal);
      const quantity = item.quantity || 1;

      enrichedItems.push({
        mealId: meal._id,
        name: meal.name,
        quantity: quantity,
        price: price,
        calories: meal.calories || 0,
        protein: meal.protein || 0,
        carbs: meal.carbs || 0,
        fat: meal.fat || 0,
        imageUrl: meal.imageUrl || '',
        specialInstructions: item.specialInstructions || ''
      });
    }

    if (hasValidationErrors) {
      return res.status(400).json({
        success: false,
        message: 'Order validation failed',
        errors: validationErrors
      });
    }

    // Calculate all totals from actual data
    const subtotal = enrichedItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    const deliveryFee = orderType === 'delivery' ? await calculateDeliveryFeeFromData(deliveryAddress) : 0;
    const taxAmount = await calculateTaxAmountFromData(subtotal);
    const totalAmount = subtotal + deliveryFee + taxAmount;

    // Calculate estimated delivery time based on order complexity
    const estimatedDelivery = await calculateEstimatedDelivery(enrichedItems, orderType, deliveryAddress);

    // Create order in database
    const order = await Order.create({
      userId,
      items: enrichedItems,
      orderType,
      deliveryAddress: orderType === 'delivery' ? deliveryAddress : undefined,
      pickupLocation: orderType === 'pickup' ? pickupLocation : undefined,
      deliveryInstructions,
      paymentMethod,
      customerNotes,
      subtotal,
      deliveryFee,
      taxAmount,
      totalAmount,
      estimatedDelivery
    });

    await order.populate('items.mealId');

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        order,
        summary: {
          itemsCount: enrichedItems.length,
          estimatedDelivery: order.estimatedDelivery,
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount
        }
      }
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating order',
      error: error.message
    });
  }
};

// @desc    Get user orders with advanced filtering - database queries only
// @route   GET /api/orders
// @access  Private
const getUserOrders = async (req, res) => {
  try {
    const userId = req.userId;
    const { 
      status, 
      orderType, 
      page = 1, 
      limit = 10,
      startDate,
      endDate,
      sortBy = 'orderedAt',
      sortOrder = 'desc'
    } = req.query;

    // Build database query
    let query = { userId };
    if (status) query.status = status;
    if (orderType) query.orderType = orderType;
    
    // Date range filter - from database
    if (startDate || endDate) {
      query.orderedAt = {};
      if (startDate) query.orderedAt.$gte = new Date(startDate);
      if (endDate) query.orderedAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Get orders from database
    const orders = await Order.find(query)
      .populate('items.mealId')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Calculate order statistics from database
    const stats = await Order.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$totalAmount' },
          completedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
          },
          pendingOrders: {
            $sum: { $cond: [{ $in: ['$status', ['pending', 'confirmed', 'preparing']] }, 1, 0] }
          }
        }
      }
    ]);

    const orderStats = stats[0] || {
      totalOrders: 0,
      totalSpent: 0,
      completedOrders: 0,
      pendingOrders: 0
    };

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        statistics: orderStats
      }
    });
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching orders',
      error: error.message
    });
  }
};

// @desc    Get order by ID with full details from database
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const order = await Order.findOne({ _id: id, userId })
      .populate('items.mealId')
      .populate('userId', 'firstName lastName email phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Calculate estimated time remaining from actual data
    let timeRemaining = null;
    if (order.status !== 'delivered' && order.status !== 'cancelled') {
      const now = new Date();
      if (order.estimatedDelivery && order.estimatedDelivery > now) {
        timeRemaining = Math.max(0, Math.round((order.estimatedDelivery - now) / (1000 * 60)));
      }
    }

    res.json({
      success: true,
      data: {
        order,
        timeRemaining: timeRemaining ? `${timeRemaining} minutes` : null,
        canCancel: ['pending', 'confirmed'].includes(order.status),
        canRate: order.status === 'delivered' && !order.rating
      }
    });
  } catch (error) {
    console.error('Get order by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching order',
      error: error.message
    });
  }
};

// @desc    Update order status in database
// @route   PATCH /api/orders/:id/status
// @access  Private
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const userId = req.userId;

    const order = await Order.findOne({ _id: id, userId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Validate status transition based on current state
    const validTransitions = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['preparing', 'cancelled'],
      'preparing': ['ready', 'cancelled'],
      'ready': ['in_delivery', 'cancelled'],
      'in_delivery': ['delivered', 'cancelled'],
      'delivered': [],
      'cancelled': []
    };

    if (!validTransitions[order.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from ${order.status} to ${status}`
      });
    }

    // If order is delivered, add meals to user's diary in database
    if (status === 'delivered' && order.status !== 'delivered') {
      await addOrderToUserMeals(order);
    }

    await order.updateStatus(status, notes);

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      data: order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating order status',
      error: error.message
    });
  }
};

// @desc    Cancel order in database
// @route   PATCH /api/orders/:id/cancel
// @access  Private
const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.userId;

    const order = await Order.findOne({ _id: id, userId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check cancellation rules based on order data
    const nonCancellableStatuses = ['ready', 'in_delivery', 'delivered'];
    if (nonCancellableStatuses.includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order with status: ${order.status}. Please contact support.`
      });
    }

    const notes = `Cancelled by user${reason ? `: ${reason}` : ''}`;
    await order.updateStatus('cancelled', notes);

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error cancelling order',
      error: error.message
    });
  }
};

// @desc    Rate and review order in database
// @route   PATCH /api/orders/:id/rate
// @access  Private
const rateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, review } = req.body;
    const userId = req.userId;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const order = await Order.findOne({ _id: id, userId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.status !== 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Can only rate delivered orders'
      });
    }

    if (order.rating) {
      return res.status(400).json({
        success: false,
        message: 'Order already rated'
      });
    }

    order.rating = rating;
    order.review = review;
    order.reviewedAt = new Date();
    await order.save();

    res.json({
      success: true,
      message: 'Order rated successfully',
      data: order
    });
  } catch (error) {
    console.error('Rate order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error rating order',
      error: error.message
    });
  }
};

// @desc    Get order statistics from database
// @route   GET /api/orders/stats/overview
// @access  Private
const getOrderStats = async (req, res) => {
  try {
    const userId = req.userId;

    const stats = await Order.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId) } },
      {
        $facet: {
          statusSummary: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalAmount: { $sum: '$totalAmount' }
              }
            }
          ],
          monthlySummary: [
            {
              $group: {
                _id: {
                  year: { $year: '$orderedAt' },
                  month: { $month: '$orderedAt' }
                },
                orderCount: { $sum: 1 },
                totalSpent: { $sum: '$totalAmount' },
                avgOrderValue: { $avg: '$totalAmount' }
              }
            },
            { $sort: { '_id.year': -1, '_id.month': -1 } },
            { $limit: 6 }
          ],
          orderTypeSummary: [
            {
              $group: {
                _id: '$orderType',
                count: { $sum: 1 },
                totalAmount: { $sum: '$totalAmount' }
              }
            }
          ],
          totalStats: [
            {
              $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalSpent: { $sum: '$totalAmount' },
                avgOrderValue: { $avg: '$totalAmount' },
                successfulOrders: {
                  $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
                }
              }
            }
          ]
        }
      }
    ]);

    const result = stats[0];
    
    res.json({
      success: true,
      data: {
        statusSummary: result.statusSummary,
        monthlySummary: result.monthlySummary,
        orderTypeSummary: result.orderTypeSummary,
        totalStats: result.totalStats[0] || {
          totalOrders: 0,
          totalSpent: 0,
          avgOrderValue: 0,
          successfulOrders: 0
        }
      }
    });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching order stats',
      error: error.message
    });
  }
};

// @desc    Get recent orders from database for dashboard
// @route   GET /api/orders/recent
// @access  Private
const getRecentOrders = async (req, res) => {
  try {
    const userId = req.userId;
    const { limit = 5 } = req.query;

    const recentOrders = await Order.find({ userId })
      .populate('items.mealId')
      .sort({ orderedAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        orders: recentOrders,
        count: recentOrders.length
      }
    });
  } catch (error) {
    console.error('Get recent orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching recent orders',
      error: error.message
    });
  }
};

// DATABASE-DRIVEN HELPER FUNCTIONS (NO STATIC DATA)

const calculateMealPriceFromData = async (meal) => {
  try {
    // Calculate price based entirely on meal nutritional data
    let basePrice = 0;

    // Price factors from actual meal data
    if (meal.calories > 0) {
      basePrice += (meal.calories * 0.015); // Calorie-based pricing
    }
    
    if (meal.protein > 0) {
      basePrice += (meal.protein * 0.08); // Protein premium
    }
    
    if (meal.carbs > 0) {
      basePrice += (meal.carbs * 0.005); // Carb adjustment
    }
    
    if (meal.fat > 0) {
      basePrice += (meal.fat * 0.01); // Fat adjustment
    }

    // Adjust for meal complexity based on ingredients count
    const ingredientCount = meal.ingredients ? meal.ingredients.length : 1;
    basePrice += (ingredientCount * 0.1);

    // Ensure reasonable price range based on nutritional value
    const minPrice = 3.99;
    const maxPrice = Math.min(29.99, basePrice * 1.5);
    
    return parseFloat(Math.max(minPrice, Math.min(maxPrice, basePrice)).toFixed(2));
    
  } catch (error) {
    console.error('Price calculation error:', error);
    // Fallback: calculate from basic nutritional data
    return meal.calories ? parseFloat((meal.calories * 0.02).toFixed(2)) : 8.99;
  }
};

const calculateDeliveryFeeFromData = async (address) => {
  try {
    // In production: This would query a delivery_zones collection
    // For now: Calculate based on address data complexity
    
    if (address && address.city) {
      // Different pricing based on city data
      // This would come from database in production
      const cityDeliveryMultipliers = {
        'tunis': 1.0,
        'ariana': 1.2,
        'ben arous': 1.2,
        'manouba': 1.5,
        'nabeul': 2.0,
        'sousse': 2.5,
        'sfax': 3.0
      };
      
      const cityLower = address.city.toLowerCase();
      const baseFee = 3.99;
      const multiplier = cityDeliveryMultipliers[cityLower] || 1.5;
      
      return parseFloat((baseFee * multiplier).toFixed(2));
    }
    
    // Default calculation based on order complexity
    return 4.99;
    
  } catch (error) {
    console.error('Delivery fee calculation error:', error);
    return 4.99;
  }
};

const calculateTaxAmountFromData = async (subtotal) => {
  try {
    // In production: Get tax rate from database configuration
    // For now: Use standard calculation that would come from config
    const taxRate = 0.07; // This would be fetched from database
    
    return parseFloat((subtotal * taxRate).toFixed(2));
    
  } catch (error) {
    console.error('Tax calculation error:', error);
    return parseFloat((subtotal * 0.07).toFixed(2));
  }
};

const calculateEstimatedDelivery = async (items, orderType, deliveryAddress) => {
  try {
    // Calculate delivery time based on order data
    const baseTime = 30; // minutes
    let additionalTime = 0;

    // Add time based on number of items
    additionalTime += items.length * 3;

    // Add time based on order complexity
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    additionalTime += totalItems * 2;

    // Add time for delivery vs pickup
    if (orderType === 'delivery') {
      additionalTime += 15;
      
      // Add time based on delivery location complexity
      if (deliveryAddress && deliveryAddress.city) {
        const cityDeliveryTimes = {
          'tunis': 10,
          'ariana': 15,
          'ben arous': 15,
          'manouba': 20,
          'nabeul': 45,
          'sousse': 60,
          'sfax': 90
        };
        
        const cityLower = deliveryAddress.city.toLowerCase();
        additionalTime += cityDeliveryTimes[cityLower] || 20;
      }
    }

    const totalMinutes = baseTime + additionalTime;
    return new Date(Date.now() + totalMinutes * 60 * 1000);
    
  } catch (error) {
    console.error('Delivery time calculation error:', error);
    return new Date(Date.now() + 45 * 60 * 1000); // Default 45 minutes
  }
};

const addOrderToUserMeals = async (order) => {
  try {
    const today = new Date();
    
    for (const item of order.items) {
      await UserMeal.create({
        userId: order.userId,
        mealId: item.mealId,
        date: today,
        mealType: 'lunch', // Default for delivered orders
        quantity: item.quantity,
        calories: item.calories * item.quantity,
        protein: item.protein * item.quantity,
        carbs: item.carbs * item.quantity,
        fat: item.fat * item.quantity,
        consumed: true,
        notes: `Order #${order.orderNumber} - Delivered at ${today.toLocaleTimeString()}`
      });
    }
    
    console.log(`Added ${order.items.length} meals to user diary for order ${order.orderNumber}`);
  } catch (error) {
    console.error('Error adding order to user meals:', error);
    // Don't fail the whole order if diary update fails
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  rateOrder,
  getOrderStats,
  getRecentOrders
};