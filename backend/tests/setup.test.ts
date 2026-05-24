import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

describe('GET /api/setup/status', () => {
  it('returns isSetup false when no setup record exists', async () => {
    const res = await request(app).get('/api/setup/status');
    expect(res.status).toBe(200);
    expect(res.body.isSetup).toBe(false);
    expect(res.body.siteName).toBe('LightTickets');
  });
});

describe('POST /api/setup', () => {
  it('creates admin and setup record on first run', async () => {
    const res = await request(app)
      .post('/api/setup')
      .send({
        db: { provider: 'sqlite', databaseUrl: 'file:./dev.db' },
        admin: { email: 'admin@example.com', password: 'admin123', username: 'admin' },
      });

    expect(res.status).toBe(201);
    expect(res.body.setup.isSetup).toBe(true);
    expect(res.body.admin.email).toBe('admin@example.com');
    expect(res.body.admin.role).toBe('admin');
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');

    // status should now report isSetup true
    const status = await request(app).get('/api/setup/status');
    expect(status.body.isSetup).toBe(true);
  });

  it('rejects invalid payload', async () => {
    const res = await request(app)
      .post('/api/setup')
      .send({
        db: { provider: 'sqlite', databaseUrl: '' },
        admin: { email: 'bad', password: 'short', username: 'x' },
      });

    expect([400, 422]).toContain(res.status);
  });

  it('rejects setup after already initialized', async () => {
    // first setup
    await request(app)
      .post('/api/setup')
      .send({
        db: { provider: 'sqlite', databaseUrl: 'file:./dev.db' },
        admin: { email: 'dupsetup@example.com', password: 'admin123', username: 'dupsetup' },
      });

    // second attempt should conflict
    const res = await request(app)
      .post('/api/setup')
      .send({
        db: { provider: 'sqlite', databaseUrl: 'file:./dev.db' },
        admin: { email: 'another@example.com', password: 'admin123', username: 'another' },
      });

    expect(res.status).toBe(409);
  });
});
