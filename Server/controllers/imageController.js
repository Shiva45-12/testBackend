// Server/controllers/imageController.js
import Image from '../models/imageModel.js';
import cloudinary from '../config/cloudinary.js';
import streamifier from 'streamifier';

export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Upload buffer to Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "my_uploads" }, // cloudinary folder
      async (error, result) => {
        if (error) {
          console.error("Cloudinary Error:", error);
          return res.status(500).json({ message: "Upload failed", error });
        }

        // Save image in DB
        const newImage = await Image.create({
          filename: req.file.originalname,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
          url: result.secure_url,
          cloudinaryId: result.public_id,
          format: result.format,
          width: result.width,
          height: result.height,
          uploadedBy: req.user?._id || null,
          category: req.body.category || "other",
          description: req.body.description || ""
        });

        return res.status(201).json({
          message: "Image uploaded successfully",
          image: newImage
        });
      }
    );

    streamifier.createReadStream(req.file.buffer).pipe(uploadStream);

  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).json({ message: "Server Error", error: err });
  }
};


// Get all images
export const getAllImages = async (req, res) => {
  try {
    const images = await Image.find().sort({ createdAt: -1 });
    res.status(200).json(images);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};


// Delete Image From Cloudinary + DB
export const deleteImage = async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) return res.status(404).json({ message: "Image not found" });

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(image.cloudinaryId);

    // Delete from DB
    await Image.findByIdAndDelete(req.params.id);

    res.json({ message: "Image deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};
