# 0010 · Traspaso de propiedad del hogar

## Contexto

El rol `owner` permitía renombrar el hogar y expulsar miembros, pero no había forma de cederlo. Si
el propietario abandonaba la lista (o perdía la identidad), el hogar quedaba con un dueño fantasma:
nadie podía gestionarlo y el rol no se podía recuperar.

## Decisión

- El propietario actual puede ceder la propiedad a otro miembro del mismo hogar.
- `POST /household/transfer-ownership` con `{ memberId }`, solo para `owner`.
- La operación es atómica: el actor pasa a `member` y el destino a `owner` en la misma transacción.
- No se permite cederse la propiedad a uno mismo (`ALREADY_OWNER`) ni a alguien de otro hogar
  (`MEMBER_NOT_FOUND`).
- En la UI, cada miembro distinto del propietario tiene un botón de corona **“Hacer owner”** con
  confirmación. Al terminar se refrescan el hogar y el DTO del usuario: el antiguo dueño pierde el
  lápiz de renombrar y los botones de expulsar.

## Consecuencias

- Un hogar siempre puede tener un propietario activo y recuperable.
- Hay exactamente un `owner` por hogar tras el traspaso, aunque el esquema admita más; no añadimos
  multi-owner para no complicar permisos ni UI.
- El nuevo propietario conserva su identidad y su sesión; no hace falta volver a entrar.
