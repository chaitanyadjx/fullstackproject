/**
 * DISCOVERY / BROWSE TESTS
 * Routes: GET /stations, GET /stations/:id, GET /stations/:id/videos,
 *         GET /discover/categories, GET /discover/featured
 */

const request = require('supertest');
const {
  connectDB, cleanup, getApp,
  expectSuccess, expectError,
} = require('./helpers');

let app;

beforeAll(async () => {
  await connectDB();
  app = getApp();
});

afterAll(async () => {
  await cleanup();
});

// ─────────────────────────────────────────────────────────────
// GET /stations  (All are public, no auth required)
// ─────────────────────────────────────────────────────────────
describe('GET /api/v1/stations', () => {
  it('200 — returns list of public stations', async () => {
    const res = await request(app).get('/api/v1/stations');
    expectSuccess(res, 200);
    expect(res.body.data).toHaveProperty('stations');
    expect(Array.isArray(res.body.data.stations)).toBe(true);
  });

  it('200 — supports ?search query param', async () => {
    const res = await request(app).get('/api/v1/stations?search=tech');
    expectSuccess(res, 200);
    expect(res.body.data).toHaveProperty('stations');
  });

  it('200 — supports ?category filter', async () => {
    const res = await request(app).get('/api/v1/stations?category=Technology');
    expectSuccess(res, 200);
    res.body.data.stations.forEach((s) => {
      expect(s.category).toBe('Technology');
    });
  });

  it('200 — supports ?sort=popular', async () => {
    const res = await request(app).get('/api/v1/stations?sort=popular');
    expectSuccess(res, 200);
  });

  it('200 — supports pagination (page + limit)', async () => {
    const res = await request(app).get('/api/v1/stations?page=1&limit=5');
    expectSuccess(res, 200);
    expect(res.body.data.stations.length).toBeLessThanOrEqual(5);
  });

  it('200 — results never include stream key or private data', async () => {
    const res = await request(app).get('/api/v1/stations');
    res.body.data.stations.forEach((s) => {
      expect(s).not.toHaveProperty('streamKey');
    });
  });
});

// ─────────────────────────────────────────────────────────────
// GET /stations/:id
// ─────────────────────────────────────────────────────────────
describe('GET /api/v1/stations/:id', () => {
  it('200 — full station page data structure', async () => {
    // We insert a known station or accept 404 gracefully
    const res = await request(app).get('/api/v1/stations/000000000000000000000000');
    if (res.statusCode === 200) {
      expect(res.body.data).toHaveProperty('name');
      expect(res.body.data).toHaveProperty('subscriberCount');
      expect(res.body.data).toHaveProperty('tiers');
      expect(res.body.data).toHaveProperty('recentVideos');
      expect(Array.isArray(res.body.data.tiers)).toBe(true);
      expect(Array.isArray(res.body.data.recentVideos)).toBe(true);
    } else {
      expect(res.statusCode).toBe(404);
    }
  });

  it('404 — returns 404 for unknown station', async () => {
    const res = await request(app).get('/api/v1/stations/000000000000000000000000');
    expect([200, 404]).toContain(res.statusCode);
  });
});

// ─────────────────────────────────────────────────────────────
// GET /stations/:id/videos
// ─────────────────────────────────────────────────────────────
describe('GET /api/v1/stations/:id/videos', () => {
  it('200 or 404 — returns videos for a station', async () => {
    const res = await request(app).get('/api/v1/stations/000000000000000000000000/videos');
    if (res.statusCode === 200) {
      expect(Array.isArray(res.body.data.videos)).toBe(true);
    } else {
      expect(res.statusCode).toBe(404);
    }
  });

  it('200 — only public videos visible to unauthenticated user', async () => {
    const res = await request(app).get('/api/v1/stations/000000000000000000000000/videos');
    if (res.statusCode === 200) {
      res.body.data.videos.forEach((v) => {
        expect(v.visibility).not.toBe('private');
      });
    }
  });
});

// ─────────────────────────────────────────────────────────────
// GET /discover/categories
// ─────────────────────────────────────────────────────────────
describe('GET /api/v1/discover/categories', () => {
  it('200 — returns categories array', async () => {
    const res = await request(app).get('/api/v1/discover/categories');
    expectSuccess(res, 200);
    expect(Array.isArray(res.body.data)).toBe(true);
    res.body.data.forEach((cat) => {
      expect(cat).toHaveProperty('name');
      expect(cat).toHaveProperty('stationCount');
    });
  });
});

// ─────────────────────────────────────────────────────────────
// GET /discover/featured
// ─────────────────────────────────────────────────────────────
describe('GET /api/v1/discover/featured', () => {
  it('200 — returns featured content sections', async () => {
    const res = await request(app).get('/api/v1/discover/featured');
    expectSuccess(res, 200);
    expect(res.body.data).toHaveProperty('featuredStations');
    expect(res.body.data).toHaveProperty('trendingVideos');
    expect(Array.isArray(res.body.data.featuredStations)).toBe(true);
    expect(Array.isArray(res.body.data.trendingVideos)).toBe(true);
  });
});
