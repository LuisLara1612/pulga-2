/* Pruebas de la simulación de la casa. Correr desde pulga-2/ con: node --test */
const test=require('node:test');
const assert=require('node:assert/strict');
const C=require('../js/casa-sim.js');
const R=C.REGLAS;

const partida=(semilla=1,mascota='perro')=>{const rng=C.azar(semilla);return{rng,e:C.nueva(mascota,rng)}};
const sinEventos=e=>{e.cola=[];return e};
const promedio=(n,fn)=>{let s=0;for(let i=0;i<n;i++)s+=fn(i);return s/n};
const m=(d,h)=>(d-1)*1440+h*60;

test('el módulo carga y expone las reglas',()=>{
  assert.equal(typeof C.avanzar,'function');
  assert.equal(R.MIN_POR_SEG,6);
});

/* ---------- 2. Reloj y calendario ---------- */
test('240 s reales son 1 día y 5 s son 30 minutos',()=>{
  assert.equal(C.minutosPorSeg(1)*240,1440);
  assert.equal(C.minutosPorSeg(1)*5,30);
  const {e,rng}=partida();const d=C.dia(e.min);
  for(let i=0;i<240*20;i++)C.avanzar(e,C.minutosPorSeg(1)/20,rng,null);
  assert.equal(C.dia(e.min),d+1);
  assert.ok(Math.abs(e.min-(R.INICIO_MIN+1440))<1e-6);
});

test('rutinas: 10:00 de día de escuela y 02:00',()=>{
  const {e}=partida();
  assert.equal(C.donde(e,'nino',m(1,10)).lugar,'escuela');
  assert.equal(C.donde(e,'nina',m(1,10)).lugar,'escuela');
  assert.equal(C.donde(e,'joven',m(1,10)).lugar,'prepa');
  assert.equal(C.donde(e,'papa',m(1,10)).lugar,'trabajo');
  C.huespedes(e).forEach(id=>assert.equal(C.donde(e,id,m(2,2)).lugar,'casa',id));
  assert.equal(C.donde(e,'nino',m(6,10)).lugar,'casa','sábado no hay escuela');
});

test('el baño de las 07:00 del día 3 agenda el siguiente a las 06:00 del día 4',()=>{
  const {e,rng}=partida();sinEventos(e);
  e.min=m(3,6);e.horaHecha=Math.floor(e.min/60);
  C.agendar(e,{t:m(3,7),tipo:'bano',id:'nino'});
  C.avanzar(e,90,rng,null);
  assert.equal(e.hu.nino.proxBano,m(4,6));
  assert.ok(e.cola.some(c=>c.tipo==='bano'&&c.id==='nino'&&c.t===m(4,6)));
});

test('los 5 primeros baños caen en horas distintas',()=>{
  const {e}=partida();
  const horas=C.PERSONAS.map(id=>Math.floor(e.hu[id].proxBano/60));
  assert.equal(new Set(horas).size,5);
  C.PERSONAS.forEach(id=>assert.ok(e.hu[id].proxBano>=R.INICIO_MIN));
});

test('solo hay contactos entre integrantes en el mismo lugar',()=>{
  const {e,rng}=partida(3);let n=0;
  for(let k=0;k<1440*10;k++)C.avanzar(e,1,rng,null).forEach(ev=>{
    if(ev.tipo!=='contacto')return;n++;
    assert.equal(C.donde(e,ev.a,ev.t).lugar,C.donde(e,ev.b,ev.t).lugar,ev.que);
  });
  assert.ok(n>50);
});

