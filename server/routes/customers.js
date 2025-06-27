const express = require('express');
const router = express.Router();
const { getCustomerInsights, getCLVDistribution, getGeoDistribution } = require('../controllers/customerInsightsController');

// GET /api/customers/insights
router.get('/insights', getCustomerInsights);
// GET /api/customers/clv-distribution
router.get('/clv-distribution', getCLVDistribution);
// GET /api/customers/geo
router.get('/geo', getGeoDistribution);

module.exports = router; 