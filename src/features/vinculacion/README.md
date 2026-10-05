# `features/vinculacion/` — Vincular el kit por QR

Lo que ve un familiar con cuenta nueva: vincula su kit Lares escaneando el QR de la controladora
y hace la configuración inicial. Diseño completo, contrato con el backend y **cambios al
diagrama de base de datos**: [`docs/vinculacion-kit.md`](../../../docs/vinculacion-kit.md).

Cubre **RF12** (acceso solo de familiares autorizados: quien escanea el QR queda como
`responsable_principal`) y la parte de app de **RF10** (ubicación de cada cámara; el informe,
Sección 3.8, prevé que se asigne desde la aplicación móvil).

| Archivo | Ruta | Qué es |
|---|---|---|
| `InicioVinculacionScreen.tsx` | `/vinculacion` | Paso 1: instrucciones + "Escanear el QR" / "Ingresar el código a mano". Si ya hay un kit vinculado sin terminar, redirige al paso 2. |
| `EscanearQrScreen.tsx` | `/vinculacion/escanear` | Paso 1: cámara (`expo-camera`), con manejo del permiso (pedir / abrir Ajustes). |
| `CodigoManualScreen.tsx` | `/vinculacion/codigo` | Paso 1: código a mano, formateado mientras se escribe ("7K3P-9QXM"). |
| `DatosResidenteScreen.tsx` | `/vinculacion/residente` | Paso 2: nombre (obligatorio) y teléfono (opcional) del residente. |
| `UbicacionCamarasScreen.tsx` | `/vinculacion/camaras` | Paso 3: ubicación de cada cámara del plan del kit (1 a 3), con sugerencias. "Terminar" guarda todo. |
| `VinculacionProvider.tsx` | — | Estado entre pasos (borrador del residente) y la acción `vincular(codigo)`. |
| `codigoKit.ts` | — | Formato del código y del QR: normalizar, formatear, validar, leer el QR. |

## Decisiones

- **El residente se guarda al final del paso 3**, junto con las cámaras. Tener residente es la
  señal de "configuración terminada" (`CuentaProvider`); si se guardara en el paso 2, la app
  saltaría a las pestañas y el paso 3 nunca se vería.
- **El plan del kit fija la cantidad de cámaras.** Cada kit viene de fábrica con 1 a 3 cámaras
  (`kit.cantidad_camaras`, lo que compró el cliente). El paso 3 muestra "Tu kit incluye N
  cámaras" y exactamente N campos; no hay forma de agregar una cámara desde la app. Si el
  backend devolviera más cámaras que el plan, la app igual muestra solo las del plan.
- **Sin "Volver" desde el paso 2**: el kit ya quedó vinculado, volver a escanear no tiene
  sentido. Sí se puede cerrar sesión; al volver a entrar, se retoma en el paso 2 (el borrador del
  residente se pierde, son dos campos).
- **El QR se lee dentro de la app** (no con la cámara del celular): funciona en Expo Go y no
  depende de que la app esté instalada con su esquema `lares://`.
- **Código en Crockford base32** (sin I, L, O, U) y la app corrige O→0 e I/L→1: es lo que más se
  confunde al tipear.
- **Errores que dicen qué hacer**: QR que no es de Lares, kit ya vinculado ("pedile a quien lo
  configuró que te invite"), demasiados intentos. Los textos de 404/409/429 vienen del backend.
- **Consejo del baño en el paso 3**: apuntar la cámara a la puerta, no al interior. Sale de las
  entrevistas del informe (Sección 3.1.2.2).
- **Permiso de cámara**: el texto explica que solo se usa para leer el QR y que no se guarda
  ninguna imagen (coherente con RNF1). No se pide micrófono (`app.json`).

## Cómo probar (mock)

Crear una cuenta nueva desde el Login y usar los códigos de prueba de `src/api/README.md`
(ej. `7K3P-9QXM`). Para el escáner, generar un QR con el texto
`lares://vincular?serie=LR-000123&codigo=7K3P9QXM`.

## Pendiente

- Endpoints en el backend (`PENDIENTE BACKEND`, ver `docs/vinculacion-kit.md`).
- Verificación del mail antes de vincular (decisión abierta, con Firebase).
- Editar la ubicación de las cámaras y el residente después, desde Perfil.
- Invitar a otros familiares (RF12) desde Perfil.
