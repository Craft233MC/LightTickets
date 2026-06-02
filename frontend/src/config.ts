interface FrontendConfig {
  backendUrl: string;
}

let _config: FrontendConfig | null = null;

export async function loadFrontendConfig(): Promise<FrontendConfig> {
  if (_config) return _config;

  try {
    const res = await fetch('/data/config.yml');
    if (res.ok) {
      const text = await res.text();
      const parsed: Record<string, string> = {};
      for (const line of text.split('\n')) {
        const match = line.match(/^(\w+):\s*"?([^"]*)"?\s*$/);
        if (match) parsed[match[1]] = match[2];
      }
      if (parsed.backendUrl) {
        _config = { backendUrl: parsed.backendUrl };
        return _config;
      }
    }
  } catch {
    // Config file not available
  }

  _config = {
    backendUrl: import.meta.env.VITE_API_URL || '/api',
  };
  return _config;
}

export function getFrontendConfig(): FrontendConfig {
  if (!_config) {
    throw new Error('Frontend config not loaded. Call loadFrontendConfig() first.');
  }
  return _config;
}
