# ADR 0001 — PostgreSQL y autenticación propia en lugar de Supabase

- Estado: aceptado
- Fecha: 2026-01-15

## Contexto

La app necesita persistencia compartida entre los miembros de un hogar, autenticación sin fricción y despliegue dockerizado. Supabase ofrece Postgres, Auth, Realtime y Storage como servicio gestionado, y también se puede autohospedar.

El uso real de esta app sería: tablas relacionales, sesiones de larga duración y sincronización entre móviles. No hay ficheros, OAuth, emails transaccionales ni funciones edge.

## Decisión

Usar **PostgreSQL** en un contenedor y **autenticación propia**:

- **Cuenta global** con nombre único, PIN de 4 dígitos y pregunta de seguridad. La cuenta existe antes que el hogar.
- **Pertenencia a un hogar** en `household_members`; hoy `unique user_id` limita a un hogar por cuenta. Para varios hogares se quita el índice y se añade un selector.
- PIN con Argon2id y pepper de servidor.
- Recuperación con **pregunta de seguridad** de una lista fácil; la respuesta se normaliza y se hashea con el mismo Argon2id + pepper. Sin emails.
- El PIN es de la cuenta: el creador del hogar no puede cambiarlo; solo puede expulsar al miembro. La recuperación es personal.
- Sesiones con token aleatorio; en base de datos solo el SHA-256.
- Cookie `httpOnly`, `SameSite=Lax`, `Secure` con HTTPS, 180 días.
- Rate limit en registro, login, unirse a un hogar y recuperación.

## Consecuencias

**A favor**

- Un contenedor menos que mantener: Supabase autohospedado son ~10 servicios.
- Sin dependencia de un proveedor para el caso de uso principal.
- Auth adaptada al producto: cuenta primero, hogar después, sin emails ni magic links.
- Si mañana se quiere Supabase, sigue siendo Postgres: cambia la cadena de conexión y los repositorios no se tocan.
- El dominio y los casos de uso se testean sin infraestructura.

**En contra**

- Hay que administrar backups, actualizaciones de Postgres y TLS (resuelto con Caddy).
- Algunas funciones estándar (recuperación por email, OAuth) no vienen regaladas. La pregunta de seguridad cubre la recuperación sin depender de un proveedor de email.
- Un PIN de 4 dígitos tiene poca entropía; el pepper y el rate limit no son opcionales. La pregunta de seguridad también es un secreto débil, así que está rate-limited y, al usarla, invalida las sesiones.
- Si la cuenta no configura la pregunta, pierde la recuperación automática; por eso es obligatoria al registrarse.
- El modelo actual es de un hogar por cuenta. Varios hogares requieren quitar el `unique user_id`, un selector y un hogar activo por sesión; es una extensión consciente, no un cambio silencioso.

## Cuándo revisar esta decisión

- Si se quiere delegar backups y operación en un servicio gestionado.
- Si se necesitan OAuth/social, storage de ficheros o edge functions.
- Si la app deja de ser familiar y requiere cuentas verificadas por email o un segundo factor real (OTP).
