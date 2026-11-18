# sitio_monitor

Sitio corporativo y CMS de MONITOR — Inteligencia de Mercado (monorepo pnpm).

## Estructura

| Carpeta | Contenido |
| --- | --- |
| `artifacts/monitor` | Sitio web (React + Vite) con renderizado en servidor (`server.mjs`) |
| `artifacts/api-server` | API Express: contenido del sitio, solicitudes de contacto, CMS, archivos |
| `lib/db` | Esquema de PostgreSQL (Drizzle) |
| `lib/api-spec` | Contrato OpenAPI; genera `lib/api-zod` y `lib/api-client-react` |
| `scripts` | Utilidades (procesar logos, subir video) |
| `docs` | Configuración, publicación y SEO |
| `attached_assets`, `generated-artifacts` | Materiales originales (logos, fotos, videos, documentos) |

## Comandos

```bash
pnpm install
pnpm run typecheck        # revisa tipos en todo el monorepo
pnpm run build            # typecheck + build de todos los paquetes
pnpm --filter @workspace/monitor run test:ssr   # pruebas del HTML del servidor (después de build)
```

Desarrollo local:

```bash
DATABASE_URL=postgres://... PORT=5000 pnpm --filter @workspace/api-server run dev
PORT=5173 API_ORIGIN=http://127.0.0.1:5000 pnpm --filter @workspace/monitor run dev
```

Variables: `DATABASE_URL`, `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY` / `VITE_CLERK_PUBLISHABLE_KEY`,
`SITE_URL`, `VITE_SITE_URL`, `RESEND_FROM_EMAIL`. `PORT` y `BASE_PATH` son opcionales en el sitio
(por defecto 5173 y `/`). Ver `docs/CONFIGURACION-MONITOR.md`.

El correo (Resend) y el almacenamiento de archivos/videos usan integraciones de Replit.
