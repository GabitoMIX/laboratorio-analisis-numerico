/* Interfaz para los nuevos módulos de modelación y EDO. */
'use strict';
const odeExamples = {
  growth: {label:'Crecimiento poblacional',expression:'0.5*y',x0:0,y0:10,end:2,h:0.2,
    context:'Modelo de crecimiento proporcional: la tasa de cambio es proporcional a la población. y(0)=10 y k=0.5.'},
  cooling: {label:'Enfriamiento de Newton',expression:'-0.25*(y-20)',x0:0,y0:90,end:8,h:0.5,
    context:'Modelo de transferencia de calor: el ambiente está a 20 °C y el cuerpo parte de 90 °C.'},
  mixing: {label:'Conservación de masa en tanque',expression:'2-0.2*y',x0:0,y0:0,end:10,h:0.5,
    context:'Balance de masa: acumulación = entrada (2 unidades/min) − salida (0.2·y unidades/min). Volumen constante.'}
};
const odeRecent = {};
const odeEsc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const odeNum = id => Number(document.getElementById(id).value.trim().replace(',','.'));
const odeStr = id => document.getElementById(id).value.trim();
const odeFmt = (n,d=7) => Number.isFinite(n) ? Number(n.toFixed(d)).toString() : 'NaN';
const odeMath = () => {if (window.MathJax?.typesetPromise) window.MathJax.typesetPromise().catch(()=>{});};

function loadODEExample(name) {
  const preset = odeExamples[name];
  if (!preset) return;
  const fields={odeExpression:preset.expression,odeX0:preset.x0,odeY0:preset.y0,odeEnd:preset.end,odeH:preset.h};
  Object.entries(fields).forEach(([id,value]) => document.getElementById(id).value=value);
  document.getElementById('odeContext').textContent=preset.context;
  runODE();
}

function odeSeriesGraph(canvasId, series) {
  const canvas=document.getElementById(canvasId);
  if (!canvas) return;
  const ctx=canvas.getContext('2d');
  const W=canvas.width,H=canvas.height;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#fff'; ctx.fillRect(0,0,W,H);
  const all=series.flatMap(s=>s.points).filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y));
  if(!all.length) return;
  let minX=Math.min(...all.map(p=>p.x)),maxX=Math.max(...all.map(p=>p.x));
  let minY=Math.min(...all.map(p=>p.y)),maxY=Math.max(...all.map(p=>p.y));
  const rangeX=Math.max(1e-9,maxX-minX),rangeY=Math.max(1e-9,maxY-minY);
  minY-=rangeY*.1;maxY+=rangeY*.1;
  const left=74,right=25,top=30,bottom=56;
  const xx=x=>left+(x-minX)/rangeX*(W-left-right);
  const yy=y=>H-bottom-(y-minY)/(maxY-minY)*(H-top-bottom);
  ctx.font='12px system-ui';ctx.lineWidth=1;
  for(let i=0;i<=5;i++) {
    const y=top+(H-top-bottom)*i/5;
    ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(W-right,y);ctx.strokeStyle='#e5ebe8';ctx.stroke();
    ctx.fillStyle='#52635a';ctx.textAlign='right';ctx.fillText(odeFmt(maxY-(maxY-minY)*i/5,3),left-9,y+4);
    const x=left+(W-left-right)*i/5;
    ctx.beginPath();ctx.moveTo(x,top);ctx.lineTo(x,H-bottom);ctx.strokeStyle='#eef2f0';ctx.stroke();
    ctx.textAlign='center';ctx.fillText(odeFmt(minX+rangeX*i/5,3),x,H-bottom+20);
  }
  ctx.strokeStyle='#a2ada7';ctx.strokeRect(left,top,W-left-right,H-top-bottom);
  ctx.textAlign='center';ctx.font='bold 13px system-ui';ctx.fillStyle='#304239';ctx.fillText('x / tiempo',W/2,H-10);
  const palette=['#087b36','#24599c','#c58018','#9f48a1','#d04752'];
  series.forEach((s,i)=>{
    const ps=s.points.filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y));
    if(!ps.length)return;
    ctx.beginPath();ctx.lineWidth=2.7;ctx.strokeStyle=palette[i%palette.length];
    ps.forEach((p,j)=> j===0 ? ctx.moveTo(xx(p.x),yy(p.y)):ctx.lineTo(xx(p.x),yy(p.y)));
    ctx.stroke();
  });
  // Leyenda fuera del área de trazado; texto asociado se presenta también arriba en HTML.
}

