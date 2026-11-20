const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect, jwtSecret } = require('../middleware/auth');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const generateToken = (userId, email) =>
    jwt.sign({ userId, email }, jwtSecret(), { expiresIn: '30d', algorithm: 'HS256' });

// Reject non-string credentials outright: a JSON object such as {"$ne": null} must never reach a query.
function readCredentials(body, { register = false } = {}) {
    const { name, email, password } = body || {};
    if (typeof email !== 'string' || typeof password !== 'string' || (register && typeof name !== 'string')) {
        return { error: 'Missing fields' };
    }
    const normalised = email.trim().toLowerCase();
    if (!EMAIL_RE.test(normalised) || normalised.length > 254) return { error: 'Invalid email address' };
    if (register && password.length < 8) return { error: 'Password must be at least 8 characters' };
    if (register && !name.trim()) return { error: 'Missing fields' };
    return { name: register ? name.trim().slice(0, 100) : undefined, email: normalised, password };
}

router.post('/register', async (req, res, next) => {
    try {
        const creds = readCredentials(req.body, { register: true });
        if (creds.error) return res.status(400).json({ message: creds.error });
        const userExists = await User.findOne({ email: creds.email });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        const user = await User.create({ name: creds.name, email: creds.email, password: creds.password });
        res.status(201).json({
            token: generateToken(user._id, user.email),
            user: { _id: user._id, name: user.name, email: user.email }
        });
    } catch (err) { next(err); }
});

router.post('/login', async (req, res, next) => {
    try {
        const creds = readCredentials(req.body);
        if (creds.error) return res.status(400).json({ message: creds.error });
        const user = await User.findOne({ email: creds.email }).select('+password');
        if (user && (await user.comparePassword(creds.password))) {
            res.json({ token: generateToken(user._id, user.email), user: { _id: user._id, name: user.name, email: user.email } });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (err) { next(err); }
});

router.get('/me', protect, async (req, res, next) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) { next(err); }
});

module.exports = router;
