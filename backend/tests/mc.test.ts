import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from './setup.js';

const app = createApp();

describe('POST /api/mc/link-code', () => {
  it('generates a 6-digit link code', async () => {
    const server = await prisma().server.create({
      data: { name: 'survival', apiKey: 'test-server-key-123', address: 'mc.example.com' },
    });

    const res = await request(app)
      .post('/api/mc/link-code')
      .set('X-Server-Key', server.apiKey)
      .send({ minecraftUuid: '550e8400-e29b-41d4-a716-446655440000', minecraftName: 'Steve' });

    expect(res.status).toBe(201);
    expect(res.body.code).toMatch(/^\d{6}$/);
    expect(res.body).toHaveProperty('expiresAt');
  });

  it('rejects without server key', async () => {
    const res = await request(app)
      .post('/api/mc/link-code')
      .send({ minecraftUuid: '550e8400-e29b-41d4-a716-446655440000', minecraftName: 'Steve' });

    expect(res.status).toBe(401);
  });
});

describe('POST /api/mc/tickets', () => {
  it('creates a ticket from game context', async () => {
    const server = await prisma().server.create({
      data: { name: 'mc-srv', apiKey: 'mc-key-456' },
    });

    const bcrypt = await import('bcrypt');
    const hash = await bcrypt.default.hash('Password123!', 12);
    await prisma().user.create({
      data: {
        email: 'mcplayer@test.com',
        passwordHash: hash,
        username: 'mcplayer',
        minecraftUuid: '550e8400-e29b-41d4-a716-446655440000',
        minecraftName: 'Steve',
      },
    });

    const res = await request(app)
      .post('/api/mc/tickets')
      .set('X-Server-Key', server.apiKey)
      .send({
        minecraftUuid: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Block glitch',
        body: 'Blocks disappear when placed',
        template: 'bug_report',
        context: { world: 'world', x: 100, y: 64, z: -200, gameMode: 'SURVIVAL' },
      });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Block glitch');
  });

  it('rejects unlinked player', async () => {
    const server = await prisma().server.create({
      data: { name: 'mc-srv2', apiKey: 'mc-key-789' },
    });

    const res = await request(app)
      .post('/api/mc/tickets')
      .set('X-Server-Key', server.apiKey)
      .send({
        minecraftUuid: 'unknown-uuid',
        title: 'Test',
        body: 'Body',
        template: 'bug_report',
      });

    expect(res.status).toBe(404);
  });
});

describe('GET /api/mc/tickets/:uuid', () => {
  it('returns tickets for linked player', async () => {
    const server = await prisma().server.create({
      data: { name: 'mc-list', apiKey: 'mc-list-key' },
    });
    const bcrypt = await import('bcrypt');
    const hash = await bcrypt.default.hash('Password123!', 12);
    await prisma().user.create({
      data: {
        email: 'mclist@test.com',
        passwordHash: hash,
        username: 'mclist',
        minecraftUuid: '550e8400-e29b-41d4-a716-446655440001',
        minecraftName: 'Alex',
      },
    });

    await request(app)
      .post('/api/mc/tickets')
      .set('X-Server-Key', server.apiKey)
      .send({
        minecraftUuid: '550e8400-e29b-41d4-a716-446655440001',
        title: 'MC Ticket',
        body: 'From game',
        template: 'bug_report',
      });

    const res = await request(app)
      .get('/api/mc/tickets/550e8400-e29b-41d4-a716-446655440001')
      .set('X-Server-Key', server.apiKey);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('returns empty array for unknown uuid', async () => {
    const server = await prisma().server.create({
      data: { name: 'mc-empty', apiKey: 'mc-empty-key' },
    });

    const res = await request(app)
      .get('/api/mc/tickets/00000000-0000-0000-0000-000000000000')
      .set('X-Server-Key', server.apiKey);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('POST /api/mc/comments', () => {
  it('creates a comment from game', async () => {
    const server = await prisma().server.create({
      data: { name: 'mc-comment', apiKey: 'mc-comment-key' },
    });
    const bcrypt = await import('bcrypt');
    const hash = await bcrypt.default.hash('Password123!', 12);
    await prisma().user.create({
      data: {
        email: 'mccomment@test.com',
        passwordHash: hash,
        username: 'mccomment',
        minecraftUuid: '550e8400-e29b-41d4-a716-446655440002',
        minecraftName: 'Commenter',
      },
    });

    const ticket = await request(app)
      .post('/api/mc/tickets')
      .set('X-Server-Key', server.apiKey)
      .send({
        minecraftUuid: '550e8400-e29b-41d4-a716-446655440002',
        title: 'Ticket with comment',
        body: 'Body',
        template: 'bug_report',
      });

    const res = await request(app)
      .post('/api/mc/comments')
      .set('X-Server-Key', server.apiKey)
      .send({
        minecraftUuid: '550e8400-e29b-41d4-a716-446655440002',
        ticketId: ticket.body.id,
        body: 'Comment from game',
      });

    expect(res.status).toBe(201);
    expect(res.body.body).toBe('Comment from game');
  });
});

describe('POST /api/mc/tickets/:id/close', () => {
  it('allows linked player to close own ticket', async () => {
    const server = await prisma().server.create({
      data: { name: 'mc-close', apiKey: 'mc-close-key' },
    });
    const bcrypt = await import('bcrypt');
    const hash = await bcrypt.default.hash('Password123!', 12);
    await prisma().user.create({
      data: {
        email: 'mcclose@test.com',
        passwordHash: hash,
        username: 'mcclose',
        minecraftUuid: '550e8400-e29b-41d4-a716-446655440003',
        minecraftName: 'Closer',
      },
    });

    const ticket = await request(app)
      .post('/api/mc/tickets')
      .set('X-Server-Key', server.apiKey)
      .send({
        minecraftUuid: '550e8400-e29b-41d4-a716-446655440003',
        title: 'To close from MC',
        body: 'Body',
        template: 'bug_report',
      });

    const res = await request(app)
      .post(`/api/mc/tickets/${ticket.body.id}/close`)
      .set('X-Server-Key', server.apiKey)
      .send({ minecraftUuid: '550e8400-e29b-41d4-a716-446655440003' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('resolved');
  });
});
