# AGENTS.md · Mapa operativo de ErFrigovacio

> **Para cualquier IA que trabaje en este repo:** lee este archivo antes de explorar.
> **OpenCode lo carga automáticamente al inicio de cada sesión.**
> Si cambias la estructura, rutas, flujos o comandos, actualiza este mapa en el mismo cambio.
> Objetivo: no re-descubrir el repo en cada petición.

## 1. Qué es esto (estado actual)

Lista de la compra familiar, móvil primero, en español. **No hay cuentas, contraseñas ni PIN.**

- Cada dispositivo recibe una **identidad anónima** (nombre generado, p. ej. “Manolo 3996”) y una sesión con cookie `httpOnly`.
- Crear lista o abrir un enlace de invitación **crea la identidad y la sesión automáticamente**.
- El enlace de invitación es el secreto: `/join/:code`. El código empieza en 6 caracteres y crece solo con el número de hogares (ADR 0007).
- Desde `Hogar` puedes generar un vale temporal de un solo uso para abrir **la misma identidad** en otro dispositivo (`/transfer/:code`). No hay usuario ni PIN (ADR 0006).
- En `Hogar` también puedes crear un **código de recuperación** de 16 caracteres para volver a tu identidad si pierdes el móvil o borras las cookies (`/recover/:code`). Solo se guarda su hash (ADR 0008).
- La lista se sincroniza por sondeo cada **3 s** con actualizaciones optimistas.
- La sección **Más usados** agrupa productos parecidos (plurales, tildes, erratas de una letra, “de/la”…) y permite añadirlos a la lista con un toque.
- La IP **solo** se usa para rate limiting. Nunca como identidad ni autorización.
- Decisión vigente: `docs/adr/0005-acceso-anonimo.md`. `docs/ARCHITECTURE.md` contiene partes históricas.

## 2. Stack y comandos

| Capa | Tecnología |
| --- | --- |
| Web | React 19 + Vite + TypeScript + Tailwind CSS 4 + TanStack Query |
| API | NestJS 11 + Fastify + Zod |
| Datos | PostgreSQL 17 + Drizzle ORM |
| Contratos | `@emptyfridge/contracts` (Zod + tipos compartidos) |
| Infra | Docker Compose + nginx, PWA |

**Importante:** `pnpm` no está en PATH en esta máquina. Usa siempre `corepack pnpm`.

```bash
corepack pnpm install
corepack pnpm --filter @emptyfridge/contracts build

corepack pnpm --filter @emptyfridge/api typecheck
corepack pnpm --filter @emptyfridge/web typecheck
corepack pnpm --filter @emptyfridge/api test
corepack pnpm --filter @emptyfridge/web test
corepack pnpm --filter @emptyfridge/api build
corepack pnpm --filter @emptyfridge/web build

corepack pnpm exec biome check .
corepack pnpm e2e                 # requiere stack en localhost:8080
docker compose up -d --build      # aplica migraciones y reconstruye
docker compose logs -f api
```

E2E: Playwright, `localhost:8080`, un solo worker. Si falla por caché de PWA, recarga forzada o usa el contexto de Playwright.

## 3. Estructura exacta

```text
emptyfridge/
├─ AGENTS.md                         ← este mapa
├─ apps/
│  ├─ api/
│  │  ├─ src/
│  │  │  ├─ main.ts                  ← bootstrap Fastify, cookies, prefijo /api
│  │  │  ├─ app.module.ts            ← AuthModule + ListsModule + SharedModule
│  │  │  ├─ modules/
│  │  │  │  ├─ auth/                 ← identidad anónima, hogar, sesión
│  │  │  │  └─ lists/                ← lista actual, productos, más usados
│  │  │  └─ shared/                  ← db, config, errores, health, logging
│  │  └─ drizzle/                    ← migraciones SQL + snapshots
│  └─ web/
│     ├─ public/
│     │  ├─ brand/logo-oficial.webp  ← logo oficial completo
│     │  └─ icons/                   ← favicon/PWA (logo oficial)
│     └─ src/
│        ├─ app/                     ← App, rutas, ProtectedLayout, QueryClient
│        ├─ features/
│        │  ├─ auth/                 ← /join, hooks y api de sesión
│        │  ├─ household/            ← onboarding, hogar, compartir
│        │  └─ list/                 ← lista actual, más usados, sugerencias
│        └─ shared/                  ← api client, UI, formato, query keys
├─ packages/contracts/src/           ← contratos Zod compartidos
├─ e2e/shopping-list.spec.ts         ← flujo completo
├─ docker-compose.yml
├─ apps/web/vite.config.ts           ← PWA, manifest, proxy /api
└─ docs/                             ← ADRs, arquitectura, despliegue
```

