const DEFAULT_LOCAL_BACKEND = 'http://localhost:3001';
const HEALTH_ENDPOINT = '/api/health';
const HEALTH_TIMEOUT_MS = 2200;

let cachedBackendUrl = '';
let resolveInFlight = null;

const trimTrailingSlash = (url) => (url || '').trim().replace(/\/+$/, '');

const isLocalFrontend = () => {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1';
};

const getBackendCandidates = () => {
  const deployed = trimTrailingSlash(import.meta.env.VITE_BACKEND_URL);
  const local = trimTrailingSlash(import.meta.env.VITE_LOCAL_BACKEND_URL || DEFAULT_LOCAL_BACKEND);

  const ordered = isLocalFrontend() ? [local, deployed] : [deployed, local];
  return [...new Set(ordered.filter(Boolean))];
};

const withTimeoutSignal = (timeoutMs) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return { signal: controller.signal, clear: () => clearTimeout(timeout) };
};

const joinUrl = (baseUrl, path) => {
  if (!path) return baseUrl;
  if (/^https?:\/\//i.test(path)) return path;
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

const pingBackend = async (baseUrl) => {
  const timer = withTimeoutSignal(HEALTH_TIMEOUT_MS);
  try {
    const response = await fetch(joinUrl(baseUrl, HEALTH_ENDPOINT), {
      method: 'GET',
      signal: timer.signal,
      headers: { Accept: 'application/json' },
    });

    return response.ok;
  } catch {
    return false;
  } finally {
    timer.clear();
  }
};

export const resolveBackendBaseUrl = async ({ forceRefresh = false } = {}) => {
  if (!forceRefresh && cachedBackendUrl) return cachedBackendUrl;
  if (!forceRefresh && resolveInFlight) return resolveInFlight;

  resolveInFlight = (async () => {
    const candidates = getBackendCandidates();

    if (candidates.length === 0) {
      throw new Error('Backend URL is not configured. Set VITE_BACKEND_URL for web use.');
    }

    for (const candidate of candidates) {
      const isReachable = await pingBackend(candidate);
      if (isReachable) {
        cachedBackendUrl = candidate;
        return cachedBackendUrl;
      }
    }

    cachedBackendUrl = candidates[0];
    return cachedBackendUrl;
  })();

  try {
    return await resolveInFlight;
  } finally {
    resolveInFlight = null;
  }
};

const isNetworkError = (error) => {
  const msg = (error && error.message ? error.message : '').toLowerCase();
  return error instanceof TypeError || msg.includes('fetch') || msg.includes('network') || msg.includes('failed');
};

export const apiFetch = async (path, options = {}) => {
  const candidates = getBackendCandidates();
  if (candidates.length === 0) {
    throw new Error('No backend endpoints configured.');
  }

  const preferred = await resolveBackendBaseUrl();
  const ordered = [preferred, ...candidates.filter((url) => url !== preferred)];

  let lastError = null;

  for (let i = 0; i < ordered.length; i += 1) {
    const baseUrl = ordered[i];
    try {
      const response = await fetch(joinUrl(baseUrl, path), options);

      if (response.status >= 500 && i < ordered.length - 1) {
        continue;
      }

      cachedBackendUrl = baseUrl;
      return response;
    } catch (error) {
      lastError = error;
      if (isNetworkError(error) && i < ordered.length - 1) {
        continue;
      }
      throw error;
    }
  }

  throw lastError || new Error('Unable to reach any backend endpoint.');
};
