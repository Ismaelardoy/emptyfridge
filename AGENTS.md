# AGENTS.md · Mapa operativo de ErFrigovacio

> **Para cualquier IA que trabaje en este repo:** lee este archivo antes de explorar.
> **OpenCode lo carga automáticamente al inicio de cada sesión.**
> Si cambias la estructura, rutas, flujos o comandos, actualiza este mapa en el mismo cambio.
> Objetivo: no re-descubrir el repo en cada petición.

## 1. Qué es esto (estado actual)

Lista de la compra familiar, móvil primero, en español. **No hay cuentas, contraseñas ni PIN.**

- Cada dispositivo recibe una **identidad anónima** (nombre generado con humor negro de nevera, p. ej. “MortadelaTriste 4821”) y una sesión con cookie `httpOnly`.
- Crear lista o abrir un enlace de invitación **crea la identidad y la sesión automáticamente**.
- El enlace de invitación es el secreto: `/join/:code`. El código empieza en 6 caracteres y crece solo con el número de hogares (ADR 0007).
- En `Hogar` → **Iniciar sesión en otro dispositivo** se muestra siempre un **código de acceso** guardable de 16 caracteres (`/recover/:code`). Se genera la primera vez y se guarda en claro (y su hash para validarlo). No se guardan emails ni teléfonos. La API del vale temporal de 10 min (`/transfer`) sigue existiendo, pero la UI ya no la usa. Ver ADR 0013.
- La lista se sincroniza por sondeo cada **3 s** con actualizaciones optimistas.
- La sección **Más usados** agrupa productos parecidos (plurales, tildes, erratas de una letra, “de/la”…) y permite añadirlos a la lista con un toque.
- En **Hogar**, al final, hay un historial sutil **«Quién añadió qué»** con las altas que siguen en la lista actual (no compras cerradas ni productos eliminados), para ver los nombres anónimos junto a sus productos.
- Al abrir la lista por primera vez en la sesión, el campo de producto recibe el foco para intentar abrir el teclado directamente.
- Tras añadir el primer producto en un dispositivo no instalado, se sugiere **añadir la app a la pantalla de inicio**: instalación nativa si el navegador la permite (Chrome/Edge/Android) o tutorial por plataforma si no (iOS siempre manual). Solo se muestra una vez por dispositivo y nunca si ya se abrió como app.
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

# Desarrollo con recarga en caliente: API + web + contratos en watch.
# Usa el Postgres de Docker y abre http://localhost:5173
docker compose up -d db
corepack pnpm dev

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
| `application/rename-display-name.use-case.ts` | Cambia el nombre visible de la identidad anónima |
| `application/transfer-ownership.use-case.ts` | El owner cede la propiedad a otro miembro |
| `application/remove-member.use-case.ts` | Cualquier miembro puede expulsar; si sale el owner, se reasigna al más antiguo; la identidad expulsada se borra |
| `application/logout.use-case.ts` | Borra sesión |
| `infrastructure/drizzle-*.repository.ts` | Consultas Drizzle |
| `interface/quick.controller.ts` | **Entrada sin registro**: `/quick/*` |
| `interface/auth.controller.ts` | `/auth/me` (GET/PATCH), `/auth/logout`, `/auth/transfer-token`, `/auth/recovery-code` |
| `interface/household.controller.ts` | `/household`, renombrar, expulsar |
| `interface/auth.guard.ts` | Exige sesión |
| `interface/auth-rate-limit.guard.ts` | Rate limit por IP+ruta (solo abuso) |
| `interface/session-cookie.ts` | Nombre `sid`, opciones, `Secure` con HTTPS |

## 5. Backend: módulo `lists`

