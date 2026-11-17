/*
  app.js
  ---------------------------------------------------------------------------
  Lógica principal del Laboratorio Interactivo de Análisis Numérico.

  Responsabilidades de este archivo:
  1. Leer y validar los datos ingresados por el usuario.
  2. Ejecutar los métodos numéricos de cada módulo.
  3. Generar tablas, procedimientos matemáticos y resultados en HTML.
  4. Renderizar fórmulas LaTeX mediante MathJax.
  5. Dibujar gráficas en canvas sin librerías externas.
  6. Controlar la navegación modular tipo SPA sencilla usando data-view.
*/

// ---------------------------------------------------------------------------
// Utilidades generales de formato, lectura numérica y seguridad básica
// ---------------------------------------------------------------------------

/**
 * Formatea números para mostrarlos con una cantidad controlada de decimales.
 * También evita mostrar valores extremadamente pequeños como notación residual cercana a cero.
 */
const fmt = (n, d = 6) => {
  if (!Number.isFinite(n)) return 'NaN';
  const v = Math.abs(n) < 1e-12 ? 0 : n;
  return Number(v.toFixed(d)).toString();
};
// Atajo para mostrar números con 4 decimales cuando se necesita un resumen compacto.
const fmt4 = n => fmt(n, 4);
// Convierte entradas de texto a número, aceptando coma decimal además de punto decimal.
const num = (value) => Number(String(value).trim().replace(',', '.'));
// Escapa caracteres especiales para evitar que mensajes de error se interpreten como HTML.
const escapeHtml = (s) => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/**
 * Solicita a MathJax que vuelva a procesar las fórmulas matemáticas generadas dinámicamente.
 * Se llama después de inyectar HTML con expresiones LaTeX.
 */
function renderMath() {
  if (window.MathJax && MathJax.typesetPromise) {
    MathJax.typesetPromise().catch(() => {});
  }
}

/**
 * Lee una lista de puntos escritos como x;y o x,y, uno por línea.
 * @param {string} text - Texto del textarea con puntos.
 * @param {object} options - Permite exigir o no que los valores x sean únicos.
 * @returns {Array<{x:number,y:number}>} Puntos ordenados por x.
 */
function parsePoints(text, { requireUniqueX = true } = {}) {
  const points = [];
  const lines = String(text).split(/\n+/).map(l => l.trim()).filter(Boolean);
  for (const line of lines) {
    let parts;
    if (line.includes(';')) parts = line.split(';');
    else parts = line.split(',');
    if (parts.length < 2) throw new Error(`No pude leer la línea: ${line}. Usa formato x;y`);
    const x = num(parts[0]);
    const y = num(parts.slice(1).join('.'));
    if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error(`Dato inválido en: ${line}`);
    points.push({x, y});
  }
  if (points.length < 2) throw new Error('Ingresa mínimo 2 puntos.');
  if (requireUniqueX) {
    const seen = new Set();
    // Se verifica que no existan valores x repetidos cuando el método lo requiere.
    for (const p of points) {
      const key = String(p.x);
      if (seen.has(key)) throw new Error(`El valor x=${p.x} está repetido. En interpolación no puede repetirse.`);
      seen.add(key);
    }
  }
  return points.sort((a,b) => a.x - b.x);
}

// Suma dos polinomios representados como arreglos de coeficientes [a0, a1, a2, ...].
function polyAdd(a, b) {
  const n = Math.max(a.length, b.length);
  const out = Array(n).fill(0);
  for (let i = 0; i < n; i++) out[i] = (a[i] || 0) + (b[i] || 0);
  return out;
}
// Multiplica dos polinomios representados como arreglos de coeficientes.
function polyMul(a, b) {
  const out = Array(a.length + b.length - 1).fill(0);
  for (let i = 0; i < a.length; i++) for (let j = 0; j < b.length; j++) out[i+j] += a[i] * b[j];
  return out;
}
// Multiplica todos los coeficientes de un polinomio por un escalar.
function polyScale(a, s) { return a.map(v => v * s); }
// Evalúa un polinomio en un valor x.
function polyEval(coeff, x) { return coeff.reduce((sum, c, i) => sum + c * Math.pow(x, i), 0); }

/**
 * Convierte un término polinomial a formato LaTeX para mostrarlo en la interfaz.
 */
function termLatex(coef, power, first=false) {
  const abs = Math.abs(coef);
  if (abs < 1e-12) return '';
  const sign = coef < 0 ? (first ? '-' : ' - ') : (first ? '' : ' + ');
  let c = fmt(abs, 5);
  let variable = '';
  if (power === 1) variable = 'x';
  if (power > 1) variable = `x^{${power}}`;
  if (power > 0 && Math.abs(abs - 1) < 1e-12) c = '';
  return `${sign}${c}${variable}`;
}
// Convierte un polinomio completo a una cadena LaTeX legible.
function polyLatex(coeff) {
  const parts = [];
  for (let i = coeff.length - 1; i >= 0; i--) {
    const t = termLatex(coeff[i], i, parts.length === 0);
    if (t) parts.push(t);
  }
  return parts.join('') || '0';
}
// Une valores con signo para mostrar sumas y restas en sustituciones matemáticas.
function joinSignedValues(values, d = 6) {
  return values.map((value, i) => {
    const sign = value < 0 ? (i === 0 ? '-' : ' - ') : (i === 0 ? '' : ' + ');
    return `${sign}${fmt(Math.abs(value), d)}`;
  }).join('') || '0';
}
// Genera el factor (x - xi) en formato amigable, cuidando el signo cuando xi es negativo.
function lagrangeFactor(x) {
  return x < 0 ? `(x+${fmt(Math.abs(x),3)})` : `(x-${fmt(x,3)})`;
}

/**
 * Construye la base L_i(x) del método de Lagrange.
 * Retorna los coeficientes simplificados y el denominador usado en la base.
 */
