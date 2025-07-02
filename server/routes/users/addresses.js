/**
 * User Address Management Routes
 * Handles user address operations
 */

const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const ActivityLog = require('../../models/ActivityLog');
const { requireAuth } = require('../../middlewares/auth');
const { validateAddress } = require('../../middlewares/validators/userValidators');
const { sendSuccess, sendError, sendNotFound } = require('../../utils/responseHandler');

// GET /api/users/addresses - Get user's addresses
router.get('/', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('addresses');
    if (!user) {
      return sendNotFound(res, 'User');
    }

    sendSuccess(res, 200, 'Addresses retrieved successfully', {
      addresses: user.addresses
    });
  } catch (err) {
    sendError(res, 500, 'Server error', err);
  }
});

// POST /api/users/addresses - Add new address
router.post('/', requireAuth, validateAddress, async (req, res) => {
  try {
    const { 
      type, firstName, lastName, address, city, state, postalCode, country, phone, company, isDefault 
    } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return sendNotFound(res, 'User');
    }

    const addressData = {
      type,
      firstName,
      lastName,
      address,
      city,
      state,
      postalCode,
      country,
      phone,
      company,
      isDefault: isDefault || false
    };

    // If this is the first address or marked as default, set it as default
    if (user.addresses.length === 0 || isDefault) {
      // Remove default from other addresses
      user.addresses.forEach(addr => addr.isDefault = false);
      addressData.isDefault = true;
    }

    user.addresses.push(addressData);
    await user.save();

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'add_address',
      description: `Added new ${type} address`
    });

    sendSuccess(res, 201, 'Address added successfully', {
      address: addressData
    });
  } catch (err) {
    sendError(res, 500, 'Server error', err);
  }
});

// PUT /api/users/addresses/:id - Update address
router.put('/:id', requireAuth, validateAddress, async (req, res) => {
  try {
    const { 
      type, firstName, lastName, address, city, state, postalCode, country, phone, company, isDefault 
    } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return sendNotFound(res, 'User');
    }

    const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === req.params.id);
    if (addressIndex === -1) {
      return sendNotFound(res, 'Address');
    }

    const addressData = {
      type,
      firstName,
      lastName,
      address,
      city,
      state,
      postalCode,
      country,
      phone,
      company,
      isDefault: isDefault || false
    };

    // If setting as default, remove default from other addresses
    if (isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    user.addresses[addressIndex] = { ...user.addresses[addressIndex], ...addressData };
    await user.save();

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'update_address',
      description: `Updated ${type} address`
    });

    sendSuccess(res, 200, 'Address updated successfully', {
      address: user.addresses[addressIndex]
    });
  } catch (err) {
    sendError(res, 500, 'Server error', err);
  }
});

// DELETE /api/users/addresses/:id - Delete address
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return sendNotFound(res, 'User');
    }

    const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === req.params.id);
    if (addressIndex === -1) {
      return sendNotFound(res, 'Address');
    }

    const deletedAddress = user.addresses[addressIndex];
    user.addresses.splice(addressIndex, 1);

    // If deleted address was default and there are other addresses, set first as default
    if (deletedAddress.isDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'delete_address',
      description: `Deleted ${deletedAddress.type} address`
    });

    sendSuccess(res, 200, 'Address deleted successfully');
  } catch (err) {
    sendError(res, 500, 'Server error', err);
  }
});

// PATCH /api/users/addresses/:id/default - Set address as default
router.patch('/:id/default', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return sendNotFound(res, 'User');
    }

    const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === req.params.id);
    if (addressIndex === -1) {
      return sendNotFound(res, 'Address');
    }

    // Remove default from all addresses
    user.addresses.forEach(addr => addr.isDefault = false);
    
    // Set selected address as default
    user.addresses[addressIndex].isDefault = true;
    await user.save();

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'set_default_address',
      description: `Set ${user.addresses[addressIndex].type} address as default`
    });

    sendSuccess(res, 200, 'Default address updated successfully', {
      address: user.addresses[addressIndex]
    });
  } catch (err) {
    sendError(res, 500, 'Server error', err);
  }
});

module.exports = router; 