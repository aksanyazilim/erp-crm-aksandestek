const Ticket = require('../models/Ticket');
const { validationResult } = require('express-validator');

const getTickets = async (req, res) => {
  try {
    const tickets = await Ticket.findAll(req.user);
    res.json(tickets);
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(parseInt(req.params.id));
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Authorization check
    if (req.user.role === 'customer' && ticket.company_id !== req.user.company_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get status history
    const statusHistory = await Ticket.getStatusHistory(ticket.id);
    ticket.statusHistory = statusHistory;

    res.json(ticket);
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const assignTicket = async (req, res) => {
  try {
    const { assigned_to } = req.body;
    
    // Sadece admin atama yapabilir
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sadece admin talep atayabilir' });
    }

    const updates = {
      assigned_to,
      status: 'assigned',
      changed_by: req.user.id
    };

    const ticket = await Ticket.update(parseInt(req.params.id), updates);
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json(ticket);
  } catch (error) {
    console.error('Assign ticket error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const createTicket = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const ticketData = {
      ...req.body,
      created_by: req.user.id
    };

    // Customer users can only create tickets for their own company
    if (req.user.role === 'customer') {
      ticketData.company_id = req.user.company_id;
    }

    // Support users cannot create tickets
    if (req.user.role === 'support') {
      return res.status(403).json({ 
        error: 'Destek personeli yeni talep oluşturamaz' 
      });
    }

    const ticket = await Ticket.create(ticketData);
    res.status(201).json(ticket);
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateTicket = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updates = {
      ...req.body,
      changed_by: req.user.id
    };

    const ticket = await Ticket.update(parseInt(req.params.id), updates);
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json(ticket);
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const stats = await Ticket.getDashboardStats();
    res.json(stats);
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getTickets,
  getTicket,
  createTicket,
  updateTicket,
  getDashboardStats,
  assignTicket
};