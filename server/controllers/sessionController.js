const ParkingSession = require('../models/ParkingSession');
const ParkingSlot = require('../models/ParkingSlot');
const PricingConfig = require('../models/PricingConfig'); 

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

const calculateHourlyBill = (durationMinutes, pricingConfig) => {
    let totalAmount = 0;
    const { hourlyRates, maxHourlyCap } = pricingConfig;

    const durationHours = durationMinutes / 60;

    hourlyRates.sort((a, b) => a.durationHours - b.durationHours);

    for (let i = 0; i < hourlyRates.length; i++) {
        const currentSlab = hourlyRates[i];
        const prevSlabDuration = i > 0 ? hourlyRates[i-1].durationHours : 0;

        if (durationHours > prevSlabDuration) {
            const effectiveDurationInSlab = Math.min(durationHours, currentSlab.durationHours) - prevSlabDuration;

            if (effectiveDurationInSlab > 0) {
                if (durationHours <= currentSlab.durationHours) {
                    totalAmount = currentSlab.amount;
                    break;
                }
            }
        }
    }

    if (totalAmount > maxHourlyCap) {
        totalAmount = maxHourlyCap;
    }

    return totalAmount;
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
        const pricingConfig = await PricingConfig.findOne({ type: 'Day Pass' });

        const existingActiveSession = await ParkingSession.findOne({ vehicleNumberPlate: numberPlate, status: 'Active' })
                                                        .populate('slot', 'slotNumber');
        if (existingActiveSession) {
            return res.status(400).json({ msg: `Vehicle with number plate ${numberPlate} is already actively parked in slot ${existingActiveSession.slot.slotNumber}.` });
        }

        if (manualSlotId) {
            assignedSlot = await ParkingSlot.findOne({ slotNumber: manualSlotId.toUpperCase() });

            if (!assignedSlot) {
                return res.status(404).json({ msg: `Manual slot '${manualSlotId}' not found.` });
            }
            if (assignedSlot.status !== 'Available') {
                return res.status(400).json({ msg: `Selected slot ${assignedSlot.slotNumber} is not available (${assignedSlot.status}).` });
            }

            const compatibleTypes = getCompatibleSlotTypes(vehicleType);
            if (!compatibleTypes.includes(assignedSlot.slotType) && !(vehicleType === 'Car' && assignedSlot.slotType === 'Compact')) {
                return res.status(400).json({ msg: `Selected slot ${assignedSlot.slotNumber} is not compatible with vehicle type ${vehicleType}.` });
            }
            if (vehicleType === 'EV' && assignedSlot.slotType === 'EV' && !assignedSlot.isChargerAvailable) {
                return res.status(400).json({ msg: `Selected EV slot ${assignedSlot.slotNumber} does not have a charger available.` });
            }

        } else {
            const compatibleSlotTypes = getCompatibleSlotTypes(vehicleType);
            let query = {
                status: 'Available',
                slotType: { $in: compatibleSlotTypes }
            };

            if (vehicleType === 'EV') {
                assignedSlot = await ParkingSlot.findOne({ ...query, isChargerAvailable: true }).sort({ slotNumber: 1 });
            }
            if (!assignedSlot) {
                assignedSlot = await ParkingSlot.findOne(query).sort({ slotNumber: 1 });
            }

            if (!assignedSlot && vehicleType === 'Car') {
                assignedSlot = await ParkingSlot.findOne({ status: 'Available', slotType: 'Compact' }).sort({ slotNumber: 1 });
            }
            if (!assignedSlot && vehicleType === 'EV') {
                assignedSlot = await ParkingSlot.findOne({ status: 'Available', slotType: 'EV', isChargerAvailable: false }).sort({ slotNumber: 1 });
                if (assignedSlot) {
                    console.log(`Warning: EV vehicle assigned to slot ${assignedSlot.slotNumber} without charger.`);
                }
            }
        }

        if (!assignedSlot) {
            return res.status(400).json({ msg: `No available slot found for vehicle type ${vehicleType}. Please check the dashboard.` });
        }

        const newSession = new ParkingSession({
            vehicleNumberPlate: numberPlate,
            vehicleType: vehicleType,
            slot: assignedSlot._id,
            billingType: billingType,
            billingAmount: billingType === 'Day Pass' ? (pricingConfig ? pricingConfig.dayPassRate : 150) : 0
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

exports.checkOutVehicle = async (req, res) => {
    try {
        const { sessionId } = req.params;

        const session = await ParkingSession.findById(sessionId).populate('slot');

        if (!session) {
            return res.status(404).json({ msg: 'Parking session not found.' });
        }
        if (session.status === 'Completed') {
            return res.status(400).json({ msg: 'This parking session has already been completed.' });
        }

        session.exitTime = new Date();
        session.status = 'Completed';

        let finalBillingAmount = session.billingAmount;

        if (session.billingType === 'Hourly') {
            const entryTime = session.entryTime;
            const exitTime = session.exitTime;
            const durationMs = exitTime.getTime() - entryTime.getTime();
            const durationMinutes = Math.ceil(durationMs / (1000 * 60));

            const pricingConfig = await PricingConfig.findOne({ type: 'Hourly' });

            if (!pricingConfig) {
                return res.status(500).json({ msg: 'Hourly pricing configuration not found.' });
            }

            finalBillingAmount = calculateHourlyBill(durationMinutes, pricingConfig);
        }

        session.billingAmount = finalBillingAmount;
        await session.save();

        if (session.slot) {
            session.slot.status = 'Available';
            session.slot.currentSession = null;
            await session.slot.save();
        }

        res.json({
            msg: 'Vehicle checked out successfully',
            session: session,
            slotFreed: session.slot ? session.slot.slotNumber : 'N/A'
        });

    } catch (err) {
        console.error(err.message);
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