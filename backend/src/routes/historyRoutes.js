const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');
const { authenticate, isAdmin } = require('../middleware/authMiddleware');

// Apply auth middleware to all routes
router.use(authenticate);

// Get all history entries (admin only)
router.get('/', isAdmin, historyController.getAllHistory);

// Get history entries for a specific matrix
router.get('/matrix/:matrixId', historyController.getHistoryByMatrixId);

// Create a new history entry
router.post('/', historyController.createHistoryEntry);

// Delete a history entry (admin only)
router.delete('/:id', isAdmin, historyController.deleteHistoryEntry);

module.exports = router;