function odeRowTable(rows,vector=false) {
  const limited = rows.length>150 ? [...rows.slice(0,70), ...rows.slice(-70)] : rows;
  const headings=vector?'<th>n</th><th>xₙ</th><th>yₙ</th><th>zₙ</th>':'<th>n</th><th>xₙ</th><th>yₙ</th><th>h usado</th>';
  return `<div class="table-wrap"><table><thead><tr>${headings}</tr></thead><tbody>`+
    limited.map(r=>vector?`<tr><td>${r.i}</td><td>${odeFmt(r.x)}</td><td>${odeFmt(r.y)}</td><td>${odeFmt(r.z)}</td></tr>`:
      `<tr><td>${r.i}</td><td>${odeFmt(r.x)}</td><td>${odeFmt(r.y)}</td><td>${odeFmt(r.h)}</td></tr>`).join('')+
    `</tbody></table></div>`+
    (rows.length>150?'<p class="hint">Se muestran las primeras y últimas 70 filas. Descarga el CSV para consultar todas.</p>':'');
}

function odeSlopeBlocks(rows,method,vector=false) {
  const first=rows.slice(1,Math.min(5,rows.length));
  return first.map(r=>{
    const old=rows[r.i-1];
    const slopes=r.slopes.map((v,i)=>vector ? `<span>k${i+1}=(${odeFmt(v[0],6)}, ${odeFmt(v[1],6)})</span>`:
      `<span>k${i+1}=${odeFmt(v,7)}</span>`).join(' · ');
    let substitution='';
    if(!vector){
      const v=r.slopes.map(n=>odeFmt(n,7));
      const d=odeFmt(r.h,6),y=odeFmt(old.y,7);
      const rule=method==='euler'?`${y} + ${d}·(${v[0]})`:
        method==='midpoint'?`${y} + ${d}·(${v[1]})`:
        method==='heun'?`${y} + ${d}·((${v[0]}) + (${v[1]}))/2`:
          `${y} + ${d}·((${v[0]}) + 2·(${v[1]}) + 2·(${v[2]}) + (${v[3]}))/6`;
      substitution=`<p class="calculation-line"><strong>Sustitución:</strong> <code>y siguiente = ${rule} = ${odeFmt(r.y,8)}</code></p>`;
    }
    return `<div class="step-block"><h4>Paso ${r.i}: x=${odeFmt(old.x,5)} → ${odeFmt(r.x,5)}</h4>
     <p>Estado inicial: ${vector ? `y=${odeFmt(old.y,6)}, z=${odeFmt(old.z,6)}`:`y=${odeFmt(old.y,7)}`}, tamaño de paso ${odeFmt(r.h,5)}.</p>
     <p class="slope-values">${slopes}</p>
     ${substitution}
     <p>Actualización calculada: ${vector ? `y=${odeFmt(r.y,7)}, z=${odeFmt(r.z,7)}`:`y=${odeFmt(r.y,8)}`}</p></div>`;
  }).join('');
}
function odeError(out,e) { out.innerHTML=`<div class="output-card error"><h3>Verifica los datos</h3><p>${odeEsc(e.message)}</p></div>`; }
function odeLegend(items) {return '<div class="ode-legend">'+items.map((n,i)=>`<span class="ode-legend-item"><i style="background:${['#087b36','#24599c','#c58018','#9f48a1'][i%4]}"></i>${odeEsc(n)}</span>`).join('')+'</div>';}

