const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    dataCount: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
    status: { type: String, enum: ['active', 'training', 'ready'], default: 'active' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Project', projectSchema);
