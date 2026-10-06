'use strict';
const http = require('node:http');
const { createHash, timingSafeEqual } = require('node:crypto');
function createHostedProxy({ origin, username, password, upstreamPort }) {
  const external = new URL(origin);
  if (!['http:', 'https:'].includes(external.protocol) || external.pathname !== '/' || external.search || external.hash || external.username || external.password) throw new Error('Hosted origin must be an HTTP(S) origin');
  if (!username || username.includes(':') || !password || password.length < 16) throw new Error('Set a username and a password of at least 16 characters');
  const expected = createHash('sha256').update('Basic ' + Buffer.from(username + ':' + password).toString('base64')).digest();
  return http.createServer((req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    if (req.url === '/healthz' && req.method === 'GET') {
      const probe = http.get({ hostname:'127.0.0.1', port:upstreamPort, path:'/api/health' }, reply => {
        reply.resume(); res.writeHead(reply.statusCode === 200 ? 200 : 503); res.end(reply.statusCode === 200 ? 'ready' : 'not ready');
      });
      probe.setTimeout(3000, () => probe.destroy());
      probe.on('error', () => { res.writeHead(503); res.end('not ready'); });
      return;
    }
    if (req.headers.host !== external.host || (req.headers.origin && req.headers.origin !== external.origin) || req.headers['sec-fetch-site'] === 'cross-site') {
      res.writeHead(403); res.end('forbidden origin'); return;
    }
    const actual = createHash('sha256').update(String(req.headers.authorization || '')).digest();
    if (!timingSafeEqual(expected, actual)) {
      res.writeHead(401, { 'WWW-Authenticate':'Basic realm="Autonomy City", charset="UTF-8"' }); res.end('Sign in required'); return;
    }
    const headers = { ...req.headers, host:'127.0.0.1:' + upstreamPort };
    delete headers.authorization;
    delete headers['proxy-authorization'];
    delete headers['forwarded'];
    for (const key of Object.keys(headers)) if (key.startsWith('x-forwarded-')) delete headers[key];
    if (headers.origin) headers.origin = 'http://127.0.0.1:' + upstreamPort;
    const upstream = http.request({ hostname:'127.0.0.1', port:upstreamPort, path:req.url, method:req.method, headers }, reply => {
      res.writeHead(reply.statusCode, { ...reply.headers, 'cache-control':'no-store' }); reply.pipe(res);
      res.on('close', () => reply.destroy());
    });
    upstream.on('error', () => { if (!res.headersSent) res.writeHead(502); res.end('Service unavailable'); });
    req.on('aborted', () => upstream.destroy());
    req.pipe(upstream);
  });
}
module.exports = { createHostedProxy };
