const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Forecast = require('../models/Forecast');
const EnergyRecord = require('../models/EnergyRecord');
const axios = require('axios');
const { protect } = require('../middleware/auth');
const alertService = require('../services/alertService');

router.use(protect);

// POST /api/forecast/train/:projectId — Train ML model on project data
router.post('/train/:projectId', async (req, res) => {
    try {
        const project = await Project.findOne({ _id: req.params.projectId, owner: req.user.userId });
        if (!project) return res.status(404).json({ message: 'Project not found' });

        project.status = 'training';
        await project.save();

        // Fetch all records for training
        const records = await EnergyRecord.find({ projectId: project._id })
            .sort({ timestamp: 1 })
            .lean();

        if (records.length < 50) {
            project.status = 'ready';
            await project.save();
            return res.status(400).json({ message: 'Insufficient data for training. Need at least 50 records.' });
        }

        // Call ML service to train
        const mlResponse = await axios.post(`${process.env.ML_SERVICE_URL}/train`, {
            projectId: project._id.toString(),
            records: records
        }, { timeout: 120000 }); // 2 min timeout for training

        project.status = 'ready';
        project.lastUpdated = new Date();
        await project.save();

        res.json({
            message: 'Model trained successfully',
            modelId: mlResponse.data.modelId,
            r2Score: mlResponse.data.r2Score,
            rmse: mlResponse.data.rmse,
            featureImportance: mlResponse.data.featureImportance
        });
    } catch (err) {
        // Reset status on failure
        try {
            await Project.findByIdAndUpdate(req.params.projectId, { status: 'active' });
        } catch (_) {}
        console.error('Training error:', err.message);
        res.status(500).json({ message: err.response?.data?.detail || err.message });
    }
});

// GET /api/forecast/:projectId — Get latest stored forecast
router.get('/:projectId', async (req, res) => {
    try {
        const forecast = await Forecast.findOne({ projectId: req.params.projectId })
            .sort({ generatedAt: -1 });
        if (!forecast) return res.status(404).json({ message: 'No forecast found. Generate one first.' });
        res.json(forecast);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/forecast/generate/:projectId — Generate new forecast via ML service
router.post('/generate/:projectId', async (req, res) => {
    try {
        const project = await Project.findOne({ _id: req.params.projectId, owner: req.user.userId });
        if (!project) return res.status(404).json({ message: 'Project not found' });

        const horizon = req.body.horizon || 24;

        // Fetch last 7 days of records as context
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentRecords = await EnergyRecord.find({
            projectId: project._id,
            timestamp: { $gte: sevenDaysAgo }
        }).sort({ timestamp: 1 }).lean();

        if (recentRecords.length === 0) {
            return res.status(400).json({ message: 'No recent data available for forecasting.' });
        }

        // Call ML service for forecast
        const mlResponse = await axios.post(`${process.env.ML_SERVICE_URL}/forecast`, {
            projectId: project._id.toString(),
            records: recentRecords,
            horizon
        }, { timeout: 60000 });

        const mlData = mlResponse.data;

        // Store forecast in MongoDB
        const forecast = await Forecast.create({
            projectId: project._id,
            generatedAt: new Date(),
            horizon: mlData.horizon,
            predictions: mlData.predictions,
            featureImportance: mlData.featureImportance,
            confidenceScore: mlData.confidenceScore,
            xaiReasons: mlData.xaiReasons,
            modelType: 'RF+GBM+XGBoost Ensemble'
        });

        // Get latest record for alert generation
        const latestRecord = recentRecords[recentRecords.length - 1];
        await alertService.generateAlerts(project._id, forecast, latestRecord);

        res.json(forecast);
    } catch (err) {
        console.error('Forecast generation error:', err.message);
        res.status(500).json({ message: err.response?.data?.detail || err.message });
    }
});

module.exports = router;
