# Arquitectura

> Desde el [ADR 0005](adr/0005-acceso-anonimo.md) el acceso es anónimo: no hay cuentas, PIN ni recuperación. Las secciones de este documento que describen cuentas y PIN son históricas y no reflejan la implementación actual.

## Objetivos

1. **Cero fricción diaria**: abrir, añadir, marcar, finalizar. Sin login constante ni menús.
2. **Datos compartidos** entre los miembros de un hogar, con aislamiento estricto entre hogares.
3. **Autohospedable**: un `docker compose up` y listo.
4. **Código mantenible** sin convertir una lista de la compra en un sistema distribuido.

## Vista general

```text
┌────────────────────┐        /api/*         ┌────────────────────┐
│  apps/web          │ ────────────────────▶ │  apps/api          │
│  React SPA + PWA   │                       │  NestJS + Fastify  │
│  TanStack Query    │ ◀──────────────────── │  Zod + Drizzle     │
└────────────────────┘        JSON            └─────────┬──────────┘
          │                                             │ SQL
          │        packages/contracts (tipos)            ▼
          └───────────────────────────────▶  ┌────────────────────┐
                                             │  PostgreSQL 17     │
                                             └────────────────────┘
```

En Docker: `caddy (opcional) → web (nginx) → api → db`. nginx sirve la SPA y hace de proxy para `/api`, así que web y API son siempre same-origin y las cookies no necesitan CORS.

## Monolito modular

No hay microservicios. Hay un **monolito modular** con una regla de dependencia explícita:

```text
interface → application → domain ← infrastructure
```

```text
apps/api/src/modules/lists/
├─ domain/
│  ├─ shopping-list.ts          # ShoppingList, ShoppingItem, Unit
│  ├─ normalize-item-name.ts    # regla pura
│  └─ ports.ts                  # ShoppingListRepository + token
├─ application/
│  ├─ add-item.use-case.ts
│  ├─ update-item.use-case.ts
│  ├─ finish-shopping.use-case.ts
│  └─ ...
├─ infrastructure/
│  └─ drizzle-shopping-list.repository.ts
└─ interface/
   ├─ lists.controller.ts
   └─ mappers.ts
```

- **domain** no importa Nest, Drizzle, HTTP ni el paquete de contratos. Es TypeScript puro.
- **application** depende de puertos, nunca de Drizzle. Los casos de uso se pueden testear con dobles en memoria y sin base de datos.
- **infrastructure** implementa los puertos. Aquí viven Drizzle, SQL y los detalles de Postgres.
- **interface** adapta HTTP: valida con Zod, llama al caso de uso y mapea a DTO.

### ¿Por qué no abstraer todo?

Las interfaces se crean solo en costuras reales:

- `ShoppingListRepository` y `MemberRepository`: permiten testear sin Postgres y cambiar de ORM sin tocar casos de uso.
- `Clock`: tests deterministas y fechas consistentes.
- `IdGenerator`: UUIDv7 generados de forma controlada.
- `PasswordHasher` y `TokenGenerator`: criptografía sustituible en tests.

No hay `IUserService`, `IUtils` ni capas vacías. La abstracción que no aísla una dependencia real solo añade indirección.

## Flujo de una petición: añadir producto

```text
POST /api/lists/current/items
  │
  ├─ AuthGuard
  │    cookie sid → SHA-256 → sesión válida → miembro (con hogar)
  │
  ├─ ZodValidationPipe(addItemInputSchema)
  │    name, quantity?, unit? → 400 problem+json si falla
  │
  ├─ AddItemUseCase
  │    1. ensureOpen(householdId)
  │       INSERT ... ON CONFLICT DO NOTHING + SELECT
  │       (el índice parcial garantiza una sola lista abierta)
  │    2. normalizeItemName(name) → "leche"
  │    3. ¿ya existe pendiente? → devolver created=false
  │    4. insertar (ON CONFLICT DO NOTHING) y devolver created
  │
  └─ ListsController → toItemDto → 201 { item, created }
```

## Modelo de datos

```text
users 1 ─── 0..1 household_members ─── 1 households
  │                                        │
  │ 1                                      │ N
  N                                      lists 1 ─── N items
sessions
```

