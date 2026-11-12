# ADR 0002 — Monolito modular en lugar de microservicios

- Estado: aceptado
- Fecha: 2026-01-15

## Contexto

El requisito es una app simple para una familia: listas, productos, histórico y sesiones. Al mismo tiempo se pide código desacoplado, SOLID y fácil de mantener.

## Decisión

Un **monolito modular** con dos módulos de negocio (`auth` y `lists`) y una regla de dependencia explícita:

```text
interface → application → domain ← infrastructure
```

- El dominio es TypeScript puro.
- Los casos de uso dependen de puertos, no de Drizzle.
- La infraestructura implementa los puertos.
- Los contratos HTTP viven en un paquete compartido con Zod.

## Consecuencias

**A favor**

- Un solo despliegue y una sola base de datos.
- Refactorizar entre módulos es barato.
- Los tests de casos de uso no necesitan red ni base de datos.
- La estructura se ve en el árbol de ficheros, no en un diagrama desactualizado.

**En contra**

- No hay aislamiento de fallos entre módulos (irrelevante aquí).
- La disciplina de dependencias hay que mantenerla en revisión: Biome y TypeScript ayudan, pero no sustituyen al criterio.

## Alternativas descartadas

- **Microservicios**: coste operativo y de desarrollo desproporcionado. Una lista de la compra no necesita red entre auth y listas.
- **Next.js full-stack**: menos piezas, pero acopla la interfaz y el backend y dificulta exponer una API estable. Se eligió SPA + API separadas.
- **Clean Architecture con cuatro capas por endpoint**: ceremonia excesiva. Aquí la abstracción se limita a las costuras reales.