function basisPolynomial(points, i) {
  let coeff = [1];
  let denom = 1;
  for (let j = 0; j < points.length; j++) {
    if (j === i) continue;
    coeff = polyMul(coeff, [-points[j].x, 1]);
    denom *= points[i].x - points[j].x;
  }
  return { coeff: polyScale(coeff, 1 / denom), denom };
}

// Genera una tabla HTML con los puntos ingresados por el usuario.
function pointsTable(points) {
  return `<div class="table-wrap"><table><thead><tr><th>i</th><th>xᵢ</th><th>yᵢ = f(xᵢ)</th></tr></thead><tbody>` +
    points.map((p,i) => `<tr><td>${i}</td><td>${fmt(p.x)}</td><td>${fmt(p.y)}</td></tr>`).join('') +
    `</tbody></table></div>`;
}

/**
 * Módulo 1: Interpolación de Lagrange.
 * Lee los puntos, construye las bases L_i(x), arma el polinomio final,
 * evalúa un valor opcional y dibuja la gráfica del polinomio.
 */
function runLagrange() {
  const out = document.getElementById('lagrangeOutput');
  try {
    // 1. Lectura y validación de los puntos ingresados por el usuario.
    const points = parsePoints(document.getElementById('lagrangePoints').value);
    const xEvalRaw = document.getElementById('lagrangeEval').value.trim();
    const xEval = xEvalRaw ? num(xEvalRaw) : null;
    // 2. Polinomio acumulador. Inicia en 0 y se le suman los aportes y_i L_i(x).
    let poly = [0];
    const rows = [];
    const steps = [];
    for (let i = 0; i < points.length; i++) {
      const b = basisPolynomial(points, i);
      poly = polyAdd(poly, polyScale(b.coeff, points[i].y));
      const factorsNum = points.map((p,j) => j === i ? '' : lagrangeFactor(p.x)).filter(Boolean).join('');
      const factorsDen = points.map((p,j) => j === i ? '' : `(${fmt(points[i].x,3)}-${fmt(p.x,3)})`).filter(Boolean).join('');
      rows.push(`<tr><td>L_${i}(x)</td><td>\\(\\frac{${factorsNum || '1'}}{${factorsDen || '1'}}\\)</td><td>\\(${polyLatex(b.coeff)}\\)</td><td>\\(${fmt(points[i].y)}L_${i}(x)\\)</td></tr>`);
      steps.push(`
        <div class="step-block">
          <h4>Base \\(L_${i}(x)\\)</h4>
          <p>Se omite el punto \\(x_${i}=${fmt(points[i].x)}\\) y se multiplican los factores con los demás puntos.</p>
          <p>\\[L_${i}(x)=\\prod_{j\\neq ${i}}\\frac{x-x_j}{x_${i}-x_j}=\\frac{${factorsNum || '1'}}{${factorsDen || '1'}}=${polyLatex(b.coeff)}\\]</p>
          <p>El aporte de este punto al polinomio es:</p>
          <p>\\[y_${i}L_${i}(x)=(${fmt(points[i].y)})(${polyLatex(b.coeff)})\\]</p>
        </div>
      `);
    }
    let evalHtml = '';
    let evalStep = '';
    if (xEval !== null && Number.isFinite(xEval)) {
      const val = polyEval(poly, xEval);
      const termValues = points.map((p,i) => {
        const bi = basisPolynomial(points, i);
        return fmt(p.y * polyEval(bi.coeff, xEval), 6);
      }).map(Number);
      const terms = joinSignedValues(termValues, 6);
      evalHtml = `<div class="output-card success"><h3>Evaluación</h3><p>Para \\(x=${fmt(xEval)}\\):</p><p>\\[P(${fmt(xEval)})=${terms}=${fmt(val,6)}\\]</p></div>`;
      evalStep = `
        <div class="step-block">
          <h4>Evaluación en \\(x=${fmt(xEval)}\\)</h4>
          <p>Se sustituye el valor solicitado en el polinomio final.</p>
          <p>\\[P(${fmt(xEval)})=${terms}=${fmt(val,6)}\\]</p>
        </div>
      `;
    }
    // 3. Renderizado del procedimiento y resultados dentro del panel de salida.
    out.innerHTML = `
      <div class="output-card"><h3>Datos ingresados</h3>${pointsTable(points)}</div>
      <div class="output-card"><h3>Fórmula</h3><p>\\[P_n(x)=\\sum_{i=0}^{n-1}y_iL_i(x),\\quad L_i(x)=\\prod_{j=0, j\\neq i}^{n-1}\\frac{x-x_j}{x_i-x_j}\\]</p></div>
      <div class="output-card"><h3>Procedimiento matemático paso a paso</h3><div class="step-list">${steps.join('')}<div class="step-block"><h4>Suma de aportes</h4><p>Después de construir todas las bases, se suman los aportes de cada punto.</p><p>\\[P(x)=\\sum y_iL_i(x)=${polyLatex(poly)}\\]</p></div>${evalStep}</div></div>
      <div class="output-card"><h3>Iteraciones internas / bases de Lagrange</h3><div class="table-wrap"><table><thead><tr><th>Base</th><th>Sustitución</th><th>Forma simplificada</th><th>Aporte</th></tr></thead><tbody>${rows.join('')}</tbody></table></div></div>
      <div class="output-card success"><h3>Polinomio final</h3><p>\\[P(x)=${polyLatex(poly)}\\]</p></div>
      ${evalHtml}
      <div class="output-card"><h3>Interpretación pedagógica</h3><p>El polinomio obtenido debe pasar exactamente por todos los puntos ingresados. Si cambias un punto, cambian las bases \\(L_i(x)\\) y por tanto el polinomio completo.</p></div>
    `;
    // 4. Gráfica del polinomio final junto con los puntos originales.
    plotFunction('lagrangeCanvas', points, x => polyEval(poly, x), 'Polinomio de Lagrange');
    renderMath();
  } catch (err) {
    out.innerHTML = `<div class="output-card error"><h3>Error</h3><p>${escapeHtml(err.message)}</p></div>`;
  }
}

