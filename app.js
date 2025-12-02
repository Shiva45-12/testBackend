import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
// import bcrypt from 'bcryptjs';
// import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import adminRoutes from './Server/routes/adminRoutes.js';
import userRoutes from './Server/routes/userRoutes.js';
dotenv.config();

const app = express();
const JWT_SECRET = 'your-secret-key';

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// MongoDB Connection (Local)
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('MongoDB Error:', err));



// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);

// Dashboard Stats Route
app.get('/api/admin/dashboard/stats', (req, res) => {
  res.json({
    totalUsers: 0,
    activeUsers: 0,
    totalAdmins: 1
  });
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server running' });
});

export default app;
