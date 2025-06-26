const Support = require('../models/Support');
const ActivityLog = require('../models/ActivityLog');

// Get all support tickets with filtering and pagination
const getAllTickets = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      priority,
      category,
      assignedTo,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (priority && priority !== 'all') filter.priority = priority;
    if (category && category !== 'all') filter.category = category;
    if (assignedTo && assignedTo !== 'all') filter.assignedTo = assignedTo;

    // Search functionality
    if (search) {
      filter.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query
    const tickets = await Support.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('assignedTo', 'name email')
      .populate('orderId', 'orderNumber totalPrice')
      .populate('productId', 'name price');

    // Get total count for pagination
    const total = await Support.countDocuments(filter);

    // Log activity
    await ActivityLog.create({
      action: 'VIEW_SUPPORT_TICKETS',
      user: req.user._id,
      description: `Viewed support tickets with filters: ${JSON.stringify(filter)}`,
      ipAddress: req.ip
    });

    res.json({
      tickets,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    res.status(500).json({ message: 'Error fetching support tickets' });
  }
};

// Get single ticket by ID
const getTicketById = async (req, res) => {
  try {
    const ticket = await Support.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('orderId', 'orderNumber totalPrice items')
      .populate('productId', 'name price images')
      .populate('responses.adminId', 'name email');

    if (!ticket) {
      return res.status(404).json({ message: 'Support ticket not found' });
    }

    // Log activity
    await ActivityLog.create({
      action: 'VIEW_SUPPORT_TICKET',
      user: req.user._id,
      description: `Viewed support ticket: ${ticket._id}`,
      ipAddress: req.ip
    });

    res.json(ticket);
  } catch (error) {
    console.error('Error fetching support ticket:', error);
    res.status(500).json({ message: 'Error fetching support ticket' });
  }
};

// Create new support ticket (customer facing)
const createTicket = async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      subject,
      message,
      category,
      priority,
      orderId,
      productId
    } = req.body;

    // Validate required fields
    if (!customerName || !customerEmail || !subject || !message) {
      return res.status(400).json({ 
        message: 'Customer name, email, subject, and message are required' 
      });
    }

    // Create ticket
    const ticket = new Support({
      customerName,
      customerEmail,
      customerPhone,
      subject,
      message,
      category: category || 'general',
      priority: priority || 'medium',
      orderId,
      productId
    });

    await ticket.save();

    // Log activity
    await ActivityLog.create({
      action: 'CREATE_SUPPORT_TICKET',
      user: req.user?._id || null,
      description: `New support ticket created: ${ticket._id} by ${customerEmail}`,
      ipAddress: req.ip
    });

    res.status(201).json({
      message: 'Support ticket created successfully',
      ticketId: ticket._id
    });
  } catch (error) {
    console.error('Error creating support ticket:', error);
    res.status(500).json({ message: 'Error creating support ticket' });
  }
};

// Update ticket status and assignment (admin only)
const updateTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      priority,
      assignedTo,
      internalNotes,
      tags
    } = req.body;

    const updateData = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (assignedTo) updateData.assignedTo = assignedTo;
    if (internalNotes !== undefined) updateData.internalNotes = internalNotes;
    if (tags) updateData.tags = tags;

    const ticket = await Support.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('assignedTo', 'name email');

    if (!ticket) {
      return res.status(404).json({ message: 'Support ticket not found' });
    }

    // Log activity
    await ActivityLog.create({
      action: 'UPDATE_SUPPORT_TICKET',
      user: req.user._id,
      description: `Updated support ticket: ${ticket._id} - Status: ${status}, Priority: ${priority}`,
      ipAddress: req.ip
    });

    res.json({
      message: 'Support ticket updated successfully',
      ticket
    });
  } catch (error) {
    console.error('Error updating support ticket:', error);
    res.status(500).json({ message: 'Error updating support ticket' });
  }
};

// Add admin response to ticket
const addResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, isInternal = false } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: 'Response message is required' });
    }

    const ticket = await Support.findById(id);
    if (!ticket) {
      return res.status(404).json({ message: 'Support ticket not found' });
    }

    // Add response
    const response = {
      adminId: req.user._id,
      adminName: req.user.name,
      message: message.trim(),
      isInternal,
      createdAt: new Date()
    };

    ticket.responses.push(response);

    // Update ticket status if it was open
    if (ticket.status === 'open') {
      ticket.status = 'in_progress';
    }

    await ticket.save();

    // Log activity
    await ActivityLog.create({
      action: 'ADD_SUPPORT_RESPONSE',
      user: req.user._id,
      description: `Added response to support ticket: ${ticket._id}`,
      ipAddress: req.ip
    });

    res.json({
      message: 'Response added successfully',
      response
    });
  } catch (error) {
    console.error('Error adding response:', error);
    res.status(500).json({ message: 'Error adding response' });
  }
};

// Delete support ticket (admin only)
const deleteTicket = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await Support.findByIdAndDelete(id);
    if (!ticket) {
      return res.status(404).json({ message: 'Support ticket not found' });
    }

    // Log activity
    await ActivityLog.create({
      action: 'DELETE_SUPPORT_TICKET',
      user: req.user._id,
      description: `Deleted support ticket: ${id}`,
      ipAddress: req.ip
    });

    res.json({ message: 'Support ticket deleted successfully' });
  } catch (error) {
    console.error('Error deleting support ticket:', error);
    res.status(500).json({ message: 'Error deleting support ticket' });
  }
};

// Get support statistics
const getSupportStats = async (req, res) => {
  try {
    const stats = await Support.getStats();

    // Get recent tickets count
    const recentTickets = await Support.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    // Get average response time
    const ticketsWithResponses = await Support.find({
      'responses.0': { $exists: true }
    });

    let totalResponseTime = 0;
    let responseCount = 0;

    ticketsWithResponses.forEach(ticket => {
      if (ticket.responses.length > 0) {
        const firstResponse = ticket.responses[0];
        const responseTime = firstResponse.createdAt - ticket.createdAt;
        totalResponseTime += responseTime;
        responseCount++;
      }
    });

    const averageResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0;

    res.json({
      ...stats,
      recentTickets,
      averageResponseTime: Math.round(averageResponseTime / (1000 * 60 * 60)), // in hours
      totalTickets: await Support.countDocuments()
    });
  } catch (error) {
    console.error('Error fetching support stats:', error);
    res.status(500).json({ message: 'Error fetching support statistics' });
  }
};

// Bulk update tickets
const bulkUpdateTickets = async (req, res) => {
  try {
    const { ticketIds, updates } = req.body;

    if (!ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0) {
      return res.status(400).json({ message: 'Ticket IDs are required' });
    }

    const result = await Support.updateMany(
      { _id: { $in: ticketIds } },
      updates,
      { runValidators: true }
    );

    // Log activity
    await ActivityLog.create({
      action: 'BULK_UPDATE_SUPPORT_TICKETS',
      user: req.user._id,
      description: `Bulk updated ${ticketIds.length} support tickets`,
      ipAddress: req.ip
    });

    res.json({
      message: `Successfully updated ${result.modifiedCount} tickets`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error bulk updating tickets:', error);
    res.status(500).json({ message: 'Error bulk updating tickets' });
  }
};

module.exports = {
  getAllTickets,
  getTicketById,
  createTicket,
  updateTicket,
  addResponse,
  deleteTicket,
  getSupportStats,
  bulkUpdateTickets
}; 