/**
 * Módulo 2: Interpolación lineal.
 * Calcula la recta entre dos puntos, estima un valor intermedio y,
 * si se ingresa valor real, calcula el error porcentual.
 */
function runLinearInterpolation() {
  const out = document.getElementById('linearOutput');
  try {
    const x0 = num(document.getElementById('linX0').value), y0 = num(document.getElementById('linY0').value);
    const x1 = num(document.getElementById('linX1').value), y1 = num(document.getElementById('linY1').value);
    const x = num(document.getElementById('linX').value);
    const realRaw = document.getElementById('linReal').value.trim();
    const real = realRaw ? num(realRaw) : null;
    if (![x0,y0,x1,y1,x].every(Number.isFinite)) throw new Error('Revisa los datos numéricos.');
    if (realRaw && !Number.isFinite(real)) throw new Error('El valor real debe ser numérico si lo vas a usar.');
    if (x0 === x1) throw new Error('x0 y x1 no pueden ser iguales.');
    // Pendiente de la recta que une los dos puntos.
    const slope = (y1-y0)/(x1-x0);
    const y = y0 + slope*(x-x0);
    let errorHtml = '';
    let errorStep = '';
    if (real !== null && Number.isFinite(real) && real !== 0) {
      const er = Math.abs((real - y)/real) * 100;
      errorHtml = `<div class="kpi"><small>Error porcentual</small><strong>${fmt(er,4)}%</strong></div>`;
      errorStep = `
        <div class="step-block">
          <h4>Error porcentual</h4>
          <p>Como se ingresó un valor real, se compara contra la estimación obtenida.</p>
          <p>\\[E_p=\\left|\\frac{V_{real}-V_{aprox}}{V_{real}}\\right|100=\\left|\\frac{${fmt(real,7)}-${fmt(y,7)}}{${fmt(real,7)}}\\right|100=${fmt(er,4)}\\%\\]</p>
        </div>
      `;
    }
    else if (real !== null && real === 0) {
      errorStep = `
        <div class="step-block">
          <h4>Error porcentual</h4>
          <p>No se calcula error porcentual porque el valor real ingresado es 0 y produciría una división por cero.</p>
        </div>
      `;
    }
    out.innerHTML = `
      <div class="output-card"><h3>Sustitución de la fórmula</h3><p>\\[f(${fmt(x)})=${fmt(y0)}+\\frac{${fmt(y1)}-${fmt(y0)}}{${fmt(x1)}-${fmt(x0)}}(${fmt(x)}-${fmt(x0)})\\]</p></div>
      <div class="output-card"><h3>Procedimiento matemático paso a paso</h3><div class="step-list">
        <div class="step-block">
          <h4>Pendiente entre los dos puntos</h4>
          <p>Primero se calcula el cambio promedio entre \\((x_0,f(x_0))\\) y \\((x_1,f(x_1))\\).</p>
          <p>\\[m=\\frac{f(x_1)-f(x_0)}{x_1-x_0}=\\frac{${fmt(y1,7)}-${fmt(y0,7)}}{${fmt(x1,7)}-${fmt(x0,7)}}=${fmt(slope,7)}\\]</p>
        </div>
        <div class="step-block">
          <h4>Sustitución del valor a estimar</h4>
          <p>Con la pendiente, se evalúa la recta que une los dos puntos.</p>
          <p>\\[f(${fmt(x,7)})=f(x_0)+m(x-x_0)=${fmt(y0,7)}+(${fmt(slope,7)})(${fmt(x,7)}-${fmt(x0,7)})=${fmt(y,7)}\\]</p>
        </div>
        ${errorStep}
      </div></div>
      <div class="output-card success"><h3>Resultado</h3><div class="kpi-grid"><div class="kpi"><small>Valor estimado</small><strong>${fmt(y,7)}</strong></div><div class="kpi"><small>Pendiente local</small><strong>${fmt(slope,7)}</strong></div>${errorHtml}</div></div>
      <div class="output-card"><h3>Interpretación</h3><p>La interpolación lineal aproxima el comportamiento de la función con una recta entre dos puntos. Mientras más cerca estén los puntos del valor estimado, normalmente menor será el error.</p></div>
    `;
    plotFunction('linearCanvas', [{x:x0,y:y0},{x:x1,y:y1},{x:x,y:y}], xx => y0 + ((y1-y0)/(x1-x0))*(xx-x0), 'Interpolación lineal');
    renderMath();
  } catch (err) { out.innerHTML = `<div class="output-card error"><h3>Error</h3><p>${escapeHtml(err.message)}</p></div>`; }
}

/**
 * Convierte una expresión matemática escrita por el usuario en una función evaluable de x.
 * Se habilitan funciones comunes de Math y se bloquean caracteres no permitidos.
 */
function makeFunction(expr) {
  const raw = String(expr).trim();
  if (!raw) throw new Error('Ingresa una función para evaluar.');
  const safe = raw.replace(/,/g, '.').replace(/\^/g, '**');
  const allowed = new Set(['x', 'e', 'pi', 'exp', 'sin', 'cos', 'tan', 'log', 'ln', 'sqrt', 'abs', 'asin', 'acos', 'atan']);
  const identifiers = safe.match(/[A-Za-z_]\w*/g) || [];
  if (/[^0-9A-Za-z_+\-*/().\s]/.test(safe) || identifiers.some(id => !allowed.has(id))) {
    throw new Error('La función contiene símbolos no permitidos. Usa x, números, operadores y funciones matemáticas básicas.');
  }
  try {
    return new Function('x', `
      const e = Math.E, pi = Math.PI;
      const exp = Math.exp, sin = Math.sin, cos = Math.cos, tan = Math.tan;
      const log = Math.log, ln = Math.log, sqrt = Math.sqrt, abs = Math.abs;
      const asin = Math.asin, acos = Math.acos, atan = Math.atan;
      return (${safe});
    `);
  } catch {
    throw new Error('La función no tiene una sintaxis válida.');
  }
}

