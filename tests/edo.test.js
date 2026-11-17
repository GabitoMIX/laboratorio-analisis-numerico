const assert=require('node:assert/strict');
const {test}=require('node:test');
const N=require('../edo-core.js');
const near=(actual,expected,tol=1e-5)=>assert.ok(Math.abs(actual-expected)<tol,`Valor obtenido ${actual}, esperado ${expected} (tolerancia ${tol})`);

test('parser: reconoce operaciones, funciones y bloquea instrucciones',()=>{
  const f=N.expression('sin(x) + y^2 + exp(0)');
  near(f(0,3),10,1e-9);
  assert.throws(()=>N.expression('alert(1)'),/no admitido/i);
  assert.throws(()=>N.expression('x; y'),/no permitidos/i);
  assert.throws(()=>N.expression('constructor'),/no admitido/i);
  assert.throws(()=>N.expression('0,5*y'),/punto decimal/i);
});
test('Euler para yʹ=y, y(0)=1, h=0.1, x=1',()=>{
  const r=N.scalar(N.expression('y'),{x0:0,y0:1,end:1,h:0.1,method:'euler'});
  near(r.final,1.1**10,1e-9);
  assert.equal(r.rows.length,11);
});
test('RK4 para y prima = y se aproxima a e en x=1',()=>{
  const r=N.scalar(N.expression('y'),{x0:0,y0:1,end:1,h:0.1,method:'rk4'});
  near(r.final,Math.E,2.1e-6);
});
test('Heun y punto medio tienen orden 2 en el problema exponencial',()=>{
  for (const method of ['heun','midpoint']) {
    const r=N.scalar(N.expression('y'),{x0:0,y0:1,end:1,h:0.1,method});
    near(r.final,Math.E,0.005);
  }
});
test('El último subpaso respeta el extremo sin sobrepasarlo',()=>{
  const r=N.scalar(N.expression('1'),{x0:0,y0:0,end:1,h:0.3,method:'rk4'});
  near(r.final,1,1e-10);
  assert.equal(r.rows.at(-1).x,1);
  near(r.rows.at(-1).h,0.1,1e-9);
});
test('El sistema yʹ=z, zʹ=-y conserva órbita con RK4',()=>{
  const r=N.system(N.expression('z'),N.expression('-y'),{x0:0,y0:1,z0:0,end:Math.PI/2,h:0.05,method:'rk4'});
  near(r.final[0],0,3e-7);
  near(r.final[1],-1,3e-7);
});
test('El error disminuye al refinar h en Euler',()=>{
  const c=N.convergence(N.expression('y'),{x0:0,y0:1,end:1,h:0.2,method:'euler'});
  assert.ok(c.runs[0].absError > c.runs[1].absError);
  assert.ok(c.runs[1].absError > c.runs[2].absError);
});
test('Estabilidad absoluta local de Euler para yʹ=-2y',()=>{
  const f=N.expression('-2*y');
  const a=N.stability(f,{x0:0,y0:1,h:0.5,method:'euler'});
  near(a.lambda,-2,1e-9);
  near(a.amplification,0,1e-9);
  assert.equal(a.linearlyStable,true);
  const b=N.stability(f,{x0:0,y0:1,h:1.5,method:'euler'});
  assert.equal(b.linearlyStable,false);
});
test('Valida entrada de pasos y expresiones no finitas',()=>{
  assert.throws(()=>N.scalar(N.expression('y'),{x0:0,y0:1,end:2,h:0}),/mayor que cero/);
  assert.throws(()=>N.scalar(N.expression('1/(x-1)'),{x0:0,y0:0,end:2,h:1}),/no finito/);
});