| Archivo | Responsabilidad |
| --- | --- |
| `domain/shopping-list.ts` | `ShoppingList`, `ShoppingItem`, `HistoryPage`, `Unit` |
| `domain/ports.ts` | `ShoppingListRepository` |
| `application/get-current-list.use-case.ts` | Lista abierta + productos + última compra reversible (`lastFinished`) |
| `application/add-item.use-case.ts` | Alta con deduplicación de pendientes |
| `application/update-item.use-case.ts` | Nombre, cantidad, unidad, `checked` |
| `application/delete-item.use-case.ts` | Borrar producto de lista abierta |
| `application/finish-shopping.use-case.ts` | Cierra la lista sin tocar los checks; se puede revertir 30 min |
| `application/reopen-list.use-case.ts` | Reabre una compra reciente si no hay otra lista abierta |
| `application/most-used.use-case.ts` | Agrupa productos parecidos y devuelve los más usados |
| `application/suggestions.use-case.ts` | Sugerencias agrupadas (la UI ya no muestra autocompletado) |
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
| PATCH | `/auth/me` | Cookie | Cambiar tu nombre visible. Body `{displayName}` |
| POST | `/auth/logout` | Cookie | Borra sesión |
| POST | `/auth/transfer-token` | Cookie | Genera vale de 10 min para otro dispositivo |
| POST | `/auth/recovery-code` | Cookie | Genera un código de recuperación nuevo |
| POST | `/auth/sessions/revoke-others` | Cookie | Cierra el resto de sesiones, mantiene la actual |
| GET | `/household` | Cookie | Hogar + miembros |
| PATCH | `/household` | Cookie owner | Renombrar |
| DELETE | `/household/members/:id` | Cookie | Expulsar (cualquier miembro) |
| POST | `/household/transfer-ownership` | Cookie owner | Ceder la propiedad a otro miembro |
| GET | `/lists/current` | Cookie | Lista abierta + items + altas que siguen en la lista (`recentAdditions`) |
| POST | `/lists/current/items` | Cookie | Añadir producto |
| POST | `/lists/current/finish` | Cookie | Finalizar compra |
| POST | `/lists/:id/reopen` | Cookie | Revertir una compra reciente (30 min) |
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
| `/join` | `features/auth/JoinHouseholdPage.tsx` | Un solo campo que detecta invitación, código de acceso o vale |
| `/join/:code` | `features/auth/JoinHouseholdPage.tsx` | Autoentrar; si ya estás en otro hogar, ofrece salir y entrar en esta |
| `/transfer/:code` | `features/auth/TransferPage.tsx` | Canjea un vale antiguo; la UI ya no genera vales nuevos |
| `/recover/:code` | `features/auth/TransferPage.tsx` (`mode="recovery"`) | Entra con el código de recuperación |
| `/` | `features/list/ListPage.tsx` | Lista protegida |
| `/most-used` | `features/list/MostUsedPage.tsx` | Más usados + botón Añadir por producto |
| `/household` | `features/household/HouseholdPage.tsx` | Compartir, miembros, renombrar, ceder propiedad, código de recuperación, cerrar sesión |

- `app/ProtectedLayout.tsx`: sin sesión o sin hogar → `/onboarding`. En móvil la cabecera se desplaza con el contenido y la navegación inferior es un dock flotante compacto con **Lista más grande en el centro, sin sobresalir**; en escritorio (`lg`) usa barra lateral fija y contenido centrado.
- En la lista, la barra de añadir es compacta y se queda fija arriba. Al escribir, se abren solos los ajustes de cantidad/unidad y no hay desplegable de sugerencias. En móvil, «Finalizar compra» es un botón fijo a todo el ancho fuera de la barra inferior; en escritorio, un botón fijo en la barra lateral. Las tarjetas de producto son de una línea: cantidad junto al nombre y sin autor.
- `features/list/RecentAdditions.tsx`: historial sutil «Quién añadió qué» a partir de `recentAdditions`; se muestra al final de `Hogar`.
- `features/pwa/InstallAppProvider.tsx` + `InstallAppDialog.tsx`: sugerencia de instalar la PWA tras el primer producto. La lógica de detección, evento `beforeinstallprompt`, modo standalone y tutoriales por plataforma está en `shared/lib/pwa-install.ts`.
- `features/auth/AuthScene.tsx`: escena de entrada clara y minimalista compartida por onboarding, acceso y recuperación: fondo crema, manchas de color y una nevera gigante que se mueve despacio y cambia de expresión entre seis caras (`public/brand/fridges/*.webp`). Sin logo enmarcado ni scroll en móvil. Expone `AuthScene`; los estilos `auth-*` viven en `app/styles.css` (con `prefers-reduced-motion`).
- `features/household/onboarding-copy.ts`: las frases de humor que se turnan en la portada cada ~13 s (título + subtítulo), con fundido suave y sin saltos de altura. Con movimiento reducido se queda la primera.
- `features/household/InviteCard.tsx`: fila compacta y sin tarjeta en la lista vacía (botón «Compartir lista» con icono de WhatsApp + copiar y compartir nativo).
- `shared/lib/invite.ts`: enlace/mensaje de invitación y acciones de compartir/copiar reutilizadas por `InviteCard` y `HouseholdPage`.
- `features/auth/hooks.ts`: `useMe`, `useCreateHousehold`, `useJoinHousehold`, `useRenameDisplayName`, `useRedeemTransfer`, `useCreateRecoveryCode`, `useRecoverIdentity`, `useLogout`.
- `shared/lib/credentials.ts`: guarda el código de acceso en el gestor de contraseñas del navegador con `navigator.credentials.store`. Chrome/Edge/Android abren el aviso nativo; Safari no lo soporta y la tarjeta de Hogar ofrece copiar el código. `/join` marca el campo como `current-password` (con un usuario oculto) para que el gestor lo autorrellene.
- `features/auth/api.ts`: `getMe`, `createHousehold` (`/quick/household`), `joinHousehold` (`/quick/join`), `renameDisplayName` (`PATCH /auth/me`), `redeemTransfer` (`/quick/transfer`), `createRecoveryCode` (`/auth/recovery-code`), `recoverIdentity` (`/quick/recover`).
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
| `users` | `id`, `display_name`, `display_name_key`, `recovery_code`, `recovery_code_hash`, `created_at` | Sin PIN. Nombre visible único; el código de acceso se guarda visible y su hash se usa para validarlo |
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

