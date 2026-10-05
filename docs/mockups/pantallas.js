/*
 * Pantallas de los mockups de Lares. Cada lámina (flujo3.html, oscuro1.html...) elige qué
 * pantallas muestra y en qué modo con `dibujarLamina([...], { oscuro })`. Así cada pantalla se
 * escribe una sola vez y la versión clara y la oscura no se desincronizan.
 *
 * 01 a 05: copiadas de Lares_Mobile.html (mockups del informe, Figuras 3.1 y 3.2).
 * 06 a 12: pantallas que existen en la app y no tenían mockup; los textos son los de la app
 *          (src/features/auth, src/features/vinculacion, src/features/perfil).
 */

// ── Piezas comunes ──────────────────────────────────────────────────────────
const SB = `<div class="sb"><span>9:41</span><span class="ic"><svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor"><rect y="8" width="3" height="4" rx="1"/><rect x="4.5" y="5.5" width="3" height="6.5" rx="1"/><rect x="9" y="3" width="3" height="9" rx="1"/><rect x="13.5" width="3" height="12" rx="1"/></svg><svg width="25" height="12" viewBox="0 0 25 12" fill="none"><rect x=".5" y=".5" width="21" height="11" rx="3.5" stroke="currentColor" opacity=".5"/><rect x="2.5" y="2.5" width="15" height="7" rx="2" fill="currentColor"/><path d="M23 4.2v3.6a2 2 0 0 0 0-3.6z" fill="currentColor" opacity=".5"/></svg></span></div>`;

const svg = (d, size = 20, extra = '') =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;

const I = {
  check: '<path d="M4 12.5 9.5 18 20 6.5"/>',
  alerta: '<path d="M12 3.5 21 19H3z"/><path d="M12 9v4.5M12 16.4v.2"/>',
  reloj: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  sol: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4"/>',
  luna: '<path d="M17.5 4.5a7 7 0 1 1-9.6 9.8A8 8 0 0 0 17.5 4.5z"/>',
  corazon: '<path d="M12 20.5s-7.5-4.6-7.5-9.8A4.2 4.2 0 0 1 12 8.2a4.2 4.2 0 0 1 7.5 2.5c0 5.2-7.5 9.8-7.5 9.8z"/>',
  escudo: '<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8 7.5 9.5 4.3-1.5 7.5-4.9 7.5-9.5V6z"/>',
  mail: '<rect x="2.5" y="5" width="19" height="14" rx="3"/><path d="M3 7l9 6 9-6"/>',
  candado: '<rect x="4" y="10.5" width="16" height="10.5" rx="3"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
  usuario: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.8 20c1.3-3.4 4-5 7.2-5s5.9 1.6 7.2 5"/>',
  telefono: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  casa: '<path d="M3.5 11 12 4l8.5 7"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5h4v5"/>',
  cable: '<path d="M7 3v5M11 3v5M5 8h8v3a4 4 0 0 1-8 0z"/><path d="M9 15v3a3 3 0 0 0 3 3h3a3 3 0 0 0 3-3V8"/>',
  qr: '<rect x="3.5" y="3.5" width="6" height="6" rx="1"/><rect x="14.5" y="3.5" width="6" height="6" rx="1"/><rect x="3.5" y="14.5" width="6" height="6" rx="1"/><path d="M14.5 14.5h2v2M20.5 14.5v6h-3M14.5 20.5v0"/>',
  celular: '<rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
  atras: '<path d="M15 5 8 12l7 7"/>',
  llave: '<circle cx="8" cy="15" r="4.5"/><path d="M11.2 11.8 20 3M17 6l2.5 2.5M14.5 8.5 16.5 10.5"/>',
  video: '<rect x="2.5" y="6" width="13" height="12" rx="2.5"/><path d="m15.5 10.5 6-3.5v10l-6-3.5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8v.2"/>',
  checkCirculo: '<circle cx="12" cy="12" r="9"/><path d="m8 12.3 2.8 2.7L16.2 9.5"/>',
  cpu: '<rect x="6" y="6" width="12" height="12" rx="2"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/><path d="M9 2.5V6M15 2.5V6M9 18v3.5M15 18v3.5M2.5 9H6M2.5 15H6M18 9h3.5M18 15h3.5"/>',
  bell: '<path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 13 6 9z M10 18.5a2.2 2.2 0 0 0 4 0"/>',
  barras: '<path d="M5 19V11M12 19V6M19 19v-5"/>',
};

