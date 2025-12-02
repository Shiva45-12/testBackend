import express from "express";
import {
  loginAdmin,
  createAdmin,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getDashboardStats,
  changePassword,
  getRecentActivities,
  getChartData,
  globalSearch
} from "../controllers/adminController.js";
import authenticateToken from "../middlewares/auth.js";

const router = express.Router();

// Test route
router.get("/test", async (req, res) => {
  try {
    const Admin = (await import('../models/Admin.js')).default;
    const adminCount = await Admin.countDocuments();

    if (adminCount === 0) {
      const admin = new Admin({
        name: 'Admin',
        email: 'admin@admin.com',
        password: 'admin123'
      });
      await admin.save();
      return res.json({ message: 'Default admin created', email: 'admin@admin.com', password: 'admin123' });
    }

    res.json({ message: 'Backend working', adminCount });
  } catch (error) {
    res.json({ error: error.message });
  }
});

// Auth routes
router.post("/login", loginAdmin);
router.post("/register", createAdmin);
router.post("/create-default", createAdmin);


// Protected routes
router.get("/dashboard/stats", authenticateToken, getDashboardStats);
router.get("/recent-activities", authenticateToken, getRecentActivities);
router.get("/chart-data", authenticateToken, getChartData);
router.get("/users", authenticateToken, getUsers);//for getimg data
router.post("/users", authenticateToken, createUser);
router.put("/users/:id", authenticateToken, updateUser);
router.delete("/users/:id", authenticateToken, deleteUser);
router.put("/change-password", authenticateToken, changePassword);
router.get("/search", authenticateToken, globalSearch);

export default router;
