require('dotenv').config(); // Load .env variables into process.env
const express = require('express');
const mongoose = require('mongoose');
const app = express();

app.use(express.json());

const port = process.env.PORT || 8080;
const startTime = new Date();

// Grab the secret connection string from the environment
const dbUri = process.env.MONGODB_URI;

// Connect to Azure Cosmos DB (MongoDB API)
mongoose.connect(dbUri)
    .then(() => console.log('Successfully connected to the Cosmos DB!'))
    .catch((err) => console.error('Error connecting to database:', err));

// ─── Routes ───────────────────────────────────────────────────────────────────

// Root
app.get('/', (req, res) => {
    res.json({
        message: 'Hello from Docker, GitHub Actions, Azure, and Cosmos DB!',
        app: 'FlowMetrics API',
        version: '1.0.0',
        dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    });
});

// Health check — used by Azure App Service & load balancers
app.get('/health', (req, res) => {
    const uptimeSeconds = Math.floor((new Date() - startTime) / 1000);
    const dbStates = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

    res.status(200).json({
        status: 'healthy',
        uptime: `${uptimeSeconds}s`,
        timestamp: new Date().toISOString(),
        checks: {
            server: 'ok',
            database: dbStates[mongoose.connection.readyState] || 'unknown',
            memory: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB used`,
            nodeVersion: process.version,
        },
    });
});

// Runtime status
app.get('/api/status', (req, res) => {
    const uptimeSeconds = Math.floor((new Date() - startTime) / 1000);
    const dbStates = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

    res.json({
        app: 'FlowMetrics',
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0',
        uptime: `${uptimeSeconds}s`,
        startedAt: startTime.toISOString(),
        node: process.version,
        database: {
            status: dbStates[mongoose.connection.readyState] || 'unknown',
            host: mongoose.connection.host || 'not connected',
        },
        memory: {
            heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
            heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`,
        },
    });
});

// 404 fallback
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found', path: req.path });
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(port, () => {
    console.log(`FlowMetrics API running on port ${port}`);
});
