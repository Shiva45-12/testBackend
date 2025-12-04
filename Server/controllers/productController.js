import Product from '../models/Product.js';
import cloudinary from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Function for Cloudinary upload using memoryStorage
const uploadToCloudinary = async (file) => {
  const fileBase64 = Buffer.from(file.buffer).toString("base64");
  const dataURI = `data:${file.mimetype};base64,${fileBase64}`;

  return await cloudinary.uploader.upload(dataURI, {
    folder: "dairy-app/products",
    resource_type: "image",
    transformation: [
      { width: 400, height: 400, crop: "fill" },
      { quality: "auto:good" }
    ]
  });
};

// Create New Product
export const createProduct = async (req, res) => {
  try {
    const { name, category, originalPrice, discountedPrice, description, tags, inStock, stockQuantity } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Product image is required" });
    }

    if (!name || !category || !originalPrice || !discountedPrice) {
      return res.status(400).json({
        success: false,
        message: "Name, category, originalPrice and discountedPrice are required"
      });
    }

    // Cloudinary upload
    const result = await uploadToCloudinary(req.file);

    const discountPercentage = Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);

    const product = new Product({
      image: {
        public_id: result.public_id,
        url: result.secure_url
      },
      name,
      category: category.toLowerCase(),
      originalPrice: parseFloat(originalPrice),
      discountedPrice: parseFloat(discountedPrice),
      discountPercentage,
      description,
      tags: tags ? tags.split(",").map(t => t.trim().toLowerCase()) : [],
      inStock: inStock === "true",
      stockQuantity: parseInt(stockQuantity) || 0,
      createdBy: req.user?.id
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product
    });

  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({ success: false, message: "Failed to create product", error: error.message });
  }
};

// Get All Products
export const getProducts = async (req, res) => {
  try {
    const {
      category, minPrice, maxPrice, discount, inStock,
      search, page = 1, limit = 20, sort = "-createdAt"
    } = req.query;

    let query = {};

    if (category) query.category = category.toLowerCase();

    if (minPrice || maxPrice) {
      query.discountedPrice = {};
      if (minPrice) query.discountedPrice.$gte = parseFloat(minPrice);
      if (maxPrice) query.discountedPrice.$lte = parseFloat(maxPrice);
    }

    if (discount) query.discountPercentage = { $gte: parseInt(discount) };

    if (inStock === "true") query.inStock = true;
    else if (inStock === "false") query.inStock = false;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: products
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch products", error: error.message });
  }
};

// Get Single Product
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    product.views += 1;
    await product.save();

    res.status(200).json({ success: true, data: product });

  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch product", error: error.message });
  }
};

// Update Product
export const updateProduct = async (req, res) => {
  try {
    const updates = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    // If image updated
    if (req.file) {
      if (product.image.public_id) {
        await cloudinary.uploader.destroy(product.image.public_id);
      }

      const result = await uploadToCloudinary(req.file);

      updates.image = {
        public_id: result.public_id,
        url: result.secure_url
      };
    }

    Object.keys(updates).forEach(key => (product[key] = updates[key]));
    product.updatedBy = req.user?.id;

    await product.save();

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update product", error: error.message });
  }
};

// Delete Product
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    if (product.image.public_id) await cloudinary.uploader.destroy(product.image.public_id);

    await product.deleteOne();

    res.status(200).json({ success: true, message: "Product deleted successfully" });

  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete product", error: error.message });
  }
};

// Popular, Discounted, Stock updates, Categories remain unchanged
export const getPopularProducts = async (req, res) => { /* SAME */ };
export const getProductsByCategory = async (req, res) => { /* SAME */ };
export const getDiscountedProducts = async (req, res) => { /* SAME */ };
export const markAsPopular = async (req, res) => { /* SAME */ };
export const updateProductStock = async (req, res) => { /* SAME */ };
export const getCategoriesWithCount = async (req, res) => { /* SAME */ };
