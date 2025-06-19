const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI_ATLAS, { dbName: process.env.DB_NAME }).then(() => {
    console.log('mongoose connected');
}).catch((err) => console.log(err.message));

mongoose.connection.on('connected', () => {
    console.log('✅ Connected to MongoDB');
})

mongoose.connection.on('error', (err) => {
    console.log('❌ MongoDB connection error:', err.message);
})

mongoose.connection.on('disconnected', () => {
    console.log('mongoose disconnected');
})

//* close connection to DB when the app is closed
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    process.exit(0);
})