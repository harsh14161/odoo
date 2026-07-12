const express = require('express');
const router = express.Router();
const controller = require('../controllers/tripController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.get('/', controller.list);
router.get('/:id', controller.getOne);
router.post('/', authorize('driver', 'fleet_manager', 'admin'), controller.create);
router.put('/:id/dispatch', authorize('driver', 'fleet_manager', 'admin'), controller.dispatch);
router.put('/:id/complete', authorize('driver', 'fleet_manager', 'admin'), controller.complete);
router.put('/:id/cancel', authorize('driver', 'fleet_manager', 'admin'), controller.cancel);

module.exports = router;
