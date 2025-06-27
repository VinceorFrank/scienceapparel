const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middlewares/auth');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { Parser } = require('json2csv');
const ActivityLog = require('../models/ActivityLog');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/csv');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.csv');
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// POST /api/csv-import/products - Import products from CSV
router.post('/products', protect, admin, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No CSV file uploaded' });
    }

    const Product = require('../models/Product');
    const Category = require('../models/Category');
    const results = [];
    const errors = [];
    let importedCount = 0;
    let updatedCount = 0;

    // Read and parse CSV file
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', async (data) => {
        try {
          // Validate required fields
          if (!data.name || !data.price) {
            errors.push({ row: data, error: 'Name and price are required' });
            return;
          }

          // Find or create category
          let categoryId = null;
          if (data.category) {
            let category = await Category.findOne({ 
              name: { $regex: new RegExp(`^${data.category}$`, 'i') } 
            });
            if (!category) {
              category = new Category({ name: data.category });
              await category.save();
            }
            categoryId = category._id;
          }

          // Check if product exists
          const existingProduct = await Product.findOne({ 
            name: { $regex: new RegExp(`^${data.name}$`, 'i') } 
          });

          const productData = {
            name: data.name,
            description: data.description || '',
            price: parseFloat(data.price),
            stock: parseInt(data.stock) || 0,
            category: categoryId,
            featured: data.featured === 'true',
            archived: data.archived === 'true',
            discountPrice: data.discountPrice ? parseFloat(data.discountPrice) : undefined,
            tags: data.tags ? data.tags.split(',').map(tag => tag.trim()) : []
          };

          if (existingProduct) {
            // Update existing product
            await Product.findByIdAndUpdate(existingProduct._id, productData);
            updatedCount++;
            results.push({ action: 'updated', product: data.name });
          } else {
            // Create new product
            const newProduct = new Product(productData);
            await newProduct.save();
            importedCount++;
            results.push({ action: 'created', product: data.name });
          }
        } catch (error) {
          errors.push({ row: data, error: error.message });
        }
      })
      .on('end', async () => {
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        // Log activity
        await ActivityLog.create({
          user: req.user._id,
          action: 'csv_import_products',
          description: `Imported ${importedCount} new products, updated ${updatedCount} products from CSV`
        });

        res.json({
          success: true,
          message: `Import completed: ${importedCount} created, ${updatedCount} updated`,
          summary: {
            imported: importedCount,
            updated: updatedCount,
            errors: errors.length
          },
          results,
          errors
        });
      })
      .on('error', (error) => {
        // Clean up uploaded file
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: 'Error processing CSV file', error: error.message });
      });
  } catch (err) {
    next(err);
  }
});

// POST /api/csv-import/users - Import users from CSV
router.post('/users', protect, admin, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No CSV file uploaded' });
    }

    const User = require('../models/User');
    const results = [];
    const errors = [];
    let importedCount = 0;
    let updatedCount = 0;

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', async (data) => {
        try {
          // Validate required fields
          if (!data.name || !data.email || !data.password) {
            errors.push({ row: data, error: 'Name, email, and password are required' });
            return;
          }

          // Check if user exists
          const existingUser = await User.findOne({ email: data.email });

          const userData = {
            name: data.name,
            email: data.email,
            password: data.password,
            role: data.role || 'customer',
            status: data.status || 'active',
            phone: data.phone || '',
            address: data.address || ''
          };

          if (existingUser) {
            // Update existing user
            existingUser.name = userData.name;
            existingUser.role = userData.role;
            existingUser.status = userData.status;
            existingUser.phone = userData.phone;
            existingUser.address = userData.address;
            if (data.password) {
              existingUser.password = data.password;
            }
            await existingUser.save();
            updatedCount++;
            results.push({ action: 'updated', user: data.email });
          } else {
            // Create new user
            const newUser = new User(userData);
            await newUser.save();
            importedCount++;
            results.push({ action: 'created', user: data.email });
          }
        } catch (error) {
          errors.push({ row: data, error: error.message });
        }
      })
      .on('end', async () => {
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        // Log activity
        await ActivityLog.create({
          user: req.user._id,
          action: 'csv_import_users',
          description: `Imported ${importedCount} new users, updated ${updatedCount} users from CSV`
        });

        res.json({
          success: true,
          message: `Import completed: ${importedCount} created, ${updatedCount} updated`,
          summary: {
            imported: importedCount,
            updated: updatedCount,
            errors: errors.length
          },
          results,
          errors
        });
      })
      .on('error', (error) => {
        // Clean up uploaded file
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: 'Error processing CSV file', error: error.message });
      });
  } catch (err) {
    next(err);
  }
});