function runODE() {
  const out=document.getElementById('odeOutput');
  try {
    const expr=odeStr('odeExpression'),f=NumericalODE.expression(expr),
      x0=odeNum('odeX0'),y0=odeNum('odeY0'),end=odeNum('odeEnd'),h=odeNum('odeH'),
      method=odeStr('odeMethod');
    const settings={x0,y0,end,h,method};
    const result=NumericalODE.scalar(f,settings);
    const reference=NumericalODE.scalar(f,{...settings,method:'rk4',h:Math.max(h/4,(end-x0)/1000)});
    const formula={
      euler:String.raw`y_{n+1}=y_n+h\,f(x_n,y_n)`,
      midpoint:String.raw`y_{n+1}=y_n+h\,f(x_n+h/2,\,y_n+h k_1/2)`,
      heun:String.raw`y_{n+1}=y_n+\frac{h}{2}(k_1+k_2)`,
      rk4:String.raw`y_{n+1}=y_n+\frac{h}{6}(k_1+2k_2+2k_3+k_4)`
    }[method];
    out.innerHTML=`
      <div class="output-card success"><h3>Resultado — ${odeEsc(NumericalODE.METHODS[method])}</h3>
      <p>Para el PVI <strong>y' = ${odeEsc(expr)}</strong>, con \\(y(${odeFmt(x0)})=${odeFmt(y0)}\\), se obtiene:</p>
      <div class="big-result">\\(y(${odeFmt(end)}) \\approx ${odeFmt(result.final,9)}\\)</div>
      <p class="hint">Aproximación con ${result.rows.length-1} pasos. El último paso se ajusta si el intervalo no es múltiplo exacto de h.</p></div>
      <div class="output-card"><h3>Fórmula y procedimiento</h3><p>\\[${formula}\\]</p><div class="step-list">${odeSlopeBlocks(result.rows,method)}</div>
      <p class="hint">Se muestran los primeros cuatro pasos; todos los pasos quedan en la tabla y el CSV.</p></div>
      <div class="output-card"><h3>Tabla de iteraciones</h3>${odeRowTable(result.rows)}</div>
      <div class="output-card"><h3>Visualización</h3>${odeLegend([NumericalODE.METHODS[method],'Referencia RK4 refinada'])}
      <p class="hint">La referencia RK4 refinada es numérica, no una solución exacta.</p></div>`;
    odeSeriesGraph('odeCanvas',[
      {points:result.rows.map(r=>({x:r.x,y:r.y}))},
      {points:reference.rows.map(r=>({x:r.x,y:r.y}))}
    ]);
    odeRecent.ode={headers:['n','x','y','h'],rows:result.rows.map(r=>[r.i,r.x,r.y,r.h])};
    odeMath();
  } catch(e){odeError(out,e);}
}

function runSystemODE(){
  const out=document.getElementById('systemOutput');
  try {
    const expr1=odeStr('sysF'),expr2=odeStr('sysG');
    const f=NumericalODE.expression(expr1),g=NumericalODE.expression(expr2);
    const settings={x0:odeNum('sysX0'),y0:odeNum('sysY0'),z0:odeNum('sysZ0'),
      end:odeNum('sysEnd'),h:odeNum('sysH'),method:odeStr('sysMethod')};
    const result=NumericalODE.system(f,g,settings);
    out.innerHTML=`
      <div class="output-card success"><h3>Solución aproximada del sistema</h3>
      <p>y'=${odeEsc(expr1)} y z'=${odeEsc(expr2)}, con y(${odeFmt(settings.x0)})=${odeFmt(settings.y0)}, z(${odeFmt(settings.x0)})=${odeFmt(settings.z0)}.</p>
      <div class="big-result">\\(y(${odeFmt(settings.end)}) \\approx ${odeFmt(result.final[0],8)}\\)<br>\\(z(${odeFmt(settings.end)}) \\approx ${odeFmt(result.final[1],8)}\\)</div>
      <p class="hint">Método ${odeEsc(NumericalODE.METHODS[settings.method])}, ${result.rows.length-1} pasos.</p></div>
      <div class="output-card"><h3>Primeros pasos del método</h3>
      <p>Para sistemas, cada pendiente es un vector \\((k_y,k_z)\\). Las actualizaciones se realizan simultáneamente para \\(y\\) y \\(z\\).</p>
      <div class="step-list">${odeSlopeBlocks(result.rows,settings.method,true)}</div></div>
      <div class="output-card"><h3>Tabla de resultados</h3>${odeRowTable(result.rows,true)}</div>
      <div class="output-card"><h3>Gráficas de las variables</h3>${odeLegend(['y(x)','z(x)'])}</div>`;
    odeSeriesGraph('systemCanvas',[
      {points:result.rows.map(r=>({x:r.x,y:r.y}))},
      {points:result.rows.map(r=>({x:r.x,y:r.z}))}
    ]);
    odeRecent.system={headers:['n','x','y','z'],rows:result.rows.map(r=>[r.i,r.x,r.y,r.z])};
    odeMath();
  }catch(e){odeError(out,e);}
}

