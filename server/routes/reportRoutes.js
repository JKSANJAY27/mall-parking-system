const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/revenue/summary', reportController.getRevenueSummary);
router.get('/revenue/daily', reportController.getDailyRevenue);
router.get('/revenue/monthly', reportController.getMonthlyRevenue);

router.get('/utilization/peak-hours', reportController.getPeakHours);
router.get('/utilization/slot-usage', reportController.getSlotUtilization);

module.exports = router;