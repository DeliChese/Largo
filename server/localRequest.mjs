const LOCAL_PEERS = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);
const FORWARDED_HEADERS = ['forwarded', 'x-forwarded-for', 'x-forwarded-host', 'x-forwarded-proto'];

function firstHeaderValue(value) {
  return typeof value === 'string' ? value.split(',')[0].trim() : undefined;
}

function isHostedHost(value) {
  const host = firstHeaderValue(value)?.toLowerCase();
  if (!host) return false;
  const allowedHosts = new Set(
    (process.env.NG_ALLOWED_HOSTS ?? '')
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  );
  return allowedHosts.has(host) || (host.endsWith('.run.app') && /^[a-z0-9.-]+(?::\d+)?$/.test(host));
}

function isHostedProxyRequest(req, allowMissingOrigin) {
  if (!process.env.K_SERVICE && !process.env.NG_ALLOWED_HOSTS) return false;
  const fetchSite = req.headers['sec-fetch-site'];
  if (fetchSite !== undefined && fetchSite !== 'same-origin') return false;
  const forwardedHost = firstHeaderValue(req.headers['x-forwarded-host']);
  const externalHost = isHostedHost(req.headers.host)
    ? firstHeaderValue(req.headers.host)
    : LOCAL_PEERS.has(req.socket.remoteAddress) && isHostedHost(forwardedHost)
      ? forwardedHost
      : undefined;
  if (!externalHost) return false;
  const { origin } = req.headers;
  return origin === 'https://' + externalHost ||
    origin === 'http://' + externalHost ||
    (origin === undefined && allowMissingOrigin);
}

export function isLocalRequest(req, { allowMissingOrigin = false } = {}) {
  if (isHostedProxyRequest(req, allowMissingOrigin)) return true;
  const { origin, host } = req.headers;
  const localHost = /^(localhost|127\.0\.0\.1|\[::1\])(?::(\d+))?$/i.exec(host ?? '');
  const matchesOrigin = origin === 'http://' + host || (origin === undefined && allowMissingOrigin);
  const fetchSite = req.headers['sec-fetch-site'];
  return LOCAL_PEERS.has(req.socket.remoteAddress) && !!localHost && Number(localHost[2] ?? 80) === req.socket.localPort &&
    matchesOrigin && (fetchSite === undefined || fetchSite === 'same-origin') &&
    !FORWARDED_HEADERS.some((name) => req.headers[name] !== undefined);
}