test('los contactos con adultos son más cortos y el hurón tiene más contactos y más cortos',()=>{
  const durs=mascota=>{const {e,rng}=partida(5,mascota),l=[];C.planificarDia(e,2,rng);e.cola.forEach(c=>{if(c.tipo==='contacto')l.push(c)});return l};
  const l=durs('perro'),ad=l.filter(c=>C.grupo(c.a)==='adulto'||C.grupo(c.b)==='adulto'),otros=l.filter(c=>!ad.includes(c));
  assert.ok(Math.max(...ad.map(c=>c.dur))<Math.min(...otros.map(c=>c.dur)));
  const pet=(l,id)=>l.filter(c=>c.a===id||c.b===id);
  const pp=promedio(30,i=>pet(durs.call(null,'perro'),'perro').length),ph=promedio(30,i=>pet(durs('huron'),'huron').length);
  assert.ok(ph>pp);
  const dp=pet(l,'perro').map(c=>c.dur),dh=pet(durs('huron'),'huron').map(c=>c.dur);
  assert.ok(Math.max(...dh)<Math.min(...dp));
});

test('la revisión escolar se avisa con 1 hora',()=>{
  const {e}=partida();sinEventos(e);
  C.agendar(e,{t:m(1,11),tipo:'revision'});
  e.min=m(1,10);
  assert.ok(C.avisos(e).some(a=>a.tipo==='revision'));
  e.min=m(1,9.5);
  assert.ok(!C.avisos(e).some(a=>a.tipo==='revision'));
});

test('avanzar 3 días de golpe no se salta baños',()=>{
  const {e,rng}=partida(7);
  const fin=e.min+3*1440;let esperados=0;
  C.PERSONAS.forEach(id=>{for(let t=C.PRIMER_BANO[id];t<=fin;t+=R.BANO_CADA_H*60)esperados++});
  const banos=C.avanzar(e,3*1440,rng,null).filter(ev=>ev.tipo==='bano').length;
  assert.equal(banos,esperados);
});

/* ---------- 3. Colonias ---------- */
test('partida nueva: 2 adultos, 1 joven, 2 niños, 1 mascota y 1 pulga en un niño',()=>{
  const {e}=partida(1,'gato');
  const ids=C.huespedes(e),g=ids.map(C.grupo);
  assert.equal(g.filter(x=>x==='adulto').length,2);
  assert.equal(g.filter(x=>x==='joven').length,1);
  assert.equal(g.filter(x=>x==='nino').length,2);
  assert.deepEqual(ids.filter(id=>C.grupo(id)==='mascota'),['gato']);
  assert.equal(e.hu.nino.adultas,1);
  ids.filter(id=>id!=='nino').forEach(id=>{assert.equal(e.hu[id].adultas,0);assert.equal(e.hu[id].huevos,0)});
  assert.throws(()=>C.nueva('pez',C.azar(1)));
});

test('un niño con 3 adultas crece en 6 horas sin eventos',()=>{
  const total=promedio(200,i=>{const {e,rng}=partida(100+i);sinEventos(e);e.hu.nino.adultas=3;C.avanzar(e,360,rng,null);return e.hu.nino.adultas+e.hu.nino.huevos});
  assert.ok(total>3,'promedio '+total);
});

test('una colonia no pasa el tope',()=>{
  const {e,rng}=partida(2);sinEventos(e);e.hu.nino.adultas=R.TOPE;
  C.avanzar(e,48*60,rng,null);
  assert.ok(e.hu.nino.adultas+e.hu.nino.huevos<=R.TOPE);
});

test('el niño contagia más que el adulto con la misma colonia',()=>{
  const pasa=de=>promedio(1000,i=>{const {e,rng}=partida(i);e.hu.nino.adultas=0;e.hu[de].adultas=8;const r=C.contagio(e,de,'nina',rng,null);return r?r.adultas:0});
  assert.ok(pasa('nino')>pasa('mama'));
});

test('el baño deja al menos 10 % y las escondidas sobreviven más',()=>{
  const rng=C.azar(9);
  for(let i=0;i<1000;i++){const v=C.sobrevivenBano(Array(20).fill(false),'nino',rng).filter(Boolean).length;assert.ok(v>=2)}
  assert.equal(C.sobrevivenBano([false],'adulto',rng).filter(Boolean).length,1);
  let esc=0,no=0;
  for(let i=0;i<1000;i++){const l=Array.from({length:20},(_,k)=>k<10),v=C.sobrevivenBano(l,'nino',rng);v.forEach((x,k)=>{if(x)k<10?esc++:no++})}
  assert.ok(esc>no);
  const sob=gr=>promedio(500,()=>C.sobrevivenBano(Array(20).fill(false),gr,rng).filter(Boolean).length);
  assert.ok(sob('joven')>sob('nino'));
});

