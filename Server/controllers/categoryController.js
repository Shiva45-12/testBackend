import Category from '../models/categoryModel.js';
import { upload } from './imageController.js'; // Reuse image upload

// Get all categories
export const getAllCategories = async (req, res) => {
  try {
    const { 
      status = 'active', 
      featured, 
      parent = null,
      sortBy = 'displayOrder',
      sortOrder = 'asc'
    } = req.query;

    // Build query
    const query = { status };
    
    if (featured !== undefined) {
      query.isFeatured = featured === 'true';
    }
    
    if (parent === 'null' || parent === '') {
      query.parentCategory = null;
    } else if (parent) {
      query.parentCategory = parent;
    }

    // Sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const categories = await Category.find(query)
      .sort(sort)
      .populate('parentCategory', 'name slug')
      .select('-__v');

    res.json({
      success: true,
      count: categories.length,
      categories
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: err.message 
    });
  }
};

// Get single category by slug or ID
export const getCategory = async (req, res) => {
  try {
    const { identifier } = req.params;
    
    // Check if identifier is a valid ObjectId or slug
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);
    
    const query = isObjectId 
      ? { _id: identifier } 
      : { slug: identifier.toLowerCase() };
    
    const category = await Category.findOne(query)
      .populate('parentCategory', 'name slug')
      .populate({
        path: 'subcategories',
        select: 'name slug description icon isFeatured',
        match: { status: 'active' },
        options: { sort: { displayOrder: 1 } }
      });

    if (!category) {
      return res.status(404).json({ 
        success: false, 
        message: 'Category not found' 
      });
    }

    res.json({
      success: true,
      category
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: err.message 
    });
  }
};

// Create category
export const createCategory = async (req, res) => {
  try {
    const { name, description, parentCategory, isFeatured, displayOrder } = req.body;

    // Generate slug from name
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');

    // Check if category already exists
    const existingCategory = await Category.findOne({ $or: [{ name }, { slug }] });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name or slug already exists'
      });
    }

    // Handle image upload if present
    let imageData = {};
    if (req.file) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      imageData = {
        url: `${baseUrl}/uploads/images/${req.file.filename}`,
        filename: req.file.filename,
        path: req.file.path
      };
    }

    // Create category
    const category = new Category({
      name,
      slug,
      description: description || '',
      image: imageData,
      parentCategory: parentCategory || null,
      isFeatured: isFeatured || false,
      displayOrder: displayOrder || 0,
      status: 'active'
    });

    await category.save();

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: err.message 
    });
  }
};

// Update category
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // If name is being updated, update slug too
    if (updates.name) {
      updates.slug = updates.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
    }

    // Handle image update if present
    if (req.file) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      updates.image = {
        url: `${baseUrl}/uploads/images/${req.file.filename}`,
        filename: req.file.filename,
        path: req.file.path
      };
    }

    const category = await Category.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ 
        success: false, 
        message: 'Category not found' 
      });
    }

    res.json({
      success: true,
      message: 'Category updated successfully',
      category
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: err.message 
    });
  }
};

// Delete category (soft delete)
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findByIdAndUpdate(
      id,
      { status: 'archived' },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ 
        success: false, 
        message: 'Category not found' 
      });
    }

    res.json({
      success: true,
      message: 'Category archived successfully',
      category
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: err.message 
    });
  }
};

// Get category hierarchy (parent with children)
export const getCategoryHierarchy = async (req, res) => {
  try {
    const categories = await Category.aggregate([
      { $match: { status: 'active' } },
      {
        $graphLookup: {
          from: 'categories',
          startWith: '$_id',
          connectFromField: '_id',
          connectToField: 'parentCategory',
          as: 'subcategories',
          depthField: 'depth'
        }
      },
      { $match: { parentCategory: null } },
      { $sort: { displayOrder: 1 } }
    ]);

    res.json({
      success: true,
      categories
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: err.message 
    });
  }
};

// Get featured categories
export const getFeaturedCategories = async (req, res) => {
  try {
    const categories = await Category.find({
      status: 'active',
      isFeatured: true
    })
    .sort({ displayOrder: 1 })
    .select('name slug description icon image')
    .limit(10);

    res.json({
      success: true,
      categories
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: err.message 
    });
  }
};

// Bulk create default dairy categories
export const createDefaultCategories = async (req, res) => {
  try {
    const defaultCategories = [
      {
        name: 'Milk',
        slug: 'milk',
        description: 'Fresh milk and milk products',
        icon: '🥛',
        displayOrder: 1,
        metadata: { color: '#2196F3' }
      },
      {
        name: 'Ghee',
        slug: 'ghee',
        description: 'Pure clarified butter',
        icon: '🫕',
        displayOrder: 2,
        metadata: { color: '#FF9800' }
      },
      {
        name: 'Curd',
        slug: 'curd',
        description: 'Fresh yogurt and curd products',
        icon: '🍶',
        displayOrder: 3,
        metadata: { color: '#4CAF50' }
      },
      {
        name: 'Paneer',
        slug: 'paneer',
        description: 'Fresh cottage cheese',
        icon: '🧀',
        displayOrder: 4,
        metadata: { color: '#795548' }
      },
      {
        name: 'Butter',
        slug: 'butter',
        description: 'Fresh butter and spreads',
        icon: '🧈',
        displayOrder: 5,
        metadata: { color: '#FFEB3B' }
      },
      {
        name: 'Cheese',
        slug: 'cheese',
        description: 'Various cheese products',
        icon: '🧀',
        displayOrder: 6,
        metadata: { color: '#FF5722' }
      },
      {
        name: 'Cream',
        slug: 'cream',
        description: 'Fresh cream and malai',
        icon: '🍦',
        displayOrder: 7,
        metadata: { color: '#FFFFFF' }
      },
      {
        name: 'Buttermilk',
        slug: 'buttermilk',
        description: 'Fresh chaas and buttermilk',
        icon: '🥤',
        displayOrder: 8,
        metadata: { color: '#9C27B0' }
      }
    ];

    // Insert default categories if they don't exist
    const operations = defaultCategories.map(category => ({
      updateOne: {
        filter: { slug: category.slug },
        update: { $setOnInsert: category },
        upsert: true
      }
    }));

    await Category.bulkWrite(operations);

    const categories = await Category.find({ slug: { $in: defaultCategories.map(c => c.slug) } });

    res.status(201).json({
      success: true,
      message: 'Default categories created',
      categories
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: err.message 
    });
  }
};