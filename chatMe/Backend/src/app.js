const express = require('express');
const cors = require('cors');

const app = express();

// Middlewares setup
// Frontend URL environment se le rahe hain CORS ke liye
const allowedOrigin = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, "") : '*';

app.use(cors({
    origin: allowedOrigin,
    methods: ['GET', 'POST'],
    credentials: true
}));

app.use(express.json());

// Basic route check karne ke liye
app.get('/', (req, res) => {
    res.send('ChatMe Backend is running! ⚡');
});

module.exports = app;
