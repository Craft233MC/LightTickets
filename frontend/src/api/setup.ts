import { apiFetch } from './client';

export interface SiteConfig {
  isSetup: boolean;
  requireLogin: boolean;
  siteName: string;
}

export interface SetupPayload {
  db: {
    provider: 'sqlite' | 'mysql';
    databaseUrl: string;
  };
  admin: {
    email: string;
    password: string;
    username: string;
  };
  site?: {
    siteName?: string;
    siteUrl?: string;
  };
  mc?: {
    defaultServerName?: string;
  };
}

export interface SetupResult {
  setup: {
    id: number;
    isSetup: boolean;
    siteName: string;
    siteUrl: string | null;
    createdAt: string;
    updatedAt: string;
  };
  admin: {
    id: string;
    email: string;
    username: string;
    role: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface SettingsResult {
  requireLogin: boolean;
  siteName: string;
}

export async function getSiteConfig(): Promise<SiteConfig> {
  return apiFetch<SiteConfig>('/setup/site-config', { method: 'GET' });
}

export async function completeSetup(payload: SetupPayload): Promise<SetupResult> {
  return apiFetch<SetupResult>('/setup', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateSettings(data: { requireLogin?: boolean }): Promise<SettingsResult> {
  return apiFetch<SettingsResult>('/setup/settings', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
