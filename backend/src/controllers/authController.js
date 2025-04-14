const { User } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// Register new user
exports.register = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { username, email, password } = req.body;
    
    // Log for debugging
    console.log('Register attempt:', { username, email });
    
    // Check if username already exists
    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    // Check if email already exists
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: 'user' // Default role
    });
    
    // Don't return password
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };
    
    return res.status(201).json({ 
      message: 'User registered successfully', 
      user: userData 
    });
  } catch (error) {
    console.error('Registration error on server:', error);
    return res.status(500).json({ 
      error: 'Registration failed. Please try again.' 
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { username, password } = req.body;
    
    // Find user
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
};

// Get current user
// Perbaiki getCurrentUser untuk mengembalikan data user lengkap
exports.getCurrentUser = async (req, res) => {
  try {
    // req.user sudah diisi oleh middleware authenticate
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] } // Jangan sertakan password
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Kembalikan data user dengan token yang sama
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(500).json({ error: 'Failed to get user data' });
  }
};

// Logout user (optional, as JWT is stateless)
exports.logout = async (req, res) => {
  // JWT is stateless, so we don't need to do anything on the server
  // The client should remove the token
  return res.status(200).json({ message: 'Logged out successfully' });
};

// Update user role (admin only)
exports.updateUserRole = async (req, res) => {
  try {
    // Check if requester is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const { userId, newRole } = req.body;
    
    // Validate role
    if (!['user', 'admin'].includes(newRole)) {
      return res.status(400).json({ error: 'Invalid role. Must be "user" or "admin"' });
    }
    
    // Find user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update role
    user.role = newRole;
    await user.save();
    
    return res.status(200).json({
      message: 'User role updated successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Update user role error:', error);
    return res.status(500).json({ error: 'Failed to update user role' });
  }
};

// Add these functions to the existing authController.js file

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    // Check if requester is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'role', 'createdAt']
    });
    
    return res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Create new user (admin only)
exports.createUser = async (req, res) => {
  try {
    // Check if requester is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const { username, email, password, role } = req.body;
    
    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }
    
    // Check if username already exists
    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    // Check if email already exists
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: role || 'user' // Default to 'user' if not specified
    });
    
    // Don't return password
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    };
    
    return res.status(201).json({ 
      message: 'User created successfully', 
      user: userData 
    });
  } catch (error) {
    console.error('User creation error:', error);
    return res.status(500).json({ 
      error: 'User creation failed. Please try again.' 
    });
  }
};

// Delete user (admin only)
exports.deleteUser = async (req, res) => {
  try {
    // Check if requester is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const { id } = req.params;
    
    // Find user
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Prevent deleting yourself
    if (user.id === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }
    
    // Delete user
    await user.destroy();
    
    return res.status(200).json({ 
      message: 'User deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
};
