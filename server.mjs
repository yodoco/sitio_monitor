import http from 'node:http';
import path from 'node:path';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const production = process.argv.includes('--production');
const origin = new URL(process.env.SITE_URL || 'https://www.monitormkt.com').origin;
// Public API only: no cookies/authorization are forwarded to SSR data requests.
// /api belongs to the existing API artifact, not this web process.
const apiOrigin = production ? origin : 'http://127.0.0.1:80';
const vite = production ? null : await (await import('vite')).createServer({
  configFile: path.join(root, 'vite.config.ts'),
  server: { middlewareMode: true }, appType: 'custom',
});
const productionRender = production ? (await import('./dist/server/entry-server.js')).render : null;
const types = {
  '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain', '.map': 'application/json',
};
function send(req, res, status, body, type = 'text/html; charset=utf-8') {
  res.statusCode = status;
  res.setHeader('Content-Type', type);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(req.method === 'HEAD' ? undefined : body);
}
function templateWithHead(template, head) {
  return template
    .replace(/<title>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta\s+(?:name|property)=["'](?:description|robots|og:[^"']+|twitter:[^"']+)["'][^>]*>/gi, '')
    .replace(/<link\s+rel=["']canonical["'][^>]*>/gi, '')
    .replace('</head>', `${head}\n</head>`);
}
export async function handle(req, res) {
  const url = new URL(req.url, origin);
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return send(req, res, 405, 'Method not allowed', 'text/plain');
  }
  if (url.pathname === '/__health') return send(req, res, 200, 'ok', 'text/plain');
  if (url.pathname === '/about' || url.pathname === '/about/') {
    res.setHeader('Location', `/quienes-somos${url.search}`);
    return send(req, res, 301, '');
  }
  if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
    res.setHeader('Location', `${url.pathname.replace(/\/+$/, '')}${url.search}`);
    return send(req, res, 301, '');
  }
  if (url.pathname === '/robots.txt') {
    return send(req, res, 200, `User-agent: *\nAllow: /\nDisallow: /ad-min\nDisallow: /inteligencia-inmobiliaria\nSitemap: ${origin}/api/sitemap.xml\n`, 'text/plain; charset=utf-8');
  }
  if (url.pathname.startsWith('/api/')) return send(req, res, 404, 'Not found', 'text/plain');
  if (production && (url.pathname.startsWith('/assets/') || path.extname(url.pathname))) {
    let decoded;
    try { decoded = decodeURIComponent(url.pathname); } catch { return send(req, res, 400, 'Bad request', 'text/plain'); }
    const publicDir = path.join(root, 'dist/public');
    const file = path.resolve(publicDir, `.${decoded}`);
    if (!file.startsWith(`${publicDir}${path.sep}`)) return send(req, res, 404, 'Not found', 'text/plain');
    try {
      if (!(await stat(file)).isFile()) throw new Error('Not a file');
      const data = await readFile(file);
      res.setHeader('Cache-Control', url.pathname.startsWith('/assets/') ? 'public, max-age=3600' : 'no-cache');
      return send(req, res, 200, data, types[path.extname(file)] || 'application/octet-stream');
    } catch (error) {
      if (error.code && error.code !== 'ENOENT' && error.code !== 'ENOTDIR') throw error;
      return send(req, res, 404, 'Not found', 'text/plain');
    }
  }
  const isDevAsset = !production && (/^\/(?:@|src\/|node_modules\/|assets\/)/.test(url.pathname) || !!path.extname(url.pathname));
  if (isDevAsset) {
    return vite.middlewares(req, res, () => send(req, res, 404, 'Not found', 'text/plain'));
  }
  let template = await readFile(path.join(root, production ? 'dist/public/index.html' : 'index.html'), 'utf8');
  if (vite) template = await vite.transformIndexHtml(req.url, template);
  res.setHeader('Cache-Control', 'no-store');
  if (/^\/ad-min(?:\/sign-(?:in|up)(?:\/.*)?)?$/.test(url.pathname)) {
    const head = '<title>Administrador Monitor</title><meta name="robots" content="noindex, nofollow">';
    return send(req, res, 200, templateWithHead(template, head));
  }
  // Tablero de inteligencia inmobiliaria: privado, sin SSR ni datos del sitio; el acceso lo valida la API.
  if (/^\/inteligencia-inmobiliaria(?:\/sign-(?:in|up)(?:\/.*)?)?$/.test(url.pathname)) {
    const head = '<title>Inteligencia inmobiliaria · Monitor</title><meta name="robots" content="noindex, nofollow">';
    return send(req, res, 200, templateWithHead(template, head));
  }
  const response = await fetch(`${apiOrigin}/api/site`, {
    headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Public content API returned ${response.status}`);
  const site = await response.json();
  const render = productionRender || (await vite.ssrLoadModule('/src/entry-server.tsx')).render;
  const result = render(`${url.pathname}${url.search}`, site, origin);
  const html = templateWithHead(template, result.head).replace(
    '<div id="root"></div>',
    () => `<div id="root">${result.html}</div><script id="monitor-site-data" type="application/json">${result.data}</script>`,
  );
  return send(req, res, result.status, html);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT);
  if (!port) throw new Error('PORT is required');
  http.createServer((req, res) => {
    handle(req, res).catch(error => {
      vite?.ssrFixStacktrace(error);
      console.error('SSR request failed:', error);
      res.setHeader('Cache-Control', 'no-store');
      send(req, res, 503, '<!doctype html><html lang="es"><head><meta name="robots" content="noindex"><title>Monitor — temporalmente no disponible</title></head><body><h1>No pudimos cargar esta página</h1><p>Intenta de nuevo en unos momentos.</p></body></html>');
    });
  }).listen(port, '0.0.0.0', () => console.info(`Monitor SSR listening on ${port}`));
}
