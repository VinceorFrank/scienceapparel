const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { requireAuth, requireAdmin } = require('../middlewares/auth');

// Apply admin middleware to all routes
router.use(requireAuth, requireAdmin);

router.get('/clv', statsController.getCLV);
router.get('/users-by-country', statsController.getUsersByCountry);
router.get('/revenue-over-time', statsController.getRevenueOverTime);
router.get('/top-products', statsController.getTopProducts);
router.get('/orders-by-status', statsController.getOrdersByStatus);
router.get('/new-customers-over-time', statsController.getNewCustomersOverTime);
router.get('/revenue-by-category', statsController.getRevenueByCategory);
router.get('/aov', statsController.getAOV);
router.get('/low-stock-products', statsController.getLowStockProducts);
router.get('/repeat-vs-onetime-customers', statsController.getRepeatVsOneTimeCustomers);

// New enhanced analytics routes
router.get('/conversion-rate', statsController.getConversionRate);
router.get('/abandoned-cart-metrics', statsController.getAbandonedCartMetrics);
router.get('/newsletter-analytics', statsController.getNewsletterAnalytics);
router.get('/admin-activity-analytics', statsController.getAdminActivityAnalytics);

router.post('/custom-pie', statsController.getCustomPieChart);

router.get('/support-ticket-stats', statsController.getSupportTicketStats);
router.get('/top-customers', statsController.getTopCustomers);
router.get('/revenue-by-product', statsController.getRevenueByProduct);
router.get('/order-status-over-time', statsController.getOrderStatusOverTime);

module.exports = router; 