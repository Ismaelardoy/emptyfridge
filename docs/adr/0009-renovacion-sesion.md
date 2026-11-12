# 0009 · Renovación deslizante de la sesión

> **Sustituido por el ADR 0011.** Las sesiones ya no caducan; este documento queda como histórico.

## Contexto

La sesión dura `SESSION_DAYS` (180 por defecto) desde que se emite y **no se renovaba al usarla**.
Alguien que abre la lista todos los días se quedaba fuera a los seis meses sin haber hecho nada
malo.

## Decisión

- En cada petición autenticada, `AuthGuard` comprueba cuánto le queda a la sesión.
- Si queda **la mitad o menos** (90 días con la configuración por defecto), se alarga al completo:
  `sessions.expires_at = ahora + SESSION_DAYS` y se vuelve a emitir la cookie con el mismo token y
  el `maxAge` completo.
- El token **no cambia**: no hay rotación, no se invalidan otros dispositivos y no hay peticiones
  extra en el cliente. Es una única escritura en BD como mucho una vez cada 90 días por sesión.
- La decisión vive en `domain/session-renewal.ts` (`shouldRenewSession`) y la ejecuta
  `RenewSessionUseCase`, para poder probarla sin HTTP.

## Consecuencias

- Quien usa la app al menos una vez cada 90 días no caduca nunca. Quien desaparece, sí.
- No hay renovación en `POST /quick/*` (entradas sin sesión), solo en rutas con `AuthGuard`.
- La cookie sigue siendo `httpOnly`, `SameSite=Lax`, `Secure` con HTTPS.
