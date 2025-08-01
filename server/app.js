const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const ParkingSlot = require('./models/ParkingSlot');
const ParkingSession = require('./models/ParkingSession');
const PricingConfig = require('./models/PricingConfig');

const app = express();

connectDB();

app.use(express.json({ extended: false }));
app.use(cors());

app.get('/', (req, res) => res.send('Mall Parking System API is running...'));

app.use('/api/slots', require('./routes/slotRoutes')); 
app.use('/api/sessions', require('./routes/sessionRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));

module.exports = app;