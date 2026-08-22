const express = require('express');
const router = express.Router();
const multer = require('multer');
const { parse } = require('csv-parse');
const fs = require('fs');
const EnergyRecord = require('../models/EnergyRecord');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');
const demoDataService = require('../services/demoDataService');

const upload = multer({ dest: 'uploads/' });

router.use(protect);

// POST /api/data/upload/:projectId — Upload CSV and ingest records
router.post('/upload/:projectId', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    try {
        const project = await Project.findOne({ _id: req.params.projectId, owner: req.user.userId });
        if (!project) {
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ message: 'Project not found' });
        }

        const records = [];
        let columns = [];
        let missingFields = new Set();

        const requiredFields = ['solarGeneration', 'windGeneration', 'energyDemand', 'batterySOC'];

        const parser = fs.createReadStream(req.file.path).pipe(
            parse({ columns: true, skip_empty_lines: true, cast: true })
        );

        for await (const row of parser) {
            if (!columns.length) {
                columns = Object.keys(row);
                requiredFields.forEach(f => { if (!columns.includes(f)) missingFields.add(f); });
            }

            records.push({
                projectId: project._id,
                timestamp: new Date(row.timestamp || row.date || row.datetime || Date.now()),
                solarGeneration: Number(row.solarGeneration || row.solar_generation || 0),
                windGeneration: Number(row.windGeneration || row.wind_generation || 0),
                totalCapacity: Number(row.totalCapacity || row.total_capacity || 400),
                temperature: Number(row.temperature || row.temp || 20),
                solarIrradiance: Number(row.solarIrradiance || row.irradiance || 0),
                cloudCoverage: Number(row.cloudCoverage || row.cloud_coverage || 0),
                humidity: Number(row.humidity || 60),
                windSpeed: Number(row.windSpeed || row.wind_speed || 0),
                windDirection: Number(row.windDirection || row.wind_direction || 0),
                rainProbability: Number(row.rainProbability || row.rain_prob || 0),
                batteryCapacity: Number(row.batteryCapacity || row.battery_capacity || 500),
                batterySOC: Number(row.batterySOC || row.battery_soc || 50),
                chargeRate: Number(row.chargeRate || row.charge_rate || 0),
                dischargeRate: Number(row.dischargeRate || row.discharge_rate || 0),
                energyDemand: Number(row.energyDemand || row.energy_demand || row.demand || 0),
                gridAvailability: row.gridAvailability !== undefined ? Boolean(row.gridAvailability) : true,
                gridPrice: Number(row.gridPrice || row.grid_price || 0.1)
            });
        }

        await EnergyRecord.insertMany(records);
        project.dataCount = (project.dataCount || 0) + records.length;
        project.lastUpdated = new Date();
        project.status = 'active';
        await project.save();

        fs.unlinkSync(req.file.path);

        res.json({
            inserted: records.length,
            columns,
            missingFields: Array.from(missingFields),
            stats: { total: records.length, columns: columns.length }
        });
    } catch (err) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ message: err.message });
    }
});

// POST /api/data/demo — Generate and insert 30-day synthetic demo dataset
router.post('/demo', async (req, res) => {
    try {
        const projectId = await demoDataService.generateAndInsert(req.user.userId);
        res.json({ projectId, message: 'Demo Solar + Wind Microgrid dataset generated (720 hourly records, 30 days)' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/data/stats/:projectId — Comprehensive dataset statistics
router.get('/stats/:projectId', async (req, res) => {
    try {
        const projectId = req.params.projectId;

        // Use MongoDB aggregation for efficient stats
        const [aggResult] = await EnergyRecord.aggregate([
            { $match: { projectId: require('mongoose').Types.ObjectId.createFromHexString(projectId) } },
            {
                $group: {
                    _id: null,
                    totalRecords: { $sum: 1 },
                    firstTimestamp: { $min: '$timestamp' },
                    lastTimestamp: { $max: '$timestamp' },
                    avgSolarGen: { $avg: '$solarGeneration' },
                    maxSolarGen: { $max: '$solarGeneration' },
                    minSolarGen: { $min: '$solarGeneration' },
                    avgWindGen: { $avg: '$windGeneration' },
                    maxWindGen: { $max: '$windGeneration' },
                    minWindGen: { $min: '$windGeneration' },
                    avgDemand: { $avg: '$energyDemand' },
                    maxDemand: { $max: '$energyDemand' },
                    minDemand: { $min: '$energyDemand' },
                    avgBatterySOC: { $avg: '$batterySOC' },
                    avgGridPrice: { $avg: '$gridPrice' },
                    avgTemp: { $avg: '$temperature' },
                    avgWindSpeed: { $avg: '$windSpeed' },
                    avgCloudCoverage: { $avg: '$cloudCoverage' },
                    totalSolarEnergy: { $sum: '$solarGeneration' },
                    totalWindEnergy: { $sum: '$windGeneration' },
                    totalDemandEnergy: { $sum: '$energyDemand' }
                }
            }
        ]);

        if (!aggResult) return res.json({ totalRecords: 0 });

        // Get latest record for current status
        const latestRecord = await EnergyRecord.findOne({ projectId }).sort({ timestamp: -1 }).lean();

        res.json({
            totalRecords: aggResult.totalRecords,
            dateRange: { start: aggResult.firstTimestamp, end: aggResult.lastTimestamp },
            latest: latestRecord,
            averages: {
                solarGeneration: Math.round(aggResult.avgSolarGen * 10) / 10,
                windGeneration: Math.round(aggResult.avgWindGen * 10) / 10,
                energyDemand: Math.round(aggResult.avgDemand * 10) / 10,
                batterySOC: Math.round(aggResult.avgBatterySOC * 10) / 10,
                gridPrice: Math.round(aggResult.avgGridPrice * 1000) / 1000,
                temperature: Math.round(aggResult.avgTemp * 10) / 10,
                windSpeed: Math.round(aggResult.avgWindSpeed * 10) / 10,
                cloudCoverage: Math.round(aggResult.avgCloudCoverage * 10) / 10
            },
            peaks: {
                maxSolarGen: Math.round(aggResult.maxSolarGen * 10) / 10,
                maxWindGen: Math.round(aggResult.maxWindGen * 10) / 10,
                maxDemand: Math.round(aggResult.maxDemand * 10) / 10
            },
            totals: {
                solarEnergy: Math.round(aggResult.totalSolarEnergy),
                windEnergy: Math.round(aggResult.totalWindEnergy),
                totalGeneration: Math.round(aggResult.totalSolarEnergy + aggResult.totalWindEnergy),
                totalDemand: Math.round(aggResult.totalDemandEnergy)
            }
        });
    } catch (err) {
        console.error('Stats error:', err);
        res.status(500).json({ message: err.message });
    }
});

// GET /api/data/records/:projectId — Paginated energy records
router.get('/records/:projectId', async (req, res) => {
    try {
        const { limit = 100, skip = 0, startDate, endDate } = req.query;
        let query = { projectId: req.params.projectId };

        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = new Date(startDate);
            if (endDate) query.timestamp.$lte = new Date(endDate);
        }

        const [records, total] = await Promise.all([
            EnergyRecord.find(query)
                .sort({ timestamp: 1 })
                .skip(Number(skip))
                .limit(Number(limit))
                .lean(),
            EnergyRecord.countDocuments(query)
        ]);

        res.json({ records, total, limit: Number(limit), skip: Number(skip) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
