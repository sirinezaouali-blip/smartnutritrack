const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  mealId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meal',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  calories: {
    type: Number,
    required: true,
    min: 0
  },
  protein: {
    type: Number,
    default: 0
  },
  carbs: {
    type: Number,
    default: 0
  },
  fat: {
    type: Number,
    default: 0
  },
  imageUrl: String,
  specialInstructions: String
});

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  items: [orderItemSchema],
  status: {
    type: String,
    enum: [
      'pending',           // Order created, waiting for confirmation
      'confirmed',         // Order confirmed by restaurant
      'preparing',         // Food being prepared
      'ready',             // Food ready for pickup/delivery
      'in_delivery',       // Out for delivery
      'delivered',         // Successfully delivered
      'cancelled',         // Order cancelled
      'refunded'           // Order refunded
    ],
    default: 'pending',
    index: true
  },
  orderType: {
    type: String,
    enum: ['delivery', 'pickup'],
    default: 'delivery',
    required: true
  },
  
  // Pricing Information
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  deliveryFee: {
    type: Number,
    default: 0,
    min: 0
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Nutritional Information
  totalCalories: {
    type: Number,
    required: true,
    min: 0
  },
  totalProtein: {
    type: Number,
    default: 0
  },
  totalCarbs: {
    type: Number,
    default: 0
  },
  totalFat: {
    type: Number,
    default: 0
  },
  
  // Delivery Information
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: {
      type: String,
      default: 'Tunisia'
    },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  deliveryInstructions: String,
  
  // Pickup Information
  pickupLocation: {
    name: String,
    address: String,
    phone: String
  },
  pickupTime: Date,
  
  // Timing Information
  estimatedDelivery: Date,
  orderedAt: {
    type: Date,
    default: Date.now
  },
  confirmedAt: Date,
  preparingAt: Date,
  readyAt: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  
  // Payment Information
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'paypal', 'cash_on_delivery', 'mobile_money'],
    default: 'cash_on_delivery'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
    default: 'pending'
  },
  paymentId: String, // External payment gateway ID
  
  // Restaurant Information
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    default: null // For future multi-restaurant support
  },
  restaurantName: {
    type: String,
    default: 'SmartNutritrack Kitchen'
  },
  
  // Tracking & Communication
  trackingNumber: String,
  driverInfo: {
    name: String,
    phone: String,
    vehicle: String
  },
  customerNotes: String,
  internalNotes: String,
  
  // Ratings & Feedback
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  review: String,
  reviewedAt: Date
}, {
  timestamps: true
});

// Indexes for efficient queries
orderSchema.index({ userId: 1, orderedAt: -1 });
orderSchema.index({ status: 1, orderedAt: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ 'deliveryAddress.city': 1 });

// Pre-save middleware to calculate totals and generate order number
orderSchema.pre('save', async function(next) {
  try {
    // Generate order number if not exists
    if (!this.orderNumber) {
      const date = new Date();
      const timestamp = date.getTime().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      this.orderNumber = `SN${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${timestamp}${random}`;
    }
    
    // Calculate subtotal from items
    if (this.isModified('items')) {
      this.subtotal = this.items.reduce((total, item) => {
        return total + (item.price * item.quantity);
      }, 0);
      
      // Calculate nutritional totals
      this.totalCalories = this.items.reduce((total, item) => {
        return total + (item.calories * item.quantity);
      }, 0);
      
      this.totalProtein = this.items.reduce((total, item) => {
        return total + (item.protein * item.quantity);
      }, 0);
      
      this.totalCarbs = this.items.reduce((total, item) => {
        return total + (item.carbs * item.quantity);
      }, 0);
      
      this.totalFat = this.items.reduce((total, item) => {
        return total + (item.fat * item.quantity);
      }, 0);
    }
    
    // Calculate total amount
    this.totalAmount = this.subtotal + this.deliveryFee + this.taxAmount - this.discountAmount;
    
    // Set timing based on status changes
    const now = new Date();
    if (this.isModified('status')) {
      switch (this.status) {
        case 'confirmed':
          this.confirmedAt = this.confirmedAt || now;
          break;
        case 'preparing':
          this.preparingAt = this.preparingAt || now;
          break;
        case 'ready':
          this.readyAt = this.readyAt || now;
          break;
        case 'delivered':
          this.deliveredAt = this.deliveredAt || now;
          break;
        case 'cancelled':
          this.cancelledAt = this.cancelledAt || now;
          break;
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Method to update order status
orderSchema.methods.updateStatus = function(newStatus, notes = '') {
  this.status = newStatus;
  if (notes) {
    this.internalNotes = (this.internalNotes ? this.internalNotes + '\n' : '') + 
                        `${new Date().toISOString()}: ${notes}`;
  }
  return this.save();
};

// Method to add tracking info
orderSchema.methods.addTrackingInfo = function(trackingNumber, driverInfo = {}) {
  this.trackingNumber = trackingNumber;
  if (driverInfo.name || driverInfo.phone) {
    this.driverInfo = { ...this.driverInfo, ...driverInfo };
  }
  return this.save();
};

// Static method to get orders by status and date range
orderSchema.statics.getOrdersByStatus = function(userId, status, startDate, endDate) {
  const query = { userId };
  if (status) query.status = status;
  if (startDate || endDate) {
    query.orderedAt = {};
    if (startDate) query.orderedAt.$gte = new Date(startDate);
    if (endDate) query.orderedAt.$lte = new Date(endDate);
  }
  
  return this.find(query)
    .populate('items.mealId')
    .sort({ orderedAt: -1 });
};

// Static method to get order statistics
orderSchema.statics.getOrderStats = function(userId) {
  return this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' },
        avgOrderValue: { $avg: '$totalAmount' }
      }
    }
  ]);
};

// Static method to get monthly order summary
orderSchema.statics.getMonthlySummary = function(userId, year = new Date().getFullYear()) {
  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        orderedAt: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$orderedAt' },
        orderCount: { $sum: 1 },
        totalSpent: { $sum: '$totalAmount' },
        avgOrderValue: { $avg: '$totalAmount' },
        successfulOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
        }
      }
    },
    { $sort: { '_id': 1 } }
  ]);
};

module.exports = mongoose.model('Order', orderSchema);