### Salir de una lista y entrar en otra
`Hogar` → “Cerrar sesión en este dispositivo” → `POST /auth/logout` borra la sesión y la cookie; la lista anterior no se toca. Después se puede entrar en otra con su código. Si abres `/join/:code` estando ya en otro hogar, `POST /quick/join` responde `ALREADY_IN_HOUSEHOLD` y la UI ofrece “Salir de la otra lista y entrar en esta”: hace logout y reintenta el join con una identidad nueva.

### Sincronización
`useCurrentList` hace polling cada 3 s. Las mutaciones locales son optimistas. La misma respuesta incluye `recentAdditions` para el historial «Quién añadió qué». No hay SSE/WebSockets.

### Sesiones sin caducidad y cierre remoto
`IssueSessionUseCase` crea la sesión con `expires_at = null` (no caduca). `AuthGuard` reemite la cookie de 400 días en cada petición autenticada para esquivar el límite del navegador. `POST /auth/sessions/revoke-others` borra todas las sesiones de la identidad menos la actual (ADR 0011).

### Ceder la propiedad
`Hogar` → botón corona de un miembro → `POST /household/transfer-ownership` con `{memberId}` → transacción: el actor pasa a `member` y el destino a `owner`. Solo un propietario actual puede; tras ceder, queda un único owner (ADR 0010).

### Entrar en otro dispositivo (código visible)
Al entrar en `Hogar`, si la identidad aún no tiene código, `POST /auth/recovery-code` genera un código `XXXX-XXXX-XXXX-XXXX` de 16 caracteres. El código se guarda en `users.recovery_code` y se devuelve en `/auth/me`, por lo que **se muestra siempre** en la tarjeta **Iniciar sesión en otro dispositivo**. Al aparecer, la web pide una vez al navegador que lo guarde como contraseña del sitio (`navigator.credentials.store`, solo Chrome/Edge/Android) y ofrece el botón «Guardar en el móvil». En el otro dispositivo `/recover/<código>` → `POST /quick/recover` lo valida contra `recovery_code_hash` y emite sesión para el mismo `user_id`. La UI no regenera el código. La API del vale temporal de 10 min (`/transfer`) sigue existiendo, pero la UI ya no la usa. Ver ADR 0013.

### Más usados + agrupación
`GET /lists/most-used` agrupa productos por parecido: plurales, tildes, mayúsculas, puntuación, palabras vacías y erratas de una letra. Devuelve `{ products: [{ name, count }] }`. En UI: `/most-used`, lista ordenada por uso con botón “Añadir”.

