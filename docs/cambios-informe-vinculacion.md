# Cambios al informe: vinculación del kit e instalación

> **Para Claude Code, trabajando en el repo del informe (`PFI_Ellero_Ferrario`, LaTeX).**
> Este documento dice qué agregar al informe y en qué sección. Lo armó la sesión que trabaja en
> la app móvil (repo `PFI_Ellero_Ferrario_Frontend`). Avanzá sección por sección y mostrale a
> Lucas cada cambio antes de pasar a la siguiente.

## Antes de empezar

1. **Actualizá el repo del informe.** Las copias locales estaban atrasadas (el 2026-10-04 las
   dos estaban en el commit del 14/08 y la marca Lares solo estaba en GitHub). Hacé `git pull`
   en `D:\PFI_Ellero_Ferrario` y confirmá que `chapters/chapter03.tex` tiene la sección
   `\section{Branding}` antes de tocar nada.
2. **Leé la fuente técnica:** `D:\PFI_Ellero_Ferrario_Frontend\docs\vinculacion-kit.md`. Tiene
   el diseño completo (flujo, QR, instalación, entidades de la base de datos campo por campo,
   endpoints y seguridad). Este documento solo dice **dónde** va cada parte en el informe; los
   datos salen de ahí. No inventes campos, números ni decisiones que no estén en esa fuente.
3. **Respetá el estilo del repo** (`.claude/memory/feedback_estilo_guiones.md`):
   - Nada de guiones largos (`---`, `--`, `—`) como aclaración; usar comas o paréntesis.
   - No abusar de los dos puntos.
   - Nada de tono "meta" ("esta sección describe...", "a continuación se presenta..."); ir
     directo al contenido.
   - Escribir como el resto del informe: tercera persona impersonal, párrafos y no listas
     salvo donde el capítulo ya usa listas, referencias con `Sección~\ref{...}` y
     `Figura~\ref{...}`, requerimientos citados como RF/RNF.
   - El producto se llama **Lares** (macro `\marca`), la controladora **Lar** (`\modcont`) y
     cada cámara **Vela** (`\modcam`). **Ojo:** esas macros se definen con `\newcommand` al
     principio de la sección Branding (3.10), así que **no existen todavía** en las secciones
     anteriores (3.2 a 3.8). Ahí, o se escribe el nombre a mano, o se le propone a Lucas mover
     los `\newcommand` al preámbulo (`main.tex`) para poder usarlas en todo el documento.
     Fuera de Branding, el informe hoy habla de "la controladora" y "las cámaras IP"; mantener
     esa forma y usar los nombres de marca solo donde aporten.

## Qué se decidió (resumen para tener contexto)

- **Instalación "enchufar y listo".** El kit viene preconfigurado de fábrica. La controladora
  no necesita monitor, teclado ni mouse. Se conecta a internet **con un cable de red al router**
  de la casa; el cable **no está incluido en el kit**, lo aporta el familiar. Las cámaras se conectan a una **red wifi privada que arma la propia
  controladora** y vienen configuradas de fábrica para usar solo esa red, por lo que **no tienen
  salida a internet**. El software arranca solo al encender la controladora, también después
  de un corte de luz.
- **Luz de estado** en la controladora (ámbar titilando: sin internet; verde titilando:
  esperando vinculación; verde fija: funcionando; roja: problema). La app muestra lo mismo en
  palabras.
- **Vinculación por QR desde la app.** El familiar instala la app, crea su cuenta, escanea el
  QR de la etiqueta de la controladora (o tipea el código de 8 caracteres) y queda como
  responsable principal del hogar. Después carga el nombre y teléfono del residente y la
  ubicación de cada cámara. Otros familiares entran por invitación.
- **Plan de cámaras.** Cada kit sale de fábrica con la cantidad de cámaras que compró el
  cliente (de 1 a 3, coherente con la Sección 3.9.2.1: el kit trae 1 cámara y se suman hasta 3).
  Al escanear el QR, la app solo deja configurar la ubicación de esas cámaras. El backend no
  acepta cámaras por encima del plan.
- **Panel de control local**: queda como herramienta técnica (equipo y soporte), accesible
  desde un navegador en la red de la casa. El familiar hace todo desde la app.
- **Base de datos**: entidad nueva KIT (separada de HOGAR) y cambios en RESIDENTE, EVENTO y
  otras (detalle en la fuente).
- **A futuro**: conectar la controladora por wifi en vez de cable, con la app pasándole la red
  por Bluetooth.

## Cambios por sección

Prioridad: **[A]** hacer, **[B]** recomendado, **[C]** consultar con Lucas antes.

