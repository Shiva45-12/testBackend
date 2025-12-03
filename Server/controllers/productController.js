import Product from '../models/Product.js';
import cloudinary from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Create New Product (with image upload)
export const createProduct = async (req, res) => {
  try {
    const { name, category, originalPrice, discountedPrice, description, tags, inStock, stockQuantity } = req.body;
    
    // Validate required fields
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Product image is required'
      });
    }

    if (!name || !category || !originalPrice || !discountedPrice) {
      return res.status(400).json({
        success: false,
        message: 'Name, category, originalPrice and discountedPrice are required'
      });
    }

    // Upload image to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'dairy-app/products',
      resource_type: 'image',
      transformation: [
        { width: 400, height: 400, crop: 'fill' },
        { quality: 'auto:good' }
      ],
      tags: ['dairy', 'product', category]
    });

    // Calculate discount percentage
    const discountPercentage = Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);

    // Create product
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
      tags: tags ? tags.split(',').map(tag => tag.trim().toLowerCase()) : [],
      inStock: inStock === 'true',
      stockQuantity: parseInt(stockQuantity) || 0,
      createdBy: req.user?.id
    });

    await product.save();

    // Remove local file
    const fs = await import('fs');
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });

  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message
    });
  }
};

// Get All Products with Filtering
export const getProducts = async (req, res) => {
  try {
    const { 
      category, 
      minPrice, 
      maxPrice, 
      discount, 
      inStock, 
      search,
      page = 1, 
      limit = 20,
      sort = '-createdAt'
    } = req.query;

    // Build query
    let query = {};

    // Category filter
    if (category) {
      query.category = category.toLowerCase();
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.discountedPrice = {};
      if (minPrice) query.discountedPrice.$gte = parseFloat(minPrice);
      if (maxPrice) query.discountedPrice.$lte = parseFloat(maxPrice);
    }

    // Discount filter
    if (discount) {
      query.discountPercentage = { $gte: parseInt(discount) };
    }

    // Stock filter
    if (inStock === 'true') {
      query.inStock = true;
    } else if (inStock === 'false') {
      query.inStock = false;
    }

    // Search by name, description, or tags
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const products = await Product.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

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
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
};

// Get Popular Products
export const getPopularProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    
    const popularProducts = await Product.find({ 
      isPopular: true,
      inStock: true 
    })
    .sort({ 
      discountPercentage: -1,
      salesCount: -1,
      ratings: -1
    })
    .limit(limit)
    .select('name category originalPrice discountedPrice discountPercentage image description ratings');

    res.status(200).json({
      success: true,
      count: popularProducts.length,
      data: popularProducts
    });

  } catch (error) {
    console.error('Get popular products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch popular products',
      error: error.message
    });
  }
};

// Get Products by Category
export const getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const products = await Product.find({ 
      category: category.toLowerCase(),
      inStock: true 
    })
    .sort({ 
      discountPercentage: -1,
      createdAt: -1 
    })
    .limit(limit)
    .select('name category originalPrice discountedPrice discountPercentage image ratings salesCount');

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No products found in ${category} category`
      });
    }

    res.status(200).json({
      success: true,
      category,
      count: products.length,
      data: products
    });

  } catch (error) {
    console.error('Get products by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products by category',
      error: error.message
    });
  }
};

// Get Single Product
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Increment view count
    product.views += 1;
    await product.save();

    res.status(200).json({
      success: true,
      data: product
    });

  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message
    });
  }
};

// Update Product
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Find product
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Handle image update if new image is uploaded
    if (req.file) {
      // Delete old image from Cloudinary
      if (product.image.public_id) {
        await cloudinary.uploader.destroy(product.image.public_id);
      }

      // Upload new image
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'dairy-app/products',
        resource_type: 'image',
        transformation: [
          { width: 400, height: 400, crop: 'fill' },
          { quality: 'auto:good' }
        ]
      });

      updates.image = {
        public_id: result.public_id,
        url: result.secure_url
      };

      // Remove local file
      const fs = await import('fs');
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    }

    // Update product
    Object.keys(updates).forEach(key => {
      product[key] = updates[key];
    });

    product.updatedBy = req.user?.id;
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });

  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error.message
    });
  }
};

// Delete Product
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Delete image from Cloudinary
    if (product.image.public_id) {
      await cloudinary.uploader.destroy(product.image.public_id);
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message
    });
  }
};

// Mark Product as Popular
export const markAsPopular = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndUpdate(
      id,
      { 
        isPopular: true,
        updatedBy: req.user?.id 
      },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product marked as popular',
      data: product
    });

  } catch (error) {
    console.error('Mark as popular error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark product as popular',
      error: error.message
    });
  }
};

// Get Products with High Discounts
export const getDiscountedProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    const minDiscount = parseInt(req.query.minDiscount) || 10;

    const discountedProducts = await Product.find({
      discountPercentage: { $gte: minDiscount },
      inStock: true
    })
    .sort({ discountPercentage: -1 })
    .limit(limit)
    .select('name category originalPrice discountedPrice discountPercentage image');

    res.status(200).json({
      success: true,
      count: discountedProducts.length,
      data: discountedProducts
    });

  } catch (error) {
    console.error('Get discounted products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch discounted products',
      error: error.message
    });
  }
};

// Update Product Stock
export const updateProductStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stockQuantity, inStock } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (stockQuantity !== undefined) {
      product.stockQuantity = parseInt(stockQuantity);
      product.inStock = product.stockQuantity > 0;
    }

    if (inStock !== undefined) {
      product.inStock = inStock === 'true';
    }

    product.updatedBy = req.user?.id;
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product stock updated successfully',
      data: product
    });

  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product stock',
      error: error.message
    });
  }
};

// Get Categories with Product Counts
export const getCategoriesWithCount = async (req, res) => {
  try {
    const categories = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          available: {
            $sum: { $cond: [{ $eq: ['$inStock', true] }, 1, 0] }
          }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
};