import { initPrisma, getPrisma } from '../src/db.js';
import { beforeEach } from 'vitest';

initPrisma();
const prisma = () => getPrisma();

beforeEach(async () => {
  await prisma().ticketTemplate.deleteMany();
  await prisma().setupStatus.deleteMany();
  await prisma().auditLog.deleteMany();
  await prisma().ticketLabel.deleteMany();
  await prisma().attachment.deleteMany();
  await prisma().comment.deleteMany();
  await prisma().permissionRequest.deleteMany();
  await prisma().linkCode.deleteMany();
  await prisma().ticket.deleteMany();
  await prisma().label.deleteMany();
  await prisma().user.deleteMany();
  await prisma().server.deleteMany();
});

export { prisma };
