const ParkingSession = require('../models/ParkingSession');
const ParkingSlot = require('../models/ParkingSlot');

const getCompatibleSlotTypes = (vehicleType) => {
    switch (vehicleType) {
        case 'Car':
            return ['Regular', 'Compact'];
        case 'Bike':
            return ['Bike'];
        case 'EV':
            return ['EV'];
        case 'Handicap Accessible':
            return ['Handicap Accessible'];
        default:
            return [];
    }
};

exports.checkInVehicle = async (req, res) => {
    const { numberPlate, vehicleType, billingType, manualSlotId } = req.body;

    if (!numberPlate || !vehicleType || !billingType) {
        return res.status(400).json({ msg: 'Please enter all required fields: number plate, vehicle type, and billing type.' });
    }
    if (!['Car', 'Bike', 'EV', 'Handicap Accessible'].includes(vehicleType)) {
        return res.status(400).json({ msg: 'Invalid vehicle type.' });
    }
    if (!['Hourly', 'Day Pass'].includes(billingType)) {
        return res.status(400).json({ msg: 'Invalid billing type.' });
    }

    try {
        let assignedSlot = null;

        const existingActiveSession = await ParkingSession.findOne({ vehicleNumberPlate: numberPlate, status: 'Active' })
                                                        .populate('slot', 'slotNumber');
        if (existingActiveSession) {
            return res.status(400).json({ msg: `Vehicle with number plate ${numberPlate} is already actively parked in slot ${existingActiveSession.slot.slotNumber}.` });
        }

        if (manualSlotId) {
            const slot = await ParkingSlot.findById(manualSlotId);

            if (!slot) {
                return res.status(404).json({ msg: 'Manual slot not found.' });
            }
            if (slot.status !== 'Available') {
                return res.status(400).json({ msg: `Selected slot ${slot.slotNumber} is not available (${slot.status}).` });
            }

            const compatibleTypes = getCompatibleSlotTypes(vehicleType);
            if (!compatibleTypes.includes(slot.slotType) && !(vehicleType === 'Car' && slot.slotType === 'Compact')) {
                return res.status(400).json({ msg: `Selected slot ${slot.slotNumber} is not compatible with vehicle type ${vehicleType}.` });
            }
            if (vehicleType === 'EV' && slot.slotType === 'EV' && !slot.isChargerAvailable) {
                return res.status(400).json({ msg: `Selected EV slot ${slot.slotNumber} does not have a charger available.` });
            }
            assignedSlot = slot;

        } else {
            const compatibleSlotTypes = getCompatibleSlotTypes(vehicleType);
            let query = {
                status: 'Available',
                slotType: { $in: compatibleSlotTypes }
            };

            if (vehicleType === 'EV') {
                query.isChargerAvailable = true;
            }

            assignedSlot = await ParkingSlot.findOne(query).sort({ slotNumber: 1 });

            if (!assignedSlot && vehicleType === 'EV') {
                assignedSlot = await ParkingSlot.findOne({ status: 'Available', slotType: 'EV', isChargerAvailable: false }).sort({ slotNumber: 1 });
                if (assignedSlot) {
                    console.log(`Warning: EV vehicle assigned to slot ${assignedSlot.slotNumber} without charger.`);
                }
            }
            if (!assignedSlot && vehicleType === 'Car') {
                assignedSlot = await ParkingSlot.findOne({ status: 'Available', slotType: 'Compact' }).sort({ slotNumber: 1 });
            }

            if (!assignedSlot) {
                return res.status(400).json({ msg: `No available slot found for vehicle type ${vehicleType}.` });
            }
        }

        const newSession = new ParkingSession({
            vehicleNumberPlate: numberPlate,
            vehicleType: vehicleType,
            slot: assignedSlot._id,
            billingType: billingType,
            billingAmount: billingType === 'Day Pass' ? 150 : 0
        });
        await newSession.save();

        assignedSlot.status = 'Occupied';
        assignedSlot.currentSession = newSession._id;
        await assignedSlot.save();

        res.status(201).json({
            msg: 'Vehicle checked in successfully',
            session: newSession,
            assignedSlot: {
                _id: assignedSlot._id,
                slotNumber: assignedSlot.slotNumber,
                slotType: assignedSlot.slotType
            }
        });

    } catch (err) {
        console.error(err.message);
        if (err.code === 11000) {
            return res.status(400).json({ msg: 'Duplicate key error. Vehicle might already be in session or slot number exists.' });
        }
        res.status(500).send('Server Error');
    }
};

exports.searchSession = async (req, res) => {
    const { numberPlate } = req.query;

    if (!numberPlate) {
        return res.status(400).json({ msg: 'Please provide a number plate for search.' });
    }

    try {
        const session = await ParkingSession.findOne({ vehicleNumberPlate: numberPlate, status: 'Active' })
                                             .populate('slot', 'slotNumber slotType');

        if (!session) {
            return res.status(404).json({ msg: 'No active session found for this number plate.' });
        }

        res.json(session);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};