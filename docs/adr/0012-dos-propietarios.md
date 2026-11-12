# 0012 · Dos propietarios por hogar

## Contexto

Con un solo propietario, si esa persona perdía la identidad o abandonaba la lista, el hogar quedaba
con un dueño fantasma: nadie podía renombrarlo ni expulsar miembros. El traspaso de propiedad (ADR
0010) ayuda, pero exige que el dueño siga dentro y actúe.

## Decisión

- El **creador** del hogar es propietario.
- El **primero que entra** con el código de invitación también entra como propietario.
- Los siguientes entran como **miembros**.
- `JoinHouseholdUseCase` mira cuántos miembros hay: si solo está el creador, asigna `owner`; si ya
  hay más, `member`.
- La UI muestra a ambos como **“Propietario”**; los dos pueden renombrar, expulsar y ceder la
  propiedad.
- Ceder la propiedad (ADR 0010) sigue funcionando: el actor pasa a miembro y el destino queda como
  único propietario.

## Consecuencias

- Desde el segundo miembro, el hogar siempre tiene dos personas que pueden gestionarlo. Si una
  pierde el móvil, la otra puede seguir y cederle la propiedad cuando vuelva.
- Hay como máximo dos propietarios por la regla de entrada; el esquema admite más, pero no los
  creamos.
- Si dos personas canjean el mismo código exactamente a la vez, ambas podrían leer “solo hay un
  miembro” y quedar como propietarias. Es una carrera muy improbable y el resultado (tres
  propietarios) no rompe nada.
