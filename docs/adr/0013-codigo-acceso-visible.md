# 0013 · Código de acceso visible en Hogar

## Contexto

El código de recuperación de ADR 0008 se guardaba solo hasheado y se mostraba una única vez. En la
práctica era fácil perderlo: la persona entraba en `Hogar`, veía la tarjeta, no lo copiaba y ya no
podía volver a consultarlo. Para una lista de la compra familiar, eso generaba más soporte que
seguridad real.

## Decisión

- Se guarda el código de acceso también en claro en `users.recovery_code`, además de su hash en
  `users.recovery_code_hash`.
- `/auth/me` devuelve `recoveryCode` formateado, así que la tarjeta **Iniciar sesión en otro
  dispositivo** lo muestra siempre.
- La UI lo genera automáticamente la primera vez que hace falta. No hay botón para regenerarlo.
- `POST /quick/recover` sigue validando contra el hash, no contra el texto visible.
- No se guardan emails ni teléfonos: la recuperación sigue siendo un código que se puede guardar o
  compartir con otro miembro.

## Consecuencias

- Cualquiera con acceso a la base de datos puede leer los códigos de acceso. Es el intercambio
  consciente por una UX mucho más simple y por no perder la identidad al cerrar sesión.
- Las identidades creadas antes de este cambio no tienen `recovery_code`: la app les genera uno
  nuevo al entrar en `Hogar` y el código antiguo deja de servir.
- El código se puede rotar por API (`POST /auth/recovery-code`), pero la UI no expone esa acción.
- El vale temporal de ADR 0006 sigue existiendo por compatibilidad, aunque la UI ya no lo usa.
