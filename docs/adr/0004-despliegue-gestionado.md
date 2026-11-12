# ADR 0004 — Despliegue gestionado con Vercel + Render + Supabase

- Estado: aceptado como opción secundaria
- Fecha: 2026-01-15

## Contexto

El despliegue principal del repo es un único `docker compose` con nginx y Caddy. También se quiere una alternativa gestionada sin administrar servidor: Vercel para la SPA, Render para la API y Supabase para PostgreSQL.

## Decisión

Soportar **Vercel + Render + Supabase** sin cambiar la arquitectura:

- **Vercel** publica la SPA y hace un rewrite de `/api/*` hacia Render. El navegador ve un solo origen, así que las cookies `SameSite=Lax` siguen funcionando y no hace falta CORS.
- **Render** ejecuta el mismo contenedor de la API. Usa `preDeployCommand` para migrar (plan de pago) o `RUN_MIGRATIONS=true` en una sola instancia (plan free).
- **Supabase** se usa **solo como PostgreSQL**. No se usan Supabase Auth, Realtime, Storage ni las claves `anon`/`service_role`. La autenticación sigue siendo la del ADR 0001.

Variables nuevas:

- `DATABASE_SSL`: `disable` en local, `require` en Supabase.
- `DATABASE_PREPARE`: `true` con Session Pooler; `false` con Transaction Pooler (6543).
- `RUN_MIGRATIONS`: aplica migraciones al arrancar cuando la plataforma no ofrece un paso previo.

## Consecuencias

**A favor**

- Cero administración de servidor.
- Se reutiliza la misma imagen Docker y las mismas migraciones.
- El rewrite de Vercel evita CORS y mantiene la cookie first-party.
- Supabase es sustituible: cualquier Postgres con TLS vale.

**En contra**

- Tres proveedores y tres facturas/límites.
- Render free duerme y Supabase free puede pausar: no es una experiencia “siempre lista”.
- `preDeployCommand` exige plan de pago en Render.
- El pooler de Supabase añade dos configuraciones que hay que entender (`ssl`, `prepare`).

## Alternativas

- **VPS + Docker Compose + Caddy** (recomendada para una familia): una sola factura, sin sleeps, backups con `pg_dump`, control total.
- **Render + Render Postgres**: una pieza menos, pero se pierde el panel/backups de Supabase.
- **Vercel + Supabase + API serverless**: obligaría a adaptar NestJS a funciones y a cambiar el modelo de conexiones; no compensa.

## Cuándo revisar

- Si los sleeps/pausas de los planes gratuitos molestan.
- Si se necesita escalar la API a más de una instancia: pasar las migraciones a un job dedicado.
- Si se adopta Supabase Auth/RLS: cambiaría el modelo de autenticación y el aislamiento.
