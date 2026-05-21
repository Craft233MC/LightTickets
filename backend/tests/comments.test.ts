import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

async function createUserAndGetToken(email = 'user@test.com') {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email, password: 'Password123!', username: email.split('@')[0] });
  return res.body.accessToken;
}

describe('POST /api/tickets/:id/comments', () => {
  it('creates a comment on a ticket', async () => {
    const token = await createUserAndGetToken('commenter@test.com');
    const ticket = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test Ticket', body: 'Body', type: 'bug_report' });

    const res = await request(app)
      .post(`/api/tickets/${ticket.body.id}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ body: 'This is a comment' });

    expect(res.status).toBe(201);
    expect(res.body.body).toBe('This is a comment');
    expect(res.body.authorId).toBeDefined();
    expect(res.body.ticketId).toBe(ticket.body.id);
  });

  it('rejects empty body', async () => {
    const token = await createUserAndGetToken('empty@test.com');
    const ticket = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test', body: 'Body', type: 'bug_report' });

    const res = await request(app)
      .post(`/api/tickets/${ticket.body.id}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ body: '' });

    expect(res.status).toBe(400);
  });

  it('rejects unauthenticated request', async () => {
    const token = await createUserAndGetToken('anon@test.com');
    const ticket = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test', body: 'Body', type: 'bug_report' });

    const res = await request(app)
      .post(`/api/tickets/${ticket.body.id}/comments`)
      .send({ body: 'Not auth' });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/tickets/:id/comments', () => {
  it('lists comments for a ticket', async () => {
    const token = await createUserAndGetToken('comment-list@test.com');
    const ticket = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test', body: 'Body', type: 'bug_report' });

    await request(app)
      .post(`/api/tickets/${ticket.body.id}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ body: 'First comment' });
    await request(app)
      .post(`/api/tickets/${ticket.body.id}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ body: 'Second comment' });

    const res = await request(app)
      .get(`/api/tickets/${ticket.body.id}/comments`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].body).toBe('First comment');
    expect(res.body[1].body).toBe('Second comment');
  });

  it('returns empty array when no comments', async () => {
    const token = await createUserAndGetToken('empty-comments@test.com');
    const ticket = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test', body: 'Body', type: 'bug_report' });

    const res = await request(app)
      .get(`/api/tickets/${ticket.body.id}/comments`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});
