const express = require('express');
const router = express.Router();
const controller = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/kpis', controller.kpis);

module.exports = router;