| Tabla | Campos clave | Reglas |
| --- | --- | --- |
| `users` | `id`, `display_name`, `display_name_key`, `pin_hash`, `security_question`, `security_answer_hash` | Cuenta global: nombre único (clave normalizada); pregunta y respuesta ambas o ninguna (check); respuesta Argon2id |
| `households` | `id`, `name`, `invite_code` | Código único de 6 caracteres (se aceptan 8 legacy) |
| `household_members` | `household_id`, `user_id`, `role`, `joined_at` | PK compuesta; **`unique user_id`**: un hogar por cuenta; rol `owner`/`member` |
| `sessions` | `token_hash`, `user_id`, `expires_at` | Solo se guarda el hash; `cascade` al borrar la cuenta |
| `lists` | `household_id`, `status`, `closed_at`, `closed_by` | **Índice único parcial**: una sola lista `open` por hogar; autor `closed_by` → `users` |
| `items` | `list_id`, `name`, `normalized_name`, `quantity`, `unit`, `checked`, `added_by` | `cascade` con la lista; autor `set null`; **único pendiente** por `(list_id, normalized_name)` |

Decisiones relevantes:

- **Una lista abierta por hogar** la garantiza Postgres, no la aplicación. Dos peticiones simultáneas no pueden crear dos listas.
- **Finalizar** bloquea la fila (`SELECT ... FOR UPDATE`) y, en la misma transacción, marca todos los productos como `checked` y cierra la lista. La siguiente lista se crea al añadir el primer producto. Dos “Finalizar” simultáneos no cierran dos veces la misma compra.
- **Deduplicación** por `normalized_name` (minúsculas, sin tildes, espacios colapsados) y solo entre pendientes. Un índice único parcial `(list_id, normalized_name) WHERE checked = false` la garantiza incluso si dos personas añaden el mismo producto a la vez; el repositorio usa `ON CONFLICT DO NOTHING` y devuelve el existente con `created=false`.
- **Histórico inmutable desde la API**: editar y borrar exigen que la lista esté `open`.
- **Aislamiento**: toda consulta de productos une con `lists` y filtra `household_id`. Un recurso de otro hogar devuelve `404`, no `403`.

## API

Todas las rutas llevan el prefijo `/api`. Errores en `application/problem+json`.

| Método | Ruta | Auth | Descripción |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | — | Crea la cuenta global y emite sesión |
| `POST` | `/auth/login` | — | Login con nombre + PIN |
| `POST` | `/auth/logout` | — | Borra la sesión y limpia la cookie |
| `PUT` | `/auth/security-question` | Cookie | Configura/actualiza tu pregunta y respuesta de seguridad |
| `POST` | `/auth/recovery/question` | — | Devuelve la pregunta de seguridad de una cuenta |
| `POST` | `/auth/recovery/reset` | — | Verifica la respuesta, cambia el PIN y emite una sesión |
| `GET` | `/auth/me` | Cookie | Cuenta actual (con hogar o `null`) |
| `POST` | `/household` | Cookie | Crea un hogar y la membresía `owner` |
| `POST` | `/household/join` | Cookie | Se une con un código de invitación |
| `GET` | `/household` | Cookie | Hogar + miembros + código de invitación |
| `PATCH` | `/household` | Cookie (owner) | Renombra el hogar |
| `DELETE` | `/household/members/:id` | Cookie (owner) | Quita la membresía de otro usuario; su cuenta sigue existiendo |
| `GET` | `/lists/current` | Cookie | Lista abierta con productos (o `null`) |
| `POST` | `/lists/current/items` | Cookie | Añade (crea la lista si no existe) |
| `PATCH` | `/lists/items/:id` | Cookie | Nombre, cantidad, unidad o `checked` |
| `DELETE` | `/lists/items/:id` | Cookie | Borra un producto de la lista abierta |
| `POST` | `/lists/current/finish` | Cookie | Cierra la compra y marca todos los productos como comprados |
| `GET` | `/lists/history?page=&pageSize=` | Cookie | Histórico paginado |
| `GET` | `/lists/suggestions` | Cookie | Nombres frecuentes para autocompletar |
| `GET` | `/lists/:id` | Cookie | Detalle de una compra |
| `POST` | `/lists/:id/repeat` | Cookie | Copia productos que falten a la lista abierta |
| `GET` | `/health` | — | Liveness + ping a Postgres |

Las rutas estáticas (`current`, `history`, `suggestions`) se declaran antes que `:id` para que Nest no las capture como identificadores.