### Finalizar y revertir compra
`POST /lists/current/finish` cierra la lista sin marcar ni desmarcar productos. Durante 30 minutos, `GET /lists/current` devuelve `lastFinished` y la pantalla vacía muestra «Revertir compra»; `POST /lists/:id/reopen` la reabre tal cual estaba si no hay otra lista abierta.

### Compartir desde la lista vacía
Con la lista vacía (al principio o después de finalizar), debajo de la tarjeta de estado aparece `InviteCard`: botón grande de WhatsApp, «Copiar enlace» y compartir nativo si el navegador lo permite, más el código del hogar y un enlace a `Hogar`. Se comparte desde la propia lista, sin navegar antes: el portapapeles y `navigator.share` necesitan el gesto del usuario y lo perderían tras un cambio de ruta.

## 11. Dónde tocar cada cosa

| Quiero… | Tocar |
| --- | --- |
| Añadir/cambiar un campo del DTO | `packages/contracts/src/*.ts` → mapper API → API client/hook web |
| Añadir un endpoint | `interface/*.controller.ts` + `application/*.use-case.ts` + provider en `*.module.ts` + `features/*/api.ts` + hook |
| Cambiar entrada anónima / sesión | `create-anonymous-user.use-case.ts`, `quick-*.use-case.ts`, `authenticate-session.use-case.ts`, `auth.guard.ts`, `session-cookie.ts` |
| Cambiar mi nombre visible | `rename-display-name.use-case.ts`, `auth.controller.ts` (`PATCH /auth/me`), `HouseholdPage.tsx`, `features/auth/hooks.ts` |
| Salir de una lista y entrar en otra | `logout.use-case.ts`, `auth.controller.ts` (`POST /auth/logout`), `HouseholdPage.tsx`, `JoinHouseholdPage.tsx` |
| Cerrar sesión en otros móviles | `revoke-other-sessions.use-case.ts`, `auth.controller.ts` (`POST /auth/sessions/revoke-others`). Solo API: la UI ya no muestra esa tarjeta |
| Ceder la propiedad del hogar | `transfer-ownership.use-case.ts`, `household.controller.ts`, `HouseholdPage.tsx` |
| Entrar en otro dispositivo / recuperar identidad | `generate-recovery-code.use-case.ts`, `recover-identity.use-case.ts`, `users.recovery_code`, `users.recovery_code_hash`, `TransferPage.tsx` (`recovery`), tarjeta “Iniciar sesión en otro dispositivo” de `HouseholdPage.tsx` (generación automática si `recoveryCode` es null) |
| Que el móvil recuerde el código de acceso | `shared/lib/credentials.ts`, tarjeta de `HouseholdPage.tsx` («Guardar en el móvil» + aviso automático una vez), formulario de `JoinHouseholdPage.tsx` (`current-password` para autorrelleno) |
| Cambiar invitación/compartir | `JoinHouseholdPage.tsx`, `HouseholdPage.tsx`, `quick.controller.ts` |
| Compartir desde la lista vacía | `InviteCard.tsx`, `shared/lib/invite.ts`, estados vacíos de `ListPage.tsx` |
| Diseño de las pantallas de entrada | `features/auth/AuthScene.tsx`, utilidades `auth-*` de `app/styles.css`, `OnboardingPage.tsx`, `JoinHouseholdPage.tsx`, `TransferPage.tsx` |
| Más usados / agrupación | `group-product-names.ts`, `most-used.use-case.ts`, `MostUsedPage.tsx`, `SuggestionsUseCase` |
| Historial de quién añadió qué (en Hogar) | `recentAdditions` calculado desde los items de la lista abierta en `get-current-list.use-case.ts`, `RecentAdditions.tsx`, `HouseholdPage.tsx` |
| Navegación inferior compacta / botón Lista sin sobresalir | `ProtectedLayout.tsx`, `styles.css` (`list-bottom-space`) |
| Entrada con código unificado | `JoinHouseholdPage.tsx` (`resolveAccessInput`) |
| Sugerir instalar la app / tutorial PWA | `shared/lib/pwa-install.ts`, `features/pwa/*`, `notifyItemAdded` en `features/list/hooks.ts` |
| Lista/productos | `features/list/*`, `modules/lists/*` |
| Logo/marca | `apps/web/public/brand/`, `apps/web/public/icons/`, `Logo.tsx`, `index.html`, `vite.config.ts`, `README.md` |
| Estilos/UI | `app/styles.css`, `shared/ui/*` |
| PWA/manifest | `apps/web/vite.config.ts` |
| Variables de entorno | `apps/api/src/shared/config/env.ts`, `.env.example`, `docker-compose.yml`, `render.yaml` |
| Migración de BD | `schema.ts` + `db:generate` + `drizzle/` |

