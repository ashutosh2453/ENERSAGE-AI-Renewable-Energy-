const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const EnergyRecord = require('../models/EnergyRecord');
const { makeDecision } = require('../services/decisionEngine');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/:projectId', async (req, res) => {
    try {
        const project = await Project.findOne({ _id: req.params.projectId, owner: req.user.userId });
        if (!project) return res.status(404).json({ message: 'Project not found' });

        const { solarDelta = 0, windDelta = 0, cloudDelta = 0, demandDelta = 0, batteryCapacity, gridPrice } = req.body;

        const latestRecord = await EnergyRecord.findOne({ projectId: project._id }).sort({ timestamp: -1 });
        if (!latestRecord) return res.status(404).json({ message: 'No data found to simulate on' });

        const baseSolar = latestRecord.solarGeneration || 0;
        const baseWind = latestRecord.windGeneration || 0;
        const baseDemand = latestRecord.energyDemand || 0;
        const baseSOC = latestRecord.batterySOC || 50;
        const baseCapacity = latestRecord.batteryCapacity || 500;
        const baseGridPrice = latestRecord.gridPrice || 0.1;

        const baselineDecision = makeDecision({
            solarGen: baseSolar,
            windGen: baseWind,
            demand: baseDemand,
            batterySOC: baseSOC,
            batteryCapacity: baseCapacity,
            gridPrice: baseGridPrice,
            gridAvailability: latestRecord.gridAvailability !== false
        });

        // Apply percentage deltas; cloud reduces solar
        const cloudFactor = 1 - Math.max(0, Math.min(1, cloudDelta / 100));
        const simSolar = Math.max(0, baseSolar * (1 + solarDelta / 100) * cloudFactor);
        const simWind = Math.max(0, baseWind * (1 + windDelta / 100));
        const simDemand = Math.max(0, baseDemand * (1 + demandDelta / 100));
        const simCapacity = batteryCapacity || baseCapacity;
        const simGridPrice = gridPrice || baseGridPrice;

        const simulatedDecision = makeDecision({
            solarGen: simSolar,
            windGen: simWind,
            demand: simDemand,
            batterySOC: baseSOC,
            batteryCapacity: simCapacity,
            gridPrice: simGridPrice,
            gridAvailability: latestRecord.gridAvailability !== false
        });

        const baseline = {
            ...baselineDecision,
            solarGen: baseSolar,
            windGen: baseWind,
            demand: baseDemand,
            batteryCapacity: baseCapacity,
            gridPrice: baseGridPrice
        };

        const simulated = {
            ...simulatedDecision,
            solarGen: simSolar,
            windGen: simWind,
            demand: simDemand,
            batteryCapacity: simCapacity,
            gridPrice: simGridPrice
        };

        res.json({
            baseline,
            simulated,
            comparison: {
                actionChanged: baselineDecision.action !== simulatedDecision.action,
                generationDelta: (simulatedDecision.totalGeneration - baselineDecision.totalGeneration).toFixed(1),
                surplusDelta: (simulatedDecision.surplus - baselineDecision.surplus).toFixed(1)
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
