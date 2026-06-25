import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { UnauthorizedError } from '../utils/errors.js';
import { getSiteConfig } from '../services/setup.service.js';

export interface AuthPayload {
  userId: number;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new UnauthorizedError('缺少认证令牌或格式不正确');
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, config.jwtSecret) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    throw new UnauthorizedError('无效的认证令牌');
  }
}

export async function conditionalAuthMiddleware(req: Request, _res: Response, next: NextFunction) {
  const { requireLogin } = await getSiteConfig();

  if (!requireLogin) {
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      try {
        const payload = jwt.verify(header.slice(7), config.jwtSecret) as AuthPayload;
        req.user = payload;
      } catch {}
    }
    return next();
  }

  // requireLogin mode: must have valid token
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new UnauthorizedError('缺少认证令牌或格式不正确');
  }
  try {
    const payload = jwt.verify(header.slice(7), config.jwtSecret) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    throw new UnauthorizedError('无效的认证令牌');
  }
}
