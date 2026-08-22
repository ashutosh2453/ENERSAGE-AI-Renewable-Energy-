const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const EnergyRecord = require('../models/EnergyRecord');
const Forecast = require('../models/Forecast');
const Alert = require('../models/Alert');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', async (req, res) => {
    try {
        const projects = await Project.find({ owner: req.user.userId });
        res.json(projects);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', async (req, res) => {
    try {
        const { name, description } = req.body;
        const project = await Project.create({ name, description, owner: req.user.userId });
        res.status(201).json(project);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/:id', async (req, res) => {
    try {
        const project = await Project.findOne({ _id: req.params.id, owner: req.user.userId });
        if (!project) return res.status(404).json({ message: 'Project not found' });
        res.json(project);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', async (req, res) => {
    try {
        const project = await Project.findOne({ _id: req.params.id, owner: req.user.userId });
        if (!project) return res.status(404).json({ message: 'Project not found' });
        
        await EnergyRecord.deleteMany({ projectId: project._id });
        await Forecast.deleteMany({ projectId: project._id });
        await Alert.deleteMany({ projectId: project._id });
        await project.deleteOne();
        
        res.json({ message: 'Project deleted' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
