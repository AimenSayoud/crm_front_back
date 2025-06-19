const express = require('express');
const cors = require('cors');
const createError = require('http-errors');
require('dotenv').config();
require('./utils/init_mongodb');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
const apiRoutes = require('./api/v1');
app.use('/api/v1', apiRoutes);

// Health check
app.get('/', async (req, res, next) => {
    res.send({ message: 'Recruitment API is running!', status: 'ok' });
});

// 404 handler
app.use(async (req, res, next) => {
    next(createError.NotFound('This route does not exist'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.send({ 
        error: { 
            status: err.status || 500, 
            message: err.message,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        } 
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));