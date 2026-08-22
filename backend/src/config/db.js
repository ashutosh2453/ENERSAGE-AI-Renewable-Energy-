const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 3000 });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.log(`Primary MongoDB Connection failed (${error.message}). Attempting In-Memory MongoDB fallback...`);
        try {
            const { MongoMemoryServer } = require('mongodb-memory-server');
            const mongoServer = await MongoMemoryServer.create();
            const uri = mongoServer.getUri();
            const conn = await mongoose.connect(uri);
            console.log(`In-Memory MongoDB Connected successfully at: ${uri}`);
        } catch (memErr) {
            console.error(`In-Memory MongoDB Error: ${memErr.message}`);
        }
    }
};

module.exports = connectDB;

