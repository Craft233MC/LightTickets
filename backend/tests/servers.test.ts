import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from './setup.js';

const app = createApp();

async function createAdminAndGetToken(email = 'admin@test.com') {
  await request(app)
    .post('/api/auth/register')
    .send({ email, password: 'Password123!', username: email.split('@')[0] });
  const user = await prisma().user.findUnique({ where: { email } });
  if (user) await prisma().user.update({ where: { id: user.id }, data: { role: 'admin' } });
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email, password: 'Password123!' });
  return loginRes.body.accessToken;
}

async function createUserAndGetToken(email = 'user@test.com') {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email, password: 'Password123!', username: email.split('@')[0] });
  return res.body.accessToken;
}

describe('GET /api/servers', () => {
  it('returns all servers for admin', async () => {
    const token = await createAdminAndGetToken('admin-srv@test.com');
    await prisma().server.create({ data: { name: 'test-srv', apiKey: 'key123' } });

    const res = await request(app)
      .get('/api/servers')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('rejects non-admin user', async () => {
    const token = await createUserAndGetToken('player-srv@test.com');

    const res = await request(app)
      .get('/api/servers')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});

describe('POST /api/servers', () => {
  it('creates a server', async () => {
    const token = await createAdminAndGetToken('admin-create-srv@test.com');

    const res = await request(app)
      .post('/api/servers')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'new-server', address: 'mc.test.com', description: 'Test server' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('new-server');
    expect(res.body.apiKey).toMatch(/^lt_/);
  });

  it('rejects duplicate server name', async () => {
    const token = await createAdminAndGetToken('admin-dup-srv@test.com');
    await request(app)
      .post('/api/servers')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'dup-server' });

    const res = await request(app)
      .post('/api/servers')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'dup-server' });

    expect(res.status).toBe(409);
  });
});

describe('POST /api/servers/:id/regenerate-key', () => {
  it('regenerates server API key', async () => {
    const token = await createAdminAndGetToken('admin-regen@test.com');
    const created = await request(app)
      .post('/api/servers')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'regen-server' });

    const oldKey = created.body.apiKey;

    const res = await request(app)
      .post(`/api/servers/${created.body.id}/regenerate-key`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.apiKey).not.toBe(oldKey);
    expect(res.body.apiKey).toMatch(/^lt_/);
  });
});

describe('DELETE /api/servers/:id', () => {
  it('deletes a server', async () => {
    const token = await createAdminAndGetToken('admin-del-srv@test.com');
    const created = await request(app)
      .post('/api/servers')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'del-server' });

    const res = await request(app)
      .delete(`/api/servers/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(204);
  });
});
