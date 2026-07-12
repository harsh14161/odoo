const express = require('express');
const router = express.Router();
const controller = require('../controllers/expenseController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.get('/', controller.list);
router.post('/', authorize('fleet_manager', 'financial_analyst', 'admin'), controller.create);
router.delete('/:id', authorize('fleet_manager', 'admin'), controller.remove);

module.exports = router;
