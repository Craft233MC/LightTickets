import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export function generateTokens(userId: string, role: string) {
  const accessToken = jwt.sign({ userId, role }, config.jwtSecret, { expiresIn: config.accessTokenExpiry });
  const refreshToken = jwt.sign({ userId, role }, config.jwtRefreshSecret, { expiresIn: config.refreshTokenExpiry });
  return { accessToken, refreshToken };
}