/**
 * Módulo 3: Método de falsa posición.
 * Busca una raíz dentro de un intervalo [a,b] siempre que exista cambio de signo.
 * Muestra cada iteración, actualización del intervalo y error aproximado.
 */
function runFalsePosition() {
  const out = document.getElementById('falseOutput');
  try {
    const expr = document.getElementById('falseFunc').value;
    const f = makeFunction(expr);
    let a = num(document.getElementById('falseA').value), b = num(document.getElementById('falseB').value);
    const maxIter = Number.parseInt(document.getElementById('falseIter').value || '20', 10);
    const tolRaw = document.getElementById('falseTol').value.trim();
    const tol = tolRaw ? num(tolRaw) : null;
    if (![a,b].every(Number.isFinite)) throw new Error('El intervalo debe ser numérico.');
    if (!Number.isInteger(maxIter) || maxIter < 1) throw new Error('Las iteraciones máximas deben ser un entero mayor o igual a 1.');
    if (tol !== null && (!Number.isFinite(tol) || tol <= 0)) throw new Error('El error máximo debe ser un número positivo.');
    let fa = f(a), fb = f(b);
    if (![fa,fb].every(Number.isFinite)) throw new Error('La función no se pudo evaluar en el intervalo.');
    let verify = `<p>\\[f(${fmt(a)})=${fmt(fa,6)},\\quad f(${fmt(b)})=${fmt(fb,6)}\\]</p>`;
    if (fa * fb > 0) throw new Error(`No hay cambio de signo: f(a)·f(b) = ${fmt(fa*fb,6)}. El método requiere f(a)f(b)<0.`);
    const rows = [];
    const steps = [];
    let xr = null, xrPrev = null, error = null, stopReason = '';
    // Bucle de iteraciones: en cada ciclo se calcula xr y se actualiza el intervalo.
    for (let k = 1; k <= maxIter; k++) {
      const oldA = a, oldB = b;
      fa = f(oldA); fb = f(oldB);
      const denominator = fa - fb;
      if (Math.abs(denominator) < 1e-12) throw new Error('No se puede calcular xr porque f(a)-f(b) es demasiado cercano a cero.');
      xr = oldB - (fb * (oldA - oldB)) / denominator;
      const fxr = f(xr);
      error = xrPrev === null ? null : Math.abs((xr - xrPrev) / xr) * 100;
      const leftProduct = fa * fxr;
      const rightProduct = fb * fxr;
      let decision;
      let signStep;
      if (Math.abs(fxr) < 1e-12) {
        decision = `raíz exacta en ${fmt(xr,6)}`;
        signStep = `<p>Como \\(f(x_r)=${fmt(fxr,6)}\\), el método encuentra una raíz exacta o prácticamente exacta.</p>`;
        stopReason = 'Se encontró raíz exacta o aproximación con f(xr)=0.';
      }
      else if (leftProduct < 0) {
        decision = `[${fmt(oldA,4)}, ${fmt(xr,4)}]`;
        signStep = `<p>\\[f(a)f(x_r)=(${fmt(fa,6)})(${fmt(fxr,6)})=${fmt(leftProduct,6)}\\lt 0\\]</p><p>La raíz queda entre \\(a\\) y \\(x_r\\), entonces el nuevo intervalo es \\([${fmt(oldA,6)},${fmt(xr,6)}]\\).</p>`;
        b = xr;
      }
      else if (rightProduct < 0) {
        decision = `[${fmt(xr,4)}, ${fmt(oldB,4)}]`;
        signStep = `<p>\\[f(b)f(x_r)=(${fmt(fb,6)})(${fmt(fxr,6)})=${fmt(rightProduct,6)}\\lt 0\\]</p><p>La raíz queda entre \\(x_r\\) y \\(b\\), entonces el nuevo intervalo es \\([${fmt(xr,6)},${fmt(oldB,6)}]\\).</p>`;
        a = xr;
      }
      else {
        decision = 'no se pudo actualizar el intervalo';
        signStep = '<p>No se encontró un cambio de signo claro después de evaluar \\(x_r\\). Revisa la función o el intervalo.</p>';
        stopReason = 'El método no pudo actualizar el intervalo con la información disponible.';
      }
      const errorStep = error === null
        ? '<p>En la primera iteración no se calcula error aproximado porque todavía no existe un \\(x_r\\) anterior.</p>'
        : `<p>\\[\\varepsilon_a=\\left|\\frac{x_r^{(${k})}-x_r^{(${k-1})}}{x_r^{(${k})}}\\right|100=\\left|\\frac{${fmt(xr,8)}-${fmt(xrPrev,8)}}{${fmt(xr,8)}}\\right|100=${fmt(error,4)}\\%\\]</p>`;
      steps.push(`
        <div class="step-block">
          <h4>Iteración ${k}</h4>
          <p>Con \\(a=${fmt(oldA,6)}\\), \\(b=${fmt(oldB,6)}\\), \\(f(a)=${fmt(fa,6)}\\) y \\(f(b)=${fmt(fb,6)}\\):</p>
          <p>\\[x_r=b-\\frac{f(b)(a-b)}{f(a)-f(b)}=${fmt(oldB,6)}-\\frac{(${fmt(fb,6)})(${fmt(oldA,6)}-${fmt(oldB,6)})}{${fmt(fa,6)}-${fmt(fb,6)}}=${fmt(xr,8)}\\]</p>
          <p>\\[f(x_r)=f(${fmt(xr,8)})=${fmt(fxr,8)}\\]</p>
          ${signStep}
          ${errorStep}
        </div>
      `);
      rows.push(`<tr><td>${k}</td><td>${fmt(oldA,6)}</td><td>${fmt(oldB,6)}</td><td>${fmt(fa,6)}</td><td>${fmt(fb,6)}</td><td>${fmt(xr,6)}</td><td>${fmt(fxr,6)}</td><td>${error === null ? '—' : fmt(error,4)+'%'}</td><td>${decision}</td></tr>`);
      if (stopReason) break;
      if (tol !== null && error !== null && error < tol) { stopReason = `Se detuvo porque el error ${fmt(error,4)}% es menor que ${fmt(tol,4)}%.`; break; }
      xrPrev = xr;
    }
    if (!stopReason) stopReason = `Se completaron ${rows.length} iteraciones.`;
    out.innerHTML = `
      <div class="output-card"><h3>Verificación inicial</h3>${verify}<p>El intervalo es válido porque hay cambio de signo o una raíz en uno de sus extremos.</p></div>
      <div class="output-card"><h3>Fórmula usada</h3><p>\\[x_r=b-\\frac{f(b)(a-b)}{f(a)-f(b)}\\]</p></div>
      <div class="output-card"><h3>Procedimiento matemático paso a paso</h3><div class="step-list">${steps.join('')}</div></div>
      <div class="output-card"><h3>Ciclos del algoritmo</h3><div class="table-wrap"><table><thead><tr><th>k</th><th>a</th><th>b</th><th>f(a)</th><th>f(b)</th><th>xᵣ</th><th>f(xᵣ)</th><th>Error</th><th>Nuevo intervalo</th></tr></thead><tbody>${rows.join('')}</tbody></table></div></div>
      <div class="output-card success"><h3>Resultado final</h3><p>\\[x\\approx ${fmt(xr,8)}\\]</p><p>${stopReason}</p></div>
    `;
    const aa = num(document.getElementById('falseA').value), bb = num(document.getElementById('falseB').value);
    plotFunction('falseCanvas', [{x:xr,y:0},{x:aa,y:f(aa)},{x:bb,y:f(bb)}], f, `f(x)=${expr}`);
    renderMath();
  } catch (err) { out.innerHTML = `<div class="output-card error"><h3>Error</h3><p>${escapeHtml(err.message)}</p></div>`; }
}