## 12. Invariantes de producto y seguridad

- **No reintroducir cuentas, login, PIN ni preguntas de seguridad.** La identidad es anónima. Para cambiar de dispositivo se usa el código de recuperación guardable (ADR 0008), nunca usuario+contraseña. No se guardan emails ni teléfonos. La API del vale temporal (ADR 0006) sigue por compatibilidad, pero la UI no la usa.
- **No usar la IP como identidad/autorización.** La IP solo puede usarse para rate limiting.
- **El código de acceso nunca se guarda en `localStorage` en claro.** Para recordarlo se usa el gestor de contraseñas del navegador (`navigator.credentials.store`); si el navegador no lo soporta (iOS Safari, Firefox), se ofrece copiarlo. No prometer guardado automático donde la API no existe.
- UI en **español**, móvil primero, botones grandes, sin menús escondidos.
- Una identidad = un hogar (`unique user_id`). No implementar multi-hogar sin cambiar el modelo y la UI. Si una identidad se queda sin hogar (expulsión o fallo al crear/unirse), se elimina automáticamente; las sesiones, vales y membresías caen en cascada.
- Propietarios: el creador y el primero que entra. Los siguientes son miembros (ADR 0012). Cualquier miembro puede invitar compartiendo el enlace y expulsar a otros; si se expulsa al owner, el miembro más antiguo que queda toma el relevo.
- Todas las consultas de listas/items filtran por `household_id`.
- La instalación de la PWA se detecta con `display-mode: standalone` y `navigator.standalone`; la sugerencia se muestra una vez por dispositivo. **En iOS Safari no se puede instalar por código**: se enseña el tutorial manual. No prometer instalación automática ahí.
- Cookies `httpOnly`, `SameSite=Lax`, `Secure` con HTTPS; token solo hasheado en BD.
- Las sesiones **no caducan**. La cookie se reemite en cada visita con 400 días (límite del navegador). La API permite cerrar el resto (`POST /auth/sessions/revoke-others`), pero la UI ya no muestra esa tarjeta (ADR 0011).
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
- `beforeinstallprompt` solo existe en navegadores compatibles (Chrome/Edge/Android). Si la app está instalada pero se abre en una pestaña normal, no siempre se puede detectar; por eso el modo standalone es la señal principal.
- `docker compose up -d --build` es la forma fiable de probar migraciones + API + web juntos.
- El editor/entorno puede tener problemas con acentos en scripts de PowerShell; para Playwright usa selectores ASCII o `getByRole` con regex si hace falta.
- **Vercel + Render**: la web debe llamar a `/api` y Vercel proxificar a Render (`vercel.json`). Llamar directamente a Render desde Vercel rompe la cookie `SameSite=Lax` por ser otro sitio.
- **Supabase**: usa Session Pooler (5432) con `DATABASE_SSL=require` y `DATABASE_PREPARE=true`; Transaction Pooler (6543) exige `DATABASE_PREPARE=false`.
- **Dependencias**: hay `pnpm.overrides` para Fastify. No subir Zod a 4 sin arreglar la inferencia del frontend. Ver `docs/AUDITORIA-2026-11.md`.

## 15. Despliegue y auditoría

- Guía: `docs/DEPLOY-VERCEL-RENDER-SUPABASE.md`.
- Auditoría: `docs/AUDITORIA-2026-11.md`.
- Vercel: `vercel.json` en la raíz, con build del monorepo y rewrite `/api/*` a Render.
- Render: `render.yaml`, Dockerfile `apps/api/Dockerfile`, healthcheck `/api/health`.
- Supabase: Postgres con SSL; las migraciones se aplican con `preDeployCommand` o `RUN_MIGRATIONS=true`.
- No hace falta separar el repo en `frontend/` y `backend/`: ya está separado en `apps/web` y `apps/api` y comparte contratos.