// POST /api/csv-import/categories - Import categories from CSV
router.post('/categories', protect, admin, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No CSV file uploaded' });
    }

    const Category = require('../models/Category');
    const results = [];
    const errors = [];
    let importedCount = 0;
    let updatedCount = 0;

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', async (data) => {
        try {
          // Validate required fields
          if (!data.name) {
            errors.push({ row: data, error: 'Name is required' });
            return;
          }

          // Check if category exists
          const existingCategory = await Category.findOne({ 
            name: { $regex: new RegExp(`^${data.name}$`, 'i') } 
          });

          const categoryData = {
            name: data.name,
            description: data.description || '',
            featured: data.featured === 'true',
            active: data.active !== 'false',
            sortOrder: parseInt(data.sortOrder) || 0,
            image: data.image || ''
          };

          if (existingCategory) {
            // Update existing category
            await Category.findByIdAndUpdate(existingCategory._id, categoryData);
            updatedCount++;
            results.push({ action: 'updated', category: data.name });
          } else {
            // Create new category
            const newCategory = new Category(categoryData);
            await newCategory.save();
            importedCount++;
            results.push({ action: 'created', category: data.name });
          }
        } catch (error) {
          errors.push({ row: data, error: error.message });
        }
      })
      .on('end', async () => {
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        // Log activity
        await ActivityLog.create({
          user: req.user._id,
          action: 'csv_import_categories',
          description: `Imported ${importedCount} new categories, updated ${updatedCount} categories from CSV`
        });

        res.json({
          success: true,
          message: `Import completed: ${importedCount} created, ${updatedCount} updated`,
          summary: {
            imported: importedCount,
            updated: updatedCount,
            errors: errors.length
          },
          results,
          errors
        });
      })
      .on('error', (error) => {
        // Clean up uploaded file
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: 'Error processing CSV file', error: error.message });
      });
  } catch (err) {
    next(err);
  }
});

// GET /api/csv-export/products - Export products to CSV
router.get('/products', protect, admin, async (req, res, next) => {
  try {
    const Product = require('../models/Product');
    const Category = require('../models/Category');

    const products = await Product.find()
      .populate('category', 'name')
      .lean();

    const csvData = products.map(product => ({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category: product.category?.name || '',
      featured: product.featured,
      archived: product.archived,
      discountPrice: product.discountPrice || '',
      tags: product.tags?.join(', ') || '',
      createdAt: product.createdAt
    }));

    const parser = new Parser({
      fields: ['name', 'description', 'price', 'stock', 'category', 'featured', 'archived', 'discountPrice', 'tags', 'createdAt']
    });

    const csv = parser.parse(csvData);

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'csv_export_products',
      description: `Exported ${products.length} products to CSV`
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=products-${Date.now()}.csv`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

// GET /api/csv-export/users - Export users to CSV
router.get('/users', protect, admin, async (req, res, next) => {
  try {
    const User = require('../models/User');

    const users = await User.find()
      .select('-password')
      .lean();

    const csvData = users.map(user => ({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      phone: user.phone || '',
      address: user.address || '',
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    }));

    const parser = new Parser({
      fields: ['name', 'email', 'role', 'status', 'phone', 'address', 'isAdmin', 'createdAt', 'lastLogin']
    });

    const csv = parser.parse(csvData);

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'csv_export_users',
      description: `Exported ${users.length} users to CSV`
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=users-${Date.now()}.csv`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

// GET /api/csv-export/categories - Export categories to CSV
router.get('/categories', protect, admin, async (req, res, next) => {
  try {
    const Category = require('../models/Category');

    const categories = await Category.find().lean();

    const csvData = categories.map(category => ({
      name: category.name,
      description: category.description,
      featured: category.featured,
      active: category.active,
      sortOrder: category.sortOrder,
      image: category.image || '',
      createdAt: category.createdAt
    }));

    const parser = new Parser({
      fields: ['name', 'description', 'featured', 'active', 'sortOrder', 'image', 'createdAt']
    });

    const csv = parser.parse(csvData);

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'csv_export_categories',
      description: `Exported ${categories.length} categories to CSV`
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=categories-${Date.now()}.csv`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

module.exports = router; 