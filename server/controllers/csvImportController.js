const CSVProcessor = require('../utils/csvProcessor');
const { sendSuccess, sendError } = require('../utils/responseHandler');

// Import products from CSV
const importProducts = async (req, res) => {
  try {
    const { csvData } = req.body;
    
    if (!csvData || !Array.isArray(csvData)) {
      return res.status(400).json({ 
        message: 'Invalid CSV data. Please provide an array of product objects.' 
      });
    }

    // Validate CSV structure
    if (csvData.length > 0) {
      const headers = Object.keys(csvData[0]);
      const validation = CSVProcessor.validateCSVStructure(headers, 'products');
      
      if (!validation.isValid) {
        return res.status(400).json({
          message: 'Invalid CSV structure',
          missingHeaders: validation.missingHeaders,
          requiredHeaders: validation.requiredHeaders
        });
      }
    }

    // Process the CSV data
    const results = await CSVProcessor.processProducts(csvData);
    
    res.json({
      message: 'Products import completed',
      summary: results.summary,
      success: results.success,
      errors: results.errors
    });

  } catch (error) {
    console.error('Error importing products:', error);
    res.status(500).json({ 
      message: 'Error importing products',
      error: error.message 
    });
  }
};

// Import categories from CSV
const importCategories = async (req, res) => {
  try {
    const { csvData } = req.body;
    
    if (!csvData || !Array.isArray(csvData)) {
      return res.status(400).json({ 
        message: 'Invalid CSV data. Please provide an array of category objects.' 
      });
    }

    // Validate CSV structure
    if (csvData.length > 0) {
      const headers = Object.keys(csvData[0]);
      const validation = CSVProcessor.validateCSVStructure(headers, 'categories');
      
      if (!validation.isValid) {
        return res.status(400).json({
          message: 'Invalid CSV structure',
          missingHeaders: validation.missingHeaders,
          requiredHeaders: validation.requiredHeaders
        });
      }
    }

    // Process the CSV data
    const results = await CSVProcessor.processCategories(csvData);
    
    res.json({
      message: 'Categories import completed',
      summary: results.summary,
      success: results.success,
      errors: results.errors
    });

  } catch (error) {
    console.error('Error importing categories:', error);
    res.status(500).json({ 
      message: 'Error importing categories',
      error: error.message 
    });
  }
};

// Import users from CSV
const importUsers = async (req, res) => {
  try {
    const { csvData } = req.body;
    
    if (!csvData || !Array.isArray(csvData)) {
      return res.status(400).json({ 
        message: 'Invalid CSV data. Please provide an array of user objects.' 
      });
    }

    // Validate CSV structure
    if (csvData.length > 0) {
      const headers = Object.keys(csvData[0]);
      const validation = CSVProcessor.validateCSVStructure(headers, 'users');
      
      if (!validation.isValid) {
        return res.status(400).json({
          message: 'Invalid CSV structure',
          missingHeaders: validation.missingHeaders,
          requiredHeaders: validation.requiredHeaders
        });
      }
    }

    // Process the CSV data
    const results = await CSVProcessor.processUsers(csvData);
    
    // Filter out passwords from the response for security
    const sanitizedSuccess = results.success.map(item => {
      const { password, ...sanitizedItem } = item;
      return sanitizedItem;
    });

    // Create a separate array of new users with passwords for admin reference
    const newUsersWithPasswords = results.success
      .filter(item => item.action === 'created' && item.password)
      .map(item => ({
        name: item.name,
        email: item.email,
        password: item.password
      }));

    res.json({
      message: 'Users import completed',
      summary: results.summary,
      success: sanitizedSuccess,
      errors: results.errors,
      newUsersWithPasswords: newUsersWithPasswords.length > 0 ? newUsersWithPasswords : undefined
    });

  } catch (error) {
    console.error('Error importing users:', error);
    res.status(500).json({ 
      message: 'Error importing users',
      error: error.message 
    });
  }
};

// Get CSV template headers
const getTemplateHeaders = async (req, res) => {
  try {
    const { dataType } = req.params;
    
    if (!dataType) {
      return res.status(400).json({ message: 'Data type is required' });
    }

    const headers = CSVProcessor.getTemplateHeaders(dataType);
    
    if (headers.length === 0) {
      return res.status(400).json({ message: 'Invalid data type' });
    }

    res.json({
      dataType,
      headers,
      sampleData: headers.map(header => ({ [header]: '' }))
    });

  } catch (error) {
    console.error('Error getting template headers:', error);
    res.status(500).json({ 
      message: 'Error getting template headers',
      error: error.message 
    });
  }
};

// Validate CSV data without importing
const validateCSV = async (req, res) => {
  try {
    const { csvData, dataType } = req.body;
    
    if (!csvData || !Array.isArray(csvData) || !dataType) {
      return res.status(400).json({ 
        message: 'Invalid request. Please provide csvData array and dataType.' 
      });
    }

    // Validate CSV structure
    if (csvData.length > 0) {
      const headers = Object.keys(csvData[0]);
      const validation = CSVProcessor.validateCSVStructure(headers, dataType);
      
      if (!validation.isValid) {
        return res.status(400).json({
          message: 'Invalid CSV structure',
          missingHeaders: validation.missingHeaders,
          requiredHeaders: validation.requiredHeaders
        });
      }
    }

    // Basic data validation based on type
    const errors = [];
    csvData.forEach((row, index) => {
      const rowNumber = index + 1;
      
      if (dataType === 'products') {
        if (!row.Name || !row.Price) {
          errors.push(`Row ${rowNumber}: Name and Price are required`);
        }
        if (row.Price && isNaN(parseFloat(row.Price))) {
          errors.push(`Row ${rowNumber}: Price must be a number`);
        }
      }
      
      if (dataType === 'categories') {
        if (!row.Name) {
          errors.push(`Row ${rowNumber}: Name is required`);
        }
      }
      
      if (dataType === 'users') {
        if (!row.Email || !row.Name) {
          errors.push(`Row ${rowNumber}: Email and Name are required`);
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (row.Email && !emailRegex.test(row.Email)) {
          errors.push(`Row ${rowNumber}: Invalid email format`);
        }
      }
    });

    res.json({
      isValid: errors.length === 0,
      errors,
      totalRows: csvData.length,
      dataType
    });

  } catch (error) {
    console.error('Error validating CSV:', error);
    res.status(500).json({ 
      message: 'Error validating CSV',
      error: error.message 
    });
  }
};

module.exports = {
  importProducts,
  importCategories,
  importUsers,
  getTemplateHeaders,
  validateCSV
}; 