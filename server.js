const express = require('express');
const app = express();

app.use(express.json());

const port = process.env.PORT || 8080;
const startTime = new Date();

// ─── Sample Data ─────────────────────────────────────────────────────────────

const events = [
    { id: 'evt_001', type: 'page_view', source: 'web', user: 'user_42', timestamp: '2026-02-22T10:01:00Z', meta: { page: '/dashboard' } },
    { id: 'evt_002', type: 'click', source: 'web', user: 'user_17', timestamp: '2026-02-22T10:03:45Z', meta: { element: 'signup-btn' } },
    { id: 'evt_003', type: 'api_call', source: 'mobile', user: 'user_99', timestamp: '2026-02-22T10:07:12Z', meta: { endpoint: '/api/metrics' } },
    { id: 'evt_004', type: 'error', source: 'mobile', user: 'user_05', timestamp: '2026-02-22T10:09:33Z', meta: { code: 500, message: 'Internal Server Error' } },
    { id: 'evt_005', type: 'page_view', source: 'web', user: 'user_42', timestamp: '2026-02-22T10:12:00Z', meta: { page: '/reports' } },
    { id: 'evt_006', type: 'conversion', source: 'web', user: 'user_88', timestamp: '2026-02-22T10:15:20Z', meta: { plan: 'pro', revenue: 49.99 } },
];

const analytics = {
    summary: {
        totalEvents: events.length,
        pageViews: events.filter(e => e.type === 'page_view').length,
        clicks: events.filter(e => e.type === 'click').length,
        errors: events.filter(e => e.type === 'error').length,
        conversions: events.filter(e => e.type === 'conversion').length,
        totalRevenue: 49.99,
        activeUsers: 4,
    },
    topPages: [
        { page: '/dashboard', views: 320 },
        { page: '/reports', views: 214 },
        { page: '/settings', views: 98 },
        { page: '/billing', views: 57 },
    ],
    eventsBySource: {
        web: events.filter(e => e.source === 'web').length,
        mobile: events.filter(e => e.source === 'mobile').length,
    },
};

// ─── Routes ───────────────────────────────────────────────────────────────────

// Root
app.get('/', (req, res) => {
    res.json({
        app: 'FlowMetrics API',
        version: '1.0.0',
        status: 'running',
        endpoints: [
            'GET  /',
            'GET  /health',
            'GET  /api/events',
            'GET  /api/events/:id',
            'GET  /api/analytics/summary',
            'GET  /api/analytics/top-pages',
            'GET  /api/status',
        ],
    });
});

// Health check — used by Azure App Service & load balancers
app.get('/health', (req, res) => {
    const uptimeSeconds = Math.floor((new Date() - startTime) / 1000);
    res.status(200).json({
        status: 'healthy',
        uptime: `${uptimeSeconds}s`,
        timestamp: new Date().toISOString(),
        checks: {
            server: 'ok',
            memory: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB used`,
            nodeVersion: process.version,
        },
    });
});

// All events
app.get('/api/events', (req, res) => {
    const { type, source } = req.query;
    let result = [...events];
    if (type) result = result.filter(e => e.type === type);
    if (source) result = result.filter(e => e.source === source);
    res.json({ count: result.length, events: result });
});

// Single event by ID
app.get('/api/events/:id', (req, res) => {
    const event = events.find(e => e.id === req.params.id);
    if (!event) {
        return res.status(404).json({ error: 'Event not found', id: req.params.id });
    }
    res.json(event);
});

// Analytics summary
app.get('/api/analytics/summary', (req, res) => {
    res.json(analytics.summary);
});

// Top pages
app.get('/api/analytics/top-pages', (req, res) => {
    res.json({ topPages: analytics.topPages });
});

// Overall app + runtime status
app.get('/api/status', (req, res) => {
    const uptimeSeconds = Math.floor((new Date() - startTime) / 1000);
    res.json({
        app: 'FlowMetrics',
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0',
        uptime: `${uptimeSeconds}s`,
        startedAt: startTime.toISOString(),
        node: process.version,
        memory: {
            heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
            heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`,
        },
        eventsBySource: analytics.eventsBySource,
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
