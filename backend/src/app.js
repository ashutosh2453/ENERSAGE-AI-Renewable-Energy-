const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const errorHandler = require('./middleware/errorHandler');

// Strip query operators ($ne, $gt, ...) from user-supplied filter values (NoSQL injection).
mongoose.set('sanitizeFilter', true);

function createApp() {
    const app = express();
    app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }));
    app.use(helmet());
    if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));
    app.use(express.json({ limit: '1mb' }));

    app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/projects', require('./routes/projects'));
    app.use('/api/data', require('./routes/data'));
    app.use('/api/forecast', require('./routes/forecast'));
    app.use('/api/simulate', require('./routes/simulate'));
    app.use('/api/alerts', require('./routes/alerts'));
    app.use('/api/copilot', require('./routes/copilot'));

    app.use(errorHandler);
    return app;
}

module.exports = { createApp };
