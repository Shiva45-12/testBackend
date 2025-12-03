
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import adminRoutes from './Server/routes/adminRoutes.js';
import userRoutes from './Server/routes/userRoutes.js';
import offerRoutes from "./Server/routes/storeRoutes.js";
import imageRoutes from "./Server/routes/imageRoutes.js";
import categoryRoutes from "./Server/routes/categoryRoutes.js";

const app = express();


// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/uploads', express.static('uploads'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dairyapp')
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch(err => {
    process.exit(1);
  });

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use("/api", offerRoutes);
app.use("/api", imageRoutes);
app.use("/api", categoryRoutes);

// Dashboard Stats Route
app.get('/api/admin/dashboard/stats', (req, res) => {
  res.json({
    totalUsers: 0,
    activeUsers: 0,
    totalAdmins: 1,
    timestamp: new Date().toISOString()
  });
});

// Enhanced Health Check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server running',
    cloudinary: process.env.CLOUDINARY_CLOUD_NAME ? 'Configured' : 'Not configured',
    timestamp: new Date().toISOString()
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(' Server Error:', err.stack);
  
  const statusCode = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;

export default app;