require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./src/config/db');
const errorHandler = require('./src/middleware/errorHandler');

const authRoutes = require('./src/routes/auth');
const projectRoutes = require('./src/routes/projects');
const dataRoutes = require('./src/routes/data');
const forecastRoutes = require('./src/routes/forecast');
const simulateRoutes = require('./src/routes/simulate');
const alertRoutes = require('./src/routes/alerts');
const copilotRoutes = require('./src/routes/copilot');

const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/forecast', forecastRoutes);
app.use('/api/simulate', simulateRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/copilot', copilotRoutes);

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
