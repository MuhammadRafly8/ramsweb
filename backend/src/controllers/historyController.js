const { History, User, Matrix } = require('../models');
const { Op } = require('sequelize');

// Get all history entries (admin only)
async function getAllHistory(req, res) {
  try {
    const history = await History.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username']
        },
        {
          model: Matrix,
          as: 'matrix',
          attributes: ['id', 'title']
        }
      ],
      order: [['timestamp', 'DESC']]
    });
    
    return res.status(200).json(history);
  } catch (error) {
    console.error('Error fetching history:', error);
    return res.status(500).json({ error: 'Failed to fetch history' });
  }
}

// Get history entries for a specific matrix
async function getHistoryByMatrixId(req, res) {
  try {
    const { matrixId } = req.params;
    const isAdmin = req.user.role === 'admin';
    
    // Build query conditions
    const whereConditions = { matrixId };
    
    // If not admin, only show entries that are not admin-only
    if (!isAdmin) {
      whereConditions.adminOnly = false;
    }
    
    const historyEntries = await History.findAll({
      where: whereConditions,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username']
        }
      ],
      order: [['timestamp', 'DESC']]
    });
    
    return res.status(200).json(historyEntries);
  } catch (error) {
    console.error('Error fetching history:', error);
    return res.status(500).json({ error: 'Failed to fetch history' });
  }
}

// Get all history entries (admin only)
async function getAllHistory(req, res) {
  try {
    // Only admins can access all history
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const historyEntries = await History.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username']
        }
      ],
      order: [['timestamp', 'DESC']]
    });
    
    return res.status(200).json(historyEntries);
  } catch (error) {
    console.error('Error fetching history:', error);
    return res.status(500).json({ error: 'Failed to fetch history' });
  }
}

// Check if matrix exists
async function getHistoryByMatrixId(req, res) {
  try {
    const { matrixId } = req.params;
    
    // Check if matrix exists
    const matrix = await Matrix.findByPk(matrixId);
    if (!matrix) {
      return res.status(404).json({ error: 'Matrix not found' });
    }
    
    // Get history for this matrix
    const history = await History.findAll({
      where: { matrixId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username']
        }
      ],
      order: [['timestamp', 'DESC']]
    });
    
    return res.status(200).json(history);
  } catch (error) {
    console.error('Error fetching matrix history:', error);
    return res.status(500).json({ error: 'Failed to fetch matrix history' });
  }
}

// Create a new history entry
async function createHistoryEntry(req, res) {
  try {
    const { 
      matrixId, action, rowId, columnId, rowName, 
      columnName, cellKey, details, matrixSnapshot 
    } = req.body;
    
    // Check if matrix exists
    const matrix = await Matrix.findByPk(matrixId);
    if (!matrix) {
      return res.status(404).json({ error: 'Matrix not found' });
    }
    
    // Create history entry
    const historyEntry = await History.create({
      userId: req.user.id,
      userRole: req.user.role,
      matrixId,
      timestamp: new Date(),
      action,
      rowId,
      columnId,
      rowName,
      columnName,
      cellKey,
      details,
      matrixSnapshot
    });
    
    return res.status(201).json(historyEntry);
  } catch (error) {
    console.error('Error creating history entry:', error);
    return res.status(500).json({ error: 'Failed to create history entry' });
  }
}

// Delete a history entry (admin only)
async function deleteHistoryEntry(req, res) {
  try {
    const { id } = req.params;
    
    // Check if history entry exists
    const historyEntry = await History.findByPk(id);
    if (!historyEntry) {
      return res.status(404).json({ error: 'History entry not found' });
    }
    
    // Delete history entry
    await historyEntry.destroy();
    
    return res.status(200).json({ message: 'History entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting history entry:', error);
    return res.status(500).json({ error: 'Failed to delete history entry' });
  }
}

module.exports = {
  getAllHistory,
  getHistoryByMatrixId,
  createHistoryEntry,
  deleteHistoryEntry
};