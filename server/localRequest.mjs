const LOCAL_PEERS = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);
const FORWARDED_HEADERS = ['forwarded', 'x-forwarded-for', 'x-forwarded-host', 'x-forwarded-proto'];

export function isLocalRequest(req, { allowMissingOrigin = false } = {}) {
  const { origin, host } = req.headers;
  const localHost = /^(localhost|127\.0\.0\.1|\[::1\])(?::(\d+))?$/i.exec(host ?? '');
  const matchesOrigin = origin === 'http://' + host || (origin === undefined && allowMissingOrigin);
  const fetchSite = req.headers['sec-fetch-site'];
  return LOCAL_PEERS.has(req.socket.remoteAddress) && !!localHost && Number(localHost[2] ?? 80) === req.socket.localPort &&
    matchesOrigin && (fetchSite === undefined || fetchSite === 'same-origin') &&
    !FORWARDED_HEADERS.some((name) => req.headers[name] !== undefined);
}
