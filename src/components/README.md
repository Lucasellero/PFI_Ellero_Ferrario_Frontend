# `components/` — Componentes visuales genéricos

Piezas de interfaz sin lógica de negocio, reutilizables en cualquier pantalla. Si un componente
sabe qué es un "evento" o una "alerta", no va acá sino en la feature correspondiente (ej.
`EventoCard` vive en `features/eventos/`).

| Componente | Qué es |
|---|---|
| `Boton` | Botón con variantes `primario` (verde), `peligro` (rojo sólido, ej. "Llamar a Rosa") y `secundario` (solo borde, ej. "Marcar como resuelta"). Soporta `cargando`. |
| `Chip` | Chip de filtro ("Todas", "Urgentes", "Semana"...), con punto de color opcional. |
| `EncabezadoPantalla` | Sobretítulo gris + título grande + círculo con la inicial del residente. |
| `EstadoCarga` | Pantalla completa de "cargando" o "error + Reintentar". |
| `CampoTexto` | Campo de formulario: label + input con ícono + error (borde rojo y mensaje) o ayuda debajo. El error se anuncia al lector de pantalla. Acepta `ref` para pasar el foco al siguiente campo. |
| `BarraSuperior` | Barra de las pantallas fuera de las pestañas: "Volver" (o el texto que se pase, ej. "Cerrar sesión") y el indicador "Paso 2 de 3". |

Todos toman sus estilos de `src/theme`.
