# HTML del servidor y SEO

Las rutas públicas usan los mismos componentes React en servidor y navegador.
El proceso web Node sirve el HTML renderizado, los recursos estáticos y los
estados HTTP; no se debe restablecer el rewrite global a `index.html`.

## Contenido y publicación

- Cada solicitud HTML consulta `/api/site` sin cookies ni credenciales, filtra
  publicaciones y páginas publicadas, y precarga su contenido para React.
- En producción consulta la API del dominio canónico definido por `SITE_URL`;
  en desarrollo consulta la API del proxy compartido. La API debe estar disponible.
- Un error de datos devuelve 503 y `noindex`, nunca una página vacía con HTTP 200.
- Los artículos publicados en el CMS aparecen sin reconstrucción del sitio.
- El panel privado sigue siendo cliente y lleva `noindex`; no se renderizan
  sesiones de Clerk ni información administrativa en el servidor.

## Configuración

`SITE_URL` y `VITE_SITE_URL`: `https://www.monitormkt.com`.
`robots.txt` declara `https://www.monitormkt.com/api/sitemap.xml`.
El servicio web de producción ejecuta `node artifacts/monitor/server.mjs --production`.
Su comprobación de arranque usa `/__health`, sin depender de la API.

## Verificación

Después de construir: `pnpm --filter @workspace/monitor test:ssr`.
Incluye rutas públicas, artículos, borradores, 404 y serialización segura.

Después de publicar:

```sh
curl -s https://www.monitormkt.com/servicios/focus-groups
curl -I https://www.monitormkt.com/no-existe
curl -I https://www.monitormkt.com/about
curl -s https://www.monitormkt.com/robots.txt
curl -s https://www.monitormkt.com/api/sitemap.xml
```

Focus Groups debe incluir su texto en el HTML; `/no-existe` debe ser 404;
`/about` debe ser 301 con `Location: /quienes-somos`.
