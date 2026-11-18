'use strict';
/* Tablero inmobiliario RPP Chihuahua · Monitor. Inteligencia de Mercado.
   motor.js: datos, filtros, cálculos comunes y componentes (gráficas, tablas, mapa). */

// ───────────── datos ─────────────
const R = JSON.parse(document.getElementById('datos').textContent);
const N = R.n, NM = R.mesN.length, LAST = NM - 1, A1 = R.corte[0], M1 = R.corte[1];
const YM = new Uint8Array(N), OFF = new Int32Array(NM + 1);
{ let k = 0; for (let m = 0; m < NM; m++) { OFF[m] = k; for (let j = 0; j < R.mesN[m]; j++) YM[k++] = m; } OFF[NM] = k; }
const C = Uint16Array.from(R.c), T = Uint8Array.from(R.t), K = Uint16Array.from(R.k), M = Uint8Array.from(R.m), S = Uint8Array.from(R.s),
  F = Uint8Array.from(R.f), I = Uint8Array.from(R.i), P = Float64Array.from(R.p), A = Float64Array.from(R.a, (v) => v / 100), Q = Float64Array.from(R.q), X = Uint8Array.from(R.x);
const COL = R.col;                                   // [id, nombre, zona, fuera de la ciudad, punto]
const Z = new Uint8Array(N), S1 = new Uint8Array(N);
for (let r = 0; r < N; r++) { Z[r] = COL[C[r]][2]; S1[r] = R.s2a1[S[r]]; }
const FACT = R.inpc.map((v) => R.inpc[LAST] / v);     // factor para llevar a pesos del último mes
const CONTADO = R.pago.indexOf('Contado');
const MES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MESC = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const ZN = R.zonas.concat(['Sin zona']);
// Colores de la guía de estilo de Monitor (paleta aprobada el 10 de noviembre de 2026)
const SERIES = ['#0A95C7', '#E7652F', '#199E70', '#C78405', '#D55181', '#329131', '#7C6BDF', '#E34948'];   // orden fijo, de la 1 a la 8
const RAMPA6 = ['#79CDF6', '#3DB3E6', '#0A95C7', '#04729B', '#084E6C', '#0B2C41'];                             // secuencial, pasos 300 a 800
const RAMPA4 = ['#B3E3FC', '#3DB3E6', '#04729B', '#0B2C41'], TINTA4 = ['#0F1F33', '#0F1F33', '#FFFFFF', '#FFFFFF'];   // pasos 200, 400, 600 y 800
const CMERC = SERIES.slice(0, 4), CPAGO = SERIES.slice(0, 6);
const DIV5 = ['#AA3606', '#F6A47F', '#DDE2E6', '#6EC7F2', '#076C92'];                                          // divergente de cinco puntos
const CLAROS = new Set(['#E0F4FF', '#B3E3FC', '#79CDF6', '#F3F6FA', '#FFFFFF', '#DDE2E6']);                    // rellenos que llevan contorno
const S6 = R.seg1.map((t, i) => ({ t: t, c: RAMPA6[i], tx: i < 2 ? '#0F1F33' : '#FFFFFF' }));               // cajones: etiqueta en tinta hasta el paso 400

// ───────────── formato ─────────────
const nulo = (v) => v == null || (typeof v === 'number' && (isNaN(v) || !isFinite(v)));
const fN = (v) => nulo(v) ? 's/d' : String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const fP = (v) => nulo(v) ? 's/d' : '$' + fN(v);
const fMM = (v) => nulo(v) ? 's/d' : '$' + (v / 1e6 >= 100 ? fN(v / 1e6) : (v / 1e6).toFixed(1)) + ' millones';
const fPct = (x, d) => nulo(x) ? 's/d' : (x * 100).toFixed(d == null ? 1 : d) + '%';
const fSig = (r, d) => nulo(r) ? 's/d' : (r >= 0 ? '+' : '−') + Math.abs(r * 100).toFixed(d == null ? 1 : d) + '%';
const fDec = (v, d) => nulo(v) ? 's/d' : v.toFixed(d == null ? 2 : d);
const esc = (s) => String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const ymTxt = (ym) => MES[ym % 12] + ' de ' + (2019 + Math.floor(ym / 12));
const ymCorto = (ym) => MESC[ym % 12] + ' ' + (2019 + Math.floor(ym / 12));
function rangoTxt(a, b, corto) {
  const ya = 2019 + Math.floor(a / 12), yb = 2019 + Math.floor(b / 12), ma = a % 12, mb = b % 12, L = corto ? MESC : MES, de = corto ? ' ' : ' de ';
  if (a === b) return L[ma] + de + ya;
  if (ya === yb) return (ma === 0 && mb === 11) ? String(ya) : L[ma] + (corto ? '–' : ' a ') + L[mb] + de + ya;
  return L[ma] + de + ya + ' a ' + L[mb] + de + yb;
}
const pesosCorto = (v) => v >= 1e6 ? '$' + (v / 1e6).toFixed(2) + ' millones' : '$' + Math.round(v / 1000) + ' mil';

// ───────────── estado y filtros ─────────────
const st = { pag: 'resumen', per: 'auto', d: 0, h: LAST, merc: null, tipo: -1, caj: null, zona: null, col: -1, marca: -1, pago: null, fuera: false,
  mon: 'corr', nivel: 2, vista: 'op', sel: null, punto: -1, color: 'cajon', pvMerc: 1, orden: {}, exp: {} };
