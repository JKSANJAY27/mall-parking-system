const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');

router.post('/checkin', sessionController.checkInVehicle);
router.get('/search', sessionController.searchSession);
router.put('/checkout/:sessionId', sessionController.checkOutVehicle);

module.exports = router;