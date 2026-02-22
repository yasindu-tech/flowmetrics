'use strict';

const request = require('supertest');
const app = require('../src/app');

describe('GET /health', () => {
    it('should return 200 with status ok', async () => {
        const res = await request(app).get('/health');

        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe('ok');
        expect(res.body.timestamp).toBeDefined();
    });

    it('should return a valid ISO timestamp', async () => {
        const res = await request(app).get('/health');
        const ts = new Date(res.body.timestamp);

        expect(ts instanceof Date && !isNaN(ts)).toBe(true);
    });
});

describe('GET /health/ready', () => {
    it('should return 200 when all checks pass', async () => {
        const res = await request(app).get('/health/ready');

        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe('ready');
        expect(res.body.checks).toBeDefined();
        expect(typeof res.body.checks).toBe('object');
    });

    it('should include a timestamp', async () => {
        const res = await request(app).get('/health/ready');
        const ts = new Date(res.body.timestamp);

        expect(ts instanceof Date && !isNaN(ts)).toBe(true);
    });

    it('should report server check as true', async () => {
        const res = await request(app).get('/health/ready');
        expect(res.body.checks.server).toBe(true);
    });
});

describe('GET /health/live', () => {
    it('should return 200 with status alive', async () => {
        const res = await request(app).get('/health/live');

        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe('alive');
    });

    it('should include a non-negative uptime value', async () => {
        const res = await request(app).get('/health/live');

        expect(typeof res.body.uptime).toBe('number');
        expect(res.body.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should include a timestamp', async () => {
        const res = await request(app).get('/health/live');
        const ts = new Date(res.body.timestamp);

        expect(ts instanceof Date && !isNaN(ts)).toBe(true);
    });
});

describe('Unknown routes', () => {
    it('should return 404 for unrecognized paths', async () => {
        const res = await request(app).get('/not-a-real-route');
        expect(res.statusCode).toBe(404);
    });
});