El nombre es único global en `users`: el login es solo nombre + PIN, sin código de hogar ni ambigüedad entre hogares. Tras registrarse, la cuenta no tiene hogar (`household: null`) y la app lleva al onboarding para **crear uno** o **unirse con un código**. El código de invitación es solo eso: un token para unirse. El cliente guarda en `localStorage` el último nombre (nunca el PIN) para precargar el formulario.

La recuperación es de la cuenta: `recovery/question` devuelve la pregunta configurada y `recovery/reset` verifica la respuesta normalizada contra su hash, cambia el PIN, invalida todas las sesiones de esa cuenta y emite una nueva. Si la cuenta no tiene pregunta configurada, responde `409 RECOVERY_NOT_CONFIGURED`. El creador de un hogar **no** puede resetear el PIN de otra cuenta; solo puede expulsarla del hogar.

## Frontend

```text
apps/web/src/
├─ app/            # router, layout protegido, query client
├─ features/
│  ├─ auth/        # welcome, registro, login, recuperación, invitar/unirse
│  ├─ list/        # lista actual, formulario, item, finalizar
│  ├─ history/     # histórico y detalle
│  └─ household/   # onboarding, crear hogar, invitación, miembros, cuenta
└─ shared/
   ├─ api/         # fetch tipado + ApiError
   ├─ lib/         # query keys, formato, cn
   └─ ui/          # Button, Field, Card, Modal, Spinner
```

- El estado del servidor vive **solo** en TanStack Query. No hay Redux ni Zustand.
- Las mutaciones de marcar/borrar son **optimistas con rollback** si la API falla.
- `useCurrentList` hace polling cada 5 s cuando la pestaña está visible. Es suficiente para una familia y evita WebSockets, reconexiones y estado extra.
- Las `queryKeys` están centralizadas para invalidar por prefijo (`['lists']`).
- La UI es mobile-first, con objetivos táctiles grandes, y se instala como PWA.

## Testing

| Nivel | Qué se prueba | Estado |
| --- | --- | --- |
| Dominio | Normalización de nombres y productos | ✅ Vitest |
| Casos de uso | Registro, login, recuperación, alta con deduplicación, finalizar, hogar, renombrar, expulsar | ✅ Vitest + dobles |
| Contratos | Zod compartido y tipos inferidos | ✅ Compilación |
| Repositorios | SQL real y constraints | ⏳ Testcontainers (siguiente) |
| E2E | Cuenta, crear hogar, compra, histórico, repetir, invitar, login y recuperación | ✅ Playwright |
| Smoke | Stack Docker + health a través de nginx | ✅ GitHub Actions |

Los dobles de test son objetos en memoria, no mocks de framework. Los casos de uso se instancian directamente, sin levantar Nest.

## Operación

- **Migraciones**: Drizzle genera SQL versionado en `apps/api/drizzle`. El servicio `migrate` las aplica antes de arrancar la API y termina. Nunca hay `db push` en producción.
- **Configuración**: Zod valida el entorno al arrancar; si falta una variable, el proceso falla con un mensaje claro.
- **Salud**: `/api/health` comprueba Postgres. Docker usa ese endpoint para el healthcheck; nginx usa `/healthz`.
- **Logs**: Nest Logger con nivel configurable por `LOG_LEVEL`; cada petición registra método, ruta, estado y duración.
- **Backups**: `infra/backup.sh` con `pg_dump` comprimido y retención de 30 días.
- **Despliegue**: VPS con Compose + Caddy o Vercel + Render + Supabase. Ver [DEPLOYMENT.md](DEPLOYMENT.md).

## No objetivos (deliberadamente)

- Microservicios, Kafka, Redis, Kubernetes.
- CQRS, event sourcing, sagas.
- Un bus de eventos para una app de 4 personas.
- Offline-first con resolución de conflictos.
- Multi-idioma. La UI está en español y los textos están centralizados por pantalla; añadir i18n es un cambio localizado.

## Extensiones naturales

- **Varios hogares por cuenta**: quitar el `unique user_id` de `household_members`, añadir un selector de hogar y un `household_id` activo en la sesión.
- **SSE** en `/lists/events` con `LISTEN/NOTIFY` de Postgres, sustituyendo el polling. El puerto `Notifier` sería el único cambio en los casos de uso.
- **Web Push** con VAPID y un service worker para avisar al hogar.
- **Tests de integración** de repositorios con Testcontainers (los E2E ya cubren el flujo de usuario).
- **Preguntas personalizadas y rate limit por cuenta**, además del límite por IP.
