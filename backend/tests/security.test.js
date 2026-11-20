// Security regression tests: tenant isolation (IDOR), auth edge cases, input validation.
// Run with: npm test   (uses an in-memory MongoDB, no external services)
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-0123456789abcdef';

const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { createApp } = require('../src/app');
const Alert = require('../src/models/Alert');
const EnergyRecord = require('../src/models/EnergyRecord');
const Forecast = require('../src/models/Forecast');

let mongo;
let app;
const users = {};

async function register(name) {
    const res = await request(app).post('/api/auth/register')
        .send({ name, email: `${name}@example.com`, password: 'correct-horse-battery' });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    const auth = { Authorization: `Bearer ${res.body.token}` };
    const project = await request(app).post('/api/projects').set(auth).send({ name: `${name} grid` });
    assert.equal(project.status, 201);
    return { auth, projectId: project.body._id };
}

before(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
    app = createApp();
    users.alice = await register('alice');
    users.mallory = await register('mallory');
    const pid = users.alice.projectId;
    await EnergyRecord.create({ projectId: pid, timestamp: new Date(), solarGeneration: 120, windGeneration: 40, energyDemand: 90, batterySOC: 55 });
    await Forecast.create({ projectId: pid, horizon: 24, generatedAt: new Date(), predictions: [] }).catch(() => {});
});

after(async () => {
    await mongoose.disconnect();
    await mongo.stop();
});

describe('tenant isolation (IDOR)', () => {
    test('owner can read their own stats, forecast and alerts', async () => {
        const { auth, projectId } = users.alice;
        const stats = await request(app).get(`/api/data/stats/${projectId}`).set(auth);
        assert.equal(stats.status, 200);
        assert.equal(stats.body.totalRecords, 1);
        assert.equal((await request(app).get(`/api/alerts/${projectId}`).set(auth)).status, 200);
    });

    test("another user cannot read the victim's stats, forecast or alerts", async () => {
        const victim = users.alice.projectId;
        const { auth } = users.mallory;
        for (const url of [`/api/data/stats/${victim}`, `/api/forecast/${victim}`, `/api/alerts/${victim}`, `/api/projects/${victim}`]) {
            const res = await request(app).get(url).set(auth);
            assert.equal(res.status, 404, `${url} must not be readable by another user`);
            assert.ok(!JSON.stringify(res.body).includes('solarGeneration'), `${url} leaked data`);
        }
    });

    test("listing someone else's alerts must not write sample alerts into their project", async () => {
        const fresh = await register('carol');
        await request(app).get(`/api/alerts/${fresh.projectId}`).set(users.mallory.auth);
        assert.equal(await Alert.countDocuments({ projectId: fresh.projectId }), 0);
    });

    test("another user cannot resolve the victim's alerts", async () => {
        const [alert] = (await request(app).get(`/api/alerts/${users.alice.projectId}`).set(users.alice.auth)).body;
        const res = await request(app).patch(`/api/alerts/${alert._id}/resolve`).set(users.mallory.auth);
        assert.equal(res.status, 404);
        assert.equal((await Alert.findById(alert._id)).resolved, false);
        const own = await request(app).patch(`/api/alerts/${alert._id}/resolve`).set(users.alice.auth);
        assert.equal(own.status, 200);
        assert.equal(own.body.resolved, true);
        assert.equal((await request(app).patch('/api/alerts/not-an-id/resolve').set(users.alice.auth)).status, 404);
    });

    test("copilot refuses to load another user's project into the prompt", async () => {
        const res = await request(app).post('/api/copilot/chat').set(users.mallory.auth)
            .send({ message: 'What is my battery level?', projectId: users.alice.projectId });
        assert.equal(res.status, 404);
        assert.ok(!JSON.stringify(res.body).includes('Battery SOC'));
    });

    test('upload to a project you do not own is rejected', async () => {
        const res = await request(app).post(`/api/data/upload/${users.alice.projectId}`).set(users.mallory.auth)
            .attach('file', Buffer.from('timestamp,solarGeneration\n2026-01-01,1\n'), 'data.csv');
        assert.equal(res.status, 404);
    });
});

describe('authentication', () => {
    test('a bare "Bearer" header gets exactly one 401 (no double response)', async () => {
        const res = await request(app).get('/api/projects').set('Authorization', 'Bearer');
        assert.equal(res.status, 401);
        assert.equal(res.body.message, 'Not authorized, no token');
    });

    test('tokens signed with another algorithm or secret are rejected', async () => {
        const alg = jwt.sign({ userId: 'x' }, process.env.JWT_SECRET, { algorithm: 'HS512' });
        const forged = jwt.sign({ userId: 'x' }, 'wrong-secret-0123456789');
        for (const token of [alg, forged, 'garbage']) {
            assert.equal((await request(app).get('/api/projects').set('Authorization', `Bearer ${token}`)).status, 401);
        }
    });

    test('NoSQL operator injection in login is rejected', async () => {
        const res = await request(app).post('/api/auth/login').send({ email: { $ne: null }, password: 'correct-horse-battery' });
        assert.equal(res.status, 400);
        assert.equal(res.body.token, undefined);
    });

    test('registration validates email and password strength; emails are case-insensitive', async () => {
        assert.equal((await request(app).post('/api/auth/register').send({ name: 'x', email: 'nope', password: 'longenough1' })).status, 400);
        assert.equal((await request(app).post('/api/auth/register').send({ name: 'x', email: 'x@example.com', password: 'short' })).status, 400);
        assert.equal((await request(app).post('/api/auth/register').send({ name: 'A', email: 'ALICE@example.com', password: 'longenough1' })).status, 400);
        const login = await request(app).post('/api/auth/login').send({ email: 'Alice@Example.com', password: 'correct-horse-battery' });
        assert.equal(login.status, 200);
    });
});

describe('uploads and errors', () => {
    test('CSV upload parses "false" as false and rejects non-CSV files', async () => {
        const { auth, projectId } = users.mallory;
        const csv = 'timestamp,solarGeneration,windGeneration,energyDemand,batterySOC,gridAvailability\n2026-01-01T00:00:00Z,10,5,8,50,false\n';
        const ok = await request(app).post(`/api/data/upload/${projectId}`).set(auth).attach('file', Buffer.from(csv), 'data.csv');
        assert.equal(ok.status, 200, JSON.stringify(ok.body));
        const rec = await EnergyRecord.findOne({ projectId });
        assert.equal(rec.gridAvailability, false);
        const bad = await request(app).post(`/api/data/upload/${projectId}`).set(auth).attach('file', Buffer.from('MZ'), 'evil.exe');
        assert.equal(bad.status, 400);
    });

    test('server errors do not leak stack traces', async () => {
        const res = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{bad json');
        assert.ok(res.status >= 400);
        assert.equal(res.body.stack, undefined);
    });
});
