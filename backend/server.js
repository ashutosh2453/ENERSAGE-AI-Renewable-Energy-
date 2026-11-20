require('dotenv').config();
const connectDB = require('./src/config/db');
const { jwtSecret } = require('./src/middleware/auth');
const { createApp } = require('./src/app');

// Fail fast on a missing/placeholder secret instead of rejecting every login later.
jwtSecret();
connectDB();

const PORT = process.env.PORT || 5000;
createApp().listen(PORT, () => console.log(`Server running on port ${PORT}`));
