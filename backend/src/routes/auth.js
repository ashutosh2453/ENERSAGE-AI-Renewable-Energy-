const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const generateToken = (userId, email) => {
    return jwt.sign({ userId, email }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' });
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        const user = await User.create({ name, email, password });
        res.status(201).json({
            token: generateToken(user._id, user.email),
            user: { _id: user._id, name: user.name, email: user.email }
        });
    } catch (err) { res.status(500).json({ message: err.message }); }
});


router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email }).select('+password');
        if (user && (await user.comparePassword(password))) {
            res.json({ token: generateToken(user._id, user.email), user: { _id: user._id, name: user.name, email: user.email } });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
