# Despliegue

Hay dos caminos válidos. Elige según cuánto quieras administrar.

| Opción | Coste orientativo | Mantenimiento | Cuándo tiene sentido |
| --- | --- | --- | --- |
| **A. VPS + Docker Compose + Caddy** | 4–6 €/mes | Tú: backups, updates, TLS | Familia, simplicidad, coste bajo y control total |
| **B. Vercel + Render + Supabase** | 0–35 $/mes | Casi cero | Quieres servicios gestionados y no tocar un servidor |

La opción A es la que menos piezas tiene y la que yo elegiría para una app familiar. La opción B funciona perfectamente y está preparada en el repo; solo hay que tener claros los límites de los planes gratuitos.

---

## Opción A — VPS con Docker Compose (recomendada)

Requisitos: un VPS con Docker, un dominio y los puertos 80/443 abiertos.

```bash
git clone <repo> emptyfridge
cd emptyfridge
cp .env.example .env
```

Edita `.env`:

```dotenv
DOMAIN=lista.midominio.com
PUBLIC_URL=https://lista.midominio.com
APP_PORT=127.0.0.1:8080
POSTGRES_PASSWORD=<openssl rand -hex 24>
```

```bash
docker compose --profile proxy up -d --build
```

Caddy obtiene el certificado automáticamente. El `db` solo escucha en `127.0.0.1`.

Backups:

```bash
sh infra/backup.sh
```

Añade el cron indicado en el README y prueba una restauración de vez en cuando.

Actualizar:

```bash
git pull
docker compose up -d --build   # el servicio migrate aplica el esquema
```

---

## Opción B — Vercel + Render + Supabase

```text
Navegador
   │  https://tu-app.vercel.app
   ▼
Vercel (SPA estática + rewrite /api/*)
   │  proxy same-origin
   ▼
Render (contenedor de la API NestJS)
   │  SQL con TLS
   ▼
Supabase (solo PostgreSQL)
```

### 1. Supabase: solo PostgreSQL

1. Crea un proyecto en Supabase. Elige una región europea (Frankfurt) para que esté cerca de Render.
2. Guarda la contraseña de la base de datos.
3. En **Connect**, copia la cadena del **Session Pooler** (IPv4, puerto `5432`). No uses la conexión directa si Render no tiene IPv6.
4. Esa cadena es `DATABASE_URL`. Tendrá forma:

   ```text
   postgresql://postgres.<ref>:<password>@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
   ```

5. No hace falta usar Supabase Auth, Realtime, Storage ni las claves `anon`/`service_role`. La app solo usa la base de datos.

Variables para la API:

```dotenv
DATABASE_URL=<session-pooler-url>
DATABASE_SSL=require
DATABASE_PREPARE=true
```

Si prefieres el **Transaction Pooler** (puerto `6543`), funciona, pero:

- `DATABASE_PREPARE=false` (PgBouncer en modo transacción no soporta prepared statements).
- Usa el Session Pooler o la conexión directa para las migraciones.

### 2. Render: API

El repo incluye `render.yaml`. En Render: **New → Blueprint**, conecta el repo y aplica el blueprint.

Ajusta:

- `PUBLIC_URL`: la URL pública de Vercel, por ejemplo `https://emptyfridge.vercel.app`.
- `DATABASE_URL`: la cadena del Session Pooler.
- `DATABASE_SSL=require`, `DATABASE_PREPARE=true`.

El blueprint usa `plan: starter` porque `preDeployCommand` (migraciones antes del deploy) requiere plan de pago. Con `preDeployCommand: node dist/shared/db/migrate.js`, las migraciones se aplican una vez por deploy.

Si usas el plan gratuito:

- No hay `preDeployCommand`.
- Añade `RUN_MIGRATIONS=true` y mantén **una sola instancia**. El entrypoint del contenedor aplica las migraciones y luego arranca la API.
- El servicio se duerme tras un rato sin tráfico; la primera petición tarda en despertar.

