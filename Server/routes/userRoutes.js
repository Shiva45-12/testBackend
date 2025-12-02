import express from "express";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  loginUser,
} from "../controllers/adminController.js";
import authenticateToken from "../middlewares/auth.js";

const router = express.Router();

// Public routes (no auth required)
router.post("/send-otp", (req, res) => {
  res.json({ message: "OTP sent successfully", otp: "123456" });
});

router.post("/login", loginUser);

// Protected routes (auth required)
router.get("/users", authenticateToken, getUsers);
router.post("/users", authenticateToken, createUser);
router.put("/users/:id", authenticateToken, updateUser);
router.delete("/users/:id", authenticateToken, deleteUser);

export default router;