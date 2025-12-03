import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import adminRoutes from './Server/routes/adminRoutes.js';
import userRoutes from './Server/routes/userRoutes.js';
import offerRoutes from "./Server/routes/storeRoutes.js";
import imageRoutes from "./Server/routes/imageRoutes.js";
import categoryRoutes from "./Server/routes/categoryRoutes.js"; // Add this

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve static files
app.use('/uploads', express.static('uploads'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('MongoDB Error:', err));

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use("/api", offerRoutes);
app.use("/api", imageRoutes);
app.use("/api", categoryRoutes); // Add this line

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