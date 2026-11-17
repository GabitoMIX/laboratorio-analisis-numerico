/*
 * Núcleo matemático de EDO: sin dependencias, aislado de la interfaz.
 * Euler, punto medio, Heun, RK4, sistemas, convergencia y estabilidad local.
 * No emplear estas aproximaciones para decisiones de seguridad crítica.
 */
(function (root, factory) {
  const engine = factory();
  if (typeof module === 'object' && module.exports) module.exports = engine;
  if (root) root.NumericalODE = engine;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const METHODS = Object.freeze({
    euler: 'Euler explícito',
    midpoint: 'Euler mejorado (punto medio)',
    heun: 'Heun (trapecio explícito)',
    rk4: 'Runge–Kutta de orden 4'
  });
  const MATH_NAMES = Object.freeze({
    sin: Math.sin, cos: Math.cos, tan: Math.tan,
    asin: Math.asin, acos: Math.acos, atan: Math.atan,
    sqrt: Math.sqrt, abs: Math.abs, exp: Math.exp,
    log: Math.log, ln: Math.log, log10: Math.log10,
    pi: Math.PI, e: Math.E
  });
  const allowed = new Set(['x','t','y','z', ...Object.keys(MATH_NAMES)]);

  function expression(raw) {
    const input = String(raw || '').trim();
    if (input.length < 1 || input.length > 180) throw new Error('La expresión debe tener entre 1 y 180 caracteres.');
    if (input.includes(',')) throw new Error('En la expresión usa punto decimal (0.5) y ^ para potencias, no comas.');
    if (!/^[0-9a-zA-Z\s+\-*/^().]+$/.test(input)) throw new Error('La función contiene caracteres no permitidos.');
    // Se admite x e t como variable independiente, con variables dependientes y/z.
    const ids = input.match(/[a-zA-Z][a-zA-Z0-9]*/g) || [];
    for (const id of ids) if (!allowed.has(id) && !/^[eE]\d+$/.test(id)) throw new Error(`Nombre no admitido: ${id}. Usa x, y, z, sin, cos, exp, etc.`);
    // No se acepta acceso a propiedades ni secuencias de puntos.
    if (/\.(?!\d)|\d\.(?=[a-zA-Z])|\.\./.test(input)) throw new Error('Usa nombres de funciones sin prefijos, por ejemplo sin(x).');
    // Exige funciones con llamada, para evitar interpretaciones ambiguas.
    for (const id of ids) {
      if (typeof MATH_NAMES[id] === 'function' && !new RegExp(`\\b${id}\\s*\\(`).test(input)) {
        throw new Error(`La función ${id} requiere paréntesis.`);
      }
    }
    let fn;
    try {
      const jsExpr = input.replace(/\^/g, '**');
      fn = new Function('x','y','z', 'M',
        '"use strict"; const t=x; const {sin,cos,tan,asin,acos,atan,sqrt,abs,exp,log,ln,log10,pow,pi,e}=M; return (' + jsExpr + ');');
      // Comprobación sintáctica de la expresión sin evaluar con valores singulares.
    } catch (_) { throw new Error('La expresión matemática no tiene sintaxis válida. Ejemplo: x+y o 0.5*y.'); }
    return function (x, y, z = 0) {
      const result = fn(x, y, z, MATH_NAMES);
      if (!Number.isFinite(result)) throw new Error(`La función produjo un valor no finito cerca de x=${x.toFixed(5)}.`);
      return result;
    };
  }

  function assertFinite(...values) {
    if (!values.every(Number.isFinite)) throw new Error('Revisa que todos los datos iniciales sean números finitos.');
  }

  function validateRange(x0, end, h, maxSteps = 1000) {
    assertFinite(x0, end, h);
    if (end <= x0) throw new Error('El valor final de x debe ser mayor que x₀.');
    if (h <= 0) throw new Error('El tamaño de paso h debe ser mayor que cero.');
    const n = Math.ceil((end - x0) / h - 1e-10);
    if (n < 1 || n > maxSteps) throw new Error(`El número de pasos debe estar entre 1 y ${maxSteps}. Aumenta h o reduce el intervalo.`);
    return n;
  }

  function stepScalar(f, method, x, y, h) {
    const k1 = f(x,y);
    if (method === 'euler') return {next: y + h*k1, slopes:[k1]};
    if (method === 'midpoint') {
      const k2 = f(x+h/2, y+(h/2)*k1);
      return {next: y + h*k2, slopes:[k1,k2]};
    }
    if (method === 'heun') {
      const k2 = f(x+h, y+h*k1);
      return {next: y+(h/2)*(k1+k2), slopes:[k1,k2]};
    }
    if (method === 'rk4') {
      const k2 = f(x+h/2, y+(h/2)*k1);
      const k3 = f(x+h/2, y+(h/2)*k2);
      const k4 = f(x+h, y+h*k3);
      return {next: y+(h/6)*(k1+2*k2+2*k3+k4), slopes:[k1,k2,k3,k4]};
    }
    throw new Error('Método no admitido.');
  }

  function scalar(f, {x0=0, y0=1, end=1, h=0.1, method='rk4'} = {}) {
    assertFinite(x0,y0,end,h);
    validateRange(x0,end,h);
    if (!METHODS[method]) throw new Error('Método desconocido.');
    let x=x0, y=y0;
    const rows = [{i:0,x,y,slopes:[],h:0}];
    for (let i=1; x < end-1e-11*Math.max(1,Math.abs(end)); i++) {
      if (i>1000) throw new Error('Se superó el límite de 1000 pasos.');
      const d = Math.min(h, end-x);
      const s = stepScalar(f, method, x, y, d);
      if (!Number.isFinite(s.next)) throw new Error('La solución crece fuera del rango numérico. Prueba un paso más pequeño.');
      x = (end-x <= d+1e-10*Math.max(1,Math.abs(end))) ? end : x+d;
      y = s.next;
      rows.push({i,x,y,slopes:s.slopes,h:d});
    }
    return {method,rows,final:y};
  }

  function system(f,g,{x0=0,y0=1,z0=0,end=2,h=0.1,method='rk4'}={}) {
    assertFinite(x0,y0,z0,end,h);
    validateRange(x0,end,h);
    if (!['euler','heun','rk4'].includes(method)) throw new Error('Para sistemas usa Euler, Heun o RK4.');
    const F=(x,y,z)=>[f(x,y,z),g(x,y,z)];
    const advance=(v,k,c)=>[v[0]+c*k[0],v[1]+c*k[1]];
    let x=x0, v=[y0,z0];
    const rows=[{i:0,x,y:y0,z:z0,slopes:[],h:0}];
    for (let i=1; x<end-1e-11*Math.max(1,Math.abs(end));i++) {
      if (i>1000) throw new Error('Se superó el límite de 1000 pasos.');
      const d=Math.min(h,end-x);
      const k1=F(x,...v);
      let next, slopes=[k1];
      if(method==='euler') next=advance(v,k1,d);
      else if(method==='heun'){
        const k2=F(x+d,...advance(v,k1,d));
        slopes.push(k2);
        next=[v[0]+d*(k1[0]+k2[0])/2,v[1]+d*(k1[1]+k2[1])/2];
      } else {
        const k2=F(x+d/2,...advance(v,k1,d/2));
        const k3=F(x+d/2,...advance(v,k2,d/2));
        const k4=F(x+d,...advance(v,k3,d));
        slopes=[k1,k2,k3,k4];
        next=[0,1].map(j=>v[j]+d*(k1[j]+2*k2[j]+2*k3[j]+k4[j])/6);
      }
      if(!next.every(Number.isFinite)) throw new Error('El sistema produjo un valor no finito. Usa un h más pequeño.');
      x=(end-x<=d+1e-10*Math.max(1,Math.abs(end)))?end:x+d;
      v=next;
      rows.push({i,x,y:v[0],z:v[1],slopes,h:d});
    }
    return {rows,method,final:v};
  }

  function convergence(f, settings) {
    const {h} = settings;
    const scales=[1,2,4];
    const runs = scales.map(k => {
      const hh=h/k;
      validateRange(settings.x0, settings.end, hh);
      return {h:hh, ...scalar(f,{...settings,h:hh})};
    });
    // Referencia numérica refinada: NO equivale a solución analítica exacta.
    let referenceH=Math.min(h/32,(settings.end-settings.x0)/256);
    referenceH=Math.max(referenceH,(settings.end-settings.x0)/1000);
    const reference=scalar(f,{...settings,h:referenceH,method:'rk4'}).final;
    return {runs:runs.map(r=>({...r,absError:Math.abs(r.final-reference)})), reference,referenceH};
  }

  function stability(f,{x0,y0,h,method}) {
    assertFinite(x0,y0,h);
    const delta=Math.max(1e-6, Math.abs(y0)*1e-5);
    const lambda=(f(x0,y0+delta)-f(x0,y0-delta))/(2*delta);
    const z=lambda*h;
    const r={euler:1+z,midpoint:1+z+z*z/2,heun:1+z+z*z/2,
      rk4:1+z+z*z/2+z*z*z/6+z*z*z*z/24}[method];
    if(!Number.isFinite(r)) throw new Error('No se pudo estimar la estabilidad local.');
    return {lambda,z,amplification:r, linearlyStable:Math.abs(r)<=1};
  }

  return {METHODS,expression,scalar,system,convergence,stability,validateRange};
});