test('peinado y secado quitan huevos y activan el bloqueo de 30 minutos',()=>{
  for(let i=0;i<100;i++){const {e,rng}=partida(i);e.hu.nino.huevos=6;C.peinadoEstadistico(e,'nino',rng);assert.ok(e.hu.nino.huevos<6)}
  const {e,rng}=partida();sinEventos(e);e.min=m(1,12);e.horaHecha=12;
  C.agendar(e,{t:m(1,12.5),tipo:'peinado',id:'joven'});
  C.avanzar(e,30,rng,null);
  assert.equal(e.hu.joven.bloqueoHasta,m(1,12.5)+R.PEINADO_DUR_MIN+R.BLOQUEO_MIN);
  assert.ok(e.hu.joven.gel,'el joven siempre usa gel');
  e.hu.joven.adultas=5;e.hu.joven.huevos=5;
  e.min=e.hu.joven.bloqueoHasta-1;C.pasoHora(e,'joven',rng);
  assert.equal(e.hu.joven.huevos,5,'sin nacimientos ni huevos nuevos en el bloqueo');
  assert.ok(e.hu.joven.adultas<=5);
});

test('la revisión escolar mata más que el peinado de mamá',()=>{
  const mama=promedio(500,i=>{const {e,rng}=partida(i);sinEventos(e);e.min=m(1,7.5);e.horaHecha=7;e.hu.nino.adultas=10;C.agendar(e,{t:m(1,7+40/60),tipo:'peinado-mama',id:'nino'});C.avanzar(e,20,rng,null);return 10-e.hu.nino.adultas});
  const rev=promedio(500,i=>{const {e,rng}=partida(i);sinEventos(e);e.min=m(1,10.5);e.horaHecha=10;e.hu.nino.adultas=10;C.agendar(e,{t:m(1,11),tipo:'revision'});C.avanzar(e,40,rng,null);return 10-e.hu.nino.adultas});
  assert.ok(mama>0);
  assert.ok(rev>mama,'revisión '+rev+' contra mamá '+mama);
});

test('veterinario: aviso un día antes, colonia de la mascota a 0 y el baño no la toca',()=>{
  const {e,rng}=partida(4,'conejo');sinEventos(e);
  e.vetMin=m(1,20);C.agendar(e,{t:e.vetMin,tipo:'vet'});C.agendar(e,{t:e.vetMin-R.AVISO_VET_H*60,tipo:'aviso-vet'});
  e.hu.conejo.adultas=5;e.hu.conejo.huevos=2;
  e.min=m(1,6.5);e.horaHecha=6;
  assert.ok(C.avisos(e).some(a=>a.tipo==='vet'));
  C.agendar(e,{t:m(1,7),tipo:'bano',id:'nino'});
  const ev=C.avanzar(e,60*12,rng,null);
  assert.ok(ev.some(x=>x.tipo==='bano'));
  assert.ok(e.hu.conejo.adultas>=5,'el baño de la familia no toca a la mascota');
  const vet=C.avanzar(e,60*2,rng,null).find(x=>x.tipo==='vet');
  assert.ok(vet);
  assert.equal(e.hu.conejo.adultas,0);assert.equal(e.hu.conejo.huevos,0);
  assert.equal(C.donde(e,'conejo',e.min).lugar,'veterinario');
  assert.equal(e.vetMin,m(1,20)+R.VET_CADA_DIAS*1440);
});

test('el primer veterinario es el día 30 y se avisa el día 29',()=>{
  const {e,rng}=partida(11);
  const ev=C.avanzar(e,30*1440,rng,null);
  const av=ev.find(x=>x.tipo==='aviso-vet'),vet=ev.findIndex(x=>x.tipo==='vet');
  assert.ok(av&&vet>=0);
  assert.equal(C.dia(e.vetMin-R.VET_CADA_DIAS*1440),30);
});

