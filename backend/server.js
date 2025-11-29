const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
// CORS Configuration
app.use(cors({
  origin: 'http://localhost:3000', // Your React frontend
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle preflight requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_nutritrack')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/meals', require('./src/routes/mealRoutes'));
app.use('/api/users', require('./src/routes/userRoutes')); 
app.use('/api/user-meals', require('./src/routes/userMealRoutes'));
app.use('/api/analytics', require('./src/routes/analyticsRoutes'));
app.use('/api/planner', require('./src/routes/plannerRoutes'));
app.use('/api/orders', require('./src/routes/orderRoutes')); 
app.use('/api/social', require('./src/routes/socialRoutes'));
app.use('/api/scan', require('./src/routes/scanRoutes'));
app.use('/api/ai', require('./src/routes/aiRoutes'));
app.use('/api/recovery', require('./src/routes/recoveryRoutes'));
app.use('/api/search', require('./src/routes/searchRoutes'));

// Basic route
app.get('/', (req, res) => {
  res.json({ message: '🚀 SmartNutritrack Backend is running!' });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🎯 Server running on port ${PORT}`);
  console.log(`🔗 http://localhost:${PORT}`);
  console.log(`🔐 Auth routes: http://localhost:${PORT}/api/auth`);
});