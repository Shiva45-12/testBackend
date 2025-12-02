import express from "express";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  loginUser,
} from "../controllers/adminController.js";
import User from "../models/User.js";
import authenticateToken from "../middlewares/auth.js";

const router = express.Router();

// Public routes (no auth required)

// router.post("/send-otp", (req, res) => {
//   res.json({ message: "OTP sent successfully", otp: "123456" });
// });

// otp verification

router.post("/send-otp", async (req, res) => {
  try {
    const { phone } = req.body;

    //  Check if phone is provided
    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    //  Check if user exists with that phone
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: "User not found with this phone number" });
    }

    //  Generate OTP (you can change to real OTP later)
    const otp = "123456";  // static for testing

    // Send response with OTP
    res.json({
      message: "OTP sent successfully",
      otp,
      phone: user.phone
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});



router.post("/login", loginUser);

// Protected routes (auth required)
router.get("/users", authenticateToken, getUsers);
router.post("/users", authenticateToken, createUser);
router.put("/users/:id", authenticateToken, updateUser);
router.delete("/users/:id", authenticateToken, deleteUser);

export default router;