const express = require('express');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(auth);

router.get('/support', async (req, res) => {
  try {
    const supportUsers = await User.getSupportUsers();
    res.json(supportUsers);
  } catch (error) {
    console.error('Get support users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin only routes
router.get('/', authorize('admin'), async (req, res) => {
  try {
    const users = await User.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;