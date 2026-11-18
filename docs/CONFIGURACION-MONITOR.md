# Configuración de MONITOR

## Administración

- Acceso: `/ad-min/sign-in`, panel: `/ad-min`. No se muestran enlaces públicos al CMS ni existe un portal de clientes.
- El acceso inicial se reserva a `holamonitor@gmail.com`, el correo proporcionado en el brief. Debe registrarse mediante Clerk y verificar que es dueño de ese correo; no se creó ninguna contraseña compartida.
- Desde el panel, ese administrador puede autorizar un segundo correo. Hay un máximo de dos correos administradores; no se inventó la identidad del segundo.
- Cada persona debe crear y verificar su propia cuenta. El registro público por sí solo no otorga permisos administrativos.
- Desarrollo y publicación usan cuentas de Clerk separadas. La lista de correos inicial también se aplica en producción; el dueño debe verificar su correo allí. Los cambios posteriores se guardan en la base de datos correspondiente.
- El panel permite gestionar contenido, páginas adicionales, publicaciones, imágenes, videos y enlaces, y atender contactos y cotizaciones.

## Inteligencia inmobiliaria (tablero privado)

- Dirección: `/inteligencia-inmobiliaria`. No tiene enlaces en el sitio; `robots.txt` y `noindex` lo dejan fuera de buscadores.
- Acceso: cuentas de Clerk con correo verificado. Entran los correos autorizados en el panel (pestaña **Inteligencia inmobiliaria**) y los administradores. Crear una cuenta no da acceso. Sin límite de dos correos (máximo 200).
- Inicio de sesión y registro: `/inteligencia-inmobiliaria/sign-in` y `/inteligencia-inmobiliaria/sign-up`.
- Datos: se cargan desde el panel con el `datos.json` que genera Monitor cada mes. Se guardan en la tabla `monitor_tablero_data` y solo los entrega `GET /api/tablero/data` a cuentas autorizadas (comprimidos y con ETag).
- **No subir `datos.json` a `public/`, a la biblioteca multimedia ni al repositorio**: sería público.
- Código del tablero (sin datos): `public/inteligencia-inmobiliaria/tablero/` (`index.html` y `tablero.js`). Lo genera Monitor; se reemplaza completo cuando cambie el tablero.
- La página muestra el tablero en un marco. Su botón "Cerrar sesión" le pide a la página cerrar la sesión de Clerk; si la sesión vence, el tablero avisa y la página vuelve a validar el acceso.
- Tablas nuevas: `monitor_tablero_access` y `monitor_tablero_data`. En desarrollo: `pnpm --filter @workspace/db run push`; en producción se aplican al publicar.
- Mapa: fondo de calles de OpenStreetMap, para uso moderado. Con muchos usuarios conviene cambiar `fondoMapa` en `index.html` por un proveedor de mapas.

## Solicitudes y Resend

- Las solicitudes válidas se guardan en PostgreSQL antes de intentar enviar la notificación.
- Destinatario: `holamonitor@gmail.com`. Los cambios de correo visible del sitio no cambian este destinatario de notificaciones.
- Resend está conectado mediante la integración de Replit. Su clave actual es solo de envío y no permite consultar los dominios. No hace falta ampliar ese permiso para enviar.
- Falta indicar un remitente válido de un dominio verificado en Resend. Configurarlo en la variable `RESEND_FROM_EMAIL`, en desarrollo y producción según corresponda.
- No usar una dirección Gmail como remitente de Resend. El correo del visitante se usa como `reply_to`.
- Si falta el remitente o falla Resend, la solicitud permanece guardada y la respuesta informa que la notificación no se envió.
- `emailSent` indica que Resend aceptó el envío, no que el mensaje llegó a la bandeja final.
- Los botones de respuesta del panel abren el programa de correo o Gmail; no se ha conectado ni leído la bandeja de Gmail.
- Protección básica: validación de servidor, campo trampa, límite de cinco solicitudes cada 15 minutos por IP y comprobación de origen. El límite en memoria se reinicia con el servidor; para mucho tráfico conviene agregar protección distribuida/CAPTCHA.

## Contenido pendiente

- No se proporcionaron artículos, reportes o casos autorizados. Se conserva la sección Insights con estado vacío, sin inventar publicaciones.
- El aviso de privacidad proporcionado en octubre de 2026 está incorporado íntegramente. Por instrucción del usuario no se incluye una página de términos y condiciones.
- El gráfico de inicio contiene cifras expresamente ilustrativas, no resultados de clientes.
- El video adjunto se convirtió de MOV de 270 MB a MP4 1080p de aproximadamente 7.6 MB y se guardó en App Storage. No se presume una licencia adicional a la del archivo aportado por el usuario.
- Los doce logotipos se procesaron a un solo tono conservando sus siluetas; los originales no se alteraron.

## Publicación y buscadores

- Después de publicar, obtener el dominio real y configurar `SITE_URL` (servidor) y `VITE_SITE_URL` (web) con esa URL HTTPS.
- `/api/sitemap.xml` genera la lista de páginas públicas, incluidos contenidos publicados del CMS. Sin dominio configurado responde explícitamente 503, evitando anunciar una URL inventada.
- Agregar `Sitemap: https://DOMINIO-REAL/api/sitemap.xml` a robots.txt cuando se conozca el dominio definitivo.
- No usar la URL de desarrollo como canonical ni en el sitemap.
- Las claves y dominios de Clerk para producción son gestionados por Replit. Conservar el proxy canónico de Clerk.
- Las tablas se aplican mediante el flujo normal de publicación; no ejecutar DDL en el arranque.
- Los archivos del CMS son recursos públicos del sitio. No subir información confidencial a la biblioteca multimedia.

## Comandos

- `pnpm run typecheck`
- `pnpm --filter @workspace/api-server run build`
- `pnpm --filter @workspace/db run push` (solo desarrollo)
- `pnpm --filter @workspace/api-spec run codegen` después de modificar el contrato
- `pnpm --filter @workspace/scripts exec tsx src/prepare-monitor-assets.ts` para reprocesar los logos originales
