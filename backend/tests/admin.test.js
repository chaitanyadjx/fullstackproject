/**
 * ADMIN TESTS
 * Routes: GET /admin/stats,
 *         GET /admin/creators/applications,
 *         PUT /admin/creators/applications/:id/approve or /reject,
 *         GET/PUT /admin/reports,
 *         PUT /admin/reports/:id/ban-user,
 *         PUT /admin/reports/:id/warn-user,
 *         PUT /admin/content/:id/takedown,
 *         GET/POST/PUT/DELETE /admin/bundles
 */

const request = require('supertest');
const {
  connectDB, cleanup, getApp,
  loginAdmin, registerUser, loginUser,
  expectSuccess, expectError,
} = require('./helpers');

let app;
let adminToken;
let viewerToken;
let applicationId;
let reportId;
let adminBundleId;

beforeAll(async () => {
  await connectDB();
  app = getApp();

  ({ token: adminToken } = await loginAdmin(app));

  const { payload } = await registerUser(app, { email: 'admin_subject@test.com' });
  viewerToken = await loginUser(app, payload.email);

  // Submit a creator application to have data to work with
  const appRes = await request(app)
    .post('/api/v1/studio/apply')
    .set('Authorization', `Bearer ${viewerToken}`)
    .send({
      stationName: 'TestStation',
      category: 'Technology',
      description: 'A test station.',
    });
  applicationId = appRes.body?.data?._id;
});

afterAll(async () => {
  await cleanup();
});

// ─────────────────────────────────────────────────────────────
// GET /admin/stats
// ─────────────────────────────────────────────────────────────
describe('GET /api/v1/admin/stats', () => {
  it('200 — returns comprehensive platform stats', async () => {
    const res = await request(app)
      .get('/api/v1/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    expectSuccess(res, 200);
    const d = res.body.data;
    expect(d).toHaveProperty('totalUsers');
    expect(d).toHaveProperty('totalCreators');
    expect(d).toHaveProperty('totalRevenue');
    expect(d).toHaveProperty('activeSubscriptions');
    expect(d).toHaveProperty('pendingApplications');
    expect(d).toHaveProperty('openReports');
  });

  it('403 — viewer cannot access admin stats', async () => {
    const res = await request(app)
      .get('/api/v1/admin/stats')
      .set('Authorization', `Bearer ${viewerToken}`);
    expectError(res, 403);
  });

  it('401 — blocked without token', async () => {
    const res = await request(app).get('/api/v1/admin/stats');
    expectError(res, 401);
  });
});

// ─────────────────────────────────────────────────────────────
// GET /admin/creators/applications
// ─────────────────────────────────────────────────────────────
describe('GET /api/v1/admin/creators/applications', () => {
  it('200 — returns list of applications', async () => {
    const res = await request(app)
      .get('/api/v1/admin/creators/applications')
      .set('Authorization', `Bearer ${adminToken}`);
    expectSuccess(res, 200);
    expect(res.body.data).toHaveProperty('applications');
    expect(Array.isArray(res.body.data.applications)).toBe(true);
    expect(res.body.data).toHaveProperty('total');
  });

  it('200 — supports ?status=pending filter', async () => {
    const res = await request(app)
      .get('/api/v1/admin/creators/applications?status=pending')
      .set('Authorization', `Bearer ${adminToken}`);
    expectSuccess(res, 200);
    res.body.data.applications.forEach((a) => {
      expect(a.status).toBe('pending');
    });
  });

  it('403 — non-admin cannot list applications', async () => {
    const res = await request(app)
      .get('/api/v1/admin/creators/applications')
      .set('Authorization', `Bearer ${viewerToken}`);
    expectError(res, 403);
  });
});

// ─────────────────────────────────────────────────────────────
// PUT /admin/creators/applications/:id/approve
// ─────────────────────────────────────────────────────────────
describe('PUT /api/v1/admin/creators/applications/:id/approve', () => {
  it('200 — admin approves an application', async () => {
    if (!applicationId) return;
    const res = await request(app)
      .put(`/api/v1/admin/creators/applications/${applicationId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    expectSuccess(res, 200);
    expect(res.body.data.status).toBe('approved');
  });

  it('404 — returns 404 for unknown application', async () => {
    const res = await request(app)
      .put('/api/v1/admin/creators/applications/000000000000000000000000/approve')
      .set('Authorization', `Bearer ${adminToken}`);
    expectError(res, 404);
  });

  it('403 — viewer cannot approve applications', async () => {
    const res = await request(app)
      .put('/api/v1/admin/creators/applications/000000000000000000000000/approve')
      .set('Authorization', `Bearer ${viewerToken}`);
    expectError(res, 403);
  });
});

// ─────────────────────────────────────────────────────────────
// PUT /admin/creators/applications/:id/reject
// ─────────────────────────────────────────────────────────────
describe('PUT /api/v1/admin/creators/applications/:id/reject', () => {
  it('200 or 400 — admin rejects an application with reason', async () => {
    // Submit a second application for rejection
    const { payload } = await registerUser(app, { email: 'reject_applicant@test.com' });
    const rejToken = await loginUser(app, payload.email);
    const appRes = await request(app)
      .post('/api/v1/studio/apply')
      .set('Authorization', `Bearer ${rejToken}`)
      .send({ stationName: 'ToBeRejected', category: 'Music', description: 'Test.' });
    const rejAppId = appRes.body?.data?._id;
    if (!rejAppId) return;

    const res = await request(app)
      .put(`/api/v1/admin/creators/applications/${rejAppId}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Insufficient portfolio.' });
    expectSuccess(res, 200);
    expect(res.body.data.status).toBe('rejected');
  });
});

// ─────────────────────────────────────────────────────────────
// GET /admin/reports
// ─────────────────────────────────────────────────────────────
describe('GET /api/v1/admin/reports', () => {
  it('200 — returns list of content reports', async () => {
    const res = await request(app)
      .get('/api/v1/admin/reports')
      .set('Authorization', `Bearer ${adminToken}`);
    expectSuccess(res, 200);
    expect(res.body.data).toHaveProperty('reports');
    expect(Array.isArray(res.body.data.reports)).toBe(true);
  });

  it('403 — viewer cannot access reports', async () => {
    const res = await request(app)
      .get('/api/v1/admin/reports')
      .set('Authorization', `Bearer ${viewerToken}`);
    expectError(res, 403);
  });
});

// ─────────────────────────────────────────────────────────────
// PUT /admin/reports/:id  (Change status)
// ─────────────────────────────────────────────────────────────
describe('PUT /api/v1/admin/reports/:id', () => {
  it('404 — returns 404 for unknown report', async () => {
    const res = await request(app)
      .put('/api/v1/admin/reports/000000000000000000000000')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'reviewed', note: 'No violation found.' });
    expectError(res, 404);
  });
});

