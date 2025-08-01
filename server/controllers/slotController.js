const ParkingSlot = require('../models/ParkingSlot');
const ParkingSession = require('../models/ParkingSession');
const PricingConfig = require('../models/PricingConfig');

exports.getAllSlots = async (req, res) => {
    try {
        const { slotType, status } = req.query;
        let query = {};

        if (slotType) {
            query.slotType = slotType;
        }
        if (status) {
            query.status = status;
        }

        const slots = await ParkingSlot.find(query).populate('currentSession', 'vehicleNumberPlate entryTime');
        res.json(slots);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getDashboardCounts = async (req, res) => {
    try {
        const totalSlots = await ParkingSlot.countDocuments(); 
        const freeSlots = await ParkingSlot.countDocuments({ status: 'Available' }); 
        const occupiedSlots = await ParkingSlot.countDocuments({ status: 'Occupied' }); 
        const maintenanceSlots = await ParkingSlot.countDocuments({ status: 'Maintenance' });

        res.json({
            totalSlots,
            freeSlots,
            occupiedSlots,
            maintenanceSlots
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.updateSlotStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['Maintenance', 'Available'].includes(status)) {
            return res.status(400).json({ msg: 'Invalid status provided. Must be "Maintenance" or "Available".' });
        }

        const slot = await ParkingSlot.findById(id);

        if (!slot) {
            return res.status(404).json({ msg: 'Parking slot not found.' });
        }

        if (slot.status === 'Occupied' && status === 'Maintenance') {
            return res.status(400).json({ msg: 'Cannot set an occupied slot to maintenance. Check out vehicle first.' });
        }

        slot.status = status; 
        await slot.save();

        res.json(slot);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.seedSlots = async (req, res) => {
    try {
        await ParkingSlot.deleteMany({});
        await PricingConfig.deleteMany({});

        const slotsToCreate = [
            { slotNumber: 'A1-01', slotType: 'Regular' },
            { slotNumber: 'A1-02', slotType: 'Regular' },
            { slotNumber: 'A1-03', slotType: 'Compact' },
            { slotNumber: 'B1-01', slotType: 'EV', isChargerAvailable: true },
            { slotNumber: 'B1-02', slotType: 'Handicap Accessible' },
            { slotNumber: 'C1-01', slotType: 'Bike' },
            { slotNumber: 'C1-02', slotType: 'Bike' },
            { slotNumber: 'D1-01', slotType: 'Regular' },
            { slotNumber: 'D1-02', slotType: 'Regular' },
            { slotNumber: 'E1-01', slotType: 'EV', isChargerAvailable: false },
            { slotNumber: 'E1-02', slotType: 'Regular' },
            { slotNumber: 'F1-01', slotType: 'Compact' },
            { slotNumber: 'G1-01', slotType: 'Handicap Accessible' },
            { slotNumber: 'H1-01', slotType: 'Bike' },
        ];

        const createdSlots = await ParkingSlot.insertMany(slotsToCreate);

        // --- ADD PRICING CONFIGURATION SEEDING ---
        const hourlyPricing = {
            type: 'Hourly',
            hourlyRates: [
                { durationHours: 1, amount: 50 },
                { durationHours: 3, amount: 100 },
                { durationHours: 6, amount: 150 },
                { durationHours: 24, amount: 200 } // Use a large number for 6+ hours max cap
            ],
            maxHourlyCap: 200
        };

        const dayPassPricing = {
            type: 'Day Pass',
            dayPassRate: 150
        };

        await PricingConfig.create(hourlyPricing);
        await PricingConfig.create(dayPassPricing);
        // --- END PRICING CONFIGURATION SEEDING ---

        res.status(201).json({ msg: 'Slots and pricing seeded successfully', count: createdSlots.length, slots: createdSlots });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};