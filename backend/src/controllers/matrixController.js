const { Matrix, User, History } = require('../models');
const { Op } = require('sequelize');

// Get all matrices (admin only)
async function getAllMatrices(req, res) {
  try {
    const matrices = await Matrix.findAll({
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username']
        }
      ]
    });
    
    return res.status(200).json(matrices);
  } catch (error) {
    console.error('Error fetching matrices:', error);
    return res.status(500).json({ error: 'Failed to fetch matrices' });
  }
}

// Get matrices created by user or shared with user
async function getUserMatrices(req, res) {
  try {
    const userId = req.user.id;
    
    const matrices = await Matrix.findAll({
      where: {
        [Op.or]: [
          { createdBy: userId },
          { sharedWith: { [Op.contains]: [userId] } }
        ]
      },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username']
        }
      ]
    });
    
    return res.status(200).json(matrices);
  } catch (error) {
    console.error('Error fetching user matrices:', error);
    return res.status(500).json({ error: 'Failed to fetch matrices' });
  }
}

// Get matrix by ID
async function getMatrixById(req, res) {
  try {
    const { id } = req.params;
    
    const matrix = await Matrix.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username']
        }
      ]
    });
    
    if (!matrix) {
      return res.status(404).json({ error: 'Matrix not found' });
    }
    
    return res.status(200).json(matrix);
  } catch (error) {
    console.error('Error fetching matrix:', error);
    return res.status(500).json({ error: 'Failed to fetch matrix' });
  }
}

// Create new matrix
async function createMatrix(req, res) {
  try {
    const { title, description, keyword, data } = req.body;
    const userId = req.user.id;
    
    const newMatrix = await Matrix.create({
      title,
      description,
      keyword,
      data: data || {
        rows: [],
        columns: [],
        dependencies: {}
      },
      createdBy: userId
    });
    
    return res.status(201).json(newMatrix);
  } catch (error) {
    console.error('Error creating matrix:', error);
    return res.status(500).json({ error: 'Failed to create matrix' });
  }
}

// Remove this duplicate import
// const { User, History } = require('../models');
// const Matrix = require('../models/matrix');

// Update matrix
async function updateMatrix(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Find the matrix
    const matrix = await Matrix.findByPk(id);
    
    if (!matrix) {
      return res.status(404).json({ error: 'Matrix not found' });
    }
    
    // Check if user is authorized to update this matrix
    // Allow both admin and users with the correct keyword
    const isAdmin = req.user.role === 'admin';
    const isCreator = matrix.createdBy === req.user.id;
    const hasCorrectKeyword = updates.keyword === matrix.keyword;
    
    if (!isAdmin && !isCreator && !hasCorrectKeyword) {
      return res.status(403).json({ error: 'Not authorized to update this matrix' });
    }
    
    // Update the matrix
    await matrix.update(updates);
    
    return res.status(200).json(matrix);
  } catch (error) {
    console.error('Error updating matrix:', error);
    return res.status(500).json({ error: 'Failed to update matrix' });
  }
}

// Delete matrix
async function deleteMatrix(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const matrix = await Matrix.findByPk(id);
    
    if (!matrix) {
      return res.status(404).json({ error: 'Matrix not found' });
    }
    
    // Check if user is the creator or admin
    if (matrix.createdBy !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this matrix' });
    }
    
    // First delete related history entries to avoid foreign key constraint errors
    await History.destroy({
      where: { matrixId: id }
    });
    
    // Then delete the matrix
    await matrix.destroy();
    
    return res.status(200).json({ message: 'Matrix deleted successfully' });
  } catch (error) {
    console.error('Error deleting matrix:', error);
    return res.status(500).json({ error: 'Failed to delete matrix', details: error.message });
  }
}

// Add this function to your matrixController.js file

// Verify matrix access with keyword
async function verifyMatrixAccess(req, res) {
  try {
    const { id } = req.params;
    const { keyword } = req.body;
    
    if (!keyword) {
      return res.status(400).json({ error: 'Keyword is required' });
    }
    
    // Find the matrix
    const matrix = await Matrix.findByPk(id);
    
    if (!matrix) {
      return res.status(404).json({ error: 'Matrix not found' });
    }
    
    // Check if the keyword matches
    const isAuthorized = matrix.keyword === keyword;
    
    if (isAuthorized) {
      // If user is authenticated, add this matrix to their authorized matrices
      if (req.user) {
        // Check if user already has access
        const userAccess = await MatrixAccess.findOne({
          where: {
            userId: req.user.id,
            matrixId: id
          }
        });
        
        // If not, create access record
        if (!userAccess) {
          await MatrixAccess.create({
            userId: req.user.id,
            matrixId: id
          });
        }
      }
      
      return res.status(200).json({ 
        authorized: true,
        message: 'Access granted'
      });
    }
    
    return res.status(200).json({ 
      authorized: false,
      message: 'Invalid keyword'
    });
  } catch (error) {
    console.error('Error verifying matrix access:', error);
    return res.status(500).json({ error: 'Failed to verify access' });
  }
}

// Add this new function for column averages
async function getMatrixColumnAverages(req, res) {
  try {
    const { matrixId } = req.params;
    
    // Find the matrix
    const matrix = await Matrix.findByPk(matrixId);
    if (!matrix) {
      return res.status(404).json({ error: 'Matrix not found' });
    }
    
    // Get all history entries for this matrix that have matrix snapshots
    const historyEntries = await History.findAll({
      where: {
        matrixId: matrixId,
        matrixSnapshot: {
          [Op.not]: null
        }
      }
    });
    
    if (historyEntries.length === 0) {
      return res.status(200).json({ 
        message: 'No history data available for this matrix',
        averages: [] 
      });
    }
    
    // Process each snapshot to calculate column averages
    const columnCounts = {};
    const columnTotals = {};
    
    for (const entry of historyEntries) {
      try {
        const snapshot = JSON.parse(entry.matrixSnapshot);
        let matrixData;
        
        // Handle different matrix data structures
        if (snapshot.data && snapshot.data.dependencies) {
          matrixData = snapshot.data;
        } else if (snapshot.dependencies) {
          matrixData = snapshot;
        } else {
          continue; // Skip invalid snapshots
        }
        
        // Count dependencies for each column
        for (const [key, value] of Object.entries(matrixData.dependencies)) {
          if (value) {
            const [rowId, colId] = key.split('_').map(Number);
            
            if (!columnCounts[colId]) {
              columnCounts[colId] = 0;
              columnTotals[colId] = 0;
            }
            
            columnCounts[colId]++;
            columnTotals[colId]++;
          }
        }
      } catch (error) {
        console.error('Error processing matrix snapshot:', error);
        // Continue with next entry
      }
    }
    
    // Calculate averages
    const averages = [];
    const currentMatrix = matrix.data;
    
    // Make sure we have column information
    if (currentMatrix && currentMatrix.columns) {
      for (const column of currentMatrix.columns) {
        averages.push({
          id: column.id,
          name: column.name,
          average: columnCounts[column.id] ? 
            columnTotals[column.id] / historyEntries.length : 0
        });
      }
    }
    
    return res.status(200).json({ averages });
  } catch (error) {
    console.error('Error calculating column averages:', error);
    return res.status(500).json({ error: 'Failed to calculate column averages' });
  }
}

module.exports = {
  getAllMatrices,
  getUserMatrices,
  getMatrixById,
  createMatrix,
  updateMatrix,
  deleteMatrix,
  verifyMatrixAccess,
  getMatrixColumnAverages 
};