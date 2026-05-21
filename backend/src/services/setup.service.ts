import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { AppError, ValidationError } from '../utils/errors.js';
import { generateTokens } from '../utils/token.js';

const prisma = new PrismaClient();

export interface DbConfig {
  provider: 'sqlite' | 'mysql';
  databaseUrl: string;
}

export interface SiteConfig {
  siteName: string;
  siteUrl?: string;
  accentColor?: string;
}

export interface SetupInput {
  db: DbConfig;
  admin: {
    email: string;
    password: string;
    username: string;
  };
  site?: SiteConfig;
  mc?: {
    defaultServerName?: string;
  };
}

export async function getSetupStatus() {
  const status = await prisma.setupStatus.findFirst();
  return {
    isSetup: status?.isSetup ?? false,
    siteName: status?.siteName ?? 'LightTicket',
    accentColor: status?.accentColor ?? '#111111',
  };
}

export async function completeSetup(input: SetupInput) {
  // Guard: already set up
  const existingSetup = await prisma.setupStatus.findFirst();
  if (existingSetup) {
    throw new AppError(409, 'Setup has already been completed');
  }

  // 1. Validate DB config
  if (!input.db.provider || !['sqlite', 'mysql'].includes(input.db.provider)) {
    throw new ValidationError('Invalid database provider. Must be sqlite or mysql.');
  }
  if (!input.db.databaseUrl) {
    throw new ValidationError('Database URL is required.');
  }

  // 2. Validate admin
  if (!input.admin.email || !input.admin.password || !input.admin.username) {
    throw new ValidationError('Admin email, password, and username are required.');
  }
  if (input.admin.password.length < 6) {
    throw new ValidationError('Admin password must be at least 6 characters.');
  }

  // 3. Create admin user
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: input.admin.email }, { username: input.admin.username }] },
  });
  if (existing) {
    throw new AppError(409, 'Admin email or username already exists');
  }

  const passwordHash = await bcrypt.hash(input.admin.password, 12);
  const admin = await prisma.user.create({
    data: {
      email: input.admin.email,
      passwordHash,
      username: input.admin.username,
      role: 'admin',
    },
  });

  // 4. Create setup status record
  const siteConfig = input.site || {};
  const setupRecord = await prisma.setupStatus.create({
    data: {
      isSetup: true,
      siteName: siteConfig.siteName || 'LightTicket',
      siteUrl: siteConfig.siteUrl || null,
      accentColor: siteConfig.accentColor || '#111111',
    },
  });

  // 5. Optionally create a default server
  if (input.mc?.defaultServerName) {
    const crypto = await import('crypto');
    const apiKey = `lt_${crypto.randomBytes(24).toString('hex')}`;
    await prisma.server.create({
      data: {
        name: input.mc.defaultServerName,
        apiKey,
      },
    });
  }

  const tokens = generateTokens(admin.id, admin.role);
  return {
    setup: setupRecord,
    admin: { id: admin.id, email: admin.email, username: admin.username, role: admin.role },
    ...tokens,
  };
}
