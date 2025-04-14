const express = require('express');
const router = express.Router();
const matrixController = require('../controllers/matrixController');
// Remove this line since we're importing the specific functions below
// const authMiddleware = require('../middleware/authMiddleware');
// Import the specific middleware functions
const { authenticate, isAdmin } = require('../middleware/authMiddleware');

// Verify matrix access with keyword (no authentication required)
// This route needs to be before the authenticate middleware
router.post('/:id/verify', matrixController.verifyMatrixAccess);

// Apply auth middleware to all other routes
router.use(authenticate);

// Get all matrices (admin only)
router.get('/all', isAdmin, matrixController.getAllMatrices);

// Get matrices for current user
router.get('/', matrixController.getUserMatrices);

// Get matrix by ID
router.get('/:id', matrixController.getMatrixById);

// Create new matrix
router.post('/', matrixController.createMatrix);

// Update matrix
router.put('/:id', matrixController.updateMatrix);

// Delete matrix
router.delete('/:id', matrixController.deleteMatrix);

// Add this new route - use authenticate instead of authMiddleware
router.get('/:matrixId/column-averages', matrixController.getMatrixColumnAverages);

module.exports = router;