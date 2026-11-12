# ADR 0003 — Polling y UI optimista en lugar de WebSockets

- Estado: aceptado
- Fecha: 2026-01-15

## Contexto

Varias personas del mismo hogar pueden editar la lista a la vez. Se quiere que los cambios aparezcan “solos” sin añadir infraestructura de tiempo real.

## Decisión

- La lista actual se refresca **cada 5 segundos** mientras la pestaña está visible (`refetchInterval` de TanStack Query).
- Las acciones propias son **optimistas**: marcar, borrar y añadir se reflejan antes de la respuesta y se revierten si falla la petición.
- Los conflictos se resuelven por última escritura. No hay fusión de texto ni relojes vectoriales.

## Consecuencias

**A favor**

- Cero infraestructura extra: ni WebSocket, ni Redis, ni `LISTEN/NOTIFY`, ni reconexión.
- Funciona detrás de cualquier proxy, CDN o red doméstica.
- Un retraso de 5 s es imperceptible para el uso real: alguien añade “leche” mientras otro está en otra pasillo.
- La UI se siente instantánea para quien actúa.

**En contra**

- No hay notificación instantánea entre dispositivos.
- El polling consume peticiones periódicas (una por pestaña cada 5 s; irrelevante para una familia).
- La última escritura gana; dos personas editando el mismo nombre a la vez pueden pisarse.

## Camino de migración

Si se quiere tiempo real:

1. Añadir un puerto `Notifier` en `lists/domain`.
2. Implementarlo con SSE + `LISTEN/NOTIFY` de Postgres.
3. Emitir eventos desde los casos de uso.
4. Sustituir el `refetchInterval` por la suscripción SSE.

El dominio y los casos de uso no cambian. Por eso el polling es una decisión reversible.
