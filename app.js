import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create app FIRST
const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files - FIXED path resolution
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// MongoDB Connection with better error handling
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dairyapp';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB Connected Successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`📍 Host: ${mongoose.connection.host}`);
  })
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  });

// MongoDB connection event listeners
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

// Import routes AFTER app is created
import adminRoutes from './Server/routes/adminRoutes.js';
import userRoutes from './Server/routes/userRoutes.js';
import offerRoutes from "./Server/routes/storeRoutes.js";
import imageRoutes from "./Server/routes/imageRoutes.js";
import categoryRoutes from "./Server/routes/categoryRoutes.js";
import productRoutes from './Server/routes/productRoutes.js';
import summerSaleRoutes from './Server/routes/summerSaleRoutes.js';

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use("/api/stores", offerRoutes);
app.use("/api/images", imageRoutes);
app.use("/api/categories", categoryRoutes);
app.use('/api/products', productRoutes); // ✅ MOVED HERE
app.use("/api/summer-sale", summerSaleRoutes);

// Dashboard Stats Route
app.get('/api/admin/dashboard/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      totalUsers: 0,
      activeUsers: 0,
      totalAdmins: 1,
      timestamp: new Date().toISOString()
    }
  });
});

// Environment check endpoint
app.get('/api/env-check', (req, res) => {
  const envVars = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT || 5000,
    MONGODB_URI: process.env.MONGODB_URI ? 'Set' : 'Not set',
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Not set',
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Not set',
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Not set',
    JWT_SECRET: process.env.JWT_SECRET ? 'Set' : 'Not set'
  };
  
  res.json({
    success: true,
    environment: envVars,
    timestamp: new Date().toISOString()
  });
});

// Enhanced Health Check
app.get('/api/health', (req, res) => {
  const healthStatus = {
    status: 'OK',
    message: 'Server running',
    serverTime: new Date().toISOString(),
    uptime: process.uptime(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    cloudinary: {
      configured: !!(process.env.CLOUDINARY_CLOUD_NAME && 
                    process.env.CLOUDINARY_API_KEY && 
                    process.env.CLOUDINARY_API_SECRET),
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'Not set'
    }
  };
  
  res.json(healthStatus);
});

// API Documentation Route
app.get('/api', (req, res) => {
  res.json({
    message: 'Dairy App API',
    version: '1.0.0',
    endpoints: {
      admin: '/api/admin',
      users: '/api/users',
      stores: '/api/stores',
      images: '/api/images',
      categories: '/api/categories',
      products: '/api/products', // ✅ Added products endpoint
      summerSale: '/api/summer-sale',
      health: '/api/health',
      envCheck: '/api/env-check'
    }
  });
});

// 404 Handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('🔥 Server Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body
  });
  
  const statusCode = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      path: req.path 
    })
  });
});

// Export app
export default app;