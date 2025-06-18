const express = require('express');
require('dotenv').config();
require('./utils/init_mongodb');


const app = express();
app.use(express.json());


app.get('/', async (req, res, next) => {
    res.send('Hello from express');
})

app.use(async (req, res, next) => {
    next(createError.NotFound('This route does not exist'));
})

//* Error handling middleware
app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.send({ error: { status: err.status || 500, message: err.message } });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));