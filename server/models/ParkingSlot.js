const mongoose = require('mongoose');

const ParkingSlotSchema = new mongoose.Schema({
    slotNumber: {
        type: String,
        required: [true, 'Slot number is required'],
        unique: true,
        trim: true
    },
    slotType: {
        type: String,
        enum: ['Regular', 'Compact', 'EV', 'Handicap Accessible', 'Bike'],
        required: [true, 'Slot type is required']
    },
    status: {
        type: String,
        enum: ['Available', 'Occupied', 'Maintenance'],
        default: 'Available'
    },
    isChargerAvailable: {
        type: Boolean,
        default: false
    },
    currentSession: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ParkingSession',
        default: null
    }
}, { timestamps: true }); // Mongoose will add `createdAt` and `updatedAt` fields automatically

// Pre-save hook: Ensure EV slots have isChargerAvailable set to true by default
// and non-EV slots have it as false, unless explicitly overridden.
ParkingSlotSchema.pre('save', function(next) {
    if (this.isModified('slotType') || this.isNew) { // Only run if slotType changes or new document
        if (this.slotType === 'EV' && typeof this.isChargerAvailable === 'undefined') {
            this.isChargerAvailable = true; // Default EV slots to have a charger
        } else if (this.slotType !== 'EV') {
            this.isChargerAvailable = false; // Non-EV slots don't have chargers
        }
    }
    next();
});

module.exports = mongoose.model('ParkingSlot', ParkingSlotSchema);