const tabs = (activa, badge) => `<div class="tabs">
  <div class="tab ${activa === 'n' ? 'on' : ''}">${svg(I.bell, 26)}Notificaciones${badge ? `<span class="bdg">${badge}</span>` : ''}</div>
  <div class="tab ${activa === 'r' ? 'on' : ''}">${svg(I.barras, 26)}Reportes</div>
  <div class="tab ${activa === 'p' ? 'on' : ''}">${svg(I.usuario, 26)}Perfil</div></div>`;

const nav = (volver, paso) => `<div class="nav"><div class="back">${svg(I.atras, 22)}${volver}</div>${
  paso
    ? `<div class="paso">${[1, 2, 3].map((n) => `<i class="${n <= paso ? 'on' : ''}"></i>`).join('')}<b>Paso ${paso} de 3</b></div>`
    : ''
}</div>`;

const campo = (label, icono, valor, { error, ayuda, clase = '' } = {}) => `<div class="field"><label>${label}</label>
  <div class="inp ${error ? 'err' : ''}">${icono ? svg(icono, 20, 'style="color:var(--mut)"') : ''}<span class="${clase}">${valor}</span></div>
  ${error ? `<div class="msg err">${error}</div>` : ayuda ? `<div class="msg">${ayuda}</div>` : ''}</div>`;

const LOGO = `<svg class="lg" viewBox="0 0 96 96" aria-label="Lares"><rect width="96" height="96" rx="23" fill="#F8F7F2"/><path d="M18 46 48 22l30 24" fill="none" stroke="#1F5D4B" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="48" cy="48" r="7.5" fill="#1F5D4B"/><path d="M33 74c1.8-9 7.8-14 15-14s13.2 5 15 14" fill="none" stroke="#1F5D4B" stroke-width="6.5" stroke-linecap="round"/></svg>`;

/** QR de prueba (dibujo, no escaneable). */
const QR = (() => {
  const n = 21, c = 4;
  const fijo = (x, y, ox, oy) => x >= ox && x < ox + 7 && y >= oy && y < oy + 7;
  const ojo = (x, y, ox, oy) => {
    const dx = x - ox, dy = y - oy;
    return dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4);
  };
  let r = '';
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      let on;
      if (fijo(x, y, 0, 0)) on = ojo(x, y, 0, 0);
      else if (fijo(x, y, 14, 0)) on = ojo(x, y, 14, 0);
      else if (fijo(x, y, 0, 14)) on = ojo(x, y, 0, 14);
      else on = (x * 7 + y * 13 + x * y) % 3 === 0;
      if (on) r += `<rect x="${x * c}" y="${y * c}" width="${c}" height="${c}"/>`;
    }
  return `<svg width="${n * c}" height="${n * c}" viewBox="0 0 ${n * c} ${n * c}" fill="#1B2A24">${r}</svg>`;
})();

