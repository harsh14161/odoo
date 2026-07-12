const express = require('express');
const router = express.Router();
const controller = require('../controllers/maintenanceController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.get('/', controller.list);
router.post('/', authorize('fleet_manager', 'admin'), controller.create);
router.put('/:id/close', authorize('fleet_manager', 'admin'), controller.close);
router.delete('/:id', authorize('fleet_manager', 'admin'), controller.remove);

module.exports = router;
