const express = require('express');
const authRoutes = require('./auth.routes');
const ApiResponse = require('../utils/apiResponse');

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json(
    new ApiResponse(
      200,
      {
        status: 'UP',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
      'API sunucusu çalışıyor'
    )
  );
});

// Auth route'ları
router.use('/auth', authRoutes);

module.exports = router;
