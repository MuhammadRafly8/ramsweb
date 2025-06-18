const express = require('express');
const router = express.Router();
const ahpTreeController = require('../controllers/ahpTreeController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

router.post('/', ahpTreeController.createAhpTree);
router.get('/', ahpTreeController.getAhpTrees);
router.get('/:id', ahpTreeController.getAhpTreeById);
router.put('/:id', ahpTreeController.updateAhpTree);
router.delete('/:id', ahpTreeController.deleteAhpTree);

module.exports = router;