## 4. Backend: módulo `auth`

Regla de dependencia: `interface → application → domain ← infrastructure`.

| Archivo | Responsabilidad |
| --- | --- |
| `domain/household.ts` | `User` (sin PIN), `Household`, `Membership`, `Role`, `Session`, `TransferToken` |
| `domain/anonymous-name.ts` | Genera nombres anónimos graciosos |
| `domain/normalize-display-name.ts` | Clave única normalizada |
| `domain/invite-code.ts` | Longitud del código de invitación según hogares (6→12) |
| `domain/ports.ts` | Puertos y tokens (`USER_REPOSITORY`, `HOUSEHOLD_REPOSITORY`, `SESSION_REPOSITORY`, `TRANSFER_TOKEN_REPOSITORY`, `TOKEN_GENERATOR`) |
| `application/create-anonymous-user.use-case.ts` | Crea identidad anónima con reintento por nombre duplicado |
| `application/quick-create-household.use-case.ts` | Identidad (si no hay) + hogar + sesión |
| `application/quick-join-household.use-case.ts` | Identidad (si no hay) + membresía + sesión |
| `application/create-household.use-case.ts` | Crea hogar y membresía owner |
| `application/join-household.use-case.ts` | Añade membresía: owner el primero, member el resto |
| `application/issue-session.use-case.ts` | Token aleatorio + hash + cookie |
| `application/revoke-other-sessions.use-case.ts` | Cierra todas las sesiones menos la actual |
| `application/create-transfer-token.use-case.ts` | Vale de 10 min para llevar la identidad a otro dispositivo |
| `application/redeem-transfer-token.use-case.ts` | Consume el vale y emite sesión para la misma identidad |
| `application/generate-recovery-code.use-case.ts` | Código de recuperación de 16 caracteres (solo hash) |
| `application/recover-identity.use-case.ts` | Abre la identidad con el código de recuperación |
| `application/authenticate-session.use-case.ts` | `execute` (obliga) y `tryExecute` (opcional) |
| `application/get-household.use-case.ts` | Hogar + miembros |
| `application/rename-household.use-case.ts` | Solo owner |
| `application/transfer-ownership.use-case.ts` | El owner cede la propiedad a otro miembro |
| `application/remove-member.use-case.ts` | Solo owner |
| `application/logout.use-case.ts` | Borra sesión |
| `infrastructure/drizzle-*.repository.ts` | Consultas Drizzle |
| `interface/quick.controller.ts` | **Entrada sin registro**: `/quick/*` |
| `interface/auth.controller.ts` | `/auth/me`, `/auth/logout`, `/auth/transfer-token`, `/auth/recovery-code` |
| `interface/household.controller.ts` | `/household`, renombrar, expulsar |
| `interface/auth.guard.ts` | Exige sesión |
| `interface/auth-rate-limit.guard.ts` | Rate limit por IP+ruta (solo abuso) |
| `interface/session-cookie.ts` | Nombre `sid`, opciones, `Secure` con HTTPS |

## 5. Backend: módulo `lists`

| Archivo | Responsabilidad |
| --- | --- |
| `domain/shopping-list.ts` | `ShoppingList`, `ShoppingItem`, `HistoryPage`, `Unit` |
| `domain/ports.ts` | `ShoppingListRepository` |
| `application/get-current-list.use-case.ts` | Lista abierta + productos |
| `application/add-item.use-case.ts` | Alta con deduplicación de pendientes |
| `application/update-item.use-case.ts` | Nombre, cantidad, unidad, `checked` |
| `application/delete-item.use-case.ts` | Borrar producto de lista abierta |
| `application/finish-shopping.use-case.ts` | Cierra lista, marca todo comprado |
| `application/most-used.use-case.ts` | Agrupa productos parecidos y devuelve los más usados |
| `application/suggestions.use-case.ts` | Usa `MostUsedUseCase` para el autocompletado |
| `domain/group-product-names.ts` | Clustering por plurales, tildes, erratas y palabras vacías |
| `infrastructure/drizzle-shopping-list.repository.ts` | SQL de listas/items/usage |
| `interface/lists.controller.ts` | Endpoints `/lists/*` |

## 6. API: rutas reales (prefijo global `/api`)