// ── Pantallas ───────────────────────────────────────────────────────────────
const PANTALLAS = {
  '01': {
    titulo: '01 · Login',
    sub: 'Bienvenida cálida, un solo objetivo',
    html: () => `<div class="login"><div class="mark">${LOGO}<div class="brand">LARES</div><div class="sub" style="text-align:center;max-width:270px">La distancia deja de ser<br>un problema.</div></div>
<div style="margin-top:38px">${campo('Correo electrónico', I.mail, 'ana.gomez@mail.com')}${campo('Contraseña', I.candado, '<span style="letter-spacing:.22em">••••••••</span>')}
<div class="btn" style="margin-top:26px">Iniciar sesión</div><div style="text-align:center;margin-top:20px"><a style="font-size:16px;font-weight:600;text-decoration:none">Olvidé mi contraseña</a></div></div>
<div style="margin-top:auto;padding-bottom:26px;text-align:center"><div style="font-size:15px;color:var(--ink2);margin-bottom:10px">¿Te llegó un kit Lares? <a style="font-weight:600;text-decoration:none">Creá tu cuenta</a></div><div style="font-size:14px;color:var(--mut);line-height:1.5">Monitoreo no invasivo · El video nunca sale de tu hogar</div></div></div>`,
  },

  '02': {
    titulo: '02 · Notificaciones (home)',
    sub: 'Estado del día + feed cronológico',
    html: () => `<div class="hdr"><div><div style="font-size:15px;color:var(--mut);font-weight:600">Jueves 13 de agosto</div><h1>Hola, Ana</h1></div><div class="avat">R</div></div>
<div style="padding:0 20px"><div class="sum warn"><div class="big">${svg(I.alerta, 30)}</div><div><h2>2 alertas requieren<br>tu atención</h2><p>Rosa · última señal 14:22</p></div></div></div>
<div class="chips"><div class="chip on">Todas</div><div class="chip"><i class="dot" style="background:var(--rd)"></i>Urgentes</div><div class="chip"><i class="dot" style="background:var(--am)"></i>Moderadas</div><div class="chip"><i class="dot" style="background:var(--lo)"></i>Rutina</div></div>
<div class="body"><div class="pin"><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M9 2h6l-1 7 4 4v2h-5v7h-2v-7H6v-2l4-4z"/></svg>Fijado hasta ser atendido</div>
<div class="card r"><div class="bar"></div><div class="ico">${svg(I.alerta, 24)}</div><div class="txt"><div class="top"><span class="hour">14:20</span><span class="who">Rosa</span></div><div class="evt">Posible caída detectada</div><div class="det">Living · sin movimiento por 3 minutos</div></div><div class="unread"></div></div>
<div class="card a" style="margin-top:14px"><div class="bar"></div><div class="ico">${svg(I.reloj, 24)}</div><div class="txt"><div class="top"><span class="hour">11:05</span><span class="who">Rosa</span></div><div class="evt">Inactividad prolongada</div><div class="det">3 h sin movimiento en el living</div></div><div class="unread"></div></div>
<div class="lbl" style="margin-top:18px">Hoy · rutina</div>
<div class="card g read"><div class="bar"></div><div class="ico">${svg(I.check, 24)}</div><div class="txt"><div class="top"><span class="hour">12:40</span><span class="who">Rosa</span></div><div class="evt">Almorzó en la cocina</div><div class="det">Como es habitual</div></div></div>
<div class="card g read"><div class="bar"></div><div class="ico">${svg(I.sol, 24)}</div><div class="txt"><div class="top"><span class="hour">7:30</span><span class="who">Rosa</span></div><div class="evt">Se levantó a las 7:30</div><div class="det">Como todos los días</div></div></div></div>
${tabs('n', 2)}`,
  },

  '03': {
    titulo: '03 · Detalle de alerta',
    sub: 'Bottom sheet al tocar una tarjeta',
    html: () => `<div class="hdr"><div><div style="font-size:15px;color:var(--mut);font-weight:600">Jueves 13 de agosto</div><h1>Hola, Ana</h1></div><div class="avat">R</div></div>
<div style="padding:0 20px"><div class="sum warn"><div class="big">${svg(I.alerta, 30)}</div><div><h2>2 alertas requieren<br>tu atención</h2><p>Rosa · última señal 14:22</p></div></div></div>
<div class="body"><div class="card r"><div class="bar"></div><div class="ico">${svg(I.alerta, 24)}</div><div class="txt"><div class="top"><span class="hour">14:20</span><span class="who">Rosa</span></div><div class="evt">Posible caída detectada</div></div></div></div>
<div class="scrim"></div><div class="sheet"><div class="grab"></div><div class="tag">${svg(I.alerta, 15)}ALERTA URGENTE</div><h3>Posible caída detectada</h3><div class="meta">Hoy 14:20 · Living · Rosa Méndez</div>
<div class="anon" style="margin-top:12px">${svg(I.escudo, 14)}El video se procesa en tu hogar · nunca se envía a la nube</div>
<div class="kv"><div><span>Confianza del modelo</span><b>92 %</b></div><div><span>Sin movimiento desde</span><b>3 min</b></div><div><span>Última actividad normal</span><b>13:55 · cocina</b></div></div>
<div class="acts"><div class="btn2 p">Llamar a Rosa</div><div class="btn2 s">Marcar como resuelta</div></div></div>`,
  },

  '04': {
    titulo: '04 · Reportes — eventos',
    sub: 'Rutina y eventos del período',
    html: () => `<div class="hdr"><div><div style="font-size:15px;color:var(--mut);font-weight:600">Rosa Méndez</div><h1>Reportes</h1></div><div class="avat">R</div></div>
<div class="chips"><div class="chip">Hoy</div><div class="chip on">Semana</div><div class="chip">Mes</div></div>
<div class="body"><div class="panel"><div class="ph2">Rutina de la semana</div><div class="pnote">Comparado con lo habitual · promedio por día</div><div class="rts-wrap">
<div class="rt g"><div class="ri">${svg(I.check)}</div><div><div class="rtt">Despertar</div><div class="rts">Hoy 7:35 · habitual 7:00–7:45</div></div></div>
<div class="rt g"><div class="ri">${svg(I.check)}</div><div><div class="rtt">Comió</div><div class="rts">Hoy 9:10 · habitual 8:00–9:00</div></div></div>
<div class="rt a"><div class="ri">${svg(I.alerta)}</div><div><div class="rtt">Sedentarismo</div><div class="rts">3 h sentada · habitual 1 h por día</div></div></div></div></div>
<div class="lbl">Eventos de la semana</div>
<div class="card a"><div class="bar"></div><div class="ico">${svg(I.luna, 24)}</div><div class="txt"><div class="top"><span class="hour">Mar · 00:40</span><span class="who">Rosa</span></div><div class="evt">Rutina de sueño alterada</div><div class="det">Se acostó 2 h más tarde de lo habitual</div></div></div>
<div class="card a read"><div class="bar"></div><div class="ico">${svg(I.reloj, 24)}</div><div class="txt"><div class="top"><span class="hour">Mar · 16:10</span><span class="who">Rosa</span></div><div class="evt">Inactividad prolongada</div><div class="det">2 h 40 sin movimiento en el living</div></div></div>
<div class="card g read"><div class="bar"></div><div class="ico">${svg(I.check, 24)}</div><div class="txt"><div class="top"><span class="hour">Lun · 8:15</span><span class="who">Rosa</span></div><div class="evt">Semana sin otros desvíos</div><div class="det">Comidas y descanso en horario</div></div></div></div>
${tabs('r', 2)}`,
  },

  '05': {
    titulo: '05 · Día en orden',
    sub: 'Estado sin alertas: calma, no vacío',
    html: () => `<div class="hdr"><div><div style="font-size:15px;color:var(--mut);font-weight:600">Jueves 13 de agosto</div><h1>Hola, Ana</h1></div><div class="avat">R</div></div>
<div style="padding:0 20px"><div class="sum ok"><div class="big">${svg(I.check, 30, 'stroke-width="2.4"')}</div><div><h2>Todo en orden hoy</h2><p>Rosa · última señal hace 8 minutos</p></div></div></div>
<div class="chips"><div class="chip on">Todas</div><div class="chip"><i class="dot" style="background:var(--rd)"></i>Urgentes</div><div class="chip"><i class="dot" style="background:var(--am)"></i>Moderadas</div><div class="chip"><i class="dot" style="background:var(--lo)"></i>Rutina</div></div>
<div class="body"><div class="empty"><div class="cir">${svg(I.corazon, 46, 'stroke-width="1.8"')}</div><h3>Sin alertas por ahora</h3><p>Rosa está siguiendo su rutina de siempre. Te avisamos en el momento en que algo cambie.</p></div>
<div class="lbl">Hoy · rutina</div>
<div class="card g read"><div class="bar"></div><div class="ico">${svg(I.check, 24)}</div><div class="txt"><div class="top"><span class="hour">8:15</span><span class="who">Rosa</span></div><div class="evt">Tomó la medicación</div><div class="det">Cocina · en su horario</div></div></div>
<div class="card g read"><div class="bar"></div><div class="ico">${svg(I.sol, 24)}</div><div class="txt"><div class="top"><span class="hour">7:30</span><span class="who">Rosa</span></div><div class="evt">Se levantó a las 7:30</div><div class="det">Como todos los días</div></div></div></div>
${tabs('n')}`,
  },

  // ── Pantallas nuevas ─────────────────────────────────────────────────────
  '06': {
    titulo: '06 · Crear cuenta',
    sub: 'Para quien recibe el kit · validación en vivo',
    html: () => `<div class="form">${nav('Volver')}
<div class="intro"><h1>Creá tu cuenta</h1><div class="sub">Después vas a escanear el QR de tu kit para vincularlo con esta cuenta.</div></div>
${campo('Tu nombre', I.usuario, 'Ana Gómez')}
${campo('Correo electrónico', I.mail, 'ana.gomez@gmail.com', { ayuda: 'Gmail, Hotmail, Outlook, Yahoo o iCloud.' })}
${campo('Contraseña', I.candado, '<span style="letter-spacing:.22em">••••••••</span>')}
<div class="reglas">${['Al menos 8 caracteres', 'Al menos una letra', 'Al menos un número']
      .map((r) => `<div class="regla ok">${svg(I.checkCirculo, 14)}${r}</div>`)
      .join('')}</div>
${campo('Repetí la contraseña', I.candado, '<span style="letter-spacing:.22em">•••••••</span>', { error: 'Las contraseñas no coinciden.' })}
<div class="btn">Crear cuenta</div>
<div class="pie" style="margin-top:auto;padding-bottom:22px">Tus datos se usan solo para avisarte lo que pasa en el hogar.</div></div>`,
  },

  '07': {
    titulo: '07 · Vinculá tu kit',
    sub: 'Paso 1 · instrucciones y QR',
    html: () => `<div class="form">${nav('Cerrar sesión', 1)}
<div class="intro"><div class="icir">${svg(I.casa, 30)}</div><h1>¡Hola, Ana!</h1><div class="sub">Vinculemos tu kit Lares con tu cuenta. Así vas a recibir las alertas de tu familiar en este celular.</div></div>
<div class="pasos">
<div class="pasoi"><span class="n">1</span><span class="t">Enchufá la controladora Lar y conectala al router de tu casa con un cable de red.</span>${svg(I.cable, 18)}</div>
<div class="pasoi"><span class="n">2</span><span class="t">Buscá la etiqueta con el código QR en la base de la controladora.</span>${svg(I.qr, 18)}</div>
<div class="pasoi"><span class="n">3</span><span class="t">Escaneala desde acá. Si no podés, tipeá el código que está debajo.</span>${svg(I.celular, 18)}</div></div>
<div class="btn" style="margin-top:22px">Escanear el código QR</div>
<div class="link">Ingresar el código a mano</div>
<div class="nota" style="margin-top:auto;margin-bottom:22px">${svg(I.escudo, 16)}<span>El código solo vincula el kit con tu cuenta. El video se procesa en la controladora y nunca sale del hogar.</span></div></div>`,
  },

  '08': {
    titulo: '08 · Escanear el QR',
    sub: 'Paso 1 · con la cámara del celular',
    camara: true, // pantalla completa de cámara: barra de estado clara sobre fondo negro
    html: () => `<div class="cam"><div class="luz"></div><div class="cuadro"></div><div class="planta"></div><div class="mesa"></div>
<div class="lar"><div class="led"></div><div class="etq">${QR}<small>LR-000124</small><b>4HDW-8R2N</b></div><span class="marca">LAR</span></div></div>
<div class="dim"></div>
<svg class="esquinas" width="152" height="190" viewBox="0 0 152 190" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round">
<path d="M3 32V11a8 8 0 0 1 8-8h21M120 3h21a8 8 0 0 1 8 8v21M3 158v21a8 8 0 0 0 8 8h21M120 187h21a8 8 0 0 0 8-8v-21"/></svg>
<div class="detectado"><span>${svg(I.check, 14, 'stroke-width="3"')}QR detectado</span></div>
<div class="indic">Encuadrá el QR de la etiqueta de la controladora</div>
<div class="flot arriba">${nav('Volver', 1)}</div>
<div class="flot abajo"><div class="spin"></div>Vinculando el kit 4HDW-8R2N…</div>`,
  },

  '09': {
    titulo: '09 · Código a mano',
    sub: 'Paso 1 · si la cámara no lee el QR',
    html: () => `<div class="form">${nav('Volver', 1)}
<div class="intro"><h1>Código del kit</h1><div class="sub">Está impreso debajo del QR, en la etiqueta de la controladora. Son 8 letras y números.</div></div>
${campo('Código de vinculación', I.llave, '4HDW-8R2N', { clase: 'codigo', ayuda: 'No importan las mayúsculas, los espacios ni si confundís la O con el 0.' })}
<div class="btn">Vincular kit</div>
<div class="nota" style="margin-top:auto;margin-bottom:22px">${svg(I.info, 16)}<span>¿Te dice que el kit ya está vinculado? Pedile a quien lo configuró que te invite desde su app.</span></div></div>`,
  },

  '10': {
    titulo: '10 · Residente',
    sub: 'Paso 2 · a quién se cuida',
    html: () => `<div class="form">${nav('Cerrar sesión', 2)}
<div class="exito">${svg(I.checkCirculo, 18)}Kit LR-000124 vinculado a tu cuenta · 1 cámara</div>
<div class="intro"><h1>¿A quién vas a cuidar?</h1><div class="sub">Es la persona que vive en el hogar. Su nombre aparece en las alertas y los reportes.</div></div>
${campo('Nombre y apellido', I.usuario, 'Rosa Méndez')}
${campo('Teléfono', I.telefono, '11 15 2345-6789', { ayuda: 'Se va a guardar como +54 9 11 2345-6789' })}
<div class="btn">Siguiente</div></div>`,
  },

  '11': {
    titulo: '11 · Ubicación de la cámara',
    sub: 'Paso 3 · según el plan del kit (1 cámara)',
    html: () => `<div class="form">${nav('Volver', 3)}
<div class="intro"><h1>¿Dónde está tu cámara?</h1><div class="sub">Así las alertas te dicen dónde pasó algo: "Posible caída · Living".</div></div>
<div class="plan">${svg(I.video, 18)}Tu kit incluye 1 cámara</div>
${campo('Tu cámara', I.video, 'Living')}
<div class="sug">${['Living', 'Cocina', 'Dormitorio', 'Pasillo', 'Puerta del baño', 'Entrada']
      .map((s, i) => `<div class="chip ${i === 0 ? 'on' : ''}">${s}</div>`)
      .join('')}</div>
<div class="nota" style="margin-top:18px">${svg(I.info, 16)}<span>¿Una cámara cerca del baño? Apuntala a la puerta, no al interior: si tarda mucho en salir, Lares te avisa igual. El video nunca sale de la controladora.</span></div>
<div class="btn">Terminar</div></div>`,
  },

  '12': {
    titulo: '12 · Perfil',
    sub: 'Datos, kit vinculado y apariencia',
    html: (oscuro) => `<div class="hdr"><div><div style="font-size:15px;color:var(--mut);font-weight:600">ana.gomez@mail.com</div><h1>Ana Gómez</h1></div></div>
<div class="body" style="display:flex;flex-direction:column;gap:14px">
<div class="filas">
<div class="fila">${svg(I.casa, 18)}<div><small>Hogar</small><b>Casa de Rosa</b></div></div>
<div class="fila">${svg(I.usuario, 18)}<div><small>Residente</small><b>Rosa Méndez</b></div></div>
<div class="fila">${svg(I.telefono, 18)}<div><small>Teléfono del residente</small><b>+54 9 11 2345-6789</b></div></div>
<div class="fila">${svg(I.cpu, 18)}<div><small>Kit vinculado</small><b>LR-000124 · 1 cámara</b></div></div>
<div class="fila">${svg(I.escudo, 18)}<div><small>Tu rol</small><b>Responsable principal</b></div></div></div>
<div><div class="lbl" style="margin:0 0 10px 2px">Apariencia</div><div style="display:flex;gap:8px">${['Sistema', 'Claro', 'Oscuro']
      .map((a) => `<div class="chip ${(oscuro ? a === 'Oscuro' : a === 'Sistema') ? 'on' : ''}" style="height:40px">${a}</div>`)
      .join('')}</div>${oscuro ? '' : '<div class="msg">Sigue el modo claro u oscuro de tu celular.</div>'}</div>
<div class="nota">${svg(I.escudo, 16)}<span>El video se procesa dentro del hogar y nunca se envía a la nube. A la app solo llegan los eventos detectados.</span></div>
<div class="btnsec">Cerrar sesión</div></div>
${tabs('p', 2)}`,
  },
};

/**
 * Dibuja una lámina: los celulares en fila, con su título arriba, como las Figuras 3.1 y 3.2.
 * `oscuro`: celulares en modo oscuro sobre lienzo oscuro.
 */
function dibujarLamina(ids, { oscuro = false } = {}) {
  const ANCHO = 510; // separación entre celulares (igual que Lares_Mobile.html)
  document.body.style.width = `${ids.length * ANCHO + 70}px`;
  document.body.style.height = '1180px';
  if (oscuro) document.body.classList.add('lienzo-oscuro');
  ids.forEach((id, i) => {
    const p = PANTALLAS[id];
    const frame = document.createElement('div');
    frame.className = 'frame';
    frame.style.left = `${80 + i * ANCHO}px`;
    frame.style.top = '120px';
    frame.innerHTML = `<div class="cap">${p.titulo}<span>${p.sub}${oscuro ? ' · modo oscuro' : ''}</span></div>
      <div class="phone ${oscuro ? 'dark' : ''} ${p.camara ? 'camara' : ''}" data-screen-label="${p.titulo}"><div class="notch"></div>${SB}<div class="scr">${p.html(oscuro)}</div></div>`;
    document.body.appendChild(frame);
  });
}
