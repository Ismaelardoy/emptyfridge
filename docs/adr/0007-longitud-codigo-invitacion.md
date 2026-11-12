# 0007 · Longitud adaptativa del código de invitación

## Contexto

Se propuso empezar con códigos más cortos (4–5 caracteres) y alargarlos cuando se agoten las
combinaciones. El objetivo es que sean fáciles de dictar por teléfono.

Un código de invitación no es solo un identificador: es el **secreto** que da acceso a la lista de
un hogar. Su seguridad no depende de cuántos hogares existan, sino del tamaño total del espacio:

| Longitud | Combinaciones | Bits |
| --- | --- | --- |
| 4 | ~1,05 millones | 20 |
| 5 | ~33,5 millones | 25 |
| 6 | ~1.070 millones | 30 |

Con 4 caracteres, un atacante no necesita acertar el código de *tu* hogar: le basta encontrar
**cualquier** código válido. El rate limit (20 intentos / 5 min / IP) frena a una IP, no a una
botnet. Además, los códigos cortos creados al principio seguirían siendo cortos para siempre,
porque cambiarlos rompería los enlaces ya compartidos por WhatsApp.

## Decisión

- El mínimo se queda en **6 caracteres** (30 bits). No se baja de ahí por ahorrar dos pulsaciones.
- La longitud se calcula con `inviteCodeLengthFor(households)`: crece de uno en uno cuando los
  hogares superan **1/10.000** del espacio disponible.
  - 0–107.373 hogares → 6 caracteres
  - desde 107.374 → 7
  - desde 3.435.973 → 8… hasta un máximo de 12.
- Si aun así se genera un código repetido, el caso de uso reintenta con uno más largo (hasta 4
  intentos).
- Los contratos aceptan de 6 a 12 caracteres, de modo que los códigos antiguos de 6 y 8 siguen
  funcionando.
- Escribir el código a mano ya **no** dispara la petición a los 6 caracteres: se envía al pulsar el
  botón. Abrir `/join/<código>` sigue entrando automáticamente.

## Consecuencias

- Ningún hogar existente queda con un código más débil de lo que ya era.
- El crecimiento es una válvula de seguridad: en la práctica no se activará hasta cientos de miles
  de hogares.
- Si algún día se quiere bajar de 6, hay que asumir el riesgo de fuerza bruta y rotar los códigos
  antiguos, lo que invalida enlaces ya compartidos.
