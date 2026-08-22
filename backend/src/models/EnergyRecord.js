const mongoose = require('mongoose');

const energyRecordSchema = new mongoose.Schema({
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    timestamp: { type: Date, required: true, index: true },
    solarGeneration: Number,
    windGeneration: Number,
    totalCapacity: Number,
    temperature: Number,
    solarIrradiance: Number,
    cloudCoverage: Number,
    humidity: Number,
    windSpeed: Number,
    windDirection: Number,
    rainProbability: Number,
    batteryCapacity: Number,
    batterySOC: Number,
    chargeRate: Number,
    dischargeRate: Number,
    energyDemand: Number,
    gridAvailability: Boolean,
    gridPrice: Number
});

energyRecordSchema.index({ projectId: 1, timestamp: 1 });

module.exports = mongoose.model('EnergyRecord', energyRecordSchema);
