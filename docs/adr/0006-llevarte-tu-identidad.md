# 0006 · Llevarte tu identidad a otro dispositivo

## Contexto

El acceso anónimo del ADR 0005 tiene un precio: si cambias de móvil, borras las cookies o pierdes
el dispositivo, la identidad (y el rol de propietario del hogar) se queda atrás. El enlace de
invitación sí te devuelve a la lista, pero como miembro nuevo, no como la misma persona.

Se pidió “usuario y PIN”. Eso reintroduce cuentas: nombres elegidos, credenciales de baja entropía,
fuerza bruta, recuperación y datos personales. No es necesario para resolver el problema real.

## Decisión

- La identidad se mueve con un **vale temporal de un solo uso**, no con una cuenta.
- En `Hogar → Pasar la lista a otro móvil` se genera un código de 12 caracteres (formato `XXXX-XXXX-XXXX`)
  y un enlace `/transfer/<código>`.
- El vale caduca a los **10 minutos**, se consume de forma atómica y solo se guarda su hash
  (`transfer_tokens.token_hash`), igual que las sesiones.
- Generar un vale nuevo invalida el anterior de la misma identidad.
- Al abrirlo en el otro dispositivo se emite una **sesión nueva** para el mismo `user_id`; la sesión
  del dispositivo original sigue viva. No se crea ni se modifica ninguna identidad.
- Un dispositivo que ya tiene hogar no puede canjear un vale (`ALREADY_IN_HOUSEHOLD`): evita cambiar
  de identidad sin querer y dejar un hogar huérfano.
- Sigue sin haber usuario, PIN, contraseña ni recuperación de cuenta. La IP solo se usa para
  rate limiting, nunca como identidad.

## Consecuencias

- Cambiar de móvil con el móvil viejo a mano: 10 segundos y sigues siendo la misma persona.
- Si pierdes el dispositivo **sin haber generado un enlace**, no hay recuperación de esa identidad;
  puedes volver a entrar con el código del hogar como miembro. Es el coste de no tener cuentas.
- El vale es un secreto portador de vida corta: quien lo abra primero se lleva la identidad. Por eso
  caduca rápido, es de un solo uso y se muestra una única vez.