// ─────────────────────────────────────────────────────────────
// PUT /admin/reports/:id/ban-user
// ─────────────────────────────────────────────────────────────
describe('PUT /api/v1/admin/reports/:id/ban-user', () => {
  it('404 — returns 404 for unknown report ID', async () => {
    const res = await request(app)
      .put('/api/v1/admin/reports/000000000000000000000000/ban-user')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Repeated violations', durationDays: 30 });
    expectError(res, 404);
  });

  it('400 — rejects missing ban reason', async () => {
    const res = await request(app)
      .put('/api/v1/admin/reports/000000000000000000000000/ban-user')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ durationDays: 30 });
    expectError(res, 400);
  });
});

// ─────────────────────────────────────────────────────────────
// PUT /admin/content/:id/takedown
// ─────────────────────────────────────────────────────────────
describe('PUT /api/v1/admin/content/:id/takedown', () => {
  it('404 — returns 404 for unknown content ID', async () => {
    const res = await request(app)
      .put('/api/v1/admin/content/000000000000000000000000/takedown')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Copyright violation' });
    expectError(res, 404);
  });

  it('400 — rejects missing reason', async () => {
    const res = await request(app)
      .put('/api/v1/admin/content/000000000000000000000000/takedown')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});
    expectError(res, 400);
  });

  it('403 — non-admin cannot take down content', async () => {
    const res = await request(app)
      .put('/api/v1/admin/content/000000000000000000000000/takedown')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ reason: 'Test' });
    expectError(res, 403);
  });
});

// ─────────────────────────────────────────────────────────────
// POST /admin/bundles  (Admin bundle management)
// ─────────────────────────────────────────────────────────────
describe('POST /api/v1/admin/bundles', () => {
  it('201 — admin creates a featured bundle', async () => {
    const res = await request(app)
      .post('/api/v1/admin/bundles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Admin Bundle',
        description: 'Curated by team.',
        price: 14.99,
        billingPeriod: 'monthly',
        stationIds: [],
      });
    expectSuccess(res, 201);
    expect(res.body.data.name).toBe('Admin Bundle');
    adminBundleId = res.body.data._id;
  });

  it('403 — viewer cannot create admin bundles', async () => {
    const res = await request(app)
      .post('/api/v1/admin/bundles')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ name: 'Hack', price: 1, billingPeriod: 'monthly', stationIds: [] });
    expectError(res, 403);
  });
});

// ─────────────────────────────────────────────────────────────
// GET /admin/bundles
// ─────────────────────────────────────────────────────────────
describe('GET /api/v1/admin/bundles', () => {
  it('200 — returns all bundles including inactive', async () => {
    const res = await request(app)
      .get('/api/v1/admin/bundles')
      .set('Authorization', `Bearer ${adminToken}`);
    expectSuccess(res, 200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('403 — viewer cannot access admin bundle list', async () => {
    const res = await request(app)
      .get('/api/v1/admin/bundles')
      .set('Authorization', `Bearer ${viewerToken}`);
    expectError(res, 403);
  });
});

// ─────────────────────────────────────────────────────────────
// PUT /admin/bundles/:id
// ─────────────────────────────────────────────────────────────
describe('PUT /api/v1/admin/bundles/:id', () => {
  it('200 — admin updates a bundle', async () => {
    if (!adminBundleId) return;
    const res = await request(app)
      .put(`/api/v1/admin/bundles/${adminBundleId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Updated Admin Bundle', isActive: false });
    expectSuccess(res, 200);
    expect(res.body.data.name).toBe('Updated Admin Bundle');
    expect(res.body.data.isActive).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// DELETE /admin/bundles/:id
// ─────────────────────────────────────────────────────────────
describe('DELETE /api/v1/admin/bundles/:id', () => {
  it('200 — admin deletes a bundle', async () => {
    if (!adminBundleId) return;
    const res = await request(app)
      .delete(`/api/v1/admin/bundles/${adminBundleId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect([200, 204]).toContain(res.statusCode);
  });

  it('404 — re-deleting returns 404', async () => {
    if (!adminBundleId) return;
    const res = await request(app)
      .delete(`/api/v1/admin/bundles/${adminBundleId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expectError(res, 404);
  });
});
