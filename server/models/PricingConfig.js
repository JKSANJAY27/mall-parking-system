const mongoose = require('mongoose');

const PricingConfigSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['Hourly', 'Day Pass'],
        required: true,
        unique: true
    },
    hourlyRates: [{
        durationHours: {
            type: Number,
            required: true
        },
        amount: {
            type: Number,
            required: true
        }
    }],
    dayPassRate: {
        type: Number,
        default: 150
    },
    maxHourlyCap: {
        type: Number,
        default: 200
    }
}, { timestamps: true });

module.exports = mongoose.model('PricingConfig', PricingConfigSchema);