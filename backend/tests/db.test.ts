import { describe, it, expect, beforeEach } from 'vitest';
import { initPrisma, getPrisma, resetPrisma } from '../src/db.js';

describe('db', () => {
  beforeEach(async () => {
    await resetPrisma();
    initPrisma();
  });

  it('getPrisma throws if initPrisma not called', async () => {
    await resetPrisma();
    expect(() => getPrisma()).toThrow('PrismaClient not initialized');
    initPrisma(); // restore for subsequent cleanup
  });

  it('getPrisma returns PrismaClient after initPrisma', () => {
    process.env.DATABASE_URL = 'file:./dev.db';
    initPrisma();
    const prisma = getPrisma();
    expect(prisma).toBeDefined();
    expect(typeof prisma.$connect).toBe('function');
  });

  it('getPrisma returns same instance on multiple calls', () => {
    process.env.DATABASE_URL = 'file:./dev.db';
    initPrisma();
    const a = getPrisma();
    const b = getPrisma();
    expect(a).toBe(b);
  });
});
