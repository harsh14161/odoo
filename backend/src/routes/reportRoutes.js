const express = require('express');
const router = express.Router();
const controller = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.get('/vehicles', authorize('financial_analyst', 'fleet_manager', 'admin'), controller.vehicleReport);
router.get('/vehicles/export/csv', authorize('financial_analyst', 'fleet_manager', 'admin'), controller.exportCsv);

module.exports = router;
