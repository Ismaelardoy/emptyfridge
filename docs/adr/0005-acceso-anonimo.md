# 0005 · Acceso anónimo sin cuentas

## Contexto

La app es una lista de la compra familiar. El registro, el PIN y la recuperación añadían pasos antes de poder usar la lista, justo en el momento en el que alguien abre un enlace de WhatsApp. La prioridad del producto es que se pueda añadir un producto en menos de 10 segundos.

## Decisión

- No hay registro, login ni contraseñas.
- Cada dispositivo recibe una **identidad anónima** (nombre generado) y una sesión con cookie `httpOnly` de larga duración.
- Crear una lista o abrir un enlace de invitación crea esa identidad y emite la sesión automáticamente.
- No se usa la IP como identidad ni autorización. La IP solo se usa para rate limiting de abuso.
- El enlace de invitación es el secreto: un código de 6 caracteres con suficiente entropía.
- La sincronización sigue siendo por sondeo corto (3 s) con actualizaciones optimistas; no requiere WebSockets ni Redis.

## Consecuencias

- La entrada es inmediata: enlace → lista → producto.
- Si se pierde la cookie, se pierde el acceso a esa identidad; se puede volver a entrar con el enlace de invitación.
- El propietario puede expulsar a alguien, pero esa persona puede reentrar con el enlace. No hay cuentas ni bloqueo permanente.
- No hay recuperación de identidad ni acceso desde otro dispositivo con la misma identidad. Es el precio de no tener cuentas.