function runConvergence(){
  const out=document.getElementById('convOutput');
  try {
    const expr=odeStr('convExpression'),f=NumericalODE.expression(expr);
    const settings={x0:odeNum('convX0'),y0:odeNum('convY0'),end:odeNum('convEnd'),h:odeNum('convH')};
    const results=Object.keys(NumericalODE.METHODS).map(method=>({method,...NumericalODE.convergence(f,{...settings,method})}));
    const finalReference=results[3].reference;
    const header='<tr><th>Método</th><th>h</th><th>y(x final)</th><th>Error vs. referencia</th></tr>';
    const body=results.map(r=>r.runs.map(s=>`<tr><td>${odeEsc(NumericalODE.METHODS[r.method])}</td><td>${odeFmt(s.h,6)}</td><td>${odeFmt(s.final,10)}</td><td>${odeFmt(Math.abs(s.final-finalReference),10)}</td></tr>`).join('')).join('');
    const stability=results.map(r=>({method:r.method,...NumericalODE.stability(f,{...settings,method:r.method})}));
    const stabilityBody=stability.map(s=>`<tr><td>${odeEsc(NumericalODE.METHODS[s.method])}</td><td>${odeFmt(s.lambda,5)}</td><td>${odeFmt(s.z,5)}</td><td>${odeFmt(Math.abs(s.amplification),6)}</td><td>${s.linearlyStable?'≤ 1':'&gt; 1'}</td></tr>`).join('');
    out.innerHTML=`
      <div class="output-card success"><h3>Comparación de convergencia</h3>
      <p>Para y'=${odeEsc(expr)}, con y(${odeFmt(settings.x0)})=${odeFmt(settings.y0)}.</p>
      <p>Referencia numérica RK4 refinada: <strong>${odeFmt(finalReference,10)}</strong>.</p>
      <p class="hint">Error absoluto frente a una referencia de alta resolución: sirve para comparar métodos, pero no demuestra error exacto.</p></div>
      <div class="output-card"><h3>¿Qué pasa cuando se reduce h?</h3><div class="table-wrap"><table><thead>${header}</thead><tbody>${body}</tbody></table></div>
      <p class="hint">Compara \\(h\\), \\(h/2\\) y \\(h/4\\): la aproximación suele mejorar al disminuir el paso, si se cumplen las hipótesis del problema.</p></div>
      <div class="output-card"><h3>Estabilidad de la linealización local</h3><p>Se estima \\(\\lambda \\approx \\partial f/\\partial y\\) alrededor del dato inicial y se evalúa el factor \\(R(h\\lambda)\\). Para \\(\\lambda<0\\), se comprueba la condición \\(|R(h\\lambda)|\\leq1\\).</p>
      <div class="table-wrap"><table><thead><tr><th>Método</th><th>λ estimada</th><th>hλ</th><th>|R(hλ)|</th><th>Condición |R|</th></tr></thead><tbody>${stabilityBody}</tbody></table></div>
      <p class="hint"><strong>Importante:</strong> este indicador local no garantiza la estabilidad global de ecuaciones no lineales. Si \\(\\lambda\\geq 0\\), el crecimiento de la solución puede ser natural y no necesariamente un fallo del método.</p></div>
      <div class="output-card"><h3>Comparación gráfica con paso h</h3>${odeLegend(Object.values(NumericalODE.METHODS))}</div>`;
    odeSeriesGraph('convCanvas',results.map(r=>({points:r.runs[0].rows.map(v=>({x:v.x,y:v.y}))})));
    odeRecent.convergence={headers:['metodo','h','valor_final','error_vs_referencia'],rows:results.flatMap(r=>r.runs.map(s=>[NumericalODE.METHODS[r.method],s.h,s.final,Math.abs(s.final-finalReference)]))};
    odeMath();
  } catch(e){odeError(out,e);}
}

function downloadODECSV(which){
  const source=odeRecent[which];
  if(!source) {alert('Primero ejecuta una simulación válida.');return;}
  const csv='\uFEFF'+[source.headers,...source.rows].map(row=>row.map(value=>'"'+String(value).replaceAll('"','""')+'"').join(';')).join('\r\n');
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');link.href=url;link.download=`laboratorio-${which}.csv`;
  document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);
}