// Construye la matriz de Vandermonde para ajuste polinomial por mínimos cuadrados.
function vandermonde(points, degree) {
  return points.map(p => Array.from({length: degree+1}, (_,j) => Math.pow(p.x, j)));
}
// Calcula la transpuesta de una matriz.
function transpose(A) { return A[0].map((_, i) => A.map(row => row[i])); }
// Multiplica dos matrices.
function matMul(A, B) {
  return A.map(row => B[0].map((_, j) => row.reduce((s, v, k) => s + v * B[k][j], 0)));
}
// Multiplica una matriz por un vector.
function matVecMul(A, v) { return A.map(row => row.reduce((s, val, i) => s + val * v[i], 0)); }
/**
 * Resuelve un sistema lineal Ax=b usando eliminación gaussiana con pivoteo parcial.
 * Se usa para resolver el sistema normal del método de mínimos cuadrados.
 */
function solveLinearSystem(A, b) {
  const n = A.length;
  const M = A.map((row,i) => [...row, b[i]]);
  for (let i = 0; i < n; i++) {
    let max = i;
    for (let k = i+1; k < n; k++) if (Math.abs(M[k][i]) > Math.abs(M[max][i])) max = k;
    [M[i], M[max]] = [M[max], M[i]];
    if (Math.abs(M[i][i]) < 1e-12) throw new Error('El sistema no tiene solución única. Revisa datos o grado.');
    const pivot = M[i][i];
    for (let j = i; j <= n; j++) M[i][j] /= pivot;
    for (let k = 0; k < n; k++) {
      if (k === i) continue;
      const factor = M[k][i];
      for (let j = i; j <= n; j++) M[k][j] -= factor * M[i][j];
    }
  }
  return M.map(row => row[n]);
}
// Convierte una matriz a texto monoespaciado para mostrarla dentro de bloques <pre>-like.
function matrixText(A) { return A.map(r => '[ ' + r.map(v => fmt(v,5).padStart(10, ' ')).join('  ') + ' ]').join('\n'); }
// Convierte una matriz a formato LaTeX bmatrix.
function matrixLatex(A, d = 5) {
  return `\\begin{bmatrix}${A.map(row => row.map(v => fmt(v,d)).join(' & ')).join(' \\\\ ')}\\end{bmatrix}`;
}
// Convierte un vector a formato LaTeX bmatrix.
function vectorLatex(v, d = 5) {
  return `\\begin{bmatrix}${v.map(value => fmt(value,d)).join(' \\\\ ')}\\end{bmatrix}`;
}

/**
 * Módulo 4: Aproximación polinomial por mínimos cuadrados.
 * Construye A, A^T, A^TA y A^Ty; resuelve coeficientes y calcula residuos.
 */
