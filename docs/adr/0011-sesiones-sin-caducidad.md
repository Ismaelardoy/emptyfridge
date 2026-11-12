# 0011 · Sesiones sin caducidad y cierre en otros dispositivos

## Contexto

El ADR 0009 renovaba la sesión cuando le quedaba media vida, pero seguía habiendo un límite: si un
móvil dejaba de usarse ~90 días, había que volver a entrar. Para una lista de la compra familiar eso
sobra, y con el código de recuperación (ADR 0008) y el traspaso (ADR 0006) ya hay formas de volver.

## Decisión

- `sessions.expires_at` pasa a ser **nullable**. Una sesión nueva se guarda con `expires_at = NULL`,
  es decir, **no caduca**. La migración `0004` también pone a `NULL` las sesiones existentes.
- `findValidByTokenHash` acepta sesiones sin fecha o con fecha futura (compatibilidad).
- La cookie `sid` se emite con **400 días**, el máximo que respeta Chrome. Como la sesión no caduca,
  `AuthGuard` **reemite la cookie en cada petición autenticada**: mientras uses la app, el móvil no
  se queda fuera nunca. No se escribe en BD para esto.
- Desaparece `SESSION_DAYS` de la configuración; ya no hay TTL de sesión.
- Nuevo `POST /auth/sessions/revoke-others` (cookie): borra todas las sesiones de la identidad
  **menos la actual**. En `Hogar → Otros móviles` hay un botón con confirmación.

## Consecuencias

- No hay caducidad por inactividad ni por tiempo. El único límite real es borrar las cookies o que
  el navegador descarte la cookie tras 400 días **sin abrir la app**.
- Un móvil perdido con la sesión abierta sigue dentro hasta que pulses **Cerrar sesión en los demás
  móviles**. Ese botón es ahora la única revocación remota: úsalo si pierdes o vendes un teléfono.
- El token de sesión es un secreto de larga duración; se guarda hasheado y nunca se expone al JS.
