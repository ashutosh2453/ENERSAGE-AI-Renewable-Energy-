const mongoose = require('mongoose');

const forecastSchema = new mongoose.Schema({
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    generatedAt: { type: Date, default: Date.now },
    horizon: Number,
    predictions: [{
        timestamp: Date,
        value: Number,
        upperBound: Number,
        lowerBound: Number,
        confidence: Number
    }],
    featureImportance: { type: Map, of: Number },
    confidenceScore: Number,
    xaiReasons: [String],
    modelType: String
});

module.exports = mongoose.model('Forecast', forecastSchema);