function runLeastSquares() {
  const out = document.getElementById('leastOutput');
  try {
    // 1. Lectura y validación de los puntos ingresados por el usuario.
    const points = parsePoints(document.getElementById('leastPoints').value, { requireUniqueX: false });
    const degree = parseInt(document.getElementById('leastDegree').value, 10);
    if (!Number.isInteger(degree) || degree < 1) throw new Error('El grado debe ser un entero mayor o igual a 1.');
    if (degree >= points.length) throw new Error('Para mínimos cuadrados usa grado menor que la cantidad de puntos.');
    // Construcción de la matriz del modelo polinomial.
    const A = vandermonde(points, degree);
    const y = points.map(p => p.y);
    const At = transpose(A);
    const AtA = matMul(At, A);
    const Aty = matVecMul(At, y);
    // Solución de coeficientes del polinomio ajustado.
    const c = solveLinearSystem(AtA, Aty);
    const sse = points.reduce((s,p) => s + Math.pow(p.y - polyEval(c, p.x), 2), 0);
    const residualTerms = points.map(p => `(${fmt(p.y,5)}-${fmt(polyEval(c,p.x),5)})^2`).join(' + ');
    const rows = points.map((p,i) => `<tr><td>${i+1}</td><td>${fmt(p.x)}</td><td>${fmt(p.y)}</td><td>${fmt(polyEval(c,p.x),6)}</td><td>${fmt(p.y-polyEval(c,p.x),6)}</td><td>${fmt(Math.pow(p.y-polyEval(c,p.x),2),6)}</td></tr>`).join('');
    out.innerHTML = `
      <div class="output-card"><h3>Datos</h3>${pointsTable(points)}</div>
      <div class="output-card"><h3>Procedimiento matemático paso a paso</h3><div class="step-list">
        <div class="step-block">
          <h4>Construcción de la matriz del modelo</h4>
          <p>Para un polinomio de grado ${degree}, cada fila usa las potencias \\(1,x,x^2,\\ldots,x^m\\).</p>
          <p>\\[A=${matrixLatex(A)},\\quad y=${vectorLatex(y)}\\]</p>
        </div>
        <div class="step-block">
          <h4>Sistema normal</h4>
          <p>El ajuste se obtiene resolviendo \\(A^TAc=A^Ty\\), donde \\(c\\) contiene los coeficientes del polinomio.</p>
          <p>\\[A^TA=${matrixLatex(AtA)},\\quad A^Ty=${vectorLatex(Aty)}\\]</p>
        </div>
        <div class="step-block">
          <h4>Solución de coeficientes</h4>
          <p>Al resolver el sistema normal se obtiene:</p>
          <p>\\[c=${vectorLatex(c)},\\quad p(x)=${polyLatex(c)}\\]</p>
        </div>
        <div class="step-block">
          <h4>Cálculo del error cuadrático global</h4>
          <p>Se evalúa el polinomio en cada dato y se suman los residuos al cuadrado.</p>
          <p>\\[SSE=\\sum_{i=1}^{n}(y_i-p(x_i))^2=${residualTerms}=${fmt(sse,6)}\\]</p>
        </div>
      </div></div>
      <div class="output-card"><h3>Matriz de Vandermonde \\(A\\)</h3><div class="matrix">${matrixText(A)}</div></div>
      <div class="output-card"><h3>Sistema normal</h3><p>\\[A^TAc=A^Ty\\]</p><div class="matrix">AᵀA =\n${matrixText(AtA)}\n\nAᵀy = [ ${Aty.map(v => fmt(v,5)).join(', ')} ]</div></div>
      <div class="output-card success"><h3>Polinomio ajustado</h3><p>\\[p(x)=${polyLatex(c)}\\]</p><div class="kpi-grid"><div class="kpi"><small>Error cuadrático global</small><strong>${fmt(sse,6)}</strong></div><div class="kpi"><small>Grado</small><strong>${degree}</strong></div><div class="kpi"><small>Puntos</small><strong>${points.length}</strong></div></div></div>
      <div class="output-card"><h3>Tabla de residuos</h3><div class="table-wrap"><table><thead><tr><th>#</th><th>x</th><th>y real</th><th>p(x)</th><th>residuo</th><th>residuo²</th></tr></thead><tbody>${rows}</tbody></table></div></div>
      <div class="output-card"><h3>Interpretación</h3><p>El método no busca pasar exactamente por todos los puntos; busca el polinomio que minimiza la suma de los residuos al cuadrado.</p></div>
    `;
    plotFunction('leastCanvas', points, x => polyEval(c, x), 'Mínimos cuadrados');
    renderMath();
  } catch (err) { out.innerHTML = `<div class="output-card error"><h3>Error</h3><p>${escapeHtml(err.message)}</p></div>`; }
}

/**
 * Módulo 5: Regresión lineal.
 * Calcula sumatorias, pendiente, intercepto, coeficiente de correlación r y R².
 */
