const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, isAdmin } = require('../middleware/authMiddleware');
const bcrypt = require('bcrypt');
const { User } = require('../models'); 

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.get('/me', authenticate, authController.getCurrentUser);
router.post('/logout', authenticate, authController.logout);

// Admin routes
router.get('/users', authenticate, isAdmin, authController.getAllUsers);
router.post('/users', authenticate, isAdmin, authController.createUser);
router.delete('/users/:id', authenticate, isAdmin, authController.deleteUser);
router.put('/users/role', authenticate, isAdmin, authController.updateUserRole);

// Update username - use the correct middleware names
router.put('/users/username', authenticate, isAdmin, async (req, res) => {
    try {
    const { userId, newUsername } = req.body;
    
    if (!userId || !newUsername) {
        return res.status(400).json({ error: 'User ID and new username are required' });
    }
    
      // Check if username already exists
    const existingUser = await User.findOne({ where: { username: newUsername } });
    if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ error: 'Username already exists' });
    }
    
      // Update the user
    const user = await User.findByPk(userId);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    user.username = newUsername;
    await user.save();
    
    res.json({ message: 'Username updated successfully' });
    } catch (error) {
    console.error('Error updating username:', error);
    res.status(500).json({ error: 'Failed to update username' });
    }
});

// Update password - use the correct middleware names
router.put('/users/password', authenticate, isAdmin, async (req, res) => {
    try {
    const { userId, newPassword } = req.body;
    
    if (!userId || !newPassword) {
        return res.status(400).json({ error: 'User ID and new password are required' });
    }
    
      // Find the user
    const user = await User.findByPk(userId);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
      // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
      // Update the user's password
    user.password = hashedPassword;
    await user.save();
    
    res.json({ message: 'Password updated successfully' });
    } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ error: 'Failed to update password' });
    }
});

module.exports = router;