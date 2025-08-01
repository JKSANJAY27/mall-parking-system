const mongoose = require('mongoose');

const ParkingSessionSchema = new mongoose.Schema({
    vehicleNumberPlate: {
        type: String,
        required: [true, 'Vehicle number plate is required'],
        trim: true
    },
    vehicleType: {
        type: String,
        enum: ['Car', 'Bike', 'EV', 'Handicap Accessible'],
        required: [true, 'Vehicle type is required']
    },
    slot: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ParkingSlot',
        required: [true, 'Parking slot is required']
    },
    entryTime: {
        type: Date,
        default: Date.now
    },
    exitTime: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        enum: ['Active', 'Completed'],
        default: 'Active'
    },
    billingType: {
        type: String,
        enum: ['Hourly', 'Day Pass'],
        required: [true, 'Billing type is required']
    },
    billingAmount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('ParkingSession', ParkingSessionSchema);