function runRegression() {
  const out = document.getElementById('regOutput');
  try {
    // 1. Lectura y validación de los puntos ingresados por el usuario.
    const points = parsePoints(document.getElementById('regPoints').value, { requireUniqueX: false });
    const n = points.length;
    // Cálculo de sumatorias necesarias para la regresión lineal.
    const sx = points.reduce((s,p)=>s+p.x,0), sy = points.reduce((s,p)=>s+p.y,0);
    const sxy = points.reduce((s,p)=>s+p.x*p.y,0), sx2 = points.reduce((s,p)=>s+p.x*p.x,0), sy2 = points.reduce((s,p)=>s+p.y*p.y,0);
    const denom = n*sx2 - sx*sx;
    if (Math.abs(denom) < 1e-12) throw new Error('No se puede calcular la recta porque los x no varían.');
    const a = (n*sxy - sx*sy) / denom;
    const b = (sy - a*sx) / n;
    const rDenom = Math.sqrt(Math.max(0, (n*sx2 - sx*sx)*(n*sy2 - sy*sy)));
    const r = rDenom < 1e-12 ? 0 : (n*sxy - sx*sy) / rDenom;
    const r2 = r*r;
    const correlationNote = rDenom < 1e-12 ? '<p>Como no hay variación suficiente en los datos, la correlación se muestra como 0 para evitar una división por cero.</p>' : '';
    const correlationStep = rDenom < 1e-12
      ? '<p>No se calcula la sustitución de \\(r\\) porque el denominador de correlación es 0 o demasiado cercano a 0.</p>'
      : `<p>\\[r=\\frac{n\\sum x_iy_i-\\sum x_i\\sum y_i}{\\sqrt{\\left(n\\sum x_i^2-(\\sum x_i)^2\\right)\\left(n\\sum y_i^2-(\\sum y_i)^2\\right)}}=\\frac{${n}(${fmt(sxy)})-${fmt(sx)}(${fmt(sy)})}{\\sqrt{(${n}(${fmt(sx2)})-${fmt(sx)}^2)(${n}(${fmt(sy2)})-${fmt(sy)}^2)}}=${fmt(r,6)}\\]</p>`;
    const rows = points.map((p,i) => `<tr><td>${i+1}</td><td>${fmt(p.x)}</td><td>${fmt(p.y)}</td><td>${fmt(p.x*p.y)}</td><td>${fmt(p.x*p.x)}</td><td>${fmt(p.y*p.y)}</td><td>${fmt(a*p.x+b,6)}</td></tr>`).join('');
    out.innerHTML = `
      <div class="output-card"><h3>Tabla de sumatorias</h3><div class="table-wrap"><table><thead><tr><th>#</th><th>xᵢ</th><th>yᵢ</th><th>xᵢyᵢ</th><th>xᵢ²</th><th>yᵢ²</th><th>ŷ</th></tr></thead><tbody>${rows}<tr><td>Σ</td><td>${fmt(sx)}</td><td>${fmt(sy)}</td><td>${fmt(sxy)}</td><td>${fmt(sx2)}</td><td>${fmt(sy2)}</td><td>—</td></tr></tbody></table></div></div>
      <div class="output-card"><h3>Procedimiento matemático paso a paso</h3><div class="step-list">
        <div class="step-block">
          <h4>Sumatorias necesarias</h4>
          <p>Se calculan los acumulados que alimentan las fórmulas de pendiente, intercepto y correlación.</p>
          <p>\\[n=${n},\\quad \\sum x_i=${fmt(sx)},\\quad \\sum y_i=${fmt(sy)},\\quad \\sum x_iy_i=${fmt(sxy)},\\quad \\sum x_i^2=${fmt(sx2)},\\quad \\sum y_i^2=${fmt(sy2)}\\]</p>
        </div>
        <div class="step-block">
          <h4>Pendiente de la recta</h4>
          <p>La pendiente indica el cambio esperado en \\(y\\) por cada unidad de \\(x\\).</p>
          <p>\\[a=\\frac{n\\sum x_iy_i-\\sum x_i\\sum y_i}{n\\sum x_i^2-(\\sum x_i)^2}=\\frac{${n}(${fmt(sxy)})-${fmt(sx)}(${fmt(sy)})}{${n}(${fmt(sx2)})-${fmt(sx)}^2}=${fmt(a,6)}\\]</p>
        </div>
        <div class="step-block">
          <h4>Intercepto</h4>
          <p>El intercepto ubica la recta cuando \\(x=0\\).</p>
          <p>\\[b=\\frac{\\sum y_i-a\\sum x_i}{n}=\\frac{${fmt(sy)}-(${fmt(a,6)})(${fmt(sx)})}{${n}}=${fmt(b,6)}\\]</p>
        </div>
        <div class="step-block">
          <h4>Correlación y determinación</h4>
          ${correlationStep}
          <p>\\[R^2=r^2=(${fmt(r,6)})^2=${fmt(r2,6)}\\quad \\Rightarrow \\quad ${fmt(r2*100,2)}\\%\\]</p>
        </div>
      </div></div>
      <div class="output-card"><h3>Sustitución</h3><p>\\[a=\\frac{n\\sum x_iy_i-\\sum x_i\\sum y_i}{n\\sum x_i^2-(\\sum x_i)^2}=\\frac{${n}(${fmt(sxy)})-${fmt(sx)}(${fmt(sy)})}{${n}(${fmt(sx2)})-(${fmt(sx)})^2}=${fmt(a,6)}\\]</p><p>\\[b=\\frac{\\sum y_i-a\\sum x_i}{n}=\\frac{${fmt(sy)}-${fmt(a,6)}(${fmt(sx)})}{${n}}=${fmt(b,6)}\\]</p></div>
      <div class="output-card success"><h3>Modelo final</h3><p>\\[\\hat y=${fmt(a,6)}x${b < 0 ? '-' : '+'}${fmt(Math.abs(b),6)}\\]</p><div class="kpi-grid"><div class="kpi"><small>Coeficiente r</small><strong>${fmt(r,6)}</strong></div><div class="kpi"><small>Determinación R²</small><strong>${fmt(r2*100,2)}%</strong></div><div class="kpi"><small>Pendiente</small><strong>${fmt(a,6)}</strong></div></div>${correlationNote}</div>
      <div class="output-card"><h3>Interpretación</h3><p>La pendiente indica cuánto cambia \\(y\\) por cada unidad adicional de \\(x\\). El valor \\(R^2\\) expresa qué porcentaje de la variabilidad de \\(y\\) queda explicado por la recta.</p></div>
    `;
    plotFunction('regCanvas', points, x => a*x+b, 'Regresión lineal');
    renderMath();
  } catch (err) { out.innerHTML = `<div class="output-card error"><h3>Error</h3><p>${escapeHtml(err.message)}</p></div>`; }
}

/**
 * Carga datos de ejemplo en el módulo correspondiente para facilitar demostraciones rápidas.
 */
function loadExample(name) {
  if (name === 'lagrange-libro') {
    document.getElementById('lagrangePoints').value = '1;800\n3;2310\n5;3090\n7;3940\n13;4755';
    document.getElementById('lagrangeEval').value = '10';
    runLagrange();
  }
  if (name === 'linear-log') {
    document.getElementById('linX0').value = '9';
    document.getElementById('linY0').value = '0.9542425';
    document.getElementById('linX1').value = '11';
    document.getElementById('linY1').value = '1.0413927';
    document.getElementById('linX').value = '10';
    document.getElementById('linReal').value = '1';
    runLinearInterpolation();
  }
  if (name === 'false-exp') {
    document.getElementById('falseFunc').value = 'exp(-x) - x';
    document.getElementById('falseA').value = '0';
    document.getElementById('falseB').value = '1';
    document.getElementById('falseIter').value = '20';
    document.getElementById('falseTol').value = '5';
    runFalsePosition();
  }
  if (name === 'least-quadratic') {
    document.getElementById('leastPoints').value = '0;1\n1;2.2\n2;5.1\n3;9.8\n4;17.1';
    document.getElementById('leastDegree').value = '2';
    runLeastSquares();
  }
  if (name === 'reg-growth') {
    document.getElementById('regPoints').value = '1;2.1\n2;4.2\n3;5.7\n4;8.5\n5;10.1';
    runRegression();
  }
}