| Método | Ruta | Auth | Qué hace |
| --- | --- | --- | --- |
| POST | `/quick/household` | No | Crea identidad anónima + hogar + sesión. Body `{name}` |
| POST | `/quick/join` | No | Crea identidad si hace falta + membresía + sesión. Body `{inviteCode}` |
| POST | `/quick/transfer` | No | Canjea un vale temporal y emite sesión para la misma identidad. Body `{code}` |
| POST | `/quick/recover` | No | Abre la identidad con el código de recuperación. Body `{code}` |
| GET | `/auth/me` | Cookie | Usuario actual + hogar |
| POST | `/auth/logout` | Cookie | Borra sesión |
| POST | `/auth/transfer-token` | Cookie | Genera vale de 10 min para otro dispositivo |
| POST | `/auth/recovery-code` | Cookie | Genera un código de recuperación nuevo |
| POST | `/auth/sessions/revoke-others` | Cookie | Cierra el resto de sesiones, mantiene la actual |
| GET | `/household` | Cookie | Hogar + miembros |
| PATCH | `/household` | Cookie owner | Renombrar |
| DELETE | `/household/members/:id` | Cookie owner | Expulsar |
| POST | `/household/transfer-ownership` | Cookie owner | Ceder la propiedad a otro miembro |
| GET | `/lists/current` | Cookie | Lista abierta + items |
| POST | `/lists/current/items` | Cookie | Añadir producto |
| POST | `/lists/current/finish` | Cookie | Finalizar compra |
| PATCH | `/lists/items/:id` | Cookie | Actualizar/marcar producto |
| DELETE | `/lists/items/:id` | Cookie | Borrar producto |
| GET | `/lists/suggestions` | Cookie | Sugerencias agrupadas |
| GET | `/lists/most-used` | Cookie | Productos más usados agrupados |
| GET | `/health` | No | Healthcheck |

Errores: `application/problem+json`, códigos estables en `packages/contracts/src/errors.ts`.

## 7. Frontend: rutas y piezas

| Ruta | Componente | Notas |
| --- | --- | --- |
| `/onboarding` | `features/household/OnboardingPage.tsx` | Crear lista sin registro |
| `/join` | `features/auth/JoinHouseholdPage.tsx` | Pestañas: código del hogar / vengo de otro móvil |
| `/join/:code` | `features/auth/JoinHouseholdPage.tsx` | Autoentrar; crea identidad si no hay sesión |
| `/transfer/:code` | `features/auth/TransferPage.tsx` | Canjea el vale de otro dispositivo y entra |
| `/recover/:code` | `features/auth/TransferPage.tsx` (`mode="recovery"`) | Entra con el código de recuperación |
| `/` | `features/list/ListPage.tsx` | Lista protegida |
| `/most-used` | `features/list/MostUsedPage.tsx` | Más usados + botón Añadir por producto |
| `/household` | `features/household/HouseholdPage.tsx` | Compartir, miembros, renombrar, ceder propiedad, cerrar otras sesiones |

- `app/ProtectedLayout.tsx`: sin sesión o sin hogar → `/onboarding`.
- `features/auth/hooks.ts`: `useMe`, `useCreateHousehold`, `useJoinHousehold`, `useCreateTransferTicket`, `useRedeemTransfer`, `useCreateRecoveryCode`, `useRecoverIdentity`, `useRevokeOtherSessions`, `useLogout`.
- `features/auth/api.ts`: `getMe`, `createHousehold` (`/quick/household`), `joinHousehold` (`/quick/join`), `createTransferTicket` (`/auth/transfer-token`), `redeemTransfer` (`/quick/transfer`).
- `features/list/hooks.ts`: `useCurrentList` (polling 3 s), `useMostUsed`, mutaciones optimistas.
- `features/list/MostUsedPage.tsx`: lista agrupada y botón “Añadir”.
- `features/history/`: eliminado. Ya no hay sección de histórico.
- `shared/lib/query-keys.ts`: claves de TanStack Query.
- `shared/api/client.ts`: fetch a `/api`, cookies same-origin, `ApiError`.
- `shared/ui/Logo.tsx`: logo oficial (icono).

## 8. Contratos (`packages/contracts/src`)

| Archivo | Contenido |
| --- | --- |
| `auth.ts` | `userDto`, `householdDto`, crear/unirse/renombrar, códigos de invitación |
| `lists.ts` | Items, listas, más usados, sugerencias, unidades |
| `common.ts` | `uuidSchema` |
| `errors.ts` | Problem Details |
| `index.ts` | Reexporta todo |

