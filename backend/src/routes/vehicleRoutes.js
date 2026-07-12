const express = require('express');
const router = express.Router();
const controller = require('../controllers/vehicleController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.get('/', controller.list);
router.get('/available', controller.availableForDispatch);
router.get('/:id', controller.getOne);
router.post('/', authorize('fleet_manager', 'admin'), controller.create);
router.put('/:id', authorize('fleet_manager', 'admin'), controller.update);
router.delete('/:id', authorize('fleet_manager', 'admin'), controller.remove);

module.exports = router;
