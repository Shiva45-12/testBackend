import mongoose from "mongoose";

const offerSchema = new mongoose.Schema({
    message: {
        type: String,
        required: true,
    },
    active: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

export default mongoose.model("Offer", offerSchema);
