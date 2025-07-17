const PageAsset = require('../models/PageAsset');
const mongoose = require('mongoose');

// --- PUBLIC --------------------------------------------------
exports.getAssetsBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    console.log('[DEBUG] GET /api/pages/', slug);
    if (!slug) return res.status(400).json({ message: 'Missing page slug' });
    const assets = await PageAsset.find({ pageSlug: slug });
    console.log('[DEBUG] Found assets:', assets.length, 'for slug:', slug);
    res.json(assets);
  } catch (err) {
    console.error('[DEBUG] Error in getAssetsBySlug:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// --- ADMIN  --------------------------------------------------
exports.upsertAsset = async (req, res) => {
  try {
    const { pageSlug, slot, overlay, alt = '', productIds = [] } = req.body;
    console.log('[DEBUG] upsertAsset called with:', { pageSlug, slot, overlay, hasFile: !!req.file });
    if (!pageSlug || !slot) return res.status(400).json({ message: 'Missing pageSlug or slot' });
    
    // Build a dynamic update object
    const update = {
      pageSlug,
      slot,
      updatedBy: req.user && req.user._id ? req.user._id : undefined
    };

    // Only validate and add overlay if it's provided
    if (overlay !== undefined) {
      const overlayNum = Number(overlay);
      if (isNaN(overlayNum) || overlayNum < 0 || overlayNum > 1) {
        return res.status(400).json({ message: 'Overlay must be a number between 0 and 1' });
      }
      update.overlay = overlayNum;
    }

    // Only add alt if provided
    if (alt) update.alt = String(alt).slice(0, 200);

    // Only add productIds if provided
    if (productIds && productIds.length > 0) {
      let productIdArr = [];
      if (Array.isArray(productIds)) {
        productIdArr = productIds;
      } else if (typeof productIds === 'string') {
        // Handle single id as string
        productIdArr = [productIds];
      }
      // Validate ObjectId
      for (const id of productIdArr) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({ message: `Invalid productId: ${id}` });
        }
      }
      update.productIds = productIdArr;
    }

    // Only add imageUrl if file is uploaded
    if (req.file) {
      update.imageUrl = `/uploads/images/${req.file.filename}`;
      console.log('[DEBUG] File uploaded, imageUrl set to:', update.imageUrl);
    }

    const asset = await PageAsset.findOneAndUpdate(
      { pageSlug, slot },
      update,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json(asset);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteAsset = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid asset id' });
    }
    const asset = await PageAsset.findByIdAndDelete(id);
    if (!asset) return res.status(404).json({ message: 'Asset not found' });
    res.json({ message: 'Asset removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}; 