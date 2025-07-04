const express = require('express');
const router = express.Router();
const {
  getAllTickets,
  getTicketById,
  createTicket,
  updateTicket,
  addResponse,
  deleteTicket,
  getSupportStats,
  bulkUpdateTickets
} = require('../controllers/supportController');

const { requireAuth, requireAdmin } = require('../middlewares/auth');

// Apply authentication middleware to all support routes
router.use(requireAuth);

// Public routes (customer facing)
router.post('/', createTicket); // Create new support ticket

// Admin-only routes (require authentication and admin role)
router.use(requireAdmin);

// Get all tickets with filtering and pagination
router.get('/', getAllTickets);

// Get support statistics
router.get('/stats', getSupportStats);

// Get single ticket by ID
router.get('/:id', getTicketById);

// Update ticket (status, priority, assignment, etc.)
router.put('/:id', updateTicket);

// Add admin response to ticket
router.post('/:id/response', addResponse);

// Delete ticket
router.delete('/:id', deleteTicket);

// Bulk update tickets
router.put('/bulk/update', bulkUpdateTickets);

module.exports = router;