test('victoria, casi victoria y derrota',()=>{
  const {e}=partida();
  C.PERSONAS.forEach(id=>e.hu[id].adultas=3);
  assert.equal(C.resultado(e),'victoria');
  e.hu.papa.adultas=2;
  assert.equal(C.resultado(e),null);
  e.hu.perro.adultas=50;
  assert.equal(C.resultado(e),null,'la mascota no cuenta');
  C.huespedes(e).forEach(id=>{e.hu[id].adultas=0;e.hu[id].huevos=0});
  assert.equal(C.resultado(e),'derrota');
  e.hu.nina.huevos=1;
  assert.equal(C.resultado(e),null,'con un huevo la partida sigue');
});

test('equilibrio: 10 días sin intervención',()=>{
  let vivasDia2=0,todasAlTopeDia1=0;
  for(let s=1;s<=20;s++){
    const {e,rng}=partida(s);e.hu.nino.adultas=3;
    C.avanzar(e,1440-R.INICIO_MIN,rng,null);
    if(C.huespedes(e).every(id=>e.hu[id].adultas>=R.TOPE))todasAlTopeDia1++;
    C.avanzar(e,1440,rng,null);
    if(C.huespedes(e).some(id=>e.hu[id].adultas||e.hu[id].huevos))vivasDia2++;
    C.avanzar(e,8*1440,rng,null);
  }
  assert.ok(vivasDia2>0,'la colonia no debe morir siempre para el día 2');
  assert.equal(todasAlTopeDia1,0,'no deben llenarse todos el día 1');
});

/* ---------- 4 y 8 ---------- */
test('ida y vuelta conteo <-> cabeza conserva adultas y huevos',()=>{
  [[3,2],[14,0],[20,7],[0,4]].forEach(([a,h])=>{
    const hu={adultas:a,huevos:h,recientes:0},c=C.aCabeza(hu);
    assert.ok(c.pantalla<=C.MAX_PANTALLA);
    C.aConteo(hu,c.pantalla,c.reserva,c.huevos);
    assert.deepEqual([hu.adultas,hu.huevos],[a,h]);
  });
});

test('piel seca hace que pasen más huevos en el siguiente contacto',()=>{
  const pasa=piel=>promedio(1000,i=>{const {e,rng}=partida(i);e.hu.nino.adultas=4;e.hu.nino.huevos=8;e.hu.nino.pielSeca=piel;const r=C.contagio(e,'nino','nina',rng,null);return r?r.huevos:0});
  assert.ok(pasa(true)>pasa(false));
  const {e,rng}=partida();e.hu.nino.pielSeca=true;e.hu.nino.huevos=3;C.contagio(e,'nino','nina',rng,null);
  assert.equal(e.hu.nino.pielSeca,false,'se gasta en el contacto');
});

test('la pulga controlada no se pasa sola',()=>{
  for(let i=0;i<300;i++){const {e,rng}=partida(i);e.hu.nino.adultas=1;C.contagio(e,'nino','nina',rng,'nino');assert.equal(e.hu.nino.adultas,1)}
});

test('habilidades del joven: metas 3, 6 y 9 en orden, y se conservan',()=>{
  const {e,rng}=partida();
  e.hu.joven.adultas=3;assert.deepEqual(C.revisarHabilidades(e),['coraza']);
  e.hu.joven.adultas=1;assert.deepEqual(C.revisarHabilidades(e),[]);
  assert.ok(e.hab.coraza,'se conserva al bajar la colonia');
  e.hu.joven.adultas=9;assert.deepEqual(C.revisarHabilidades(e),['salto','camuflaje']);
  e.energia=10;assert.equal(C.usarHabilidad(e,'coraza'),'sin-energia');
  e.energia=100;assert.equal(C.usarHabilidad(e,'coraza'),'ok');assert.equal(e.energia,100-R.COSTO.coraza);
  const f=partida().e;assert.equal(C.usarHabilidad(f,'salto'),'bloqueada');
});

