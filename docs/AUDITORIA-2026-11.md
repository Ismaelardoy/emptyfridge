# Auditoría operativa y de seguridad

Fecha: 2026-11-12  
Alcance: `apps/web`, `apps/api`, `packages/contracts`, Docker, CI y despliegue previsto en
Vercel + Render + Supabase.

## Resumen

| Área | Estado |
| --- | --- |
| Autenticación anónima y sesiones | Correcta, con riesgos asumidos |
| Cookies | Correctas; requieren proxy same-origin en producción |
| Autorización por hogar | Correcta; todas las consultas filtran por hogar |
| Validación de entrada | Correcta con Zod y body limit de 1 MB |
| SQL | Correcta; Drizzle parametriza las consultas |
| XSS | Correcto; React escapa y no hay HTML dinámico |
| Dependencias | 2 vulnerabilidades altas corregidas; queda 1 aceptada |
| Rate limiting | Débil en multi-instancia |
| Secretos | Correctos; `.env` ignorado y Render usa `sync: false` |
| Base de datos | Correcta; SSL en producción, cascadas y constraints |
| Observabilidad | Básica; health check y logs de petición |

## Vulnerabilidades de dependencias

Ejecutado con `corepack pnpm audit --prod`.

### Corregidas

- **drizzle-orm < 0.45.2**: inyección SQL con identificadores mal escapados. Actualizado a
  `0.45.4`.
- **fastify < 5.12.5**: varias vulnerabilidades altas/moderadas (bypass de validación, spoofing de
  `X-Forwarded-*`, DoS). Forzado `5.12.8` con `pnpm.overrides`.

### Aceptada

- **zod < 4.6.6**: agotamiento de memoria con colecciones constraint muy grandes. No se puede
  actualizar a Zod 4 sin romper la inferencia de tipos del frontend. Mitigación actual:
  - body limit de 1 MB en Fastify;
  - los schemas de entrada no aceptan arrays grandes ni colecciones anidadas;
  - sigue pendiente migrar a Zod 4 en una tarea aparte.

## Hallazgos de seguridad

### 1. Cookie entre Vercel y Render (crítico si se configura mal)

La cookie `sid` es `HttpOnly`, `SameSite=Lax` y `Secure` con HTTPS. Si el navegador llama
directamente a Render desde Vercel, son sitios distintos y la cookie no se envía correctamente.

**Mitigación obligatoria**: usar el rewrite `/api/*` de Vercel hacia Render, como en `vercel.json`.
Así el navegador solo habla con el dominio de Vercel y la cookie es de primera parte. No cambiar a
`SameSite=None` sin CSRF y sin asumir el bloqueo de cookies de terceros.

### 2. Código de acceso visible en base de datos (medio, aceptado)

Por decisión de producto (ADR 0013), `users.recovery_code` se guarda en claro para poder mostrarlo
siempre. El hash sigue usándose para validar. Riesgo: una fuga de base de datos permite abrir las
listas. Aceptado para una lista de la compra familiar; si se quiere endurecer, guardar el código
cifrado con una clave de entorno y descifrarlo solo al mostrarlo.

### 3. Rate limiting en memoria (medio)

`AuthRateLimitGuard` usa un `Map` por proceso. En Render con varias instancias no se comparte y se
reinicia con cada deploy. Además, `trustProxy: true` confía en cualquier `X-Forwarded-For` si la API
es accesible directamente.

**Recomendaciones**:
- una sola instancia, o rate limiting distribuido (Redis/Upstash o el del proxy);
- no exponer la URL de Render como API pública si se puede evitar;
- limitar el acceso al origen de Vercel si el plan lo permite.

### 4. Sesiones sin caducidad (medio)

La sesión no caduca en base de datos; la cookie se reemite 400 días. Si se roba una cookie, sigue
siendo válida hasta que se cierre esa sesión. Existe `POST /auth/sessions/revoke-others`, pero la UI
ya no lo muestra.

**Recomendación**: volver a exponer “cerrar sesión en otros dispositivos” o añadir caducidad
deslizante y revocación por inactividad.

### 5. Entropía de invitaciones (bajo-medio)

El código de invitación empieza en 6 caracteres (≈30 bits) y crece con el número de hogares. El
rate limit por IP reduce la fuerza bruta, pero es débil en multi-instancia. Para producción con
muchos hogares, considerar 8 caracteres desde el principio o limitar intentos por código.

### 6. CSRF (bajo con la configuración recomendada)

No hay tokens CSRF. `SameSite=Lax` impide enviar la cookie en POST cross-site y las peticiones usan
`application/json`, lo que evita formularios simples. Con el proxy same-origin de Vercel el riesgo es
bajo. No cambiar a `SameSite=None` sin añadir CSRF.

### 7. Cabeceras de seguridad (bajo)

Nginx añade `X-Content-Type-Options`, `X-Frame-Options` y `Referrer-Policy`. Vercel y Render añaden
HSTS/HTTPS. No hay CSP. Si se añade, probar antes la PWA y los scripts inline de Vite.

### 8. Borrado de identidades (correcto)

Al expulsar a un miembro sin hogar se borra el usuario y, en cascada, sesiones, vales y membresía.
Los productos añadidos se conservan con `added_by = null`. Hay confirmación en la UI. Sería útil un
log de auditoría de expulsiones si se usa en grupos grandes.

## Controles que están bien

- Token de sesión solo como hash (`sessions.token_hash`).
- Código de recuperación validado por hash.
- Cookie `HttpOnly`, `SameSite=Lax`, `Secure` con HTTPS.
- Consultas de listas/items siempre filtradas por `household_id`.
- Zod en todos los cuerpos y UUIDs de ruta.
- Límite de body de 1 MB.
- Errores en `application/problem+json` sin stack traces al cliente.
- Logs sin cookies ni cuerpos.
- Docker ejecuta como `node`, con `tini` y health checks.
- Migraciones versionadas en `apps/api/drizzle`.
- `.env` ignorado; `render.yaml` no guarda secretos (`sync: false`).

## Checklist antes de producción

- [ ] Sustituir la URL de Render en `vercel.json`.
- [ ] Configurar `PUBLIC_URL` con la URL HTTPS de Vercel.
- [ ] Configurar Supabase con SSL y el pooler correcto.
- [ ] Aplicar migraciones y verificar `/api/health`.
- [ ] Probar cookies en el dominio final (no solo localhost).
- [ ] Configurar backups de Supabase.
- [ ] Decidir si se restaura “cerrar sesión en otros dispositivos”.
- [ ] Planificar migración a Zod 4.
- [ ] Revisar rate limiting si hay más de una instancia.
- [ ] Añadir monitorización de errores (Sentry o similar) y alertas.
