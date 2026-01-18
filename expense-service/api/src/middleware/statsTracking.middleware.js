// src/middleware/statsTracking.middleware.js

const IGNORE_PREFIXES = ['/swagger', '/swagger/', '/favicon.ico', '/health'];
const IGNORE_EXACT = ['/stats', '/stats/'];

function shouldIgnore(pathname) {
  if (!pathname) return true;
  if (IGNORE_EXACT.includes(pathname)) return true;
  return IGNORE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p));
}

function sanitizePath(path) {
  const clean = (path || '').split('?')[0];

  const uuidSanitized = clean.replace(
    /\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}(?=\/|$)/g,
    '/:id'
  );

  const numSanitized = uuidSanitized.replace(/\/\d+(?=\/|$)/g, '/:id');

  return numSanitized;
}

function withTimeout(ms, promise) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  return {
    controller,
    promise: promise.finally(() => clearTimeout(t)),
  };
}

async function postStats({ baseUrl, authHeader, endpoint }) {
  const url = `${baseUrl.replace(/\/$/, '')}/stats`;

  const req = fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      accept: '*/*',
      Authorization: authHeader, // <<< KLJUČNO: isti bearer token naprej
    },
    body: JSON.stringify({ klicanaStoritev: endpoint }),
  });

  const { promise } = withTimeout(2000, req);
  await promise;
}

module.exports = function statsTrackingMiddleware(req, res, next) {
  const baseUrl = process.env.STATISTICS_URL;
  if (!baseUrl) return next();

  // isto kot kolega: posreduj ISTI token naprej
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
    return next();
  }

  res.on('finish', () => {
    try {
      const status = res.statusCode;

      // track samo uspešne
      if (status < 200 || status >= 400) return;

      const rawPath = req.originalUrl || req.url || '';
      const pathOnly = rawPath.split('?')[0];

      if (shouldIgnore(pathOnly)) return;

      const endpoint = `${req.method.toUpperCase()} ${sanitizePath(pathOnly)}`;

      setImmediate(() => {
        postStats({ baseUrl, authHeader, endpoint }).catch((err) => {
          // ne ruši API-ja zaradi stats
          if (err?.name === 'AbortError') return;
          console.warn('[stats] failed:', err?.message || err);
        });
      });
    } catch (e) {
      console.warn('[stats] middleware error:', e?.message || e);
    }
  });

  next();
};