const DEF = { resumen: 'anio', cajones: 'u12', mapa: 'u12', desarrolladores: 'u12', financiamiento: 'anio', 'vertical-ventas': 'u12' };
const PERN = { auto: 'Por omisión', anio: 'Año en curso', u12: 'Últimos 12 meses', todo: 'Todo el periodo', rango: 'Otro periodo' };
const FIJO = { cajones: { merc: 'Desarrollador y mercado abierto' }, desarrolladores: { merc: 'Desarrollador' }, 'vertical-ventas': { tipo: 'Vertical' }, plusvalia: { per: 'Toda la historia', merc: 'Según el selector' } };
function periodo() {
  const k = st.per === 'auto' ? (DEF[st.pag] || 'u12') : st.per;
  let a, b;
  if (k === 'anio') { a = (A1 - 2019) * 12; b = LAST; }
  else if (k === 'u12') { a = LAST - 11; b = LAST; }
  else if (k === 'todo') { a = 0; b = LAST; }
  else if (k === 'rango') { a = Math.min(st.d, st.h); b = Math.max(st.d, st.h); }
  else { a = (+k - 2019) * 12; b = Math.min(a + 11, LAST); }
  const comp = (k !== 'todo' && a - 12 >= 0) ? [a - 12, b - 12] : null;
  return { k: k, a: a, b: b, comp: comp, nombre: PERN[k] || k, txt: rangoTxt(a, b), corto: rangoTxt(a, b, true), ctxt: comp ? rangoTxt(comp[0], comp[1]) : '', ccorto: comp ? rangoTxt(comp[0], comp[1], true) : '' };
}
// ¿la venta pasa los filtros? ig = filtros que la página no usa, por ejemplo {merc:1}
function pasa(r, ig) {
  if (!st.fuera && COL[C[r]][3]) return false;
  if (st.tipo >= 0 && !(ig && ig.tipo) && T[r] !== st.tipo) return false;
  if (st.merc && !(ig && ig.merc) && !st.merc.has(M[r])) return false;
  if (st.caj && !st.caj.has(S1[r])) return false;
  if (st.zona && !st.zona.has(Z[r])) return false;
  if (st.col >= 0 && C[r] !== st.col) return false;
  if (st.marca >= 0 && K[r] !== st.marca) return false;
  if (st.pago && !st.pago.has(F[r])) return false;
  return true;
}
function filas(a, b, ig, extra) {
  const out = [];
  for (let r = OFF[a]; r < OFF[b + 1]; r++) if (pasa(r, ig) && (!extra || extra(r))) out.push(r);
  return out;
}
const precio = (r) => st.mon === 'const' ? P[r] * FACT[YM[r]] : P[r];
function med(arr) {
  if (!arr.length) return NaN;
  const s = Float64Array.from(arr).sort(), m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function cuant(arr, q) {
  if (!arr.length) return NaN;
  const s = Float64Array.from(arr).sort(), pos = (s.length - 1) * q, lo = Math.floor(pos), hi = Math.ceil(pos);
  return s[lo] + (s[hi] - s[lo]) * (pos - lo);
}
function moda(cuentas) { let k = -1, mx = 0; cuentas.forEach((v, i) => { if (v > mx) { mx = v; k = i; } }); return k; }
// indicadores generales de un conjunto de ventas; vt = tipo de vivienda para el precio por m² (0 horizontal, 1 vertical)
function kp(rows, vt) {
  let val = 0, cred = 0; const pr = [], m2 = [];
  for (const r of rows) { const p = precio(r); val += p; if (F[r] !== CONTADO) cred++; if (X[r] & 1) pr.push(p); if ((X[r] & 2) && T[r] === vt) m2.push(p / A[r]); }
  return { n: rows.length, val: val, cred: rows.length ? cred / rows.length : NaN, med: med(pr), p25: cuant(pr, .25), p75: cuant(pr, .75), np: pr.length, m2: med(m2), nm2: m2.length };
}
function nice(v) {
  if (!(v > 0)) return 1;
  const e = Math.pow(10, Math.floor(Math.log10(v))), m = v / e;
  for (const k of [1, 1.2, 1.6, 2, 2.4, 3.2, 4, 6, 8, 10]) if (m <= k) return k * e;
  return 10 * e;
}

// ───────────── componentes ─────────────
const QA = {};
const LN = {}, TB = {};
function card(cls, titulo, sub, cuerpo, pie, accion) {
  const k = titulo.indexOf('|'), rot = k < 0 ? '' : titulo.slice(0, k), tit = k < 0 ? titulo : titulo.slice(k + 1);
  return '<section class="panel card ' + cls + '"><div class="ch"><div>' + (rot ? '<p class="rotulo">' + esc(rot) + '</p>' : '') + '<h2 class="panel-titulo">' + esc(tit) + '</h2>' +
    (sub ? '<p class="nota">' + esc(sub.charAt(0).toUpperCase() + sub.slice(1)) + '</p>' : '') + '</div>' + (accion || '') + '</div>' + cuerpo + (pie ? '<p class="nota pie">' + esc(pie) + '</p>' : '') + '</section>';
}
function tiles(list) {
  // el cambio lleva flecha y color de estado; la flecha la pone la clase delta de la guía
  const delta = (t) => {
    if (!t.d) return '';
    const sg = t.d.charAt(0), cero = /^[+−]0\.0(%| puntos)$/.test(t.d), cls = cero ? 'neutral' : (sg === '+' ? 'positivo' : (sg === '−' ? 'negativo' : 'neutral'));
    return '<p class="delta delta--' + cls + '">' + esc((cero ? 'Sin cambio' : (sg === '+' || sg === '−' ? t.d.slice(1) : t.d)) + (t.vs ? ' ' + t.vs : '')) + '</p>';
  };
  return '<div class="tiles">' + list.map((t) => '<section class="panel tile"><p class="rotulo">' + esc(t.l) + '</p><div class="kpi-valor">' + esc(t.v) + '</div>' + delta(t) + (t.n ? '<p class="kpi-etiqueta">' + esc(t.n) + '</p>' : '') + '</section>').join('') + '</div>';
}
function leyenda(items, pre) {
  return '<div class="ley">' + (pre ? '<em>' + esc(pre) + '</em>' : '') + items.map((x) => '<span><i class="' + (x.l ? 'l' : (x.o ? 'o' : '')) + '" style="background:' + x.c + (x.b || CLAROS.has(x.c) ? ';box-shadow:inset 0 0 0 1px #89939E' : '') + '"></i>' + esc(x.t) + '</span>').join('') + '</div>';
}
// barras horizontales: rows = [{t, v, v2, tip}]; o = {fmt, lw, c}
function barras(rows, o) {
  o = o || {}; const fmt = o.fmt || fN;
  let mx = 0; rows.forEach((x) => { mx = Math.max(mx, x.v || 0, x.v2 || 0); });
  if (!rows.length) return '<p class="pie">Sin escrituras con estos filtros.</p>';
  return '<div class="bars" style="--lw:' + (o.lw || 112) + 'px">' + rows.map((x) => '<div class="br"' + (x.tip ? ' data-tip="' + esc(x.tip) + '"' : '') + '><span class="l">' + esc(x.t) + '</span><div class="t">' +
    '<div class="b"><i style="width:' + (mx ? (x.v || 0) / mx * 80 : 0).toFixed(1) + '%' + (o.c ? ';background:' + o.c : '') + '"></i><b>' + esc(x.txt || fmt(x.v)) + '</b></div>' +
    (x.v2 != null ? '<div class="b s"><i style="width:' + (mx ? x.v2 / mx * 80 : 0).toFixed(1) + '%"></i><b>' + esc(fmt(x.v2)) + '</b></div>' : '') + '</div></div>').join('') + '</div>';
}
// barras apiladas al 100%: rows = [{t, vals:[], r}]; series = [{t, c}]
function apiladas(rows, series, o) {
  o = o || {};
  const cab = o.cab ? '<div class="sr hd"><span class="l">' + esc(o.cab[0]) + '</span><span class="s"></span><span class="r">' + esc(o.cab[1]) + '</span></div>' : '';
  return '<div class="stk" style="--lw:' + (o.lw || 34) + 'px;--rw:' + (o.rw || 56) + 'px">' + cab + rows.map((x) => {
    const tot = x.vals.reduce((s, v) => s + v, 0);
    const tip = x.t + '\n' + series.map((s, i) => s.t + ': ' + fN(x.vals[i]) + ' (' + fPct(tot ? x.vals[i] / tot : NaN) + ')').join('\n');
    return '<div class="sr" data-tip="' + esc(tip) + '"><span class="l">' + esc(x.t) + '</span><div class="s">' + (tot ? x.vals.map((v, i) => v > 0 ? '<i style="flex:' + v + ' 1 0%;background:' + series[i].c + ';color:' + (series[i].tx || '#FFFFFF') + (CLAROS.has(series[i].c) ? ';box-shadow:inset 0 0 0 1px #3DB3E6' : '') + '">' + (v / tot >= .1 ? Math.round(v / tot * 100) + '%' : '') + '</i>' : '').join('') : '') + '</div><span class="r">' + esc(x.r == null ? '' : x.r) + '</span></div>';
  }).join('') + '</div>';
}
// líneas: o = {n, series:[{t,c,w,v:[],dots}], xl:[[peso,texto]], banda:[a,b], fmt, xt:(i)=>texto, alt}
function linea(id, o) {
  let mx = 0; o.series.forEach((s) => s.v.forEach((v) => { if (!nulo(v) && v > mx) mx = v; }));
  const top = nice(mx), W = Math.max(1, o.n - 1) * 10, y = (v) => 1000 - v / top * 1000;
  let dots = '';
  const paths = o.series.map((s) => {
    let d = '', pen = false;
    s.v.forEach((v, i) => {
      if (nulo(v)) { pen = false; return; }
      d += (pen ? 'L' : 'M') + (i * 10) + ',' + y(v).toFixed(1); pen = true;
      if (s.dots) dots += '<span class="dot" style="left:' + (i / Math.max(1, o.n - 1) * 100).toFixed(2) + '%;top:' + (y(v) / 10).toFixed(2) + '%;background:' + s.c + '"></span>';
    });
    return '<path d="' + d + '" style="stroke:' + s.c + ';stroke-width:' + (s.w || 2) + 'px"></path>';
  }).join('');
  const ticks = [0, .25, .5, .75, 1].map((f) => '<div class="g' + (f === 0 ? ' z' : '') + '" style="top:' + (100 - f * 100) + '%"></div><span class="y" style="top:' + (100 - f * 100) + '%">' + esc(o.fmt(top * f)) + '</span>').join('');
  const banda = o.banda ? '<div class="bd" style="left:' + (o.banda[0] / Math.max(1, o.n - 1) * 100).toFixed(2) + '%;width:' + ((o.banda[1] - o.banda[0]) / Math.max(1, o.n - 1) * 100).toFixed(2) + '%"></div>' : '';
  LN[id] = o;
  return '<div class="ln" id="' + id + '">' + banda + ticks + '<svg viewBox="0 0 ' + W + ' 1000" preserveAspectRatio="none" role="img" aria-label="' + esc(o.alt || '') + '">' + paths + '</svg>' + dots + '<div class="cx"></div><div class="hit" data-ln="' + id + '"></div></div>' +
    (o.xpts ? '<div class="lx pt">' + o.xl.map((x) => '<span>' + esc(x[1]) + '</span>').join('') + '</div>' : '<div class="lx">' + o.xl.map((x) => '<span style="flex:' + x[0] + ' 1 0%">' + esc(x[1]) + '</span>').join('') + '</div>');
}
// cambio con signo y color de estado
const sgn = (v) => '<span class="sg' + (nulo(v) || v === 0 ? '' : (v > 0 ? ' p' : ' n')) + '">' + fSig(v) + '</span>';
// tabla ordenable: cols = [{k, t, num, fmt, html, txt, cls, w, nosort}]
function tabla(id, cols, rows, o) {
  o = o || {};
  const ord = st.orden[id] || { k: o.orden, d: o.desc !== false };
  const rs = rows.slice();
  if (ord.k) rs.sort((a, b) => {
    const x = a[ord.k], y = b[ord.k], nx = nulo(x), ny = nulo(y);
    if (nx || ny) return nx && ny ? 0 : (nx ? 1 : -1);
    return (typeof x === 'string' ? x.localeCompare(y, 'es') : x - y) * (ord.d ? -1 : 1);
  });
  const lim = o.max && !st.exp[id] ? Math.min(o.max, rs.length) : rs.length;
  const head = cols.map((c) => '<th class="' + (c.num ? 'n num' : '') + '"' + (ord.k === c.k ? ' aria-sort="' + (ord.d ? 'descending' : 'ascending') + '"' : '') + (c.w ? ' style="width:' + c.w + '"' : '') + '>' +
    (c.nosort ? esc(c.t) : '<button type="button" data-ord="' + id + '|' + c.k + '">' + esc(c.t) + (ord.k === c.k ? (ord.d ? ' ↓' : ' ↑') : '') + '</button>') + '</th>').join('');
  const body = rs.slice(0, lim).map((r) => '<tr>' + cols.map((c) => '<td class="' + (c.num ? 'n num ' : '') + (c.cls || '') + '">' + (c.html ? c.html(r) : (c.sig ? sgn(r[c.k]) : esc(c.fmt ? c.fmt(r[c.k], r) : r[c.k]))) + '</td>').join('') + '</tr>').join('');
  TB[id] = { cols: cols, rs: rs };
  const mas = o.max && rs.length > o.max ? '<button type="button" class="lk" data-exp="' + id + '">' + (st.exp[id] ? 'Ver menos' : 'Ver las ' + fN(rs.length) + ' filas') + '</button>' : '';
  if (!rs.length) return '<p class="pie">Sin escrituras con estos filtros.</p>';
  return '<div class="tw"><table class="tabla-monitor"><thead><tr>' + head + '</tr></thead><tbody>' + body + '</tbody></table></div><div class="tacc">' + mas + '<button type="button" class="lk" data-copiar="' + id + '">Copiar tabla</button></div>';
}
// tabla sencilla detrás de cada gráfica
function verTabla(cab, filasT) {
  return '<details class="vt"><summary>Ver tabla</summary><div class="tw"><table class="tabla-monitor"><thead><tr>' + cab.map((c, i) => '<th class="' + (i ? 'n num' : '') + '">' + esc(c) + '</th>').join('') + '</tr></thead><tbody>' +
    filasT.map((f) => '<tr>' + f.map((v, i) => '<td class="' + (i ? 'n num' : '') + '">' + esc(v) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div></details>';
}

// ───────────── tooltip ─────────────
const tip = document.getElementById('tip');
function mostrarTip(txt, x, y) {
  const i = txt.indexOf('\n');
  tip.innerHTML = '<b>' + esc(i < 0 ? txt : txt.slice(0, i)) + '</b>' + (i < 0 ? '' : esc(txt.slice(i + 1)));
  tip.style.display = 'block';
  const w = tip.offsetWidth, h = tip.offsetHeight;
  tip.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, x + 14)) + 'px';
  tip.style.top = (y + h + 24 > window.innerHeight ? Math.max(8, y - h - 12) : y + 16) + 'px';
}
const ocultarTip = () => { tip.style.display = 'none'; document.querySelectorAll('.ln .cx').forEach((e) => { e.style.display = 'none'; }); };
document.addEventListener('pointermove', (ev) => {
  const hit = ev.target.closest && ev.target.closest('.hit');
  if (hit) {
    const o = LN[hit.dataset.ln], box = hit.getBoundingClientRect(), n1 = Math.max(1, o.n - 1);
    const i = Math.max(0, Math.min(o.n - 1, Math.round((ev.clientX - box.left) / box.width * n1)));
    const cx = hit.parentNode.querySelector('.cx'); cx.style.display = 'block'; cx.style.left = (i / n1 * 100) + '%';
    mostrarTip(o.xt(i) + '\n' + o.series.map((s) => s.t + ': ' + (nulo(s.v[i]) ? 's/d' : o.fmt(s.v[i]))).join('\n'), ev.clientX, ev.clientY);
    return;
  }
  const el = ev.target.closest && ev.target.closest('[data-tip]');
  if (el) mostrarTip(el.dataset.tip, ev.clientX, ev.clientY); else ocultarTip();
});
document.addEventListener('focusin', (ev) => { const el = ev.target.closest && ev.target.closest('[data-tip]'); if (el) { const b = el.getBoundingClientRect(); mostrarTip(el.dataset.tip, b.left + b.width / 2, b.bottom); } });
document.addEventListener('focusout', ocultarTip);
window.addEventListener('scroll', ocultarTip, true);

// ───────────── filtros: controles ─────────────
const op = (f, v, t, on) => '<button type="button" class="op" data-f="' + f + '" data-v="' + v + '" aria-pressed="' + (on ? 'true' : 'false') + '">' + esc(t) + '</button>';
const multi = (f, nombres, set) => '<div class="ops">' + op(f, 'x', f === 'zona' || f === 'pago' ? 'Todas' : 'Todos', !set) + nombres.map((n, i) => op(f, i, n, !!set && set.has(i))).join('') + '</div>';
const MARCAS_DEV = (() => { const s = new Set(); for (let r = 0; r < N; r++) if (M[r] === 0) s.add(K[r]); return Array.from(s).sort((a, b) => R.marcas[a].localeCompare(R.marcas[b], 'es')); })();
function grupo(g) {
  if (g === 'per') {
    const ops = [['auto', 'Por omisión de la página'], ['anio', 'Año en curso'], ['u12', 'Últimos 12 meses']];
    for (let y = A1 - (M1 === 12 ? 0 : 1); y >= 2019; y--) ops.push([String(y), String(y)]);
    ops.push(['todo', 'Todo el periodo']);
    const meses = (sel) => { let s = ''; for (let m = 0; m < NM; m++) s += '<option value="' + m + '"' + (m === sel ? ' selected' : '') + '>' + ymCorto(m) + '</option>'; return s; };
    return '<div class="g"><h3>Periodo</h3><div class="ops">' + ops.map((p) => op('per', p[0], p[1], st.per === p[0])).join('') + '</div>' +
      '<div class="rg"><span>Otro periodo:</span><select id="f-d" aria-label="Desde">' + meses(st.d) + '</select><span>a</span><select id="f-h" aria-label="Hasta">' + meses(st.h) + '</select>' +
      '<button type="button" class="op" data-f="rango" aria-pressed="' + (st.per === 'rango') + '">Aplicar</button></div></div>';
  }
  if (g === 'merc') return '<div class="g"><h3>Mercado</h3>' + multi('merc', R.merc, st.merc) + '</div>';
  if (g === 'tipo') return '<div class="g"><h3>Tipo de vivienda</h3><div class="ops">' + op('tipo', -1, 'Todos', st.tipo === -1) + op('tipo', 0, 'Horizontal', st.tipo === 0) + op('tipo', 1, 'Vertical', st.tipo === 1) + '</div></div>';
  if (g === 'caj') return '<div class="g"><h3>Cajón de precio</h3>' + multi('caj', R.seg1, st.caj) + '</div>';
  if (g === 'zona') return '<div class="g"><h3>Zona</h3>' + multi('zona', R.zonas, st.zona) + '</div>';
  if (g === 'pago') return '<div class="g"><h3>Forma de pago</h3>' + multi('pago', R.pago, st.pago) + '</div>';
  if (g === 'col') return '<div class="g"><h3><label for="f-col">Colonia o fraccionamiento</label></h3><input class="inp" id="f-col" type="search" list="dl-col" placeholder="Buscar por nombre" value="' + (st.col >= 0 ? esc(COL[st.col][1]) : '') + '"></div>';
  if (g === 'marca') return '<div class="g"><h3><label for="f-marca">Desarrollador</label></h3><input class="inp" id="f-marca" type="search" list="dl-marca" placeholder="Buscar por marca" value="' + (st.marca >= 0 ? esc(R.marcas[st.marca]) : '') + '"></div>';
  if (g === 'fuera') return '<div class="g"><label class="chk"><input type="checkbox" id="f-fuera"' + (st.fuera ? ' checked' : '') + '>Incluir ventas fuera de la mancha urbana</label></div>';
  return '';
}
const resumenSet = (set, nombres, todos) => !set ? todos : (set.size === 1 ? nombres[Array.from(set)[0]] : set.size + ' seleccionados');
function filtrosHTML(per, nSel) {
  const fj = FIJO[st.pag] || {};
  const flecha = '<svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12"><path d="M2.5 4.5 6 8l3.5-3.5" style="fill:none;stroke:#566476;stroke-width:1.5px;stroke-linecap:round;stroke-linejoin:round"></path></svg>';
  const qb = (g, et, val, fijo) => '<button type="button" class="fb q" data-pop="' + g + '"' + (fijo ? ' disabled' : '') + '><span>' + et + '</span><strong>' + esc(fijo || val) + '</strong>' + (fijo ? '' : flecha) + '</button>';
  const chips = [];
  const chip = (k, t) => chips.push('<span class="chip">' + esc(t) + '<button type="button" data-x="' + k + '" aria-label="Quitar filtro: ' + esc(t) + '">×</button></span>');
  if (st.per !== 'auto' && !fj.per) chip('per', per.nombre === per.k ? 'Año ' + per.k : (st.per === 'rango' ? per.corto : per.nombre));
  if (st.merc && !fj.merc) chip('merc', 'Mercado: ' + resumenSet(st.merc, R.merc));
  if (st.tipo >= 0 && !fj.tipo) chip('tipo', st.tipo ? 'Vertical' : 'Horizontal');
  if (st.caj) chip('caj', 'Cajón: ' + resumenSet(st.caj, R.seg1));
  if (st.zona) chip('zona', 'Zona: ' + resumenSet(st.zona, R.zonas));
  if (st.col >= 0) chip('col', COL[st.col][1]);
  if (st.marca >= 0) chip('marca', R.marcas[st.marca]);
  if (st.pago) chip('pago', 'Pago: ' + resumenSet(st.pago, R.pago));
  if (st.fuera) chip('fuera', 'Incluye fuera de la ciudad');
  return '<div class="filt">' + qb('per', 'Periodo', per.nombre === per.k ? per.k : (st.per === 'rango' ? per.corto : per.nombre), fj.per) + qb('merc', 'Mercado', resumenSet(st.merc, R.merc, 'Todos'), fj.merc) +
    qb('tipo', 'Tipo', st.tipo < 0 ? 'Horizontal y vertical' : (st.tipo ? 'Vertical' : 'Horizontal'), fj.tipo) + qb('caj', 'Cajón', resumenSet(st.caj, R.seg1, 'Todos')) +
    '<button type="button" class="fb mas" data-cajon="1">Más filtros</button>' + chips.join('') + (chips.length ? '<button type="button" class="lk" data-x="todo">Limpiar</button>' : '') +
    (nSel == null ? '' : '<span class="selx">' + fN(nSel) + ' escrituras en la selección</span>') + '</div>';
}
const pop = document.getElementById('pop'), cajon = document.getElementById('cajon'), velo = document.getElementById('velo');
let popG = null;
function abrirPop(g, btn) {
  popG = g; pop.innerHTML = grupo(g); pop.style.display = 'block';
  const b = btn.getBoundingClientRect();
  pop.style.left = Math.max(8, Math.min(window.innerWidth - pop.offsetWidth - 8, b.left)) + window.scrollX + 'px';
  pop.style.top = (b.bottom + window.scrollY + 6) + 'px';
}
const cerrarPop = () => { popG = null; pop.style.display = 'none'; };
function pintarCajon() {
  const per = periodo();
  cajon.querySelector('.cb').innerHTML = ['per', 'merc', 'tipo', 'caj', 'zona', 'col', 'marca', 'pago', 'fuera'].map(grupo).join('');
  cajon.querySelector('#ver-n').textContent = 'Ver ' + fN(filas(per.a, per.b).length) + ' escrituras';
}
function abrirCajon(si) { cajon.style.display = si ? 'flex' : 'none'; velo.style.display = si ? 'block' : 'none'; if (si) { cerrarPop(); pintarCajon(); } }
function limpiar(k) {
  if (k === 'todo') { st.per = 'auto'; st.merc = st.caj = st.zona = st.pago = null; st.tipo = st.col = st.marca = -1; st.fuera = false; }
  else if (k === 'per') st.per = 'auto';
  else if (k === 'tipo' || k === 'col' || k === 'marca') st[k] = -1;
  else if (k === 'fuera') st.fuera = false;
  else st[k] = null;
}
function aplicarF(f, v) {
  if (f === 'per') st.per = v;
  else if (f === 'rango') { st.d = +document.getElementById('f-d').value; st.h = +document.getElementById('f-h').value; st.per = 'rango'; }
  else if (f === 'tipo') st.tipo = +v;
  else {
    const total = { merc: R.merc.length, caj: R.seg1.length, zona: R.zonas.length, pago: R.pago.length }[f];
    if (v === 'x') st[f] = null;
    else { const s = new Set(st[f] || []); const i = +v; if (s.has(i)) s.delete(i); else s.add(i); st[f] = (s.size === 0 || s.size === total) ? null : s; }
  }
  st.sel = null; st.punto = -1;
}
function copiarTabla(id, btn) {
  const t = TB[id]; if (!t) return;
  const cols = t.cols.filter((c) => !c.nocopy);
  const txt = [cols.map((c) => c.t).join('\t')].concat(t.rs.map((r) => cols.map((c) => c.txt ? c.txt(r) : (c.sig ? fSig(r[c.k]) : (c.fmt ? c.fmt(r[c.k], r) : r[c.k]))).join('\t'))).join('\n');
  const ok = () => { btn.textContent = 'Tabla copiada'; setTimeout(() => { btn.textContent = 'Copiar tabla'; }, 1600); };
  try { navigator.clipboard.writeText(txt).then(ok, () => { btn.textContent = 'No se pudo copiar'; }); } catch (e) { btn.textContent = 'No se pudo copiar'; }
}
document.addEventListener('click', (ev) => {
  const q = (s) => ev.target.closest(s);
  let el;
  if (q('#salto')) { document.getElementById('main').focus(); return; }
  if ((el = q('[data-f]'))) { aplicarF(el.dataset.f, el.dataset.v); render(); return; }
  if ((el = q('[data-pop]'))) { if (popG === el.dataset.pop) cerrarPop(); else abrirPop(el.dataset.pop, el); return; }
  if (!q('#pop')) cerrarPop();
  if ((el = q('[data-cajon]'))) { abrirCajon(el.dataset.cajon === '1'); return; }
  if (ev.target === velo) { abrirCajon(false); return; }
  if ((el = q('[data-x]'))) { limpiar(el.dataset.x); st.sel = null; st.punto = -1; render(); return; }
  if ((el = q('[data-set]'))) { const kv = el.dataset.set.split('='); st[kv[0]] = isNaN(+kv[1]) ? kv[1] : +kv[1]; if (kv[0] === 'nivel') st.sel = null; render(); return; }
  if ((el = q('[data-ord]'))) { const kv = el.dataset.ord.split('|'); const o = st.orden[kv[0]]; st.orden[kv[0]] = { k: kv[1], d: o && o.k === kv[1] ? !o.d : true }; render(); return; }
  if ((el = q('[data-exp]'))) { st.exp[el.dataset.exp] = !st.exp[el.dataset.exp]; render(); return; }
  if ((el = q('[data-copiar]'))) { copiarTabla(el.dataset.copiar, el); return; }
  if ((el = q('[data-cel]'))) { st.sel = el.dataset.cel.split(',').map(Number); render(); return; }
  if ((el = q('[data-zona]'))) { const z = +el.dataset.zona; st.zona = (st.zona && st.zona.size === 1 && st.zona.has(z)) ? null : new Set([z]); st.punto = -1; render(); return; }
  if ((el = q('[data-pt]'))) { st.punto = +el.dataset.pt; render(); return; }
  if ((el = q('[data-zoom]'))) { zoomMapa(el.dataset.zoom); return; }
});
document.addEventListener('change', (ev) => {
  const id = ev.target.id;
  if (id === 'f-col') { const v = ev.target.value.trim().toLowerCase(); st.col = v ? COL.findIndex((c) => c[1].toLowerCase() === v) : -1; st.punto = -1; render(); }
  else if (id === 'f-marca') { const v = ev.target.value.trim().toLowerCase(); st.marca = v ? R.marcas.findIndex((m) => m.toLowerCase() === v) : -1; render(); }
  else if (id === 'f-fuera') { st.fuera = ev.target.checked; render(); }
});
document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') { cerrarPop(); abrirCajon(false); } });
document.getElementById('dl-col').innerHTML = COL.map((c) => '<option value="' + esc(c[1]) + '">').join('');
document.getElementById('dl-marca').innerHTML = MARCAS_DEV.map((k) => '<option value="' + esc(R.marcas[k]) + '">').join('');

// ───────────── páginas y navegación ─────────────
const PAGS = [['resumen', 'Resumen del mercado', 'Resumen'], ['cajones', 'Cajones de precio', 'Cajones'], ['mapa', 'Mapa de zonas', 'Mapa'], ['plusvalia', 'Plusvalía', 'Plusvalía'],
  ['desarrolladores', 'Desarrolladores', 'Desarrolladores'], ['financiamiento', 'Financiamiento', 'Financiamiento'], ['vertical-ventas', 'Vertical: ventas', 'Vertical: ventas'],
  ['vertical-oferta', 'Vertical: oferta actual', 'Vertical: oferta'], ['metodologia', 'Metodología y notas', 'Metodología']];
const PAG = {};
const FUENTE = '<p class="fuente">Fuente: Registro Público de la Propiedad de Chihuahua, procesado por Monitor. Inteligencia de Mercado. Datos a ' + ymTxt(LAST) + '.</p>';
const segBtn = (clave, ops) => '<div class="seg">' + ops.map((o) => '<button type="button" data-set="' + clave + '=' + o[0] + '" aria-pressed="' + (String(st[clave]) === String(o[0])) + '">' + esc(o[1]) + '</button>').join('') + '</div>';
function render() {
  if (!PAG[st.pag]) st.pag = 'resumen';
  document.querySelectorAll('[data-nav]').forEach((a) => { if (a.dataset.nav === st.pag) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  const per = periodo(), p = PAG[st.pag](per);
  const cab = '<div class="head"><div><p class="rotulo">Tablero inmobiliario</p><h1>' + esc(p.titulo) + '</h1><p class="nota">' + esc(p.sub) + '</p></div>' + (p.moneda === false ? '' : segBtn('mon', [['corr', 'Pesos corrientes'], ['const', 'Pesos constantes']])) + '</div>';
  document.getElementById('main').innerHTML = cab + (p.filtros === false ? '' : filtrosHTML(per, p.n)) + p.html + (p.fuente || FUENTE);
  if (p.post) p.post();
  if (popG) { const b = document.querySelector('[data-pop="' + popG + '"]'); if (b && !b.disabled) pop.innerHTML = grupo(popG); else cerrarPop(); }
  if (cajon.style.display === 'flex') pintarCajon();
  const tb = document.querySelector('.top nav a[aria-current]'); if (tb && tb.scrollIntoView) tb.scrollIntoView({ block: 'nearest', inline: 'center' });
}
function ruta() {
  const h = (location.hash || '').replace('#', '');
  const nueva = PAG[h] ? h : 'resumen';
  if (nueva !== st.pag) { st.sel = null; st.punto = -1; window.scrollTo(0, 0); }
  st.pag = nueva; cerrarPop(); render();
}
window.addEventListener('hashchange', ruta);

'use strict';
/* paginas.js: una función por página. Cada una recibe el periodo y devuelve {titulo, sub, html, n}. */

const anioDe = (ym) => 2019 + Math.floor(ym / 12);
const ANIOS = []; for (let y = 2019; y <= A1; y++) ANIOS.push(y);
const xlMeses = () => ANIOS.map((y) => [y === A1 ? Math.max(1, LAST - (y - 2019) * 12) : 12, String(y)]);
const vacio = '<section class="panel card full"><p>No hay escrituras con estos filtros. Quita alguno para ver datos.</p></section>';
const lectura = (t) => '<section class="lec portada-oscura con-anillo" aria-label="Lectura rápida"><p class="rotulo">Lectura rápida</p><p class="lt">' + esc(t) + '</p></section>';
const enPeriodo = (per) => (per.a === per.b || /^\d{4}$/.test(per.txt) ? 'En ' : 'De ') + per.txt;
const notaAnio = M1 === 12 ? '' : ' ' + A1 + ': ' + rangoTxt((A1 - 2019) * 12, LAST) + '.';
// meses a comparar en cada año: los mismos del periodo si cae en un solo año; si no, el año completo
function mesesPorAnio(per) {
  const uno = Math.floor(per.a / 12) === Math.floor(per.b / 12);
  const m0 = uno ? per.a % 12 : 0, m1 = uno ? per.b % 12 : 11;
  return { m0: m0, m1: m1, txt: uno && !(m0 === 0 && m1 === 11) ? MES[m0] + ' a ' + MES[m1] + ' de cada año' : 'por año calendario', rango: (y) => [(y - 2019) * 12 + m0, Math.min((y - 2019) * 12 + m1, LAST)] };
}
// límites en pesos de cada cajón con la UMA del año en que termina el periodo
function rangosCajon(nivel, ym) {
  const uma = R.uma[String(anioDe(ym))], n2 = R.seg2.length;
  const ini = nivel === 2 ? R.cortes.slice() : R.seg1.map((_, i) => R.cortes[R.s2a1.indexOf(i)]);
  return ini.map((c, i) => {
    const a = c * uma, b = i + 1 < ini.length ? ini[i + 1] * uma : null;
    if (i === 0) return 'Hasta ' + pesosCorto(b);
    if (b == null) return 'Más de ' + pesosCorto(a);
    return (a >= 1e6 ? '$' + (a / 1e6).toFixed(2) : pesosCorto(a)) + ' a ' + pesosCorto(b);
  });
}

// ═════════════ 1. Resumen del mercado ═════════════
PAG.resumen = (per) => {
  const cur = filas(per.a, per.b), vt = st.tipo === 1 ? 1 : 0, k = kp(cur, vt), k0 = per.comp ? kp(filas(per.comp[0], per.comp[1]), vt) : null;
  QA.resumen = { k: k, k0: k0 };
  const out = { titulo: 'Resumen del mercado', sub: 'Chihuahua capital · ' + per.txt + (k0 ? ', comparado con ' + per.ctxt : ''), n: k.n };
  if (!k.n) { out.html = vacio; return out; }
  const vs = k0 ? 'contra ' + per.ccorto : '', d = (x, y) => k0 ? fSig(x / y - 1) : '';
  const pp = k0 ? (k.cred - k0.cred) * 100 : NaN;
  const tl = [
    { l: 'Escrituras', v: fN(k.n), d: d(k.n, k0 && k0.n), vs: vs, n: k0 ? 'Antes: ' + fN(k0.n) : '' },
    { l: 'Valor escriturado', v: '$' + fN(k.val / 1e6), d: d(k.val, k0 && k0.val), vs: vs, n: 'Millones de pesos' + (k0 ? ' · antes: $' + fN(k0.val / 1e6) : '') },
    { l: 'Mediana de precio', v: fP(k.med), d: d(k.med, k0 && k0.med), vs: vs, n: 'Mitad central: ' + fP(k.p25) + ' a ' + fP(k.p75) },
    { l: vt ? 'Mediana por m² de unidad' : 'Mediana por m² de lote', v: fP(k.m2), d: d(k.m2, k0 && k0.m2), vs: vs, n: (vt ? 'Vivienda vertical' : 'Vivienda horizontal') + ' · n = ' + fN(k.nm2) },
    { l: 'Escrituras con crédito', v: fPct(k.cred), d: k0 && !nulo(pp) ? (pp >= 0 ? '+' : '−') + Math.abs(pp).toFixed(1) + ' puntos' : '', vs: vs, n: 'De contado: ' + fPct(1 - k.cred) }
  ];
  // zonas
  const zn = new Array(10).fill(0), zn0 = new Array(10).fill(0), zp = ZN.map(() => []);
  cur.forEach((r) => { zn[Z[r]]++; if (X[r] & 1) zp[Z[r]].push(precio(r)); });
  if (per.comp) filas(per.comp[0], per.comp[1]).forEach((r) => { zn0[Z[r]]++; });
  const zrows = ZN.map((z, i) => ({ z: z, n: zn[i], v: k0 && zn0[i] ? zn[i] / zn0[i] - 1 : NaN, med: med(zp[i]) })).filter((x) => x.n > 0);
  const zmax = Math.max.apply(null, zrows.map((x) => x.n)), ztop = zrows.slice().sort((a, b) => b.n - a.n)[0];
  QA.resumen.zonas = zrows;
  let lec = enPeriodo(per) + ' se inscribieron ' + fN(k.n) + ' escrituras';
  if (k0 && k0.n) lec += ', ' + fPct(Math.abs(k.n / k0.n - 1)) + (k.n < k0.n ? ' menos' : ' más') + ' que un año antes (' + per.ccorto + '). La mediana de precio ' + (k.med >= k0.med ? 'subió ' : 'bajó ') + fPct(Math.abs(k.med / k0.med - 1)) + ', a ' + fP(k.med) + '.';
  else lec += '. La mediana de precio fue de ' + fP(k.med) + '.';
  if (zrows.length > 1) lec += ' ' + ztop.z + ' concentra ' + fPct(ztop.n / k.n) + ' de las escrituras.';
  // serie mensual con los demás filtros
  const mens = new Array(NM).fill(0);
  for (let m = 0; m < NM; m++) for (let r = OFF[m]; r < OFF[m + 1]; r++) if (pasa(r)) mens[m]++;
  const mm = mens.map((_, i) => { if (i < 11) return null; let s = 0; for (let j = i - 11; j <= i; j++) s += mens[j]; return s / 12; });
  const serie = linea('ln-mes', { n: NM, series: [{ t: 'Escrituras del mes', c: '#89939E', w: 1.5, v: mens }, { t: 'Promedio de 12 meses', c: '#0A95C7', w: 2.5, v: mm }], xl: xlMeses(), banda: [per.a, per.b], fmt: fN, xt: ymTxt, alt: 'Escrituras por mes y promedio de 12 meses' });
  const tSerie = verTabla(['Mes', 'Escrituras', 'Promedio de 12 meses'], mens.map((v, i) => [ymCorto(i), fN(v), nulo(mm[i]) ? '' : fN(mm[i])]).reverse());
  // quién vende, por año
  const mp = mesesPorAnio(per);
  const mez = ANIOS.map((y) => { const rg = mp.rango(y), v = [0, 0, 0, 0]; if (rg[0] <= rg[1]) filas(rg[0], rg[1]).forEach((r) => { v[M[r]]++; }); const t = v[0] + v[1] + v[2] + v[3]; return { t: String(y), vals: v, r: t ? fPct(v[0] / t) : '' }; });
  const sMerc = R.merc.map((t, i) => ({ t: t, c: CMERC[i] }));
  // cajones (nivel 1)
  const cj = new Array(R.seg1.length).fill(0), cj0 = cj.slice();
  cur.forEach((r) => { if (X[r] & 1) cj[S1[r]]++; });
  if (per.comp) filas(per.comp[0], per.comp[1]).forEach((r) => { if (X[r] & 1) cj0[S1[r]]++; });
  const cjRows = R.seg1.map((s, i) => ({ t: s, v: cj[i], v2: k0 ? cj0[i] : null, tip: s + '\n' + per.corto + ': ' + fN(cj[i]) + (k0 ? '\n' + per.ccorto + ': ' + fN(cj0[i]) : '') }));
  const tz = tabla('t-zonas', [
    { k: 'z', t: 'Macrozona' },
    { k: 'n', t: '', nosort: true, nocopy: true, w: '34%', html: (r) => '<span class="mb" style="width:' + (r.n / zmax * 100).toFixed(1) + '%"></span>' },
    { k: 'n', t: 'Escrituras', num: true, cls: 's', fmt: fN }, { k: 'v', t: 'Cambio anual', num: true, sig: 1 }, { k: 'med', t: 'Mediana de precio', num: true, fmt: fP }
  ], zrows, { orden: 'n' });
  out.html = lectura(lec) + tiles(tl) +
    '<div class="fila">' + card('w2', 'Volumen|Escrituras por mes', rangoTxt(0, LAST) + '. La franja marca el periodo elegido.', leyenda([{ c: '#89939E', t: 'Escrituras del mes', l: 1 }, { c: '#0A95C7', t: 'Promedio de los últimos 12 meses: ' + fN(mm[LAST]) + ' en ' + ymTxt(LAST), l: 1 }]) + serie + tSerie, 'n = ' + fN(mens.reduce((s, v) => s + v, 0)) + ' escrituras. Todas las operaciones cuentan en el volumen.') +
    card('w1', 'Mercado|Quién vende', 'Escrituras por tipo de mercado, ' + mp.txt, leyenda(sMerc) + apiladas(mez, sMerc, { cab: ['Año', 'Desarrollador'], rw: 84 }) + verTabla(['Año'].concat(R.merc), mez.map((x) => [x.t].concat(x.vals.map(fN)))), 'A la derecha, el porcentaje que vendieron los desarrolladores.') + '</div>' +
    '<div class="fila">' + card('', 'Cajones|Escrituras por cajón de precio', per.txt + (k0 ? ' contra ' + per.ctxt : ''), (k0 ? leyenda([{ c: '#0A95C7', t: per.corto }, { c: '#89939E', t: per.ccorto }]) : '') + barras(cjRows), 'n = ' + fN(cj.reduce((s, v) => s + v, 0)) + '. Solo desarrollador y mercado abierto, sin atípicos. Cajones en UMAs.') +
    card('', 'Zonas|Dónde se escritura', 'Macrozonas, ' + per.txt, tz, 'n = ' + fN(k.n) + ' escrituras. La mediana solo usa las ventas que entran en precios.') + '</div>';
  return out;
};

// ═════════════ 2. Cajones de precio ═════════════
PAG.cajones = (per) => {
  const niv = st.nivel, nombres = niv === 2 ? R.seg2 : R.seg1, NC = nombres.length, kc = (r) => niv === 2 ? S[r] : S1[r];
  const rows = filas(per.a, per.b, { merc: 1 }, (r) => (X[r] & 1) && M[r] < 2);
  const out = { titulo: 'Cajones de precio', sub: 'Chihuahua capital · ' + per.txt + ' · desarrollador y mercado abierto', n: rows.length };
  if (!rows.length) { out.html = vacio; return out; }
  const mat = (v) => R.zonas.map(() => new Array(NC).fill(v));
  const esc_ = mat(0), rev = mat(0), act = mat(0);
  const dz = new Map(), dc = new Map();      // desarrollador por (zona, cajón, colonia) y por (cajón, colonia)
  const dev = new Array(NC).fill(0), abi = new Array(NC).fill(0), pr = nombres.map(() => []);
  rows.forEach((r) => {
    const j = kc(r), z = Z[r]; pr[j].push(precio(r));
    if (M[r] === 0) { dev[j]++; const key = j + '|' + C[r]; const o = dc.get(key) || { n: 0, a: 999, b: -1 }; o.n++; o.a = Math.min(o.a, YM[r]); o.b = Math.max(o.b, YM[r]); dc.set(key, o); if (z < 9) { const kz = z + '|' + key; dz.set(kz, (dz.get(kz) || 0) + 1); } }
    else abi[j]++;
    if (z < 9) { esc_[z][j]++; if (M[r] === 1) rev[z][j]++; }
  });
  dz.forEach((n, key) => { if (n >= 3) { const p = key.split('|'); act[+p[0]][+p[1]]++; } });
  const des = new Array(NC).fill(0), absL = nombres.map(() => []);
  dc.forEach((o, key) => { if (o.n >= 3) { const j = +key.split('|')[0]; des[j]++; absL[j].push(o.n / (o.b - o.a + 1)); } });
  QA.cajones = { esc: esc_, act: act, rev: rev, dev: dev, abi: abi, des: des, abs: absL.map(med) };
  // celda seleccionada: por omisión, la de más escrituras sin oferta nueva
  let sel = st.sel, mejor = null; const sinOf = {};
  esc_.forEach((f, i) => f.forEach((n, j) => {
    const a = act[i][j];
    if (a === 0 && n >= 10) { sinOf[i] = (sinOf[i] || 0) + n; if (!st.sel && (!sel || n > esc_[sel[0]][sel[1]])) sel = [i, j]; }
    if (a > 0 && (!mejor || n / a > mejor.r)) mejor = { r: n / a, i: i, j: j, n: n, a: a };
  }));
  if (!sel || sel[0] >= R.zonas.length || sel[1] >= NC) sel = mejor ? [mejor.i, mejor.j] : [0, 0];
  const rangos = rangosCajon(niv, per.b);
  const clase = (n, a) => {
    if (st.vista === 'esc') return n < 10 ? -1 : (n < 50 ? 0 : (n < 100 ? 1 : (n < 200 ? 2 : 3)));
    if (st.vista === 'des') return a === 0 ? -1 : (a === 1 ? 0 : (a <= 3 ? 1 : (a <= 5 ? 2 : 3)));
    if (n < 10) return -1; if (a === 0) return 9; const r = n / a; return r < 25 ? 0 : (r < 50 ? 1 : (r < 100 ? 2 : 3));
  };
  let celdas = '<div class="c"></div>' + nombres.map((s) => { const k = s.indexOf(' '); return niv === 2 ? '<div class="c h"><b>' + esc(s.slice(0, k)) + '</b><small>' + esc(s.slice(k + 1)) + '</small></div>' : '<div class="c h"><b>' + esc(s) + '</b></div>'; }).join('');
  R.zonas.forEach((z, i) => {
    celdas += '<div class="c zl"><b>' + esc(z) + '</b></div>';
    esc_[i].forEach((n, j) => {
      const a = act[i][j], k = clase(n, a), bg = k === -1 ? '#F3F6FA' : (k === 9 ? '#E7652F' : RAMPA4[k]), tx = k === -1 ? '#566476' : (k === 9 ? '#FFFFFF' : TINTA4[k]);
      const sub = st.vista === 'des' ? '' : (n < 10 ? '' : (a === 0 ? 'sin oferta' : a + ' des.'));
      const num = st.vista === 'des' ? (a ? String(a) : '') : (n ? fN(n) : '');
      const tipT = z + ' · ' + nombres[j] + '\n' + rangos[j] + '\nEscrituras: ' + fN(n) + '\nDe reventa: ' + fN(rev[i][j]) + '\nDesarrollos activos: ' + a + (a ? '\nEscrituras por desarrollo: ' + fDec(n / a, 1) : '');
      celdas += '<button type="button" class="c' + (sel[0] === i && sel[1] === j ? ' sel' : '') + '" data-cel="' + i + ',' + j + '" data-tip="' + esc(tipT) + '" style="background:' + bg + ';color:' + tx + '"><b style="font-weight:' + (k === -1 ? 400 : 600) + '">' + num + '</b><small>' + sub + '</small></button>';
    });
  });
  const ley = st.vista === 'esc' ? leyenda([{ c: RAMPA4[0], t: '10 a 49' }, { c: RAMPA4[1], t: '50 a 99' }, { c: RAMPA4[2], t: '100 a 199' }, { c: RAMPA4[3], t: '200 o más' }, { c: '#F3F6FA', t: 'Menos de 10', b: 1 }], 'Escrituras:')
    : st.vista === 'des' ? leyenda([{ c: RAMPA4[0], t: '1' }, { c: RAMPA4[1], t: '2 a 3' }, { c: RAMPA4[2], t: '4 a 5' }, { c: RAMPA4[3], t: '6 o más' }], 'Desarrollos activos:')
    : leyenda([{ c: RAMPA4[0], t: 'menos de 25' }, { c: RAMPA4[1], t: '25 a 49' }, { c: RAMPA4[2], t: '50 a 99' }, { c: RAMPA4[3], t: '100 o más' }, { c: '#E7652F', t: 'Sin oferta nueva: hay escrituras y ningún desarrollo activo' }, { c: '#F3F6FA', t: 'Menos de 10 escrituras', b: 1 }], 'Escrituras por desarrollo activo:');
  const sn = esc_[sel[0]][sel[1]], sa = act[sel[0]][sel[1]], srv = rev[sel[0]][sel[1]];
  const det = '<div class="det"><span class="rotulo">Celda seleccionada</span><strong>' + esc(R.zonas[sel[0]] + ' · ' + nombres[sel[1]] + ' (' + rangos[sel[1]] + ')') + '</strong><span>' + esc(fN(sn) + ' escrituras · ' + fN(srv) + ' de reventa · ' + fN(sn - srv) + ' de desarrollador · ' + (sa ? sa + (sa === 1 ? ' desarrollo activo' : ' desarrollos activos') : 'ningún desarrollo activo')) + '</span></div>';
  const zs = Object.keys(sinOf).sort((a, b) => sinOf[b] - sinOf[a])[0];
  let lec = zs != null ? R.zonas[zs] + ' suma ' + fN(sinOf[zs]) + ' escrituras en cajones donde ningún desarrollador está activo. ' : '';
  if (mejor) lec += (zs != null ? 'Donde sí hay oferta nueva, la relación más alta es ' : 'La relación más alta es ') + R.zonas[mejor.i] + ' · ' + nombres[mejor.j] + ': ' + fN(mejor.n) + ' escrituras entre ' + mejor.a + (mejor.a === 1 ? ' desarrollo activo.' : ' desarrollos activos.');
  if (!lec) lec = 'Con estos filtros no hay celdas con 10 escrituras o más.';
  // tabla por cajón
  const maxT = Math.max.apply(null, dev.map((v, i) => v + abi[i]));
  const frows = nombres.map((s, i) => ({ seg: s, i: i, rango: rangos[i], tot: dev[i] + abi[i], dev: dev[i], abi: abi[i], pdev: dev[i] + abi[i] ? dev[i] / (dev[i] + abi[i]) : NaN, des: des[i], abs: med(absL[i]), med: med(pr[i]) }));
  const tc = tabla('t-caj', [
    { k: 'i', t: 'Cajón', cls: 's', fmt: (v, r) => r.seg }, { k: 'rango', t: 'Rango en pesos de ' + anioDe(per.b), cls: 'm', nosort: true },
    { k: 'tot', t: 'Por tipo de mercado', nosort: true, nocopy: true, w: '26%', html: (r) => '<span class="ms" style="width:' + (maxT ? r.tot / maxT * 100 : 0).toFixed(1) + '%">' + (r.dev ? '<i style="flex:' + r.dev + ' 1 0%;background:#0A95C7"></i>' : '') + (r.abi ? '<i style="flex:' + r.abi + ' 1 0%;background:#E7652F"></i>' : '') + '</span>' },
    { k: 'tot', t: 'Escrituras', num: true, cls: 's', fmt: fN }, { k: 'pdev', t: 'De desarrollador', num: true, fmt: (v) => fPct(v, 0) }, { k: 'des', t: 'Desarrollos activos', num: true, fmt: fN },
    { k: 'abs', t: 'Escrituras al mes por desarrollo', num: true, fmt: (v) => nulo(v) ? 'Sin desarrollos' : fDec(v) }, { k: 'med', t: 'Mediana de precio', num: true, fmt: fP }
  ], frows, { orden: 'i', desc: false });
  // cajones por año
  const porAnio = ANIOS.map((y) => { const v = new Array(R.seg1.length).fill(0); filas((y - 2019) * 12, Math.min((y - 2019) * 12 + 11, LAST), { merc: 1 }, (r) => (X[r] & 1) && M[r] < 2).forEach((r) => { v[S1[r]]++; }); return { t: String(y), vals: v, r: fN(v.reduce((s, x) => s + x, 0)) }; });
  const s6 = S6;
  out.html = lectura(lec) +
    '<div class="fila">' + card('full', 'Oportunidad|Matriz de oportunidad por zona y cajón', 'En cada celda, las escrituras del periodo y los desarrollos activos. Más oscuro: más escrituras por cada desarrollo.',
      '<div class="tw"><div class="mx" style="grid-template-columns:repeat(' + (NC + 1) + ',minmax(0,1fr))' + (niv === 1 ? ';min-width:640px' : '') + '">' + celdas + '</div></div>' + ley + det,
      'n = ' + fN(rows.length) + ' escrituras de desarrollador y mercado abierto, sin atípicos; esta página no usa el filtro de mercado. Desarrollo activo: fraccionamiento con 3 o más escrituras de desarrollador en ese cajón durante el periodo. "des." = desarrollos activos.',
      '<div style="display:flex;flex-wrap:wrap;gap:8px">' + segBtn('nivel', [[1, '6 cajones'], [2, '13 cajones']]) + segBtn('vista', [['op', 'Oportunidad'], ['esc', 'Escrituras'], ['des', 'Desarrollos activos']]) + '</div>') + '</div>' +
    '<div class="fila">' + card('full', 'Absorción|Desplazamiento por cajón', 'Escrituras del periodo, desarrollos activos y absorción de cada cajón', leyenda([{ c: '#0A95C7', t: 'Desarrollador' }, { c: '#E7652F', t: 'Mercado abierto' }]) + tc,
      'Absorción: mediana de las escrituras al mes de cada desarrollo activo, contadas en sus meses activos. Los rangos en pesos usan la UMA de ' + anioDe(per.b) + '.') + '</div>' +
    '<div class="fila">' + card('full', 'Tendencia|Cómo se reparten las escrituras entre cajones', 'Por año calendario.' + notaAnio, leyenda(s6) + apiladas(porAnio, s6, { cab: ['Año', 'Escrituras'], rw: 64 }) + verTabla(['Año'].concat(R.seg1), porAnio.map((x) => [x.t].concat(x.vals.map(fN)))), 'Desarrollador y mercado abierto, sin atípicos. Los cajones están en UMAs: son comparables entre años.') + '</div>';
  return out;
};

// ═════════════ 3. Mapa de zonas ═════════════
const CFG = window.TABLERO || {};
const MAPA = { z: 0, cx: 0, cy: 0, fit: null, data: [], zc: [], sel: -1 };
// proyección Web Mercator en unidades del mundo (0 a 1): la misma que usan los mapas de calles
const proy = (lat, lon) => { const f = lat * Math.PI / 180; return [(lon + 180) / 360, (1 - Math.log(Math.tan(f) + 1 / Math.cos(f)) / Math.PI) / 2]; };
const KM_MUNDO = 40075.017 * Math.cos(28.64 * Math.PI / 180);
(function encuadre() {                              // marco fijo: cubre 99% de las ventas con GPS
  const w = new Float64Array(R.pts.length);
  for (let r = 0; r < N; r++) { const p = COL[C[r]][4]; if (p >= 0 && !COL[C[r]][3]) w[p]++; }
  const wq = (vals, q) => { const o = vals.map((v, i) => [v, w[i]]).sort((a, b) => a[0] - b[0]); let t = 0, s = 0; o.forEach((x) => { t += x[1]; }); for (const x of o) { s += x[1]; if (s / t >= q) return x[0]; } return o[o.length - 1][0]; };
  const xs = R.pts.map((p) => proy(p[1], p[2])[0]), ys = R.pts.map((p) => proy(p[1], p[2])[1]);
  const x0 = wq(xs, .004), x1 = wq(xs, .996), y0 = wq(ys, .004), y1 = wq(ys, .996), px = (x1 - x0) * .06, py = (y1 - y0) * .06;
  MAPA.fit = [x0 - px, x1 + px, y0 - py, y1 + py];
})();
function pintarMapa() {
  const el = document.getElementById('mapa'); if (!el) return;
  const W = el.clientWidth, H = el.clientHeight, f = MAPA.fit;
  const zfit = Math.log2(Math.min(W / (f[1] - f[0]), H / (f[3] - f[2])) / 256);
  if (!MAPA.z) { MAPA.z = zfit; MAPA.cx = (f[0] + f[1]) / 2; MAPA.cy = (f[2] + f[3]) / 2; }
  MAPA.zfit = zfit;
  const k = 256 * Math.pow(2, MAPA.z); MAPA.k = k;
  const sx = (x) => (x - MAPA.cx) * k + W / 2, sy = (y) => (y - MAPA.cy) * k + H / 2;
  let h = '';
  if (CFG.fondoMapa) {                              // fondo de calles: mosaicos del nivel de acercamiento más próximo
    const zt = Math.max(3, Math.min(19, Math.round(MAPA.z))), n = Math.pow(2, zt), lado = k / n;
    const tx0 = Math.floor((MAPA.cx - W / 2 / k) * n), tx1 = Math.floor((MAPA.cx + W / 2 / k) * n), ty0 = Math.floor((MAPA.cy - H / 2 / k) * n), ty1 = Math.floor((MAPA.cy + H / 2 / k) * n);
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
      if (tx < 0 || ty < 0 || tx >= n || ty >= n) continue;
      h += '<img class="tl" alt="" draggable="false" src="' + CFG.fondoMapa.replace('{z}', zt).replace('{x}', tx).replace('{y}', ty) + '" style="left:' + sx(tx / n).toFixed(1) + 'px;top:' + sy(ty / n).toFixed(1) + 'px;width:' + (lado + .6).toFixed(1) + 'px;height:' + (lado + .6).toFixed(1) + 'px">';
    }
  }
  const nmax = MAPA.data.reduce((m, p) => Math.max(m, p.n), 1), cr = Math.min(40, W * .055) / Math.sqrt(nmax);
  MAPA.rad = (n) => Math.max(4, cr * Math.sqrt(n));
  MAPA.data.forEach((p) => {
    const x = sx(p.x), y = sy(p.y), r = MAPA.rad(p.n);
    if (x < -r || y < -r || x > W + r || y > H + r) return;
    h += '<button type="button" class="bub' + (p.c ? '' : ' nd') + (p.i === MAPA.sel ? ' sel' : '') + '" data-pt="' + p.i + '" data-tip="' + esc(p.tip) + '" aria-label="' + esc(p.nombre) + '" style="left:' + x.toFixed(1) + 'px;top:' + y.toFixed(1) + 'px;width:' + (2 * r).toFixed(1) + 'px;height:' + (2 * r).toFixed(1) + 'px' + (p.c ? ';background:' + p.c : '') + '"></button>';
  });
  MAPA.zc.forEach((z) => { h += '<button type="button" class="zl" data-zona="' + z.z + '" aria-pressed="' + (!!st.zona && st.zona.has(z.z)) + '" style="left:' + sx(z.x).toFixed(1) + 'px;top:' + sy(z.y).toFixed(1) + 'px">' + esc(R.zonas[z.z]) + '</button>'; });
  h += '<div class="ctl"><button type="button" data-zoom="in" aria-label="Acercar">+</button><button type="button" data-zoom="out" aria-label="Alejar">−</button><button type="button" data-zoom="reset" aria-label="Ver toda la ciudad" style="font-size:12px">Todo</button></div>' +
    '<div class="esc"><span>5 km</span><i style="width:' + (5 / KM_MUNDO * k).toFixed(0) + 'px"></i></div>' +
    (CFG.fondoMapa ? '<span class="atr">' + esc(CFG.atribucion || '') + '</span>' : '<span class="nota">Vista previa: el fondo de calles aparece en la versión del sitio.</span>');
  el.innerHTML = h;
  el.classList.toggle('conf', !!CFG.fondoMapa);
  el.style.touchAction = MAPA.z > zfit + .1 ? 'none' : 'pan-y';
}
function zoomMapa(d) {
  if (d === 'reset') MAPA.z = 0; else MAPA.z = Math.max(MAPA.zfit - 1, Math.min(18, MAPA.z + (d === 'in' ? .5 : -.5)));
  pintarMapa();
}
(function arrastre() {
  let on = null, movido = false;
  document.addEventListener('pointerdown', (ev) => { const m = ev.target.closest && ev.target.closest('#mapa'); if (!m || ev.target.closest('.ctl')) return; if (ev.pointerType !== 'mouse' && MAPA.z <= MAPA.zfit + .1) return; on = { x: ev.clientX, y: ev.clientY, cx: MAPA.cx, cy: MAPA.cy }; movido = false; });
  document.addEventListener('pointermove', (ev) => { if (!on) return; const dx = ev.clientX - on.x, dy = ev.clientY - on.y; if (Math.abs(dx) + Math.abs(dy) < 5 && !movido) return; movido = true; MAPA.cx = on.cx - dx / MAPA.k; MAPA.cy = on.cy - dy / MAPA.k; pintarMapa(); });
  document.addEventListener('pointerup', () => { on = null; });
  document.addEventListener('click', (ev) => { if (movido && ev.target.closest && ev.target.closest('#mapa')) { ev.stopPropagation(); ev.preventDefault(); } movido = false; }, true);
  window.addEventListener('resize', () => { if (document.getElementById('mapa')) { MAPA.z = 0; pintarMapa(); } });
})();
PAG.mapa = (per) => {
  const rows = filas(per.a, per.b), vt = st.tipo === 1 ? 1 : 0;
  const out = { titulo: 'Mapa de zonas', sub: 'Chihuahua capital · ' + per.txt, n: rows.length };
  if (!rows.length) { out.html = vacio; return out; }
  const pts = new Map(), cols = new Map(); let sinGps = 0;
  const nuevo = () => ({ n: 0, dev: 0, pr: [], s1: new Array(R.seg1.length).fill(0), z: new Array(10).fill(0), cols: new Map(), m2: [], m20: [] });
  rows.forEach((r) => {
    const c = C[r], p = COL[c][4], pc = precio(r);
    const oc = cols.get(c) || { c: c, n: 0, dev: 0, pr: [] }; oc.n++; if (M[r] === 0) oc.dev++; if (X[r] & 1) oc.pr.push(pc); cols.set(c, oc);
    if (p < 0) { sinGps++; return; }
    const o = pts.get(p) || nuevo(); o.n++; if (M[r] === 0) o.dev++; o.z[Z[r]]++; o.cols.set(c, (o.cols.get(c) || 0) + 1);
    if (X[r] & 1) { o.pr.push(pc); o.s1[S1[r]]++; }
    if ((X[r] & 2) && T[r] === vt) o.m2.push(P[r] * FACT[YM[r]] / A[r]);
    pts.set(p, o);
  });
  if (per.comp) filas(per.comp[0], per.comp[1]).forEach((r) => { const p = COL[C[r]][4], o = p >= 0 && pts.get(p); if (o && (X[r] & 2) && T[r] === vt) o.m20.push(P[r] * FACT[YM[r]] / A[r]); });
  const zc = R.zonas.map(() => ({ x: 0, y: 0, n: 0 }));
  const data = [];
  pts.forEach((o, p) => {
    const xy = proy(R.pts[p][1], R.pts[p][2]), cl = Array.from(o.cols.entries()).sort((a, b) => b[1] - a[1]);
    const nombre = COL[cl[0][0]][1] + (cl.length > 1 ? ' y ' + (cl.length - 1) + ' más' : ''), z = moda(o.z), s1 = moda(o.s1), mp = med(o.pr);
    const pv = o.m2.length >= 10 && o.m20.length >= 10 ? med(o.m2) / med(o.m20) - 1 : NaN;
    let c;
    if (st.color === 'plusvalia') c = nulo(pv) ? '' : DIV5[pv <= -.10 ? 0 : (pv < -.03 ? 1 : (pv <= .03 ? 2 : (pv < .10 ? 3 : 4)))];
    else c = s1 < 0 ? '' : RAMPA6[s1];
    data.push({ i: p, x: xy[0], y: xy[1], n: o.n, c: c, nombre: nombre, o: o, cl: cl, z: z, mp: mp, pv: pv,
      tip: nombre + '\nEscrituras: ' + fN(o.n) + '\nMediana de precio: ' + fP(mp) + (s1 >= 0 ? '\nCajón más frecuente: ' + R.seg1[s1] : '') + (st.color === 'plusvalia' ? '\nPrecio por m², cambio real: ' + fSig(pv) : '') });
    if (z < 9) { zc[z].x += xy[0] * o.n; zc[z].y += xy[1] * o.n; zc[z].n += o.n; }
  });
  data.sort((a, b) => b.n - a.n);
  if (!data.length) { out.html = vacio; return out; }
  const s = data.find((d) => d.i === st.punto) || data[0];
  MAPA.data = data; MAPA.sel = s.i; MAPA.zc = zc.map((v, z) => ({ z: z, x: v.x / v.n, y: v.y / v.n, n: v.n })).filter((v) => v.n > 0);
  QA.mapa = { n: rows.length, puntos: data.length, sinGps: sinGps, top: { id: R.pts[data[0].i][0], n: data[0].n, mp: data[0].mp, nombre: data[0].nombre } };
  const cmx = s.cl[0][1], lista = s.cl.slice(0, 6), resto = s.o.n - lista.reduce((t, x) => t + x[1], 0);
  const panel = '<section class="panel card"><div><p class="rotulo">Punto seleccionado</p><h2 class="panel-titulo">' + esc(s.nombre) + '</h2><p class="nota">' + esc((s.z < 9 ? 'Macrozona ' + R.zonas[s.z] : 'Sin zona') + (s.cl.length > 1 ? ' · ' + s.cl.length + ' colonias comparten este punto' : '')) + '</p></div>' +
    '<div class="kv"><div><span>Escrituras</span><b>' + fN(s.o.n) + '</b></div><div><span>Mediana de precio</span><b>' + fP(s.mp) + '</b></div><div><span>De desarrollador</span><b>' + fPct(s.o.dev / s.o.n) + '</b></div></div>' +
    barras(lista.map((x) => ({ t: COL[x[0]][1], v: x[1] })), { lw: 150 }) + (resto > 0 ? '<p class="pie">Y ' + (s.cl.length - lista.length) + ' más con ' + fN(resto) + ' escrituras.</p>' : '') + '</section>';
  const crows = Array.from(cols.values()).map((o) => ({ col: COL[o.c][1], zona: ZN[COL[o.c][2]], n: o.n, med: med(o.pr), pdev: o.dev / o.n }));
  const tr = tabla('t-col', [{ k: 'col', t: 'Colonia' }, { k: 'zona', t: 'Macrozona', cls: 'm' }, { k: 'n', t: 'Escrituras', num: true, cls: 's', fmt: fN }, { k: 'med', t: 'Mediana de precio', num: true, fmt: fP }, { k: 'pdev', t: 'De desarrollador', num: true, fmt: (v) => fPct(v, 0) }], crows, { orden: 'n', max: 10 });
  const ley = st.color === 'plusvalia'
    ? leyenda([{ c: DIV5[0], t: 'baja más de 10%', o: 1 }, { c: DIV5[1], t: 'baja 3 a 10%', o: 1 }, { c: DIV5[2], t: 'sin cambio (±3%)', o: 1 }, { c: DIV5[3], t: 'sube 3 a 10%', o: 1 }, { c: DIV5[4], t: 'sube más de 10%', o: 1 }, { c: '#FFFFFF', t: 'menos de 10 ventas', o: 1, b: 1 }], 'Precio por m², cambio real:')
    : leyenda(R.seg1.map((t, i) => ({ c: RAMPA6[i], t: t, o: 1 })), 'Cajón más frecuente:');
  out.html = lectura('El punto con más movimiento es ' + data[0].nombre + (data[0].z < 9 ? ' (' + R.zonas[data[0].z] + ')' : '') + ': ' + fN(data[0].n) + ' escrituras en el periodo, ' + fPct(data[0].n / rows.length) + ' de las escrituras de la selección.') +
    '<div class="fila" style="align-items:flex-start">' + card('w2', 'Ubicación|Dónde se escritura', 'Una burbuja por punto del mapa. El tamaño son las escrituras del periodo. Toca una burbuja para ver su detalle, o el nombre de una zona para filtrarla.',
      '<div class="map" id="mapa"></div>' + ley, 'n = ' + fN(rows.length) + ' escrituras en ' + data.length + ' puntos.' + (sinGps ? ' ' + fN(sinGps) + ' escrituras no tienen GPS.' : '') + (st.color === 'plusvalia' ? ' Cambio real: mediana por m² en pesos constantes, ' + per.corto + ' contra ' + per.ccorto + '.' : ''),
      '<div style="display:flex;align-items:center;gap:8px"><span style="font-size:12px;color:#566476">Color</span>' + segBtn('color', [['cajon', 'Cajón'], ['plusvalia', 'Plusvalía']]) + '</div>') +
    '<div style="flex:1 1 340px;min-width:0;display:flex;flex-direction:column;gap:1rem">' + panel + '</div></div>' +
    '<div class="fila">' + card('full', 'Ranking|Colonias con más escrituras', per.txt, tr) + '</div>';
  out.post = pintarMapa;
  return out;
};

// ═════════════ 4. Plusvalía ═════════════
PAG.plusvalia = (per) => {
  const vt = st.tipo === 1 ? 1 : 0, pm = st.pvMerc, NA = ANIOS.length, ya = NA - 1, y5 = ya - 5;
  const okM = (r) => pm === 2 ? M[r] < 2 : M[r] === pm;
  const nom = ANIOS.map(() => []), real = ANIOS.map(() => []), zn = R.zonas.map(() => ANIOS.map(() => [])), zr = R.zonas.map(() => ANIOS.map(() => [])), cn = new Map();
  for (let r = 0; r < N; r++) {
    if (!(X[r] & 2) || T[r] !== vt || !okM(r) || !pasa(r, { merc: 1, tipo: 1 })) continue;
    const y = Math.floor(YM[r] / 12), a = P[r] / A[r], b = a * FACT[YM[r]];
    nom[y].push(a); real[y].push(b);
    if (Z[r] < 9) { zn[Z[r]][y].push(a); zr[Z[r]][y].push(b); }
    if (y === ya || y === ya - 1 || y === y5) { const o = cn.get(C[r]) || { a: [], b: [], c: [] }; (y === ya ? o.a : (y === ya - 1 ? o.b : o.c)).push(b); cn.set(C[r], o); }
  }
  const m10 = (arr) => arr.length >= 10 ? med(arr) : NaN, cre = (x, y) => nulo(x) || nulo(y) ? NaN : x / y - 1;
  const cn_ = nom.map(m10), cr_ = real.map(m10), usa = st.mon === 'const' ? cr_ : cn_;
  QA.plusvalia = { nom: cn_, real: cr_, n: nom.map((x) => x.length) };
  const out = { titulo: 'Plusvalía', sub: 'Mediana del precio por m² ' + (vt ? 'de unidad, vivienda vertical' : 'de lote, vivienda horizontal') + ' · ' + ['desarrollador', 'mercado abierto', 'desarrollador y mercado abierto'][pm] + ' · 2019 a ' + A1 };
  const tl = [
    { l: 'Precio por m² en ' + A1, v: fP(usa[ya]), n: 'n = ' + fN(nom[ya].length) + (st.mon === 'const' ? ' · pesos de ' + ymTxt(LAST) : ' · pesos corrientes') },
    { l: 'Cambio contra ' + (A1 - 1), v: fSig(cre(cn_[ya], cn_[ya - 1])), n: 'En pesos corrientes' },
    { l: 'Cambio real contra ' + (A1 - 1), v: fSig(cre(cr_[ya], cr_[ya - 1])), n: 'Sin inflación' },
    { l: 'Cambio real en 5 años', v: y5 >= 0 ? fSig(cre(cr_[ya], cr_[y5])) : 's/d', n: y5 >= 0 ? A1 + ' contra ' + ANIOS[y5] : '' }
  ];
  const zrows = R.zonas.map((z, i) => { const n_ = zn[i].map(m10), r_ = zr[i].map(m10); return { z: z, n: zn[i][ya].length, m2: (st.mon === 'const' ? r_ : n_)[ya], an: cre(n_[ya], n_[ya - 1]), ar: cre(r_[ya], r_[ya - 1]), n5: y5 >= 0 ? cre(n_[ya], n_[y5]) : NaN, r5: y5 >= 0 ? cre(r_[ya], r_[y5]) : NaN, serie: st.mon === 'const' ? r_ : n_ }; });
  QA.plusvalia.zonas = zrows.map((x) => ({ z: x.z, m2: x.m2, ar: x.ar, r5: x.r5 }));
  const tz = tabla('t-pvz', [{ k: 'z', t: 'Macrozona' }, { k: 'n', t: 'Ventas en ' + A1, num: true, fmt: fN }, { k: 'm2', t: 'Precio por m² en ' + A1, num: true, cls: 's', fmt: fP }, { k: 'an', t: 'Contra ' + (A1 - 1), num: true, sig: 1 }, { k: 'ar', t: 'Contra ' + (A1 - 1) + ', real', num: true, sig: 1 },
    { k: 'n5', t: '5 años', num: true, sig: 1 }, { k: 'r5', t: '5 años, real', num: true, cls: 's', sig: 1 }], zrows, { orden: 'r5' });
  const rank = zrows.filter((x) => !nulo(x.r5)).sort((a, b) => b.r5 - a.r5);
  const mejor = rank[0], peor = rank[rank.length - 1];
  const rmin = Math.min(0, rank.length ? peor.r5 : 0);
  const rankB = barras(rank.map((x) => ({ t: x.z, v: x.r5 - rmin, txt: fSig(x.r5), tip: x.z + '\nCambio real en 5 años: ' + fSig(x.r5) + '\nCambio en pesos corrientes: ' + fSig(x.n5) })), { lw: 84 });
  const crows = []; cn.forEach((o, c) => { if (o.a.length >= 10 && o.b.length >= 10) crows.push({ col: COL[c][1], zona: ZN[COL[c][2]], n: o.a.length, m2: med(o.a), ar: med(o.a) / med(o.b) - 1, r5: o.c.length >= 10 ? med(o.a) / med(o.c) - 1 : NaN }); });
  const tcn = tabla('t-pvc', [{ k: 'col', t: 'Colonia' }, { k: 'zona', t: 'Macrozona', cls: 'm' }, { k: 'n', t: 'Ventas en ' + A1, num: true, fmt: fN }, { k: 'm2', t: 'Precio por m², pesos constantes', num: true, cls: 's', fmt: fP }, { k: 'ar', t: 'Contra ' + (A1 - 1) + ', real', num: true, sig: 1 }, { k: 'r5', t: '5 años, real', num: true, sig: 1 }], crows, { orden: 'n', max: 12 });
  let lec = nulo(cn_[ya]) ? 'No hay 10 ventas o más en ' + A1 + ' con estos filtros.' : 'En ' + A1 + ' el precio por m² ' + (cre(cn_[ya], cn_[ya - 1]) >= 0 ? 'subió ' : 'bajó ') + fPct(Math.abs(cre(cn_[ya], cn_[ya - 1]))) + ' contra ' + (A1 - 1) + ' en pesos corrientes; sin inflación, ' + (cre(cr_[ya], cr_[ya - 1]) >= 0 ? 'subió ' : 'bajó ') + fPct(Math.abs(cre(cr_[ya], cr_[ya - 1]))) + '.';
  if (mejor && rank.length > 1) lec += ' En 5 años, la zona que más ganó valor real es ' + mejor.z + ' (' + fSig(mejor.r5) + ')' + (peor.r5 < mejor.r5 ? ' y la que menos, ' + peor.z + ' (' + fSig(peor.r5) + ').' : '.');
  const xa = ANIOS.map((y) => [1, String(y)]);
  out.html = lectura(lec) + '<div class="filt"><span style="font-size:13px;color:#566476">Se calcula con</span>' + segBtn('pvMerc', [[1, 'Mercado abierto'], [0, 'Desarrollador'], [2, 'Ambos']]) + '</div>' + tiles(tl) +
    '<div class="fila">' + card('w2', 'Tendencia|Precio por m², ' + (st.mon === 'const' ? 'pesos constantes' : 'pesos corrientes'), 'Mediana por año, toda la ciudad y sus macrozonas',
      leyenda([{ c: '#0A95C7', t: 'Toda la ciudad', l: 1 }, { c: '#89939E', t: 'Cada macrozona', l: 1 }]) +
      linea('ln-pv', { n: NA, series: zrows.map((x) => ({ t: x.z, c: '#89939E', w: 1.5, v: x.serie })).concat([{ t: 'Toda la ciudad', c: '#0A95C7', w: 3, v: usa, dots: 1 }]), xl: xa, xpts: 1, fmt: fP, xt: (i) => String(ANIOS[i]), alt: 'Mediana de precio por metro cuadrado por año' }) +
      verTabla(['Año', 'Pesos corrientes', 'Pesos constantes', 'Ventas'], ANIOS.map((y, i) => [String(y), fP(cn_[i]), fP(cr_[i]), fN(nom[i].length)])), 'Solo se muestra con 10 ventas o más por zona y año.' + notaAnio) +
    card('w1', 'Ranking|Quién ganó más valor en 5 años', 'Cambio real del precio por m², ' + A1 + ' contra ' + (y5 >= 0 ? ANIOS[y5] : ''), rankB, 'En pesos constantes de ' + ymTxt(LAST) + '.') + '</div>' +
    '<div class="fila">' + card('full', 'Zonas|Plusvalía por macrozona', 'Precio por m² en ' + (st.mon === 'const' ? 'pesos constantes' : 'pesos corrientes') + ' y su cambio', tz, 's/d: menos de 10 ventas en alguno de los años que se comparan.') + '</div>' +
    '<div class="fila">' + card('full', 'Colonias|Plusvalía por colonia', 'Colonias con 10 ventas o más en ' + A1 + ' y en ' + (A1 - 1) + ', de la que tiene más ventas a la que tiene menos', tcn, 'El precio por m² cambia también cuando cambia el tipo de vivienda que se vende en la colonia: léelo junto con el número de ventas.') + '</div>';
  out.filtros = undefined;
  return out;
};

// ═════════════ 5. Desarrolladores ═════════════
PAG.desarrolladores = (per) => {
  const todo = filas(per.a, per.b, { merc: 1 }), rows = todo.filter((r) => M[r] === 0);
  const out = { titulo: 'Desarrolladores', sub: 'Chihuahua capital · ' + per.txt + ' · primera venta', n: rows.length };
  if (!rows.length) { out.html = vacio; return out; }
  const mk = new Map(), ds = new Map();
  rows.forEach((r) => {
    const o = mk.get(K[r]) || { k: K[r], n: 0, val: 0, pr: [], s1: new Array(R.seg1.length).fill(0), cols: new Map() };
    o.n++; o.val += precio(r); o.cols.set(C[r], (o.cols.get(C[r]) || 0) + 1); if (X[r] & 1) { o.pr.push(precio(r)); o.s1[S1[r]]++; } mk.set(K[r], o);
    const d = ds.get(C[r]) || { c: C[r], n: 0, a: 999, b: -1, pr: [], s1: new Array(R.seg1.length).fill(0), mk: new Map() };
    d.n++; d.a = Math.min(d.a, YM[r]); d.b = Math.max(d.b, YM[r]); d.mk.set(K[r], (d.mk.get(K[r]) || 0) + 1); if (X[r] & 1) { d.pr.push(precio(r)); d.s1[S1[r]]++; } ds.set(C[r], d);
  });
  const marcas = Array.from(mk.values()).sort((a, b) => b.n - a.n);
  const drows = Array.from(ds.values()).map((d) => { const m = Array.from(d.mk.entries()).sort((a, b) => b[1] - a[1])[0][0], s1 = moda(d.s1); return { des: COL[d.c][1], marca: R.marcas[m], zona: ZN[COL[d.c][2]], n: d.n, meses: d.b - d.a + 1, abs: d.n / (d.b - d.a + 1), med: med(d.pr), caj: s1 < 0 ? '' : R.seg1[s1], s1: s1, tipo: 0 }; });
  const activos = drows.filter((d) => d.n >= 3), absMed = med(activos.map((d) => d.abs));
  QA.desarrolladores = { n: rows.length, marcas: marcas.length, activos: activos.length, abs: absMed, top: { marca: R.marcas[marcas[0].k], n: marcas[0].n } };
  const top = marcas.slice(0, 12), otros = marcas.slice(12), nOtros = otros.reduce((s, o) => s + o.n, 0);
  const rk = top.map((o) => ({ t: R.marcas[o.k], v: o.n, txt: fN(o.n) + ' · ' + fPct(o.n / rows.length), tip: R.marcas[o.k] + '\nEscrituras: ' + fN(o.n) + '\nParticipación: ' + fPct(o.n / rows.length) + '\nMediana de precio: ' + fP(med(o.pr)) + '\nDesarrollos con ventas: ' + o.cols.size }));
  if (otros.length) rk.push({ t: 'Otros ' + otros.length + ' desarrolladores', v: nOtros, txt: fN(nOtros) + ' · ' + fPct(nOtros / rows.length) });
  const s6 = S6;
  const cartera = marcas.slice(0, 10).map((o) => ({ t: R.marcas[o.k], vals: o.s1, r: fP(med(o.pr)) }));
  const td = tabla('t-des', [{ k: 'des', t: 'Desarrollo' }, { k: 'marca', t: 'Desarrollador' }, { k: 'zona', t: 'Macrozona', cls: 'm' }, { k: 'n', t: 'Escrituras', num: true, cls: 's', fmt: fN }, { k: 'meses', t: 'Meses activos', num: true, fmt: fN },
    { k: 'abs', t: 'Escrituras al mes', num: true, cls: 's', fmt: (v) => fDec(v) }, { k: 'med', t: 'Mediana de precio', num: true, fmt: fP }, { k: 's1', t: 'Cajón más frecuente', fmt: (v, r) => r.caj }], drows, { orden: 'n', max: 15 });
  const tl = [
    { l: 'Escrituras de desarrollador', v: fN(rows.length), n: fPct(rows.length / todo.length) + ' de las escrituras del periodo' },
    { l: 'Desarrolladores con ventas', v: fN(marcas.length), n: 'Los 5 mayores suman ' + fPct(marcas.slice(0, 5).reduce((s, o) => s + o.n, 0) / rows.length) },
    { l: 'Desarrollos activos', v: fN(activos.length), n: 'Con 3 o más escrituras en el periodo' },
    { l: 'Absorción típica', v: fDec(absMed), n: 'Escrituras al mes por desarrollo activo, mediana' }
  ];
  out.html = lectura(R.marcas[marcas[0].k] + ' es el desarrollador con más escrituras: ' + fN(marcas[0].n) + ', ' + fPct(marcas[0].n / rows.length) + ' de la primera venta del periodo. Un desarrollo activo escritura ' + fDec(absMed) + ' viviendas al mes en la mediana.') + tiles(tl) +
    '<div class="fila">' + card('', 'Ranking|Quién escritura más', 'Escrituras y participación en la primera venta', barras(rk, { lw: 150 }), 'n = ' + fN(rows.length) + ' escrituras de desarrollador. Esta página no usa el filtro de mercado.') +
    card('', 'Cartera|En qué cajones vende cada uno', 'Los 10 desarrolladores con más escrituras', leyenda(s6) + apiladas(cartera, s6, { lw: 130, rw: 84, cab: ['Desarrollador', 'Mediana'] }), 'A la derecha, la mediana de precio. Sin atípicos.') + '</div>' +
    '<div class="fila">' + card('full', 'Ritmo de venta|Absorción por desarrollo', 'Escrituras de desarrollador en cada fraccionamiento o torre, y su ritmo al mes', td, 'Escrituras al mes: escrituras del periodo entre los meses que van de la primera a la última. La escritura llega unos 3 meses después de la venta.') + '</div>';
  return out;
};

// ═════════════ 6. Financiamiento ═════════════
PAG.financiamiento = (per) => {
  const cur = filas(per.a, per.b), prev = per.comp ? filas(per.comp[0], per.comp[1]) : null;
  const out = { titulo: 'Financiamiento', sub: 'Chihuahua capital · ' + per.txt + (prev ? ', comparado con ' + per.ctxt : ''), n: cur.length };
  if (!cur.length) { out.html = vacio; return out; }
  const mezcla = (rows) => { const v = new Array(R.pago.length).fill(0); rows.forEach((r) => { v[F[r]]++; }); return v; };
  const fc = mezcla(cur), f0 = prev ? mezcla(prev) : null, tot = cur.length, tot0 = prev ? prev.length : 0;
  const cred = (rows, fp) => { const m = [], p = []; rows.forEach((r) => { if (Q[r] > 0 && (fp == null || F[r] === fp)) { m.push(st.mon === 'const' ? Q[r] * FACT[YM[r]] : Q[r]); if (P[r] > 0) p.push(Q[r] / P[r]); } }); return { m: med(m), p: med(p), n: m.length }; };
  const cg = cred(cur), cg0 = prev ? cred(prev) : null;
  QA.financiamiento = { mezcla: fc, n: tot, cred: cg };
  const dpp = (i) => prev && tot0 ? (() => { const d = (fc[i] / tot - f0[i] / tot0) * 100; return (d >= 0 ? '+' : '−') + Math.abs(d).toFixed(1) + ' puntos'; })() : '';
  const vs = prev ? 'contra ' + per.ccorto : '', iB = R.pago.indexOf('Bancario'), iC = R.pago.indexOf('Cofinanciamiento'), iI = R.pago.indexOf('Infonavit');
  const tl = [
    { l: 'De contado', v: fPct(fc[CONTADO] / tot), d: dpp(CONTADO), vs: vs, n: fN(fc[CONTADO]) + ' escrituras' },
    { l: 'Infonavit', v: fPct(fc[iI] / tot), d: dpp(iI), vs: vs, n: fN(fc[iI]) + ' escrituras' },
    { l: 'Bancario', v: fPct(fc[iB] / tot), d: dpp(iB), vs: vs, n: 'Más ' + fPct(fc[iC] / tot) + ' de cofinanciamiento' },
    { l: 'Crédito mediano', v: fP(cg.m), d: cg0 ? fSig(cg.m / cg0.m - 1) : '', vs: vs, n: 'n = ' + fN(cg.n) + ' escrituras con crédito' },
    { l: 'Cobertura del crédito', v: fPct(cg.p), n: 'Parte del precio que cubre, mediana' }
  ];
  const sP = R.pago.map((t, i) => ({ t: t, c: CPAGO[i] })), mp = mesesPorAnio(per);
  const anual = ANIOS.map((y) => { const rg = mp.rango(y), v = rg[0] <= rg[1] ? mezcla(filas(rg[0], rg[1])) : new Array(R.pago.length).fill(0), t = v.reduce((s, x) => s + x, 0); return { t: String(y), vals: v, r: t ? fPct(v[CONTADO] / t) : '' }; });
  const porCaj = R.seg1.map((s, i) => { const v = new Array(R.pago.length).fill(0); cur.forEach((r) => { if ((X[r] & 1) && S1[r] === i) v[F[r]]++; }); const t = v.reduce((a, x) => a + x, 0); return { t: s, vals: v, r: t ? fPct(v[CONTADO] / t) : '' }; });
  const bancos = (rows) => { const m = new Map(); rows.forEach((r) => { if ((F[r] === iB || F[r] === iC) && I[r] > 0) m.set(I[r], (m.get(I[r]) || 0) + 1); }); return m; };
  const bc = bancos(cur), b0 = prev ? bancos(prev) : null, nb = Array.from(bc.values()).reduce((s, v) => s + v, 0);
  const brows = Array.from(bc.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8).map((x) => ({ t: R.inst[x[0]], v: x[1], v2: b0 ? (b0.get(x[0]) || 0) : null, txt: fN(x[1]) + ' · ' + fPct(x[1] / nb), tip: R.inst[x[0]] + '\n' + per.corto + ': ' + fN(x[1]) + ' (' + fPct(x[1] / nb) + ')' + (b0 ? '\n' + per.ccorto + ': ' + fN(b0.get(x[0]) || 0) : '') }));
  const prow = R.pago.map((t, i) => { const c = i === CONTADO ? { m: NaN, p: NaN } : cred(cur, i); return { i: i, fp: t, n: fc[i], pct: fc[i] / tot, m: c.m, p: c.p }; });
  const tp = tabla('t-pago', [{ k: 'i', t: 'Forma de pago', fmt: (v, r) => r.fp }, { k: 'n', t: 'Escrituras', num: true, cls: 's', fmt: fN }, { k: 'pct', t: 'Participación', num: true, fmt: (v) => fPct(v) }, { k: 'm', t: 'Crédito mediano', num: true, fmt: (v) => nulo(v) ? '' : fP(v) }, { k: 'p', t: 'Parte del precio que cubre', num: true, fmt: (v) => nulo(v) ? '' : fPct(v) }], prow, { orden: 'i', desc: false });
  const iTop = moda(fc);
  out.html = lectura(R.pago[iTop] + ' es la forma de pago más usada: ' + fPct(fc[iTop] / tot) + ' de las escrituras. De contado se paga ' + fPct(fc[CONTADO] / tot) + (prev && tot0 ? ' (' + dpp(CONTADO) + ' contra ' + per.ctxt + ')' : '') + '. El crédito mediano es de ' + fP(cg.m) + ' y cubre ' + fPct(cg.p) + ' del precio.') + tiles(tl) +
    '<div class="fila">' + card('', 'Tendencia|Cómo se paga, por año', 'Escrituras por forma de pago, ' + mp.txt, leyenda(sP) + apiladas(anual, sP, { cab: ['Año', 'De contado'], rw: 72 }) + verTabla(['Año'].concat(R.pago), anual.map((x) => [x.t].concat(x.vals.map(fN)))), 'A la derecha, el porcentaje de contado.') +
    card('', 'Cajones|Cómo se paga, por cajón', per.txt, leyenda(sP) + apiladas(porCaj, sP, { lw: 112, cab: ['Cajón', 'De contado'], rw: 72 }) + verTabla(['Cajón'].concat(R.pago), porCaj.map((x) => [x.t].concat(x.vals.map(fN)))), 'Solo ventas que entran en precios.') + '</div>' +
    '<div class="fila">' + card('', 'Bancos|Qué bancos financian', 'Créditos bancarios y cofinanciamientos, ' + per.txt, (prev ? leyenda([{ c: '#0A95C7', t: per.corto }, { c: '#89939E', t: per.ccorto }]) : '') + barras(brows, { lw: 130 }), 'n = ' + fN(nb) + ' créditos con banco identificado.') +
    card('', 'Crédito|Crédito por forma de pago', per.txt, tp, st.mon === 'const' ? 'Crédito en pesos constantes de ' + ymTxt(LAST) + '.' : 'Crédito en pesos corrientes.') + '</div>';
  return out;
};

// ═════════════ 7. Vertical: ventas ═════════════
PAG['vertical-ventas'] = (per) => {
  const esV = (r) => T[r] === 1, todo = filas(per.a, per.b, { tipo: 1 }), rows = todo.filter(esV), k = kp(rows, 1);
  const prev = per.comp ? filas(per.comp[0], per.comp[1], { tipo: 1 }, esV) : null, k0 = prev ? kp(prev, 1) : null;
  const out = { titulo: 'Vertical: ventas', sub: 'Departamentos ya escriturados · ' + per.txt + (k0 ? ', comparado con ' + per.ctxt : ''), n: rows.length };
  const hist = filas(0, LAST, { tipo: 1 }, esV);
  if (!hist.length) { out.html = vacio; return out; }
  const porAnio = ANIOS.map(() => 0); hist.forEach((r) => { porAnio[Math.floor(YM[r] / 12)]++; });
  const tw = new Map();
  hist.forEach((r) => { const o = tw.get(C[r]) || { c: C[r], tot: 0, a: 999, b: -1, n: 0, pr: [], m2: [], s1: new Array(R.seg1.length).fill(0), dn: 0, da: 999, db: -1 }; o.tot++; o.a = Math.min(o.a, YM[r]); o.b = Math.max(o.b, YM[r]); tw.set(C[r], o); });
  const zn = new Array(10).fill(0), cj = new Array(R.seg1.length).fill(0);
  rows.forEach((r) => { const o = tw.get(C[r]); o.n++; zn[Z[r]]++; if (X[r] & 1) { o.pr.push(precio(r)); o.s1[S1[r]]++; cj[S1[r]]++; } if (X[r] & 2) o.m2.push(precio(r) / A[r]); if (M[r] === 0) { o.dn++; o.da = Math.min(o.da, YM[r]); o.db = Math.max(o.db, YM[r]); } });
  const trows = Array.from(tw.values()).map((o) => { const s1 = moda(o.s1); return { torre: COL[o.c][1], zona: ZN[COL[o.c][2]], n: o.n, tot: o.tot, abs: o.dn >= 3 ? o.dn / (o.db - o.da + 1) : NaN, med: med(o.pr), m2: med(o.m2), s1: s1, caj: s1 < 0 ? '' : R.seg1[s1], a: o.a, b: o.b }; });
  const conVentas = trows.filter((t) => t.n > 0).length;
  QA.vertical = { n: rows.length, k: k, torres: conVentas, hist: hist.length, porAnio: porAnio };
  const vs = k0 ? 'contra ' + per.ccorto : '', d = (x, y) => k0 && y ? fSig(x / y - 1) : '';
  const tl = [
    { l: 'Escrituras verticales', v: fN(k.n), d: d(k.n, k0 && k0.n), vs: vs, n: fPct(todo.length ? k.n / todo.length : NaN) + ' de las escrituras del periodo' },
    { l: 'Mediana de precio', v: fP(k.med), d: d(k.med, k0 && k0.med), vs: vs, n: 'Mitad central: ' + fP(k.p25) + ' a ' + fP(k.p75) },
    { l: 'Mediana por m² de unidad', v: fP(k.m2), d: d(k.m2, k0 && k0.m2), vs: vs, n: 'n = ' + fN(k.nm2) },
    { l: 'Torres con escrituras', v: fN(conVentas), n: 'De ' + fN(trows.length) + ' con escrituras desde 2019' }
  ];
  const tt = tabla('t-torres', [{ k: 'torre', t: 'Torre o condominio' }, { k: 'zona', t: 'Macrozona', cls: 'm' }, { k: 'n', t: 'Escrituras del periodo', num: true, cls: 's', fmt: fN }, { k: 'tot', t: 'Desde 2019', num: true, fmt: fN },
    { k: 'abs', t: 'Escrituras al mes', num: true, fmt: (v) => nulo(v) ? '' : fDec(v) }, { k: 'med', t: 'Mediana de precio', num: true, fmt: fP }, { k: 'm2', t: 'Precio por m²', num: true, fmt: fP }, { k: 's1', t: 'Cajón más frecuente', fmt: (v, r) => r.caj },
    { k: 'a', t: 'Primera escritura', fmt: (v) => ymCorto(v) }, { k: 'b', t: 'Última escritura', fmt: (v) => ymCorto(v) }], trows, { orden: 'n', max: 15 });
  const aviso = rows.length < 30 ? '<div class="aviso">Solo hay ' + fN(rows.length) + ' escrituras verticales con estos filtros: las medianas son una referencia, no una estimación firme. Amplía el periodo para leer con más casos.</div>' : '';
  const top = trows.slice().sort((a, b) => b.n - a.n)[0];
  out.html = lectura(rows.length ? 'Se escrituraron ' + fN(k.n) + ' departamentos, ' + fPct(k.n / todo.length) + ' de las escrituras del periodo, con mediana de ' + fP(k.med) + '. ' + top.torre + ' es la torre con más escrituras: ' + fN(top.n) + '.' : 'No hay escrituras verticales en el periodo con estos filtros.') + aviso + tiles(tl) +
    '<div class="fila">' + card('', 'Tendencia|Escrituras verticales por año', 'Desde 2019.' + notaAnio, barras(ANIOS.map((y, i) => ({ t: String(y), v: porAnio[i] })), { lw: 44 }), 'n = ' + fN(hist.length) + ' escrituras verticales desde 2019.') +
    card('', 'Distribución|Dónde y en qué cajón', per.txt, '<span class="rotulo">Por macrozona</span>' + barras(ZN.map((z, i) => ({ t: z, v: zn[i] })).filter((x) => x.v > 0).sort((a, b) => b.v - a.v), { lw: 84 }) + '<span class="rotulo">Por cajón de precio</span>' + barras(R.seg1.map((s, i) => ({ t: s, v: cj[i] })).filter((x) => x.v > 0)), 'El cajón solo cuenta ventas que entran en precios.') + '</div>' +
    '<div class="fila">' + card('full', 'Detalle|Torres', 'Escrituras, ritmo y precios de cada torre o condominio', tt, 'Escrituras al mes: solo ventas de desarrollador, en torres con 3 o más en el periodo. El m² es de la unidad. Esta página siempre muestra vivienda vertical.') + '</div>';
  return out;
};

// ═════════════ 8. Vertical: oferta actual ═════════════
// Avance con fuentes públicas: lista de proyectos de Monitor, páginas de desarrolladores y portales, y el Registro Público.
// Las cifras del Registro se calculan aquí con los mismos datos del resto del tablero.
PAG['vertical-oferta'] = () => {
  const O = R.oferta, out = { titulo: 'Vertical: oferta actual', sub: 'Proyectos verticales en venta hoy · avance al ' + (O ? O.fecha : ''), moneda: false, filtros: false };
  if (!O) { out.html = vacio; return out; }
  const idx = new Map(COL.map((c, i) => [c[1], i])), reg = new Map();
  O.filas.forEach((f) => { if (f.reg && idx.has(f.reg)) reg.set(idx.get(f.reg), f); });
  // escrituras verticales por torre ligada, desde 2019
  const est = new Map(); let totV = 0;
  for (let r = 0; r < N; r++) {
    if (T[r] !== 1 || (COL[C[r]] && COL[C[r]][3])) continue;
    totV++;
    if (!reg.has(C[r])) continue;
    const o = est.get(C[r]) || { n: 0, dev: 0, u12: 0, a: 999, b: -1, pr: [], m2: [], anio: ANIOS.map(() => 0) };
    o.n++; if (M[r] === 0) o.dev++; if (YM[r] > LAST - 12) o.u12++; o.a = Math.min(o.a, YM[r]); o.b = Math.max(o.b, YM[r]); o.anio[Math.floor(YM[r] / 12)]++;
    if (X[r] & 1) o.pr.push(P[r] * FACT[YM[r]]); if (X[r] & 2) o.m2.push(P[r] * FACT[YM[r]] / A[r]);
    est.set(C[r], o);
  }
  const filas = O.filas.map((f) => { const o = f.reg && idx.has(f.reg) ? est.get(idx.get(f.reg)) : null; return Object.assign({}, f, { n: o ? o.n : (f.reg ? 0 : NaN), dev: o ? o.dev : NaN, u12: o ? o.u12 : NaN, a: o ? o.a : NaN, b: o ? o.b : NaN, med: o ? med(o.pr) : NaN, m2: o ? med(o.m2) : NaN, anio: o ? o.anio : null }); });
  const d1 = filas.filter((f) => f.d1), nD1 = d1.reduce((s, f) => s + (f.n || 0), 0);
  const cuenta = (k, v) => filas.filter((f) => f[k] === v).length;
  const SIT = ['En construcción o preventa', 'Terminado, con unidades en venta', 'Con escrituras recientes; venta actual por confirmar'];
  const nC = cuenta('sit', SIT[0]), nT = cuenta('sit', SIT[1]), nR = cuenta('sit', SIT[2]), nAlta = cuenta('conf', 'Alta');
  const cSinEsc = filas.filter((f) => f.sit === SIT[0] && !(f.n > 0)).length, sinU = filas.filter((f) => f.u == null).length, sinP = filas.filter((f) => !f.pr).length;
  QA.oferta = { proyectos: filas.length, excluidas: O.excluidas.length, construccion: nC, terminados: nT, registro: nR, alta: nAlta, totV: totV, d1: d1.map((f) => ({ p: f.p, reg: f.reg, n: f.n, dev: f.dev, u12: f.u12, med: f.med, m2: f.m2, a: f.a, b: f.b })), nD1: nD1 };
  const lnk = (f, t) => f.url ? '<a href="' + esc(f.url) + '" target="_blank" rel="noopener">' + esc(t || f.fu1 || f.fu) + '</a>' : esc(t || f.fu);
  const ym = (v) => nulo(v) ? '' : ymCorto(v), num = (v) => nulo(v) ? '' : fN(v);
  const tl = [
    { l: 'Proyectos identificados', v: fN(filas.length), n: 'Sin colonias, oficinas, renta ni duplicados' },
    { l: 'En construcción o preventa', v: fN(nC), n: fN(cSinEsc) + ' aún sin escrituras en el Registro' },
    { l: 'Terminados con unidades en venta', v: fN(nT), n: 'Más ' + fN(nR) + ' con escrituras recientes por confirmar' },
    { l: 'Con fuente oficial', v: fN(nAlta), n: fPct(nAlta / filas.length) + ': sitio o página del desarrollador' },
    { l: 'Distrito Uno', v: fPct(nD1 / totV), n: fN(nD1) + ' de ' + fN(totV) + ' escrituras verticales desde 2019' }
  ];
  // Distrito Uno: escrituras por torre y por año
  const dOrd = d1.slice().sort((x, y) => (y.n || 0) - (x.n || 0));
  const bD1 = dOrd.filter((f) => f.reg).map((f) => ({ t: f.p, v: f.n || 0, v2: f.dev || 0, txt: fN(f.n || 0) + ' · ' + fPct((f.n || 0) / nD1), tip: f.p + '\nEscrituras desde 2019: ' + fN(f.n || 0) + '\nPrimera venta (desarrollador): ' + fN(f.dev || 0) + '\nÚltimos 12 meses: ' + fN(f.u12 || 0) }));
  const conAnio = dOrd.filter((f) => f.anio);
  const porAnio = ANIOS.map((y, i) => conAnio.reduce((s, f) => s + f.anio[i], 0));
  const bAnio = ANIOS.map((y, i) => ({ t: String(y), v: porAnio[i], tip: String(y) + '\n' + conAnio.filter((f) => f.anio[i] > 0).map((f) => f.p + ': ' + fN(f.anio[i])).join('\n') }));
  const pico = (f) => { let k = -1, mx = 0; f.anio.forEach((v, i) => { if (v > mx) { mx = v; k = i; } }); return k < 0 ? '' : String(ANIOS[k]) + ' (' + fN(mx) + ')'; };
  const tD1 = tabla('t-d1', [{ k: 'p', t: 'Torre' }, { k: 'est', t: 'Lo que publica el desarrollador', w: '26%' }, { k: 'u', t: 'Unidades', num: true, fmt: (v, r) => nulo(v) ? 'No publicado' : fN(v) + (r.un ? ' *' : '') },
    { k: 'n', t: 'Escrituras desde 2019', num: true, cls: 's', fmt: num }, { k: 'dev', t: 'Primera venta', num: true, fmt: num }, { k: 'u12', t: 'Últimos 12 meses', num: true, fmt: num },
    { k: 'pk', t: 'Año con más escrituras', nosort: true, fmt: (v, r) => r.anio ? pico(r) : '' }, { k: 'med', t: 'Mediana de precio', num: true, fmt: (v) => nulo(v) ? '' : fP(v) }, { k: 'm2', t: 'Precio por m²', num: true, fmt: (v) => nulo(v) ? '' : fP(v) },
    { k: 'pr', t: 'Precio anunciado hoy', fmt: (v) => v || 'No publicado' }, { k: 'url', t: 'Fuente', nosort: true, html: (r) => lnk(r) }], d1, { orden: 'n' });
  const notasU = d1.filter((f) => f.un).map((f) => f.p + ': ' + f.un).join(' ');
  // tabla de la ciudad
  if (st.ofs == null) st.ofs = 'todos';
  const vis = st.ofs === 'todos' ? filas : filas.filter((f) => f.sit === SIT[+st.ofs]);
  const tC = tabla('t-oferta', [{ k: 'p', t: 'Proyecto', html: (r) => esc(r.p) + (r.d1 ? ' <span class="chip-d1">Distrito Uno</span>' : '') }, { k: 'z', t: 'Macrozona', cls: 'm' }, { k: 'sit', t: 'Situación', fmt: (v) => ['En construcción', 'Terminado', 'Por confirmar'][SIT.indexOf(v)] || v }, { k: 'des', t: 'Desarrollador' },
    { k: 'u', t: 'Unidades', num: true, fmt: (v) => nulo(v) ? '' : fN(v) }, { k: 'pr', t: 'Precio anunciado', fmt: (v, r) => (v || '') + (v && r.vig ? ' ‡' : '') }, { k: 'ent', t: 'Entrega' },
    { k: 'n', t: 'Escrituras desde 2019', num: true, cls: 's', fmt: (v, r) => nulo(v) ? '' : fN(v) + (r.pos ? ' †' : '') }, { k: 'u12', t: 'Últimos 12 meses', num: true, fmt: num },
    { k: 'conf', t: 'Confianza' }, { k: 'url', t: 'Fuente pública', nosort: true, html: (r) => lnk(r, r.fu) }], vis, { orden: 'n', max: 20 });
  const segS = segBtn('ofs', [['todos', 'Todos (' + filas.length + ')'], ['0', 'En construcción (' + nC + ')'], ['1', 'Terminados (' + nT + ')'], ['2', 'Por confirmar (' + nR + ')']]);
  const bConf = ['Alta', 'Media', 'Baja'].map((c) => ({ t: c, v: cuenta('conf', c), txt: fN(cuenta('conf', c)) + ' · ' + fPct(cuenta('conf', c) / filas.length) }));
  const lider = dOrd[0];
  out.html = lectura('Distrito Uno concentra ' + fPct(nD1 / totV) + ' de los departamentos escriturados en la ciudad desde 2019 (' + fN(nD1) + ' de ' + fN(totV) + '); ' + lider.p + ' es la torre con más escrituras. Hoy se identifican ' + fN(filas.length) + ' proyectos verticales: ' + fN(nC) + ' en construcción o preventa y ' + fN(nT) + ' terminados con unidades en venta.') +
    '<div class="aviso">Avance con fuentes públicas al ' + esc(O.fecha) + '. El inventario disponible, los precios de lista vigentes y el avance de obra se confirman en el levantamiento en campo, que está en curso.</div>' + tiles(tl) +
    '<div class="fila">' + card('', 'Distrito Uno|' + lider.p + ' y ' + dOrd[1].p + ' suman ' + fPct(((lider.n || 0) + (dOrd[1].n || 0)) / nD1) + ' de las escrituras de Distrito Uno', 'Escrituras verticales desde 2019, por torre', leyenda([{ c: '#0A95C7', t: 'Todas las escrituras' }, { c: '#89939E', t: 'Primera venta (desarrollador)' }]) + barras(bD1, { lw: 104 }), 'n = ' + fN(nD1) + ' escrituras. La diferencia entre las dos barras son reventas.') +
    card('', 'Distrito Uno|Distrito Uno escritura entre ' + fN(Math.min.apply(null, porAnio.slice(0, -1))) + ' y ' + fN(Math.max.apply(null, porAnio.slice(0, -1))) + ' departamentos al año', 'Escrituras verticales de Distrito Uno por año.' + notaAnio, barras(bAnio, { lw: 44 }) + verTabla(['Torre'].concat(ANIOS.map(String)), conAnio.map((f) => [f.p].concat(f.anio.map(fN)))), 'El año con más escrituras de cada torre está en la tabla de abajo. Pasa el cursor por cada año para ver qué torres escrituraron.') + '</div>' +
    '<div class="fila">' + card('full', 'Distrito Uno|Torre por torre: lo que se ve en el Registro y lo que se publica', 'Torres de CTU en Distrito Uno y su entorno', tD1, 'Precios del Registro: mediana de las escrituras desde 2019, en pesos de ' + ymTxt(LAST) + '; el m² es de la unidad. Precio anunciado: sitios y portales consultados el ' + O.fecha + '. ' + (notasU ? '* ' + notasU : '')) + '</div>' +
    '<div class="fila">' + card('full', 'Ciudad|Proyectos verticales en venta en Chihuahua capital', 'Filtra por situación; ordena con los encabezados', segS + tC, 'Escrituras: Registro Público, solo departamentos. Por confirmar: tiene escrituras recientes en el Registro, pero no está en la lista de proyectos en venta. ‡ Precio de un anuncio anterior; vigencia por confirmar. † El nombre en el Registro está por confirmar en campo. Una torre en preventa puede llevar meses vendiendo sin escrituras: la escritura llega con la entrega.') + '</div>' +
    '<div class="fila">' + card('', 'Cobertura|' + fN(nAlta) + ' de ' + fN(filas.length) + ' proyectos tienen fuente oficial', 'Confianza de la fuente pública de cada proyecto', barras(bConf, { lw: 60 }), 'Alta: sitio del proyecto o página del desarrollador. Media: portales, corredores, redes o notas. Baja: sin fuente localizada.') +
    card('', 'Siguiente paso|Lo que confirma el levantamiento en campo', 'Datos que hoy no son públicos', '<div class="txt"><ul><li>Unidades totales: faltan en ' + fN(sinU) + ' de ' + fN(filas.length) + ' proyectos.</li><li>Precio de lista vigente: falta en ' + fN(sinP) + ' proyectos; los demás son precios de anuncio.</li><li>Unidades disponibles hoy, avance de obra y fecha de entrega.</li><li>Ritmo de venta en preventa, que el Registro no ve hasta la entrega.</li></ul></div>' +
      '<details class="vt"><summary>Ver proyectos que no entran y por qué (' + O.excluidas.length + ')</summary><div class="tw"><table class="tabla-monitor"><thead><tr><th>Nombre</th><th>Motivo</th></tr></thead><tbody>' + O.excluidas.map((x) => '<tr><td>' + esc(x.p) + '</td><td>' + esc(x.m) + '</td></tr>').join('') + '</tbody></table></div></details>', '') + '</div>';
  out.fuente = '<p class="fuente">Fuentes: Registro Público de la Propiedad de Chihuahua, datos a ' + ymTxt(LAST) + '; sitios de proyectos y desarrolladores, y portales inmobiliarios, consultados el ' + esc(O.fecha) + '. Procesado por Monitor. Inteligencia de Mercado.</p>';
  return out;
};

// ═════════════ 9. Metodología y notas ═════════════
PAG.metodologia = () => {
  const m = R.meta, f = (k) => fN(m.motivos[Object.keys(m.motivos).find((x) => x.indexOf(k) === 0)] || 0);
  const anios = Object.keys(m.por_anio);
  return { titulo: 'Metodología y notas', sub: 'Cómo se construye el tablero y cómo leerlo', moneda: false, filtros: false, html:
    '<div class="fila">' + card('', 'Control|Cuadre contra el Registro Público', 'Enero a ' + MES[M1 - 1] + ' de ' + A1, '<div class="tw"><table class="tabla-monitor"><thead><tr><th></th><th class="n">Tablero</th><th class="n">Registro Público</th><th class="n">Diferencia</th></tr></thead><tbody>' +
      '<tr><td>Escrituras</td><td class="n">' + fN(m.base_2026[0]) + '</td><td class="n">' + fN(m.rpp_2026[0]) + '</td><td class="n s">' + fN(m.base_2026[0] - m.rpp_2026[0]) + '</td></tr>' +
      '<tr><td>Monto escriturado</td><td class="n">' + fP(m.base_2026[1]) + '</td><td class="n">' + fP(m.rpp_2026[1]) + '</td><td class="n s">' + fP(m.base_2026[1] - m.rpp_2026[1]) + '</td></tr></tbody></table></div>', 'El tablero se compara antes de quitar duplicados. Después de quitarlos quedan ' + fN(m.por_anio[String(A1)][0]) + ' escrituras en ' + A1 + '.') +
    card('', 'Control|Ventas por año', 'Después de quitar duplicados', '<div class="tw"><table class="tabla-monitor"><thead><tr><th>Año</th><th class="n">En el tablero</th><th class="n">Duplicados eliminados</th></tr></thead><tbody>' + anios.map((a) => '<tr><td>' + a + '</td><td class="n">' + fN(m.por_anio[a][0]) + '</td><td class="n">' + fN(m.por_anio[a][1]) + '</td></tr>').join('') +
      '<tr class="total"><td>Total</td><td class="n">' + fN(N) + '</td><td class="n s">' + fN(m.duplicados) + '</td></tr></tbody></table></div>', notaAnio.trim()) + '</div>' +
    '<section class="panel card full"><div class="txt">' +
    '<h3>Fuente y cobertura</h3><p>Inscripciones de compraventa de vivienda del Registro Público de la Propiedad, municipio de Chihuahua, de enero de 2019 a ' + ymTxt(LAST) + '. Cada fila es una escritura inscrita. El tablero muestra por omisión las ventas dentro de la mancha urbana; ' + fN(m.fuera_ciudad) + ' quedan fuera y se pueden incluir desde "Más filtros".</p>' +
    '<h3>La fecha es la de inscripción</h3><p>Entre la firma en notaría y la inscripción pasan ' + fN(m.desfase[0]) + ' meses en la mediana, y hasta ' + fN(m.desfase[1]) + ' en 9 de cada 10 casos. Lo que se inscribe en un mes refleja ventas de meses anteriores.</p>' +
    '<h3>Qué cuenta en el volumen y qué en los precios</h3><ul><li>Todas las escrituras cuentan en el volumen.</li><li>En medianas de precio, precio por m², plusvalía y oportunidad solo entran las ventas de desarrollador y de mercado abierto sin valores atípicos: ' + fN(m.entra_precios) + ' de ' + fN(N) + '.</li>' +
    '<li>Quedan fuera de precios: ' + f('INVE') + ' ventas de gobierno (vivienda social o regularización), ' + f('Adjudic') + ' adjudicaciones de instituciones financieras, ' + f('Precio menor') + ' con precio menor a 56 UMAs mensuales y ' + f('Precio por m²') + ' con precio por m² menor a un tercio o mayor a tres veces la mediana de su colonia.</li>' +
    '<li>Los lotes de más de 1,000 m² (' + fN(m.lote1000) + ') cuentan en precio, pero no en precio por m².</li><li>Se eliminaron ' + fN(m.duplicados) + ' escrituras duplicadas: misma clave catastral o mismo folio real, con el mismo precio, en 6 meses o menos.</li><li>Todo se calcula con medianas, no con promedios.</li></ul>' +
    '<h3>Tipo de mercado</h3><p>Desarrollador es primera venta de vivienda nueva. Mercado abierto es reventa. Gobierno y adjudicación se cuentan aparte. Los pequeños constructores se clasifican por cómo venden: desarrollador si venden concentrado en pocas colonias y no revenden.</p>' +
    '<h3>Cajones de precio</h3><p>El precio de cada venta se divide entre la UMA mensual vigente en su fecha, para que los cajones sean comparables entre años. Hay 6 cajones (clasificación CONAVI/SHF) y 13 subdivisiones.</p>' +
    '<h3>Pesos corrientes y pesos constantes</h3><p>Pesos corrientes es el precio que dice la escritura. Pesos constantes lleva ese precio a pesos de ' + ymTxt(LAST) + ' con el Índice Nacional de Precios al Consumidor del INEGI, para quitar el efecto de la inflación.</p>' +
    '<h3>Absorción y desarrollo activo</h3><p>Absorción son las escrituras de desarrollador por mes en cada fraccionamiento o torre, contadas entre su primera y su última escritura del periodo. Un desarrollo se considera activo con 3 o más escrituras de desarrollador en el periodo.</p>' +
    '<h3>Matriz de oportunidad</h3><p>El Registro no mide la oferta. Como aproximación, la matriz divide las escrituras de cada zona y cajón entre sus desarrollos activos. Muchas escrituras con pocos desarrollos, o reventa sin ningún desarrollo activo, señalan demanda que la vivienda nueva no está cubriendo.</p>' +
    '<h3>Plusvalía</h3><p>Mediana del precio por m² por año, en pesos corrientes y constantes. El m² es de lote en vivienda horizontal y de unidad en vertical, por eso se leen por separado. Solo se muestra con 10 ventas o más. El precio por m² también cambia cuando cambia el tipo de vivienda que se vende en una zona.</p>' +
    '<h3>Mapa</h3><p>Cada burbuja es un punto del catálogo de colonias. Las colonias que comparten ubicación forman una sola burbuja: ' + fN(m.gps_compartido) + ' escrituras están en puntos compartidos y ' + fN(m.sin_gps) + ' no tienen ubicación. El detalle por colonia está en las tablas.</p>' +
    '<h3>Vivienda vertical</h3><p>La muestra es pequeña: ' + fN(m.vertical) + ' escrituras desde 2019. Con pocos casos, las medianas son una referencia.</p>' +
    '<h3>Fuentes</h3><ul><li>Registro Público de la Propiedad de Chihuahua. Inscripciones de compraventa de vivienda, 2019 a ' + A1 + '.</li><li>INEGI. Índice Nacional de Precios al Consumidor, base segunda quincena de julio de 2018 = 100.</li><li>INEGI. Unidad de Medida y Actualización (UMA), valores de 2019 a ' + A1 + '.</li></ul></div></section>' };
};

// página oculta para el mantenimiento mensual
PAG.pendientes = () => ({ titulo: 'Pendientes por catalogar', sub: 'Uso interno de Monitor', moneda: false, filtros: false,
  html: '<section class="panel card full"><div class="txt"><p>Con el corte a ' + ymTxt(LAST) + ' no hay nombres de colonia ni razones sociales sin catalogar.</p><p>Al cargar un mes nuevo, aquí aparecen los nombres que no estén en el catálogo, con el número de escrituras de cada uno.</p></div></section>' });

// ───────────── arranque ─────────────
window.__qa = (pag, cambios) => { if (cambios) Object.assign(st, cambios); st.pag = pag; render(); return JSON.parse(JSON.stringify(QA, (k, v) => (typeof v === 'number' && !isFinite(v)) ? null : v)); };
document.getElementById('nav-lat').innerHTML = PAGS.map((p) => '<a class="nv" href="#' + p[0] + '" data-nav="' + p[0] + '">' + esc(p[1]) + '</a>').join('');
document.getElementById('nav-sup').innerHTML = PAGS.map((p) => '<a class="nv" href="#' + p[0] + '" data-nav="' + p[0] + '">' + esc(p[2]) + '</a>').join('');
document.getElementById('corte-lat').textContent = 'Datos a ' + ymTxt(LAST);
// En el sitio de Monitor el tablero vive dentro de la página con inicio de sesión: el botón le pide a esa página cerrar la sesión.
if (CFG.salir) {
  const salir = () => window.parent.postMessage({ tipo: 'monitor-salir' }, location.origin);
  [['.side .pie-lat', 'salir-lat'], ['.top .tb', 'salir-sup']].forEach(([donde, cls]) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = cls; b.textContent = 'Cerrar sesión'; b.addEventListener('click', salir);
    document.querySelector(donde).appendChild(b);
  });
}
ruta();