/* ---------- Modo Primera persona: una sola cabeza ---------- */
test('huespedes omite la mascota cuando no hay',()=>{
  const e=C.nuevaCabeza('joven',C.azar(1));
  assert.deepEqual(C.huespedes(e),C.PERSONAS);
  assert.equal(C.huespedes(partida().e).length,6);
});

test('nuevaCabeza: 1 adulta en la cabeza elegida y un solo baño en la cola, a las 12:00',()=>{
  const e=C.nuevaCabeza('nina',C.azar(2));
  assert.equal(e.mascota,null);
  C.PERSONAS.forEach(id=>{assert.equal(e.hu[id].adultas,id==='nina'?1:0,id);assert.equal(e.hu[id].huevos,0)});
  assert.equal(e.cola.length,1);
  assert.deepEqual([e.cola[0].tipo,e.cola[0].id,e.cola[0].t],['bano','nina',m(1,12)]);
  assert.throws(()=>C.nuevaCabeza('perro',C.azar(1)));
});

test('nuevaCabeza: baños a las 12:00 y luego cada 23 h, sin contactos, días ni veterinario',()=>{
  const rng=C.azar(3),e=C.nuevaCabeza('nino',rng),banos=[],otros=new Set();
  for(let i=0;i<3*1440;i++){
    C.avanzar(e,1,rng,'nino').forEach(x=>{if(x.tipo==='bano')banos.push(e.min);else if(!['hora','bano-fin','peinado'].includes(x.tipo))otros.add(x.tipo)});
  }
  assert.deepEqual(banos,[m(1,12),m(1,12)+23*60,m(1,12)+46*60]);
  assert.deepEqual([...otros],[]);
  assert.equal(e.hu.nino.adultas,1,'la cabeza activa no usa la versión estadística');
});

test('nuevaCabeza: el joven no desbloquea habilidades',()=>{
  const rng=C.azar(4),e=C.nuevaCabeza('joven',rng);
  e.hu.joven.adultas=12;
  const ev=C.avanzar(e,120,rng,'joven');
  assert.ok(!ev.some(x=>x.tipo==='habilidad'));
  assert.ok(!C.HABILIDADES.some(h=>e.hab[h]));
});

test('metaCabeza: victoria, 12 adultas con 1 baño y derrota',()=>{
  const e=C.nuevaCabeza('mama',C.azar(5)),hu=e.hu.mama;
  assert.equal(R.FP_BANOS,2);assert.equal(R.FP_ADULTAS,10);
  hu.adultas=12;
  assert.equal(C.metaCabeza(e,'mama',1),null,'12 adultas con 1 baño: sigue');
  assert.equal(C.metaCabeza(e,'mama',2),'victoria');
  hu.adultas=9;assert.equal(C.metaCabeza(e,'mama',2),null);
  hu.adultas=10;assert.equal(C.metaCabeza(e,'mama',2),'victoria');
  hu.adultas=0;hu.huevos=2;assert.equal(C.metaCabeza(e,'mama',2),null,'sin adultas pero con huevos: sigue');
  hu.huevos=0;assert.equal(C.metaCabeza(e,'mama',0),'derrota');
});

test('rotarEntrada: con la mirada 90 grados a la derecha, adelante es la derecha del mundo',()=>{
  const cerca=(a,b)=>assert.ok(Math.abs(a.x-b.x)<1e-9&&Math.abs(a.y-b.y)<1e-9,JSON.stringify([a,b]));
  cerca(C.rotarEntrada({x:0,y:-1},0),{x:0,y:-1});
  cerca(C.rotarEntrada({x:0,y:-1},Math.PI/2),{x:1,y:0});
  cerca(C.rotarEntrada({x:1,y:0},Math.PI/2),{x:0,y:1});
  cerca(C.rotarEntrada({x:0,y:-1},Math.PI),{x:0,y:1});
  cerca(C.rotarEntrada({x:0,y:0},1.3),{x:0,y:0});
});
