# MONITOR — Inteligencia de Mercado

Sitio corporativo multipágina y CMS de MONITOR, agencia de investigación de mercados en Chihuahua.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## User preferences

- El usuario exige fidelidad al PDF: no cambiar los títulos, secciones, diseño ni paleta por iniciativa propia. Nielsen es referencia de calidad, no una plantilla para copiar.
- Logotipos adjuntos: monocromáticos, sin fondos, sin deformar ni redibujar las marcas.
- No inventar cifras reales, clientes, testimonios, artículos ni datos de contacto. Las cifras de la maqueta deben señalarse como ilustrativas.
- El CMS es sencillo y tiene como máximo dos administradores.
- El usuario reiteró que no se debe rediseñar la maqueta: conservar distribución, degradados y Poppins del PDF y utilizar el logotipo vectorial oficial completo, no reconstruirlo con texto.
- El acceso al CMS debe ser privado visualmente en `/ad-min`, sin enlaces públicos ni portal de clientes. No se requiere página de términos y condiciones.
- Excepción autorizada (18 nov 2026): `/inteligencia-inmobiliaria` es un tablero privado con acceso por correo autorizado, sin enlaces públicos ni indexación. Ver `docs/CONFIGURACION-MONITOR.md`.

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- Configuración y pendientes de publicación: `docs/CONFIGURACION-MONITOR.md`.
