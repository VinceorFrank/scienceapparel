const Product = require('../models/Product');
const Category = require('../models/Category');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

class CSVProcessor {
  // Process product CSV data
  static async processProducts(csvData) {
    const results = {
      success: [],
      errors: [],
      summary: {
        total: csvData.length,
        created: 0,
        updated: 0,
        failed: 0
      }
    };

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      const rowNumber = i + 1;

      try {
        // Validate required fields
        if (!row.Name || !row.Price) {
          results.errors.push(`Row ${rowNumber}: Name and Price are required`);
          results.summary.failed++;
          continue;
        }

        // Validate price
        const price = parseFloat(row.Price);
        if (isNaN(price) || price < 0) {
          results.errors.push(`Row ${rowNumber}: Invalid price value`);
          results.summary.failed++;
          continue;
        }

        // Validate stock
        const stock = row.Stock ? parseInt(row.Stock) : 0;
        if (isNaN(stock) || stock < 0) {
          results.errors.push(`Row ${rowNumber}: Invalid stock value`);
          results.summary.failed++;
          continue;
        }

        // Prepare product data
        const productData = {
          name: row.Name.trim(),
          description: row.Description?.trim() || '',
          price: price,
          stock: stock,
          sku: row.SKU?.trim() || '',
          brand: row.Brand?.trim() || '',
          status: row.Status?.toLowerCase() === 'inactive' ? 'inactive' : 'active'
        };

        // Handle category
        if (row.Category) {
          let category = await Category.findOne({ 
            name: { $regex: new RegExp(`^${row.Category.trim()}$`, 'i') } 
          });
          
          if (!category) {
            category = await Category.create({
              name: row.Category.trim(),
              slug: row.Category.trim().toLowerCase().replace(/\s+/g, '-'),
              description: `Imported category: ${row.Category.trim()}`
            });
          }
          
          productData.category = category._id;
        }

        // Check if product exists (by SKU or name)
        let existingProduct = null;
        if (row.SKU) {
          existingProduct = await Product.findOne({ sku: row.SKU.trim() });
        }
        if (!existingProduct) {
          existingProduct = await Product.findOne({ 
            name: { $regex: new RegExp(`^${row.Name.trim()}$`, 'i') } 
          });
        }

        if (existingProduct) {
          // Update existing product
          Object.assign(existingProduct, productData);
          await existingProduct.save();
          results.success.push({
            row: rowNumber,
            action: 'updated',
            id: existingProduct._id,
            name: existingProduct.name
          });
          results.summary.updated++;
        } else {
          // Create new product
          const newProduct = await Product.create(productData);
          results.success.push({
            row: rowNumber,
            action: 'created',
            id: newProduct._id,
            name: newProduct.name
          });
          results.summary.created++;
        }

      } catch (error) {
        results.errors.push(`Row ${rowNumber}: ${error.message}`);
        results.summary.failed++;
      }
    }

    return results;
  }

  // Process category CSV data
  static async processCategories(csvData) {
    const results = {
      success: [],
      errors: [],
      summary: {
        total: csvData.length,
        created: 0,
        updated: 0,
        failed: 0
      }
    };

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      const rowNumber = i + 1;

      try {
        // Validate required fields
        if (!row.Name) {
          results.errors.push(`Row ${rowNumber}: Name is required`);
          results.summary.failed++;
          continue;
        }

        // Prepare category data
        const categoryData = {
          name: row.Name.trim(),
          description: row.Description?.trim() || '',
          slug: row.Slug?.trim() || row.Name.trim().toLowerCase().replace(/\s+/g, '-'),
          isActive: row.Status?.toLowerCase() !== 'inactive'
        };

        // Handle parent category
        if (row['Parent Category']) {
          const parentCategory = await Category.findOne({ 
            name: { $regex: new RegExp(`^${row['Parent Category'].trim()}$`, 'i') } 
          });
          
          if (parentCategory) {
            categoryData.parent = parentCategory._id;
          }
        }

        // Check if category exists
        const existingCategory = await Category.findOne({ 
          name: { $regex: new RegExp(`^${row.Name.trim()}$`, 'i') } 
        });

        if (existingCategory) {
          // Update existing category
          Object.assign(existingCategory, categoryData);
          await existingCategory.save();
          results.success.push({
            row: rowNumber,
            action: 'updated',
            id: existingCategory._id,
            name: existingCategory.name
          });
          results.summary.updated++;
        } else {
          // Create new category
          const newCategory = await Category.create(categoryData);
          results.success.push({
            row: rowNumber,
            action: 'created',
            id: newCategory._id,
            name: newCategory.name
          });
          results.summary.created++;
        }

      } catch (error) {
        results.errors.push(`Row ${rowNumber}: ${error.message}`);
        results.summary.failed++;
      }
    }

    return results;
  }

  // Process user CSV data
  static async processUsers(csvData) {
    const results = {
      success: [],
      errors: [],
      summary: {
        total: csvData.length,
        created: 0,
        updated: 0,
        failed: 0
      }
    };

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      const rowNumber = i + 1;

      try {
        // Validate required fields
        if (!row.Email || !row.Name) {
          results.errors.push(`Row ${rowNumber}: Email and Name are required`);
          results.summary.failed++;
          continue;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(row.Email)) {
          results.errors.push(`Row ${rowNumber}: Invalid email format`);
          results.summary.failed++;
          continue;
        }

        // Prepare user data
        const userData = {
          name: row.Name.trim(),
          email: row.Email.trim().toLowerCase(),
          role: row.Role?.toLowerCase() === 'admin' ? 'admin' : 'customer',
          isActive: row.Status?.toLowerCase() !== 'inactive'
        };

        // Check if user exists
        const existingUser = await User.findOne({ email: userData.email });

        if (existingUser) {
          // Update existing user
          Object.assign(existingUser, userData);
          await existingUser.save();
          results.success.push({
            row: rowNumber,
            action: 'updated',
            id: existingUser._id,
            name: existingUser.name,
            email: existingUser.email
          });
          results.summary.updated++;
        } else {
          // Create new user (generate random password)
          const randomPassword = Math.random().toString(36).slice(-8);
          const hashedPassword = await bcrypt.hash(randomPassword, 12);
          
          userData.password = hashedPassword;
          const newUser = await User.create(userData);
          
          results.success.push({
            row: rowNumber,
            action: 'created',
            id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            password: randomPassword // Include for admin reference
          });
          results.summary.created++;
        }

      } catch (error) {
        results.errors.push(`Row ${rowNumber}: ${error.message}`);
        results.summary.failed++;
      }
    }

    return results;
  }

  // Generate CSV template headers
  static getTemplateHeaders(dataType) {
    switch (dataType) {
      case 'products':
        return [
          'Name',
          'Description', 
          'Price',
          'Stock',
          'SKU',
          'Brand',
          'Category',
          'Status'
        ];
      case 'categories':
        return [
          'Name',
          'Description',
          'Slug',
          'Parent Category',
          'Status'
        ];
      case 'users':
        return [
          'Name',
          'Email',
          'Role',
          'Status'
        ];
      default:
        return [];
    }
  }

  // Validate CSV structure
  static validateCSVStructure(headers, dataType) {
    const requiredHeaders = this.getTemplateHeaders(dataType);
    const missingHeaders = requiredHeaders.filter(header => 
      !headers.some(h => h.toLowerCase() === header.toLowerCase())
    );

    return {
      isValid: missingHeaders.length === 0,
      missingHeaders,
      requiredHeaders
    };
  }
}

module.exports = CSVProcessor; 