const { AhpTree, User } = require('../models');

// Create new AHP tree
exports.createAhpTree = async (req, res) => {
  try {
    const { title, treeData } = req.body;
    const userId = req.user.id;
    const ahpTree = await AhpTree.create({ userId, title, treeData });
    res.status(201).json(ahpTree);
  } catch (error) {
    console.error('Error creating AHP tree:', error);
    res.status(500).json({ error: 'Failed to create AHP tree' });
  }
};

// Get all AHP trees for user
exports.getAhpTrees = async (req, res) => {
  try {
    const userId = req.user.id;
    const trees = await AhpTree.findAll({ where: { userId }, order: [['createdAt', 'DESC']] });
    res.json(trees);
  } catch (error) {
    console.error('Error fetching AHP trees:', error);
    res.status(500).json({ error: 'Failed to fetch AHP trees' });
  }
};

// Get single AHP tree by id
exports.getAhpTreeById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const tree = await AhpTree.findOne({ where: { id, userId } });
    if (!tree) return res.status(404).json({ error: 'AHP tree not found' });
    res.json(tree);
  } catch (error) {
    console.error('Error fetching AHP tree:', error);
    res.status(500).json({ error: 'Failed to fetch AHP tree' });
  }
};

// Update AHP tree
exports.updateAhpTree = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, treeData } = req.body;
    const userId = req.user.id;
    const tree = await AhpTree.findOne({ where: { id, userId } });
    if (!tree) return res.status(404).json({ error: 'AHP tree not found' });
    tree.title = title;
    tree.treeData = treeData;
    await tree.save();
    res.json(tree);
  } catch (error) {
    console.error('Error updating AHP tree:', error);
    res.status(500).json({ error: 'Failed to update AHP tree' });
  }
};

// Delete AHP tree
exports.deleteAhpTree = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const tree = await AhpTree.findOne({ where: { id, userId } });
    if (!tree) return res.status(404).json({ error: 'AHP tree not found' });
    await tree.destroy();
    res.json({ message: 'AHP tree deleted' });
  } catch (error) {
    console.error('Error deleting AHP tree:', error);
    res.status(500).json({ error: 'Failed to delete AHP tree' });
  }
};