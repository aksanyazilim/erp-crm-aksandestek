const express = require('express');
const { body } = require('express-validator');
const {
  getTickets,
  getTicket,
  createTicket,
  updateTicket,
  getDashboardStats
} = require('../controllers/ticketController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(auth);

// Validation rules
const ticketValidation = [
  body('subject').notEmpty().withMessage('Subject is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('module').isIn(['crm', 'erp', 'custom']).withMessage('Invalid module'),
  body('priority').isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority')
];

// Routes
router.get('/', getTickets);
router.get('/stats', getDashboardStats);
router.get('/:id', getTicket);
router.post('/', ticketValidation, createTicket);
router.put('/:id', ticketValidation, updateTicket);
router.put('/:id/assign', auth, authorize('admin'), assignTicket);

module.exports = router;