### Cap. 3 · 3.2 Requerimientos

- **[C] RF nuevo de vinculación.** Proponer a Lucas un RF14, por ejemplo: "El sistema debe
  permitir vincular un kit con la cuenta de un familiar mediante un código QR, dejándolo como
  responsable principal del hogar". Si lo aprueba: agregarlo en 3.2.1, sumar su historia de
  usuario en la Tabla 3.I ("Como responsable a cargo, quiero vincular el kit escaneando un
  código, para ponerlo en marcha sin ayuda técnica") y revisar dónde se cuentan los RF (ej. "RF1
  a RF13").
- **[C] Redacción de RF10.** Hoy dice que las cámaras se configuran "desde un panel de
  administración local". Con lo decidido, el familiar asigna la ubicación desde la app y el
  panel local queda para soporte. Consultar si se ajusta la redacción.

### Cap. 3 · 3.3 Mockups

- **[A] Figuras nuevas.** Ya están hechas en el repo del Frontend, en
  `docs/informe/imagenes/`, con el nombre final (mismo estilo que las Figuras 3.1 y 3.2):
  - `Mockup_Mobile_Flujo3.png`: crear cuenta (06), vinculá tu kit (07) y escanear el QR (08).
  - `Mockup_Mobile_Flujo4.png`: código a mano (09), residente (10), ubicación de la cámara
    según el plan (11) y perfil (12).
  Copiarlas tal cual a `Imagenes/` del informe e incluirlas con el mismo formato de figura que las existentes,
  con un párrafo para cada una en el tono de la sección: qué resuelve cada pantalla y qué
  requerimiento cubre (RF12 y RNF10 para la cuenta y la vinculación, RF10 para la ubicación de
  cámaras, RNF8 para la simplicidad). Puntos a destacar: la validación en vivo del alta de
  cuenta, el QR como forma de instalar sin ayuda técnica, la alternativa del código a mano, el
  plan del kit que fija cuántas cámaras se configuran, y el consejo de apuntar la cámara del
  baño a la puerta (sale de las entrevistas, Sección 3.1.2.2).
- **[C] Modo oscuro.** En la misma carpeta están `Mockup_Mobile_Oscuro1.png` (01 a 05),
  `Mockup_Mobile_Oscuro2.png` (06 a 08) y `Mockup_Mobile_Oscuro3.png` (09 a 12). Consultar con
  Lucas si se incluye alguna (por ejemplo solo `Oscuro1`, con una oración sobre el modo oscuro)
  o si quedan fuera del informe.

### Cap. 3 · 3.4.1 Diagrama de Casos de Uso

- **[B]** En el texto, sumar al Bloque 2 (App Mobile) el caso de uso "Vincular kit", que
  incluye "Autenticarse". La figura (`Diagrama_Casos_Uso_PFI.png`) es de Lucidchart: **no se
  puede regenerar desde acá**. Dejar un comentario `% TODO Lucas: agregar "Vincular kit" al
  Bloque 2 del diagrama de casos de uso` junto a la figura y avisarle.

### Cap. 3 · 3.5.1 Diagrama de Arquitectura

- **[A]** En el texto: la controladora sale a internet por **cable de red** al router de la
  casa, y las cámaras se conectan a una **red privada de la controladora sin salida a
  internet**. Vincularlo con RNF1: además de procesar el video localmente, las cámaras no
  pueden mandar video afuera aunque quisieran.
- **[A]** La figura (Lucidchart) muestra la cámara conectada directo al nodo de inferencia.
  Dejar `% TODO Lucas: mostrar la red privada cámaras↔Lar y el cable Lar↔router` y avisarle.

### Cap. 3 · 3.5.2 Diagrama de Base de Datos (lo principal)

- **[A] Texto.** Actualizar la descripción del modelo de nube con lo de la fuente
  (`vinculacion-kit.md`, sección 4):
  - **KIT** (nueva): por qué está separada de HOGAR (la credencial es del aparato; si se cambia
    la controladora, el hogar conserva su historial; el kit existe desde fábrica, antes que el
    hogar). Campos principales: número de serie, **cantidad de cámaras del plan (1 a 3)**, hash
    del código de vinculación, hash de la credencial de la controladora, hogar (nulo hasta la
    vinculación), quién y cuándo lo vinculó, última conexión.
  - **CAMARA**: pertenece al KIT (las cámaras del plan se crean en fábrica junto con el kit) y
    recibe el hogar recién al vincular. Un kit nunca tiene más cámaras que su plan; relacionarlo
    con la oferta de la Sección 3.9.2.1 (cámara adicional a USD 15, hasta 3 por controladora).
  - **HOGAR**: sin `direccion` (si Lucas lo confirma, es una decisión abierta) y sin la
    credencial, que pasa a KIT.
  - **RESIDENTE**: `telefono` (lo usa el botón "Llamar" de la alerta).
  - **EVENTO**: `camara_id` opcional (los desvíos de rutina no vienen de una cámara) y
    `resuelta_at` / `resuelta_por` (quién atendió la alerta y cuándo; esto convive con
    `es_alerta`, que ya está justificado en el texto actual).
  - **DISPOSITIVO_FAMILIAR** (nueva): tokens de push de cada celular del familiar (RF8).
  - **INVITACION**: **[C]** solo si Lucas confirma que se usa.
  - Mantener el tono del texto actual, que explica cada decisión del modelo con su porqué.
- **[A] Figura 3.8.** Es de Lucidchart. La fuente tiene el diagrama completo en Mermaid como
  guía (`vinculacion-kit.md`, "Diagrama completo"). Dejar
  `% TODO Lucas: rehacer la Figura 3.8 con KIT y los campos nuevos (ver docs/vinculacion-kit.md del Frontend)`
  y avisarle.
- **[B]** Revisar que el texto actual no diga que el backend "todavía no arrancó" si ya no es
  así: `cloud/` está implementado y probado localmente en el repo Backend, aunque no desplegado
  en AWS. **Confirmar con Lucas** qué estado reportar en esta entrega.

### Cap. 3 · 3.8 Viabilidad Técnica

- **[A]** El párrafo final ("el kit se entrega armado y preconfigurado...") ampliarlo con la
  instalación concreta: conexión al router con un cable de red (no incluido en el kit), sin
  monitor, cámaras ya emparejadas con la
  controladora, arranque automático, luz de estado y vinculación escaneando el QR desde la app.
  El kit trae definida de fábrica la cantidad de cámaras del plan (1 a 3), que coincide con el
  máximo de tres por controladora que ya plantea esta sección (RNF9); al vincularlo, el familiar
  solo ubica esas cámaras.
- **[A]** Reforzar el argumento de privacidad que ya está en esta sección (cámaras domésticas
  que mandan video a la nube del fabricante): con la red privada, las cámaras del kit no tienen
  salida a internet.
- **[C] Presupuesto (Tabla 3.III).** El cable de red **no se suma** (no está incluido en el
  kit). Lo único que podría sumarse es un adaptador wifi USB, si el wifi de la Raspberry no
  alcanza para las 3 cámaras. **No cambiar números sin preguntarle a Lucas**: el costo del kit alimenta el modelo financiero de la Sección 3.9 (escenarios, VAN,
  TIR) y cualquier cambio arrastra esas cifras. Pedirle los precios.

### Cap. 3 · 3.10 Branding · Ecosistema de producto

- **[B]** La sección ya menciona "una luz verde de estado" en Lar. Sumar los estados de la luz
  (tabla o una oración, según el estilo de la sección) y la etiqueta con el QR y el código en la
  base de Lar, como parte de la experiencia de producto ("enchufar y listo").

### Cap. 4 · 4.2.3 Backend en la nube y arquitectura de red

- **[A]** La sección ya justifica conexiones salientes por HTTPS sin puertos abiertos en la casa.
  Sumar que la controladora sale por cable, que se autentica con una credencial propia del kit
  (no del familiar), que avisa periódicamente que está en línea y que la red de las cámaras es
  privada y no sale a internet.
- **[A]** Describir la vinculación: el familiar escanea el QR desde la app y la app llama a un
  endpoint de vinculación con el código; el backend lo valida (guardado como hash, de un solo
  uso, con límite de intentos) y crea el hogar con ese familiar como responsable principal.
  Datos en `vinculacion-kit.md`, sección 5.
- **[B]** Mencionar como trabajo futuro la conexión por wifi con la app pasando la red por
  Bluetooth, para hogares donde el router no está a mano.

### Lo que NO hay que tocar

- El modelo financiero (3.9) y sus figuras, salvo que Lucas lo pida.
- Las figuras de Lucidchart: solo dejar los `% TODO Lucas` y avisar.
- Texto existente que no tenga que ver con estos cambios.

## Al terminar

- Compilar el informe y revisar que no queden referencias rotas (`??`).
- Pasarle a Lucas la lista de `% TODO Lucas` (figuras a rehacer) y las decisiones **[C]** que
  quedaron pendientes.
- No hacer commit ni push sin que Lucas lo pida.