Si cambias un contrato: compila contratos antes de typecheck de apps.

## 9. Base de datos (`apps/api/src/shared/db/schema.ts`)

| Tabla | Campos clave | Invariantes |
| --- | --- | --- |
| `users` | `id`, `display_name`, `display_name_key`, `recovery_code_hash`, `created_at` | Sin PIN. Nombre visible único; código de recuperación solo hasheado |
| `households` | `id`, `name`, `invite_code` | Código único; 6–12 caracteres según hogares |
| `household_members` | `household_id`, `user_id`, `role`, `joined_at` | PK compuesta; **`unique user_id`**: un hogar por identidad; owner = creador + primero que entra |
| `sessions` | `id`, `token_hash`, `user_id`, `expires_at` | Solo hash del token; **sin caducidad** (`expires_at` null) |
| `transfer_tokens` | `id`, `user_id`, `token_hash`, `expires_at`, `used_at` | Solo hash; un uso; caduca en 10 min |
| `lists` | `id`, `household_id`, `status`, `closed_at`, `closed_by` | Una sola `open` por hogar |
| `items` | `id`, `list_id`, `name`, `normalized_name`, `checked`, `added_by`, ... | Un pendiente por nombre/lista |

Migraciones: `apps/api/drizzle/`. Generar con:

```bash
corepack pnpm --filter @emptyfridge/api db:generate
```

El servicio `migrate` de Docker aplica migraciones antes de arrancar la API.

## 10. Flujos que no debes romper

### Crear lista (sin registro)
`/onboarding` → `POST /quick/household` → si no hay cookie se crea usuario anónimo + sesión + hogar owner → `GET /auth/me` cacheado → `/`.

### Entrar por enlace
`/join/:code` → `POST /quick/join` → si no hay cookie se crea usuario anónimo + sesión + membresía → `/`. El **primero** que entra es `owner`; el resto, `member` (ADR 0012). Objetivo: enlace → producto en < 10 s. Escribir el código a mano no autoenvía: los códigos pueden crecer de 6 a 12 caracteres.

### Sincronización
`useCurrentList` hace polling cada 3 s. Las mutaciones locales son optimistas. No hay SSE/WebSockets.

### Sesiones sin caducidad y cierre remoto
`IssueSessionUseCase` crea la sesión con `expires_at = null` (no caduca). `AuthGuard` reemite la cookie de 400 días en cada petición autenticada para esquivar el límite del navegador. `POST /auth/sessions/revoke-others` borra todas las sesiones de la identidad menos la actual (ADR 0011).

### Ceder la propiedad
`Hogar` → botón corona de un miembro → `POST /household/transfer-ownership` con `{memberId}` → transacción: el actor pasa a `member` y el destino a `owner`. Solo un propietario actual puede; tras ceder, queda un único owner (ADR 0010).

### Llevarte tu identidad a otro dispositivo
`Hogar` → `POST /auth/transfer-token` (cookie) → vale `XXXX-XXXX-XXXX` de 10 min → en el otro móvil `/transfer/<vale>` → `POST /quick/transfer` consume el vale y emite sesión para el mismo `user_id`. No crea identidad nueva. Un dispositivo con hogar no puede canjear. Ver ADR 0006.

### Recuperar tu identidad
`Hogar` → `POST /auth/recovery-code` → código `XXXX-XXXX-XXXX-XXXX` de 16 caracteres (se muestra una vez) → en el otro móvil `/recover/<código>` → `POST /quick/recover` emite sesión para el mismo `user_id`. No caduca; regenerar invalida el anterior. Ver ADR 0008.

### Más usados + agrupación
`GET /lists/most-used` agrupa productos por parecido: plurales, tildes, mayúsculas, puntuación, palabras vacías y erratas de una letra. Devuelve `{ products: [{ name, count }] }`. En UI: `/most-used`, lista ordenada por uso con botón “Añadir”. El autocompletado de la lista usa la misma agrupación.

## 11. Dónde tocar cada cosa

