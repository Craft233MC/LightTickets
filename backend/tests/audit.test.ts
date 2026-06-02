import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from './setup.js';

const app = createApp();

async function createUserAndGetToken(email = 'user@test.com') {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email, password: 'Password123!', username: email.split('@')[0] });
  return res.body.accessToken;
}

async function createTicket(token: string) {
  return request(app)
    .post('/api/tickets')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Audit Ticket',
      template: 'bug_report',
      formData: { description: 'desc', reproduce: 'steps' },
    });
}

describe('GET /api/tickets/:ticketId/audit', () => {
  it('returns audit logs for a ticket', async () => {
    const token = await createUserAndGetToken('audit@test.com');
    const ticket = await createTicket(token);

    // Generate some audit events
    await request(app)
      .patch(`/api/tickets/${ticket.body.id}/title`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Renamed Ticket' });

    await request(app)
      .post(`/api/tickets/${ticket.body.id}/close`)
      .set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .get(`/api/tickets/${ticket.body.id}/audit`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.length).toBeGreaterThanOrEqual(2);

    const actions = res.body.map((log: any) => log.action);
    expect(actions).toContain('title_change');
    expect(actions).toContain('status_change');
  });

  it('returns empty array for ticket with no audit events', async () => {
    const token = await createUserAndGetToken('audit-empty@test.com');
    const ticket = await createTicket(token);

    const res = await request(app)
      .get(`/api/tickets/${ticket.body.id}/audit`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('rejects unauthenticated request', async () => {
    const token = await createUserAndGetToken('audit-auth@test.com');
    const ticket = await createTicket(token);

    const res = await request(app)
      .get(`/api/tickets/${ticket.body.id}/audit`);

    expect(res.status).toBe(401);
  });
});
