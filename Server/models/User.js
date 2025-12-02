import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true   // <-- ADD THIS
  },

  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

export default mongoose.model("User", userSchema);
