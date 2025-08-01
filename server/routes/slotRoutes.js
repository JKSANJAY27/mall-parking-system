const express = require('express');
const router = express.Router();
const slotController = require('../controllers/slotController');

router.get('/', slotController.getAllSlots);
router.get('/dashboard-counts', slotController.getDashboardCounts);
router.put('/:id/status', slotController.updateSlotStatus)
router.post('/seed', slotController.seedSlots);

module.exports = router;