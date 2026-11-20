const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const { protect } = require('../middleware/auth');
const Project = require('../models/Project');
const { requireOwnedProject } = require('../middleware/ownership');
const mongoose = require('mongoose');

router.use(protect);

const getDefaultSampleAlerts = (projectId) => [
    {
        projectId,
        type: 'critical',
        message: 'Battery Storage Low Level Warning',
        detail: 'Battery SOC dropped to 18.5%, approaching safety threshold during evening peak demand.',
        timestamp: new Date(Date.now() - 15 * 60000)
    },
    {
        projectId,
        type: 'warning',
        message: 'High Cloud Coverage Forecasted',
        detail: 'Forecast predicts 75% cloud cover tomorrow at 14:00. Solar generation expected to drop by 40%.',
        timestamp: new Date(Date.now() - 45 * 60000)
    },
    {
        projectId,
        type: 'opportunity',
        message: 'High Grid Export Price Available',
        detail: 'Grid price spiked to $0.165/kWh. Recommend discharging battery surplus to maximize revenue.',
        timestamp: new Date(Date.now() - 120 * 60000)
    },
    {
        projectId,
        type: 'warning',
        message: 'Wind Speed Fluctuation Anomaly',
        detail: 'Wind gusts exceeding 14.5 m/s detected. Output variability may impact localized microgrid stability.',
        timestamp: new Date(Date.now() - 240 * 60000)
    },
    {
        projectId,
        type: 'opportunity',
        message: 'Optimal Solar Storage Window',
        detail: 'Peak solar surplus forecasted between 11:00 AM - 2:00 PM. Battery capacity ready at 42% SOC.',
        timestamp: new Date(Date.now() - 360 * 60000)
    }
];

router.get('/:projectId', requireOwnedProject(), async (req, res, next) => {
    try {
        const projectId = req.project._id;
        let alerts = await Alert.find({ projectId, resolved: false }).sort({ timestamp: -1 });

        // If no alerts exist for this (owned) project, auto-generate sample alerts
        if (alerts.length === 0) {
            await Alert.insertMany(getDefaultSampleAlerts(projectId));
            alerts = await Alert.find({ projectId, resolved: false }).sort({ timestamp: -1 });
        }

        res.json(alerts);
    } catch (err) { next(err); }
});

router.patch('/:alertId/resolve', async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.alertId)) return res.status(404).json({ message: 'Alert not found' });
        const existing = await Alert.findById(req.params.alertId);
        // Only the owner of the alert's project may resolve it.
        const owned = existing && await Project.exists({ _id: existing.projectId, owner: req.user.userId });
        if (!owned) return res.status(404).json({ message: 'Alert not found' });
        const alert = await Alert.findByIdAndUpdate(existing._id, { resolved: true, resolvedAt: new Date() }, { new: true });
        res.json(alert);
    } catch (err) { next(err); }
});

module.exports = router;