/**
 * Dibuja una función y sus puntos asociados en un canvas HTML.
 * No usa librerías externas: calcula escalas, grilla, ejes y curva manualmente.
 */
function plotFunction(canvasId, points, fn, title) {
  // Se obtiene el canvas donde se dibujará la gráfica del módulo actual.
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle = '#fff'; ctx.fillRect(0,0,W,H);
  const xs = points.map(p=>p.x);
  let minX = Math.min(...xs), maxX = Math.max(...xs);
  const padX = Math.max(1, (maxX-minX)*0.2 || 1);
  minX -= padX; maxX += padX;
  // Se toman muestras de la función para trazar una curva suave.
  const samples = [];
  for (let i=0; i<=220; i++) {
    const x = minX + (maxX-minX)*i/220;
    let y = fn(x);
    if (Number.isFinite(y)) samples.push({x,y});
  }
  const ys = [...points.map(p=>p.y), ...samples.map(p=>p.y), 0].filter(Number.isFinite);
  let minY = Math.min(...ys), maxY = Math.max(...ys);
  const padY = Math.max(1, (maxY-minY)*0.18 || 1);
  minY -= padY; maxY += padY;
  const left=54, right=20, top=38, bottom=42;
  const sx = x => left + (x-minX)/(maxX-minX)*(W-left-right);
  const sy = y => H-bottom - (y-minY)/(maxY-minY)*(H-top-bottom);
  ctx.strokeStyle = '#e4e7ec'; ctx.lineWidth = 1;
  // Dibujo de la cuadrícula de fondo.
  for (let i=0; i<=10; i++) {
    const x = left + i*(W-left-right)/10;
    ctx.beginPath(); ctx.moveTo(x,top); ctx.lineTo(x,H-bottom); ctx.stroke();
    const y = top + i*(H-top-bottom)/10;
    ctx.beginPath(); ctx.moveTo(left,y); ctx.lineTo(W-right,y); ctx.stroke();
  }
  ctx.strokeStyle = '#98a2b3'; ctx.lineWidth = 1.3;
  if (minY <= 0 && maxY >= 0) { ctx.beginPath(); ctx.moveTo(left,sy(0)); ctx.lineTo(W-right,sy(0)); ctx.stroke(); }
  if (minX <= 0 && maxX >= 0) { ctx.beginPath(); ctx.moveTo(sx(0),top); ctx.lineTo(sx(0),H-bottom); ctx.stroke(); }
  ctx.strokeStyle = '#5b4bdb'; ctx.lineWidth = 3;
  ctx.beginPath();
  // Dibujo de la curva calculada.
  samples.forEach((p,i) => { if (i === 0) ctx.moveTo(sx(p.x), sy(p.y)); else ctx.lineTo(sx(p.x), sy(p.y)); });
  ctx.stroke();
  // Dibujo de los puntos originales ingresados por el usuario.
  for (const p of points) {
    ctx.beginPath(); ctx.arc(sx(p.x), sy(p.y), 5.5, 0, Math.PI*2);
    ctx.fillStyle = '#18a999'; ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
  }
  ctx.fillStyle = '#172033'; ctx.font = '700 16px system-ui, sans-serif'; ctx.fillText(title, left, 24);
  ctx.fillStyle = '#667085'; ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(`x: ${fmt(minX,2)} a ${fmt(maxX,2)}`, left, H-14);
  ctx.fillText(`y: ${fmt(minY,2)} a ${fmt(maxY,2)}`, W-160, H-14);
}

// Relación entre identificadores de vista y funciones que deben ejecutarse al abrir un módulo.
const moduleRunners = {
  lagrange: runLagrange,
  lineal: runLinearInterpolation,
  falsa: runFalsePosition,
  minimos: runLeastSquares,
  regresion: runRegression,
  edo: runODE,
  convergencia: runConvergence,
  sistemas: runSystemODE
};

// Actualiza visualmente los botones de navegación para indicar qué vista está activa.
function setActiveNavigation(viewId) {
  document.querySelectorAll('[data-view]').forEach(btn => {
    const isActive = btn.dataset.view === viewId;
    btn.classList.toggle('is-active', isActive);
    if (btn.classList.contains('nav-pill')) {
      btn.setAttribute('aria-current', isActive ? 'page' : 'false');
    }
  });
}

/**
 * Muestra una sola vista a la vez.
 * También actualiza el hash de la URL para permitir enlaces directos a módulos.
 */
function showView(viewId, { replaceHash = false, scroll = true } = {}) {
  const selectedView = document.getElementById(viewId) || document.getElementById('guia');
  const selectedId = selectedView.id;

  document.querySelectorAll('.view').forEach(view => {
    view.classList.toggle('is-active', view.id === selectedId);
  });
  setActiveNavigation(selectedId);

  const desiredHash = `#${selectedId}`;
  if (window.location.hash !== desiredHash) {
    const method = replaceHash ? 'replaceState' : 'pushState';
    window.history[method](null, '', desiredHash);
  }

  if (moduleRunners[selectedId]) {
    moduleRunners[selectedId]();
  } else {
    renderMath();
  }

  if (scroll) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// Inicializa los eventos de navegación modular cuando el DOM está listo.
function initModuleNavigation() {
  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-view]');
    if (!trigger) return;
    event.preventDefault();
    showView(trigger.dataset.view);
  });

  window.addEventListener('hashchange', () => {
    const viewId = window.location.hash.replace('#', '') || 'guia';
    showView(viewId, { replaceHash: true, scroll: true });
  });

  const initialView = window.location.hash.replace('#', '') || 'guia';
  showView(initialView, { replaceHash: true, scroll: false });
}

// Punto de arranque de la aplicación.
document.addEventListener('DOMContentLoaded', initModuleNavigation);
