const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    type: { type: String, enum: ['critical', 'warning', 'opportunity'], required: true },
    message: String,
    detail: String,
    timestamp: { type: Date, default: Date.now },
    resolved: { type: Boolean, default: false },
    resolvedAt: Date
});

module.exports = mongoose.model('Alert', alertSchema);
