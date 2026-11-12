# Despliegue: Vercel + Render + Supabase

Arquitectura recomendada:

```text
Navegador
  │  https://tu-app.vercel.app
  ▼
Vercel (apps/web, estático)
  │  rewrite /api/* → Render
  ▼
Render (apps/api, Docker NestJS)
  │  DATABASE_URL con SSL
  ▼
Supabase Postgres
```

No hace falta dividir el repositorio en `frontend/` y `backend/`. El monorepo ya tiene las dos
aplicaciones separadas (`apps/web` y `apps/api`) y comparten `packages/contracts`. Partirlo
duplicaría dependencias y rompería el lockfile y los tipos compartidos.

## 1. Supabase

1. Crea un proyecto en Supabase y guarda la contraseña de la base de datos.
2. Ve a **Project Settings → Database → Connection string**.
3. Para Render (proceso Node de larga duración) usa **Session Pooler**, puerto `5432`.
   - `DATABASE_URL=postgres://postgres.<ref>:<password>@<region>.pooler.supabase.com:5432/postgres?sslmode=require`
   - `DATABASE_SSL=require`
   - `DATABASE_PREPARE=true`
4. Si usas el **Transaction Pooler** (puerto `6543`, recomendado para funciones serverless), pon
   `DATABASE_PREPARE=false`.
5. Aplica las migraciones una vez. Desde local:

```bash
corepack pnpm install
DATABASE_URL="postgres://..." DATABASE_SSL=require corepack pnpm --filter @emptyfridge/api db:migrate
```

En Render se aplican con `preDeployCommand` (plan de pago) o con `RUN_MIGRATIONS=true` en una sola
instancia (plan gratuito).

### Seguridad de Supabase

- No uses la `anon key` ni la `service_role key` en este backend: la API habla Postgres directamente.
- Guarda la contraseña solo en Render/Vercel, nunca en Git.
- Activa backups y, si el plan lo permite, restricciones de red.
- Considera crear un rol Postgres dedicado para la API en vez de usar `postgres` para todo.

## 2. Render (API)

1. Importa el repositorio como **Blueprint**; `render.yaml` ya define el servicio.
2. Variables de entorno:
   - `DATABASE_URL`: cadena del Session Pooler de Supabase.
   - `DATABASE_SSL=require`.
   - `DATABASE_PREPARE=true` (o `false` con Transaction Pooler).
   - `PUBLIC_URL=https://tu-app.vercel.app` (la URL de Vercel, no la de Render). Se usa para marcar
     la cookie como `Secure`.
   - `LOG_LEVEL=info`.
3. Health check: `/api/health`.
4. Migraciones: `preDeployCommand` del `render.yaml`. En plan gratuito, activa
   `RUN_MIGRATIONS=true` y mantén **una sola instancia**.
5. Comprueba que el servicio arranca con el usuario `node` (el Dockerfile ya lo hace) y que la API
   responde por HTTPS.

## 3. Vercel (web)

1. Importa el mismo repositorio.
2. Configura:
   - **Root Directory**: la raíz del repositorio (no `apps/web`).
   - **Framework Preset**: Vite.
   - El `vercel.json` de la raíz ya define `buildCommand`, `outputDirectory` y el rewrite de `/api`.
3. Sustituye en `vercel.json`:

```text
https://REPLACE-WITH-YOUR-RENDER-SERVICE.onrender.com
```

por la URL real de Render. Si usas dominio propio, mejor `https://api.tudominio.com`.
4. No configures `VITE_API_URL`: la web llama siempre a `/api` y Vercel lo proxifica.

### Por qué el proxy de Vercel es importante

La sesión es una cookie `httpOnly` con `SameSite=Lax`. Si el navegador llama directamente a
`https://algo.onrender.com` desde `https://algo.vercel.app`, son sitios distintos y la cookie no se
enviaría (o se trataría como cookie de terceros). Con el rewrite de Vercel, el navegador solo habla
con Vercel y `/api` es mismo origen: la cookie funciona sin cambiar `SameSite` ni añadir CORS.

Si en el futuro separas frontend y API con dominios propios, usa subdominios del mismo dominio
(`app.tudominio.com` y `api.tudominio.com`) y configura CORS con credenciales. No uses
`SameSite=None` sin CSRF y sin comprobar el bloqueo de cookies de terceros.

## 4. Comprobaciones después del despliegue

```bash
curl -fsS https://tu-app.vercel.app/ | grep -q 'id="root"'
curl -fsS https://tu-app.vercel.app/api/health
```

- Crear una lista, añadir un producto y recargar.
- Abrir una invitación en otro navegador.
- Comprobar que la cookie `sid` es `HttpOnly`, `Secure` y `SameSite=Lax`.
- Comprobar que el código de acceso visible abre `/recover/:code` en otro navegador.
- Probar el cierre de sesión y la expulsión de un miembro.

## 5. Rollback

- Vercel: **Deployments → Promote** de un deployment anterior.
- Render: **Rollback** al deploy anterior.
- Supabase: restaurar backup. Las migraciones son aditivas; evita borrar columnas en caliente.

## 6. Variables de entorno

| Variable | Dónde | Ejemplo |
| --- | --- | --- |
| `DATABASE_URL` | Render | Session Pooler de Supabase |
| `DATABASE_SSL` | Render | `require` |
| `DATABASE_PREPARE` | Render | `true` (5432) / `false` (6543) |
| `PUBLIC_URL` | Render | `https://tu-app.vercel.app` |
| `LOG_LEVEL` | Render | `info` |
| `RUN_MIGRATIONS` | Render (free) | `true` en una sola instancia |