| Quiero… | Tocar |
| --- | --- |
| Añadir/cambiar un campo del DTO | `packages/contracts/src/*.ts` → mapper API → API client/hook web |
| Añadir un endpoint | `interface/*.controller.ts` + `application/*.use-case.ts` + provider en `*.module.ts` + `features/*/api.ts` + hook |
| Cambiar entrada anónima / sesión | `create-anonymous-user.use-case.ts`, `quick-*.use-case.ts`, `authenticate-session.use-case.ts`, `auth.guard.ts`, `session-cookie.ts` |
| Cerrar sesión en otros móviles | `revoke-other-sessions.use-case.ts`, `auth.controller.ts`, tarjeta “Otros móviles” de `HouseholdPage.tsx` |
| Ceder la propiedad del hogar | `transfer-ownership.use-case.ts`, `household.controller.ts`, `HouseholdPage.tsx` |
| Llevarte tu identidad a otro dispositivo | `create-transfer-token.use-case.ts`, `redeem-transfer-token.use-case.ts`, `TransferPage.tsx`, tarjeta de `HouseholdPage.tsx` |
| Recuperar identidad (móvil perdido) | `generate-recovery-code.use-case.ts`, `recover-identity.use-case.ts`, `users.recovery_code_hash`, `TransferPage.tsx` (`recovery`) |
| Cambiar invitación/compartir | `JoinHouseholdPage.tsx`, `HouseholdPage.tsx`, `quick.controller.ts` |
| Más usados / agrupación | `group-product-names.ts`, `most-used.use-case.ts`, `MostUsedPage.tsx`, `SuggestionsUseCase` |
| Lista/productos | `features/list/*`, `modules/lists/*` |
| Logo/marca | `apps/web/public/brand/`, `apps/web/public/icons/`, `Logo.tsx`, `index.html`, `vite.config.ts`, `README.md` |
| Estilos/UI | `app/styles.css`, `shared/ui/*` |
| PWA/manifest | `apps/web/vite.config.ts` |
| Variables de entorno | `apps/api/src/shared/config/env.ts`, `.env.example`, `docker-compose.yml`, `render.yaml` |
| Migración de BD | `schema.ts` + `db:generate` + `drizzle/` |

## 12. Invariantes de producto y seguridad

- **No reintroducir cuentas, login, PIN ni preguntas de seguridad.** La identidad es anónima. Para cambiar de dispositivo se usa el vale temporal (ADR 0006) o el código de recuperación (ADR 0008), nunca usuario+contraseña.
- **No usar la IP como identidad/autorización.** La IP solo puede usarse para rate limiting.
- UI en **español**, móvil primero, botones grandes, sin menús escondidos.
- Una identidad = un hogar (`unique user_id`). No implementar multi-hogar sin cambiar el modelo y la UI.
- Propietarios: el creador y el primero que entra. Los siguientes son miembros (ADR 0012).
- Todas las consultas de listas/items filtran por `household_id`.
- Cookies `httpOnly`, `SameSite=Lax`, `Secure` con HTTPS; token solo hasheado en BD.
- Las sesiones **no caducan**. La cookie se reemite en cada visita con 400 días (límite del navegador) y se puede cerrar el resto desde `Hogar → Otros móviles` (ADR 0011).
- No guardar emails ni datos personales.
- Confirmar antes de borrar datos, migraciones destructivas o cambios de auth.
- Mantener actualizado `AGENTS.md` si cambia la estructura.

## 13. Verificación antes de terminar

1. `corepack pnpm exec biome check .`
2. `corepack pnpm --filter @emptyfridge/api typecheck`
3. `corepack pnpm --filter @emptyfridge/web typecheck`
4. `corepack pnpm --filter @emptyfridge/api test`
5. `corepack pnpm --filter @emptyfridge/web test`
6. `corepack pnpm --filter @emptyfridge/api build`
7. `corepack pnpm --filter @emptyfridge/web build`
8. `docker compose up -d --build`
9. `corepack pnpm e2e`

Si hay migración nueva, comprobar que `migrate` termina sin error y que el E2E pasa.

## 14. Trampas conocidas

- `pnpm` no está en PATH: usa `corepack pnpm`.
- El `README` y `docs/ARCHITECTURE.md` pueden tener secciones históricas de cuentas/PIN. La verdad actual está en este mapa y en `docs/adr/0005-acceso-anonimo.md`.
- `random/` está ignorada en Git y contiene la imagen original del logo oficial. No borrar localmente.
- El service worker de la PWA puede servir un bundle viejo; en pruebas, recarga forzada o contexto limpio.
- `docker compose up -d --build` es la forma fiable de probar migraciones + API + web juntos.
- El editor/entorno puede tener problemas con acentos en scripts de PowerShell; para Playwright usa selectores ASCII o `getByRole` con regex si hace falta.