Comprueba `https://<servicio>.onrender.com/api/health`. Debe devolver `{"status":"ok"}`.

### 3. Vercel: web

1. Importa el repo en Vercel. **Root Directory = la raíz del repo** (no `apps/web`).
2. Edita `vercel.json` y sustituye el destino del rewrite:

   ```json
   "destination": "https://TU-SERVICIO.onrender.com/api/:path*"
   ```

3. Despliega. Vercel ejecuta el build del monorepo, publica `apps/web/dist` y hace proxy de `/api/*` hacia Render.

El rewrite es importante: el navegador ve la web y la API en el mismo origen (`tu-app.vercel.app`), así que la cookie de sesión sigue siendo first-party y `SameSite=Lax` funciona sin CORS.

Comprueba:

- `https://tu-app.vercel.app` carga la SPA.
- `https://tu-app.vercel.app/api/health` devuelve `{"status":"ok"}` (proxy funcionando).
- Crear un hogar y añadir un producto funciona.

### Dominios propios

- Web: añade el dominio en Vercel y actualiza `PUBLIC_URL` en Render a `https://lista.midominio.com`.
- API: si le pones dominio propio (`api.midominio.com`), actualiza el destino del rewrite en `vercel.json`.
- `PUBLIC_URL` debe empezar por `https://` para que la cookie se marque `Secure`.

### Costes y límites

- **Vercel**: el plan gratuito sobra para una SPA.
- **Render**: el plan gratuito duerme; el starter cuesta unos 7 $/mes y evita el arranque en frío.
- **Supabase**: el plan gratuito puede pausar el proyecto por inactividad; para uso diario, el plan Pro evita sustos.
- Si el presupuesto importa, la opción A (VPS) suele salir más barata y no duerme.

---

## Migraciones

El flujo es siempre el mismo:

```bash
pnpm db:generate   # genera SQL en apps/api/drizzle
pnpm db:migrate    # aplica contra DATABASE_URL
```

- **Docker Compose**: el servicio `migrate` aplica el esquema y termina antes de arrancar la API.
- **Render con plan de pago**: `preDeployCommand` las aplica antes del deploy.
- **Render free / Railway / Fly**: `RUN_MIGRATIONS=true` en una sola instancia.
- **Supabase**: no uses el editor SQL para cambiar el esquema a mano; las migraciones versionadas son la fuente de verdad.

## Backups

- **Supabase**: backups automáticos (según plan). Revisa la retención y prueba una restauración.
- **VPS**: `infra/backup.sh` + cron. Guarda las copias fuera del servidor.

## Seguridad en producción

- `DATABASE_SSL=require` y `DATABASE_PREPARE` acorde al pooler.
- `PUBLIC_URL` con `https://` para cookies `Secure`.
- No expongas la cadena de conexión de Supabase ni las claves `service_role`.
- La app no usa RLS de Supabase: el aislamiento por hogar se hace en SQL. La conexión usa un rol con permisos sobre el esquema; trátala como un secreto.
- Rate limit activo en creación de listas y entrada por enlace. La identidad es anónima: no hay contraseñas que rotar.

## Problemas típicos

| Síntoma | Causa probable | Solución |
| --- | --- | --- |
| `prepared statement "s1" already exists` | Transaction Pooler (6543) | `DATABASE_PREPARE=false` |
| `no pg_hba.conf entry ... no encryption` | SSL desactivado | `DATABASE_SSL=require` |
| Render no conecta a Supabase | Conexión directa IPv6 | Usa el Session Pooler (IPv4) |
| La cookie no se guarda | `PUBLIC_URL` no es https | Pon la URL https real |
| `/api/health` 404 en Vercel | Rewrite mal configurado | Revisa `vercel.json` y la URL de Render |
| El servicio tarda 30 s en responder | Render free dormido | Plan starter o VPS |
| Migraciones fallan al desplegar | `preDeployCommand` en plan free | `RUN_MIGRATIONS=true` y 1 instancia |
