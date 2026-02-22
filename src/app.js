'use strict';

const express = require('express');

const app = express();

app.use(express.json());

// --- Health Endpoints ---

/**
 * GET /health
 * Basic liveness probe — confirms the process is alive.
 */
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
    });
});

/**
 * GET /health/ready
 * Readiness probe — confirms the app is ready to serve traffic.
 * Extend this to check DB connections, upstream services, etc.
 */
app.get('/health/ready', (req, res) => {
    const checks = {
        server: true,
        // Add real dependency checks here (e.g. database ping)
    };

    const allReady = Object.values(checks).every(Boolean);

    res.status(allReady ? 200 : 503).json({
        status: allReady ? 'ready' : 'unavailable',
        checks,
        timestamp: new Date().toISOString(),
    });
});

/**
 * GET /health/live
 * Alias for the basic liveness probe (Kubernetes convention).
 */
app.get('/health/live', (req, res) => {
    res.status(200).json({
        status: 'alive',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});

module.exports = app;
