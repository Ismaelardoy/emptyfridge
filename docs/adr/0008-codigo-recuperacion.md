# 0008 · Código de recuperación de identidad

## Contexto

La identidad vive en una cookie `sid` de 180 días que **no se renueva al usarla**. Si se borran las
cookies, se pierde el móvil o simplemente caduca, no hay forma de volver a ser la misma persona: el
enlace de invitación te devuelve a la lista como miembro nuevo y el enlace temporal (ADR 0006) solo
sirve durante 10 minutos y con el móvil viejo a mano.

Se pidió “usuario y PIN”. Eso trae nombres de usuario, credenciales cortas, fuerza bruta y
recuperación de cuenta: fricción y datos personales para una lista de la compra.

## Decisión

- Cada identidad puede tener un **código de recuperación** de 16 caracteres (80 bits) con el mismo
  alfabeto sin ambigüedades que los códigos de invitación.
- Se guarda **solo su hash** en `users.recovery_code_hash` (único). No hay nombre de usuario.
- Se genera desde `Hogar → Si pierdes el móvil`, se muestra **una única vez** y se puede copiar. Generar
  otro invalida el anterior al instante.
- Es reutilizable mientras no se regenere: no caduca. `POST /quick/recover` está limitado por IP.
- La pestaña **Vengo de otro móvil** acepta en el mismo campo el enlace de traspaso o el código de
  recuperación; el cliente distingue por longitud (12 vs 16).
- Un dispositivo que ya tiene hogar no puede canjearlo (`ALREADY_IN_HOUSEHOLD`), igual que el
  traspaso.
- Sin usuario, PIN, contraseña ni recuperación de cuenta. El flujo normal de entrada no cambia:
  nadie tiene que generar ni escribir nada para empezar a usar la lista.

## Consecuencias

- Quien guarda su código puede volver a su identidad aunque pierda el móvil o borre las cookies.
- Quien no lo genera sigue expuesto a perderla; no añadimos ese paso a la creación del hogar para
  no romper la entrada en menos de 10 segundos.
- Es un secreto de larga duración: hay que tratarlo como una contraseña (no compartirlo, guardarlo
  fuera del móvil). Por eso es largo, se guarda hasheado y se puede rotar.
- Queda pendiente la renovación deslizante de la sesión y el traspaso de propiedad del hogar.
