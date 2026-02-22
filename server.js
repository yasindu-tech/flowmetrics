require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const Event = require('./models/Event');
const app = express();

app.use(express.json());

const port = process.env.PORT || 8080;
const startTime = new Date();
const dbUri = process.env.MONGODB_URI;

// ─── Connect to Azure Cosmos DB ──────────────────────────────────────────────

mongoose.connect(dbUri)
    .then(() => console.log('✅ Successfully connected to Cosmos DB!'))
    .catch((err) => console.error('❌ Error connecting to database:', err));

// ─── Routes ───────────────────────────────────────────────────────────────────

// Root — list all routes
app.get('/', (req, res) => {
    res.json({
        app: 'FlowMetrics API',
        version: '1.0.0',
        dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        endpoints: [
            'GET  /health',
            'GET  /api/status',
            'POST /api/events        — create an event in Cosmos DB',
            'GET  /api/events        — get all events from Cosmos DB',
            'GET  /api/events/:id    — get a single event by ID',
            'DELETE /api/events/:id  — delete an event by ID',
        ],
    });
});

// Health check
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

// ─── Event CRUD ───────────────────────────────────────────────────────────────

// POST /api/events — Create a new event and save to Cosmos DB
app.post('/api/events', async (req, res) => {
    try {
        const { type, source, user, meta } = req.body;
        if (!type || !source || !user) {
            return res.status(400).json({ error: 'Missing required fields: type, source, user' });
        }
        const event = new Event({ type, source, user, meta });
        const saved = await event.save();
        res.status(201).json({ message: 'Event saved to Cosmos DB ✅', event: saved });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save event', details: err.message });
    }
});

// GET /api/events — Retrieve all events from Cosmos DB
app.get('/api/events', async (req, res) => {
    try {
        const { type, source, user } = req.query;
        const filter = {};
        if (type) filter.type = type;
        if (source) filter.source = source;
        if (user) filter.user = user;

        const events = await Event.find(filter).limit(100);
        res.json({ count: events.length, events });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch events', details: err.message });
    }
});

// GET /api/events/:id — Get a single event by its Mongo _id
app.get('/api/events/:id', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ error: 'Event not found' });
        res.json(event);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch event', details: err.message });
    }
});

// DELETE /api/events/:id — Delete an event by its Mongo _id
app.delete('/api/events/:id', async (req, res) => {
    try {
        const deleted = await Event.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: 'Event not found' });
        res.json({ message: 'Event deleted ✅', event: deleted });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete event', details: err.message });
    }
});

// 404 fallback
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found', path: req.path });
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(port, () => {
    console.log(`🚀 FlowMetrics API running on port ${port}`);
});
