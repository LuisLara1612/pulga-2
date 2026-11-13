/* ---------- Modo Primera persona: una cabeza en 3D desde los ojos de la pulga ----------
   La lógica es la misma del motor (juego.js) y las reglas de Casa (casa-sim.js, casa.js):
   aquí solo cambia cómo se dibuja y cómo se controla. Posición del motor (x, y) -> 3D (x, altura, y). */
const FP_URL='https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.module.min.js';
const FP_CAM=9.5;            /* altura de los ojos sobre la piel */
const FP_ESPUMA=13;          /* altura de la espuma: queda arriba de los ojos */
const FP_CELDA=3.4;            /* un pelo suelto por celda del mundo */
const FP_MAX_PELO=2200;
const FP_PISTAS={
  mama:'poca comida y muchas uñas',
  papa:'pelo corto, uñas certeras y secadora',
  joven:'gel que frena, sudor y grasa',
  nino:'mucha comida y mechones grandes',
  nina:'mucha comida y pelo largo'
};
let T3=null;                 /* módulo de Three.js, cargado solo al entrar al modo */
const FP={listo:false,nivel:0,radio:80,niebla:78,acc:0,n:0,tPrev:0,mapaT:0,cx:0,cy:18,yawVis:0,baja:0,sube:0,ultimo:null,W:1,H:1};
let fpMira=null;             /* puntero que gira la mirada */

/* ---------- Carga diferida ---------- */
async function fpCargar(){
  if(!T3){
    const c=document.createElement('canvas');
    if(!(c.getContext('webgl2')||c.getContext('webgl')))throw new Error('webgl');
    T3=await import(FP_URL);
  }
  if(!FP.listo){try{fpMontar()}catch(err){throw new Error('webgl')}}
}
async function fpAbrir(){
  audioOn();
  sheet(`<div class="eyebrow">Primera persona</div><h2>Cargando el modo 3D</h2><p>Un momento: se está descargando la parte 3D del juego.</p>`);
  try{await fpCargar()}
  catch(err){
    const sin3d=err&&err.message==='webgl';
    sheet(`<div class="eyebrow">Primera persona</div><h2>${sin3d?'Este navegador no puede dibujar en 3D':'El modo 3D necesita conexión'}</h2>
    <p>${sin3d?'Prueba con otro navegador o con otro dispositivo.':'La primera vez hay que descargar la parte 3D. Revisa tu conexión e inténtalo de nuevo.'} Los modos Casa y Clásico funcionan igual.</p>
    <div class="actions"><button class="btn" id="bIni">Volver al inicio</button></div>`);
    $('bIni').onclick=closeSheet;
    return;
  }
  fpElegir();
}
$('btnFp').onclick=fpAbrir;

/* ---------- Elección de cabeza ---------- */
function fpElegir(){
  sheet(`<div class="eyebrow">Primera persona</div><h2>Elige la cabeza</h2>
  <p class="goal">Meta: sobrevive ${RG.FP_BANOS} baños y junta ${RG.FP_ADULTAS} pulgas adultas después del segundo.</p>
  <p>Empiezas con una sola pulga. El primer baño llega en 1 minuto. Esta partida no se guarda.</p>
  <div class="pets">${Casa.PERSONAS.map(id=>`<button data-c="${id}"><b>${nombre(id)}</b><span>${Casa.GRUPO_TXT[Casa.grupo(id)]}: ${FP_PISTAS[id]}</span></button>`).join('')}</div>
  <div class="actions"><button class="btn alt" id="bBack">Volver</button></div>`);
  $('sheetBody').querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>fpNueva(b.dataset.c));
  $('bBack').onclick=()=>{if(G&&G.fp)fpSalir();else closeSheet()};
}

/* ---------- Partida ---------- */
function fpNueva(id){
  const e=Casa.nuevaCabeza(id,Math.random),L=casaPerfil(id,e);
  casaOn=false;mode='play';
  G=newGame(L,false,{e,id,grupo:Casa.grupo(id),reserva:0,comida:[],comidaT:3,ef:{},saltoHasta:0,camHasta:0,lensHasta:0,avisoBano:0,sinHabilidades:true});
  G.tut=-1;G.fp={yaw:0,banos:0};
  /* nace en piel despejada, cerca del centro, mirando hacia donde hay más cabeza por delante */
  let ini={x:0,y:18};
  for(let d=0;d<70;d+=6){let ok=null;for(let i=0;i<12&&!ok;i++){const a=i/12*TAU,x=Math.cos(a)*d,y=18+Math.sin(a)*d;if(hyp(x,y)<70&&G.w.tufts.every(t=>hyp(t.x-x,t.y-y)>t.r+7)&&G.w.gels.every(z=>hyp(z.x-x,z.y-y)>z.r+4))ok={x,y}}if(ok){ini=ok;break}}
  G.fp.yaw=Math.atan2(-ini.x,ini.y);
  const p=makeFlea(ini.x,ini.y,false);p.shield=false;p.a=Math.atan2(-ini.y,-ini.x);G.fleas.push(p);G.player=p;
  closeSheet();showOnly(null);
  $('app').classList.add('fp');
  $('hud').hidden=false;$('btnEgg').hidden=false;$('btnJump').hidden=true;$('btnCasa').hidden=true;$('efChip').hidden=false;
  $('enWrap').hidden=true;$('patWrap').hidden=true;$('btnHab').hidden=true;
  $('hudWho').textContent=nombre(id);
  const fino=matchMedia('(pointer:fine)').matches;
  $('hint').textContent=fino?'W, A, S, D: caminar · Arrastra el mouse: mirar · Quieta: picas':'Lado izquierdo: caminar · Lado derecho: mirar · Quieta: picas';
  $('hint').hidden=false;
  lastHud={};keys.clear();joy=null;fpMira=null;
  Object.assign(FP,{cx:p.x,cy:p.y,yawVis:G.fp.yaw,baja:0,sube:0,ultimo:p,acc:0,n:0,mapaT:0});
  fpEscena(L);
  layout();fpTam();fpLugar();audioOn();
  toast('Meta: sobrevive '+RG.FP_BANOS+' baños y junta '+RG.FP_ADULTAS+' adultas',false,3.2);
}
function fpSalir(){
  $('app').classList.remove('fp');$('fpJoy').hidden=true;
  joy=null;fpMira=null;G=null;closeSheet();startAttract();refreshTitle();
}
function fpTotal(){return adults()+G.casa.reserva}
function fpColonia(){
  const a=fpTotal(),e=G.eggs.length;
  return 'Adultas: '+a+' de '+RG.FP_ADULTAS+(e?' · '+plural(e,'huevo','huevos'):'')+' · Baños: '+G.fp.banos+' de '+RG.FP_BANOS;
}
function fpLugar(){
  const e=G.casa.e,hu=e.hu[G.casa.id],m=hu.proxBano-e.min;
  setTxt($('hudPlace'),'cplace',Casa.textoDia(e.min)+' · '+Casa.textoHora(e.min)+' · '+(hu.banoHasta>e.min?'en el baño':'baño en '+Casa.horas(m)));
}
/* Reloj y eventos de higiene de la cabeza. update(dt) lo sigue llamando frame(). */
function fpTick(dt){
  const F=G.fp,C=G.casa,e=C.e,hu=e.hu[C.id];
  if(G.overT>0)return;
  Casa.aConteo(hu,adults(),C.reserva,G.eggs.length);
  const ev=Casa.avanzar(e,dt*Casa.minutosPorSeg(VEL),Math.random,C.id);
  for(const x of ev){
    if(x.tipo==='bano')casaBanoCabeza();
    else if(x.tipo==='bano-fin'){casaTiradaBano();if(fpTotal()>0)F.banos++}
    else if(x.tipo==='peinado')casaPeinadoCabeza(x.gel);
  }
  Casa.aConteo(hu,adults(),C.reserva,G.eggs.length);
  fpLugar();
  if($('hint').hidden===false&&G.t>10)$('hint').hidden=true;
  if(Casa.metaCabeza(e,C.id,F.banos)==='victoria')fpFinal('victoria');
}
function fpDerrota(){fpFinal('derrota')}
function fpFinal(r){
  const e=G.casa.e,id=G.casa.id,horas=Math.max(0,Math.round((e.min-RG.INICIO_MIN)/60));
  mode='over';joy=null;fpMira=null;keys.clear();$('fpJoy').hidden=true;$('hint').hidden=true;
  if(r==='victoria'){SFX.win();sheet(`<div class="eyebrow">${Casa.textoDia(e.min)} · ${Casa.textoHora(e.min)}</div><h2>La cabeza de ${nombre(id)} es tuya</h2>
    <p>Tu colonia sobrevivió ${RG.FP_BANOS} baños y llegó a ${RG.FP_ADULTAS} pulgas adultas.</p>
    <div class="stats"><div><b>${Casa.textoHora(e.min)}</b><span>${Casa.textoDia(e.min)}</span></div><div><b>${fpTotal()}</b><span>Adultas</span></div><div><b>${G.lost}</b><span>Perdidas</span></div></div>`+fpFinBotones())}
  else{SFX.die();sheet(`<div class="eyebrow">Colonia eliminada</div><h2>${nombre(id)} quedó sin pulgas</h2>
    <p>No quedó ninguna pulga ni huevo. Antes del baño, escóndete en un mechón o detrás de las orejas, y deja huevos dentro de los mechones.</p>
    <div class="stats"><div><b>${horas} h</b><span>Aguantaste (del juego)</span></div><div><b>${G.fp.banos}</b><span>Baños</span></div><div><b>${G.lost}</b><span>Perdidas</span></div></div>`+fpFinBotones())}
  $('bOtra').onclick=fpElegir;
  $('bIni').onclick=fpSalir;
}
const fpFinBotones=()=>`<div class="actions"><button class="btn" id="bOtra">Jugar otra vez</button><button class="btn alt" id="bIni">Volver al inicio</button></div>`;
function fpPausa(){
  if(mode!=='play')return;
  mode='paused';joy=null;fpMira=null;keys.clear();$('fpJoy').hidden=true;
  const e=G.casa.e,fino=matchMedia('(pointer:fine)').matches;
  sheet(`<div class="eyebrow">${Casa.textoDia(e.min)} · ${Casa.textoHora(e.min)}</div><h2>Pausa</h2>
  <p>El reloj está detenido. ${fino?'Camina con W, A, S, D o las flechas y arrastra el mouse para mirar. E pone un huevo.':'Arrastra en el lado izquierdo para caminar y en el derecho para mirar.'} Si te quedas quieta, picas.</p>
  <p class="goal">Meta: sobrevive ${RG.FP_BANOS} baños y junta ${RG.FP_ADULTAS} adultas.</p>
  <div class="actions"><button class="btn" id="bRes">Seguir</button><button class="btn alt" id="bOtra">Elegir otra cabeza</button><button class="btn alt" id="bIni">Salir al inicio</button></div>`);
  $('bRes').onclick=()=>{closeSheet();mode='play';lastT=performance.now()};
  $('bOtra').onclick=fpElegir;
  $('bIni').onclick=fpSalir;
}

/* ---------- Controles: mitad izquierda camina, mitad derecha (o el mouse) gira la mirada ---------- */
(()=>{
  const c=$('fp');
  c.addEventListener('pointerdown',e=>{
    audioOn();if(mode!=='play'||!G||!G.fp)return;
    const b=c.getBoundingClientRect(),izq=e.clientX-b.left<b.width/2;
    if(e.pointerType==='mouse'||!izq){if(!fpMira)fpMira={id:e.pointerId,x:e.clientX,k:e.pointerType==='mouse'?.005:.008}}
    else if(!joy)joy={id:e.pointerId,sx:e.clientX,sy:e.clientY,x:e.clientX,y:e.clientY};
    try{c.setPointerCapture(e.pointerId)}catch(_){}
    e.preventDefault();
  });
  c.addEventListener('pointermove',e=>{
    if(joy&&e.pointerId===joy.id){
      joy.x=e.clientX;joy.y=e.clientY;
      const dx=joy.x-joy.sx,dy=joy.y-joy.sy,m=hyp(dx,dy);if(m>50){joy.sx+=dx/m*(m-50);joy.sy+=dy/m*(m-50)}
    }else if(fpMira&&e.pointerId===fpMira.id){
      if(G&&G.fp&&mode==='play')G.fp.yaw+=(e.clientX-fpMira.x)*fpMira.k;
      fpMira.x=e.clientX;
    }
  });
  const fin=e=>{if(joy&&e.pointerId===joy.id)joy=null;if(fpMira&&e.pointerId===fpMira.id)fpMira=null};
  c.addEventListener('pointerup',fin);c.addEventListener('pointercancel',fin);
  addEventListener('blur',()=>{fpMira=null});
  new ResizeObserver(()=>fpTam()).observe($('app'));
})();

/* ---------- Escena ---------- */
const fpAlt=d=>d>80?-.05*(d-80)*(d-80):0;                 /* la piel cae hacia el borde: horizonte */
function fpAzar(i,j,k){let n=Math.imul(i,374761393)+Math.imul(j,668265263)+Math.imul(k,1274126177)|0;n=Math.imul(n^n>>>13,1274126177);return((n^n>>>16)>>>0)/4294967296}
function fpMontar(){
  const ren=new T3.WebGLRenderer({canvas:$('fp'),antialias:true,powerPreference:'high-performance'});
  FP.ren=ren;FP.scene=new T3.Scene();
  FP.cam=new T3.PerspectiveCamera(80,1,.4,700);FP.cam.rotation.order='YXZ';
  FP.aux=new T3.Object3D();FP.col=new T3.Color();
  /* geometrías compartidas */
  FP.gEsf=new T3.SphereGeometry(1,14,10);
  FP.gCaja=new T3.BoxGeometry(1,1,1);
  FP.gPlano=new T3.PlaneGeometry(1,1);FP.gPlano.rotateX(-Math.PI/2);
  const tallo=new T3.CylinderGeometry(.3,1,1,5,4,true);tallo.translate(0,.5,0);
  const tp=tallo.attributes.position;for(let i=0;i<tp.count;i++){const y=tp.getY(i);tp.setX(i,tp.getX(i)+5*y*y)}
  tallo.computeVertexNormals();FP.gTallo=tallo;
  const NR=36,NS=72,RM=150,pos=[],idx=[];
  for(let i=0;i<=NR;i++){const r=RM*i/NR;for(let j=0;j<NS;j++){const a=j/NS*TAU;pos.push(Math.cos(a)*r,fpAlt(r),Math.sin(a)*r)}}
  for(let i=0;i<NR;i++)for(let j=0;j<NS;j++){const a=i*NS+j,b=i*NS+(j+1)%NS,c=a+NS,d=b+NS;idx.push(a,b,c,b,d,c)}
  FP.gSuelo=new T3.BufferGeometry();FP.gSuelo.setAttribute('position',new T3.Float32BufferAttribute(pos,3));FP.gSuelo.setIndex(idx);FP.gSuelo.computeVertexNormals();
  FP.listo=true;
  fpCalidad(FP.nivel);
}
function fpTam(){
  if(!FP.listo)return;
  const b=$('app').getBoundingClientRect();FP.W=Math.max(1,b.width);FP.H=Math.max(1,b.height);
  FP.ren.setSize(FP.W,FP.H,false);
  const asp=FP.W/FP.H;
  /* en vertical la vista se abre hacia arriba para no perder ancho */
  FP.cam.fov=clamp(2*Math.atan(Math.tan(40*Math.PI/180)/asp)*180/Math.PI,62,96);
  FP.cam.aspect=asp;FP.cam.updateProjectionMatrix();
  FP.hfov=2*Math.atan(Math.tan(FP.cam.fov*Math.PI/360)*asp);
  FP.hudH=$('hud').offsetHeight;
  const top=($('hud').hidden?150:FP.hudH)+4,m=$('fpMapa'),d=Math.min(window.devicePixelRatio||1,2);
  m.style.top=top+'px';m.width=m.height=Math.round(110*d);placeToast(top+2);
}
/* Calidad: solo baja. 1: menos resolución. 2: menos pelo. 3: niebla más cerca. */
function fpCalidad(n){
  FP.nivel=n;
  FP.ren.setPixelRatio(n>=1?1:Math.min(window.devicePixelRatio||1,1.5));
  FP.radio=n>=3?44:n>=2?54:74;FP.niebla=n>=3?48:78;
  if(FP.scene.fog){FP.scene.fog.near=FP.niebla*.35;FP.scene.fog.far=FP.niebla}
  if(FP.mech)FP.mech.count=Math.round(FP.mechN*(n>=2?.6:1));
  $('app').dataset.fpCalidad=n;
}
function fpMedir(ms){
  if(FP.fijo)return;                 /* solo para pruebas: deja la calidad fija */
  FP.acc+=ms;FP.n++;
  if(FP.acc<2000)return;
  const prom=FP.acc/FP.n;FP.acc=0;FP.n=0;
  if(prom>33&&FP.nivel<3)fpCalidad(FP.nivel+1);
}
function fpMat(color,o){return new T3.MeshLambertMaterial(Object.assign({color},o||{}))}
function fpMalla(geo,mat,sx,sy,sz){const m=new T3.Mesh(geo,mat);m.scale.set(sx,sy,sz);return m}
function fpPulga(){
  const g=new T3.Group(),m=fpMat(0x4a2016),osc=FP.mOsc;
  const cuerpo=fpMalla(FP.gEsf,m,4.6,3,3);cuerpo.position.set(-.8,3.7,0);g.add(cuerpo);
  const cab=fpMalla(FP.gEsf,osc,1.8,1.6,1.6);cab.position.set(3.9,3.2,0);g.add(cab);
  for(let i=0;i<3;i++)[-1,1].forEach(s=>{const p=fpMalla(FP.gCaja,osc,.4,4.2,.4);p.position.set(-2.2+i*2.3,1.8,s*2.9);p.rotation.x=s*.55;g.add(p)});
  [-1,1].forEach(s=>{const o=fpMalla(FP.gEsf,FP.mOjo,.45,.45,.45);o.position.set(4.9,3.8,s*.8);g.add(o)});
  g.userData.m=m;g.visible=false;return g;
}
function fpEscena(L){
  const sc=FP.scene;
  /* limpia la partida anterior */
  while(sc.children.length)sc.remove(sc.children[0]);
  (FP.basura||[]).forEach(x=>x.dispose());FP.basura=[];
  const guarda=x=>{FP.basura.push(x);return x};
  const fondo=new T3.Color(shade(L.bg?L.bg[0]:'#333333',.3));
  sc.background=fondo;sc.fog=new T3.Fog(fondo,FP.niebla*.35,FP.niebla);
  sc.add(new T3.HemisphereLight(0xfff4e6,new T3.Color(shade(L.skin,-.45)),1.9));
  const sol=new T3.DirectionalLight(0xfff0dd,1.2);sol.position.set(60,120,40);sc.add(sol);
  FP.mOsc=guarda(fpMat(0x24100b));FP.mOjo=guarda(new T3.MeshBasicMaterial({color:0xfff3d6}));
  const mPiel=guarda(fpMat(L.skin,{side:T3.DoubleSide}));
  sc.add(new T3.Mesh(FP.gSuelo,mPiel));
  /* referencias: orejas a los lados, nariz al frente (-y) y cuello de la camisa en la nuca (+y) */
  const mRef=guarda(fpMat(new T3.Color(shade(L.skin,-.12)),{fog:false}));
  [-1,1].forEach(s=>{const o=fpMalla(FP.gEsf,mRef,11,30,18);o.position.set(s*106,-6,-4);sc.add(o)});
  const nariz=fpMalla(FP.gEsf,mRef,12,16,10);nariz.position.set(0,-14,-108);sc.add(nariz);
  const cuello=fpMalla(FP.gCaja,guarda(fpMat(L.shirt,{fog:false})),230,46,26);cuello.position.set(0,-34,128);sc.add(cuello);
  /* pelo suelto: parche alrededor de la cámara, se rellena cada cuadro */
  const mPelo=guarda(fpMat(0xffffff));
  FP.pelo=new T3.InstancedMesh(FP.gTallo,mPelo,FP_MAX_PELO);FP.pelo.frustumCulled=false;FP.pelo.count=0;sc.add(FP.pelo);
  FP.cPelo=new T3.Color(shade(L.hair,.1));FP.cPelo2=new T3.Color(shade(L.hair,.4));
  FP.largo=clamp((L.len[0]+L.len[1])/17,.72,1.25);
  /* mechones: matorrales densos y oscuros, leídos de la lógica */
  const lista=[];
  G.w.tufts.forEach(t=>{const q=seeded(t.seed),n=Math.round(t.r*t.r*.8);for(let i=0;i<n;i++){const a=q()*TAU,d=Math.sqrt(q())*t.r*.97;lista.push([t.x+Math.cos(a)*d,t.y+Math.sin(a)*d,q(),q(),q()])}});
  const q=seeded(77);for(let i=lista.length-1;i>0;i--){const j=q()*(i+1)|0;[lista[i],lista[j]]=[lista[j],lista[i]]}
  FP.mechN=lista.length;
  if(lista.length){
    const mMech=guarda(fpMat(new T3.Color(shade(L.hair,-.35))));
    FP.mech=new T3.InstancedMesh(FP.gTallo,mMech,lista.length);FP.mech.frustumCulled=false;
    const o=FP.aux;
    lista.forEach(([x,y,a,b,c],i)=>{
      o.position.set(x,fpAlt(hyp(x,y))-.5,y);o.rotation.set((a-.5)*.5,b*TAU,(c-.5)*.5);
      const s=.3+a*.2;o.scale.set(s,(22+b*10)*FP.largo,s);o.updateMatrix();FP.mech.setMatrixAt(i,o.matrix);
    });
    FP.mech.count=Math.round(FP.mechN*(FP.nivel>=2?.6:1));sc.add(FP.mech);
    const mSombra=guarda(new T3.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.28,depthWrite:false}));
    const disco=guarda(new T3.CircleGeometry(1,28));disco.rotateX(-Math.PI/2);
    G.w.tufts.forEach(t=>{const m=fpMalla(disco,mSombra,t.r,1,t.r);m.position.set(t.x,fpAlt(hyp(t.x,t.y))+.12,t.y);sc.add(m)});
  }else FP.mech=null;
  /* gel o cera */
  const mGel=guarda(fpMat(0x9fdcff,{transparent:true,opacity:.5,depthWrite:false}));
  const domo=guarda(new T3.SphereGeometry(1,22,8,0,TAU,0,Math.PI/2));
  FP.geles=Array.from({length:6},()=>{const m=new T3.Mesh(domo,mGel);m.visible=false;sc.add(m);return m});
  /* colonia, huevos y comida */
  FP.pulgas=Array.from({length:Casa.MAX_PANTALLA+2},()=>{const g=fpPulga();sc.add(g);return g});
  const mHuevo=guarda(fpMat(0xfff6e6));
  FP.huevos=Array.from({length:RG.TOPE},()=>{const m=new T3.Mesh(FP.gEsf,mHuevo);m.visible=false;sc.add(m);return m});
  const gCom=guarda(new T3.OctahedronGeometry(2.6)),gHaz=guarda(new T3.CylinderGeometry(1.1,1.1,46,6,1,true));
  FP.comida=Array.from({length:4},()=>{
    const g=new T3.Group(),mm=guarda(new T3.MeshBasicMaterial({color:0xffffff})),mh=guarda(new T3.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.22,depthWrite:false,side:T3.DoubleSide}));
    const a=new T3.Mesh(gCom,mm);a.position.y=4;const h=new T3.Mesh(gHaz,mh);h.position.y=23;g.add(a,h);g.userData={a,mm,mh};g.visible=false;sc.add(g);return g});
  /* uñas: franja de aviso en el suelo y dedos que bajan del cielo */
  const mDedo=guarda(fpMat(0xe6ab85,{fog:false})),mUna=guarda(fpMat(0xfff0e0,{fog:false})),gDedo=guarda(new T3.CapsuleGeometry(1,22,4,10));
  FP.unas=Array.from({length:3},()=>{
    const g=new T3.Group(),mf=guarda(new T3.MeshBasicMaterial({color:0x3a0610,transparent:true,opacity:.3,depthWrite:false}));
    const franja=new T3.Mesh(FP.gPlano,mf);franja.position.y=.2;g.add(franja);
    const dedos=[0,1,2,3].map(()=>{const d=new T3.Group(),c=new T3.Mesh(gDedo,mDedo),u=fpMalla(FP.gCaja,mUna,1,1,1);d.add(c,u);d.userData={c,u};g.add(d);return d});
    g.userData={franja,mf,dedos};g.visible=false;sc.add(g);return g});
  /* peine: pared de dientes con un hueco, carril verde en el suelo y puerta verde en el hueco */
  const mPeine=guarda(fpMat(0x25c2b1,{fog:false})),mLomo=guarda(fpMat(0x17907f,{fog:false}));
  const pg=new T3.Group();
  const dientes=new T3.InstancedMesh(FP.gCaja,mPeine,60);dientes.frustumCulled=false;pg.add(dientes);
  const lomo=fpMalla(FP.gCaja,mLomo,290,8,6);lomo.position.y=27;pg.add(lomo);
  const mVerde=guarda(new T3.MeshBasicMaterial({color:0x73f082,transparent:true,opacity:.3,depthWrite:false,side:T3.DoubleSide,fog:false}));
  const puerta=new T3.Mesh(FP.gCaja,mVerde);pg.add(puerta);
  pg.visible=false;sc.add(pg);
  const carril=new T3.Mesh(FP.gPlano,mVerde);carril.visible=false;sc.add(carril);
  FP.peine={g:pg,dientes,puerta,carril};
  /* champú y baño: pared y techo de espuma desde el radio seco hasta el borde */
  const NF=56,gEsp=guarda(new T3.BufferGeometry()),ie=[];
  gEsp.setAttribute('position',new T3.Float32BufferAttribute(new Float32Array(NF*9),3));
  for(let j=0;j<NF;j++){const a=j*3,b=(j+1)%NF*3;ie.push(a,a+1,b,b,a+1,b+1,a+1,a+2,b+1,b+1,a+2,b+2)}
  gEsp.setIndex(ie);
  const mEsp=guarda(new T3.MeshBasicMaterial({color:0xc6f1ef,side:T3.DoubleSide,transparent:true,opacity:.94,fog:false}));
  FP.espuma=new T3.Mesh(gEsp,mEsp);FP.espuma.frustumCulled=false;FP.espuma.visible=false;sc.add(FP.espuma);FP.NF=NF;
  FP.burb=new T3.InstancedMesh(FP.gEsf,guarda(fpMat(0xffffff,{fog:false})),28);FP.burb.frustumCulled=false;FP.burb.visible=false;sc.add(FP.burb);
  const mIsla=guarda(fpMat(L.skin)),gIsla=guarda(new T3.CylinderGeometry(15,18,FP_ESPUMA+3,26)),gAro=guarda(new T3.TorusGeometry(15,.6,6,40));gAro.rotateX(Math.PI/2);
  const mAro=guarda(new T3.MeshBasicMaterial({color:0xffc933,fog:false}));
  FP.islas=Array.from({length:3},()=>{const g=new T3.Group(),c=new T3.Mesh(gIsla,mIsla),a=new T3.Mesh(gAro,mAro);c.position.y=(FP_ESPUMA+3)/2-.5;a.position.y=FP_ESPUMA+2.8;g.add(c,a);g.visible=false;sc.add(g);return g});
  /* secadora: rayas de viento cerca de la cámara y el aparato a contraviento */
  FP.viento=new T3.InstancedMesh(FP.gCaja,guarda(new T3.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.6,depthWrite:false})),70);
  FP.viento.frustumCulled=false;FP.viento.visible=false;sc.add(FP.viento);
  FP.secadora=fpMalla(FP.gCaja,guarda(fpMat(0xec5f9a,{fog:false})),60,44,44);FP.secadora.visible=false;sc.add(FP.secadora);
}

/* ---------- Dibujo de cada cuadro ---------- */
function fpPelo(cx,cy){
  const L=G.L,o=FP.aux,m=FP.pelo,c=FP_CELDA,r=FP.radio,col=FP.col;
  const i0=Math.floor((cx-r)/c),i1=Math.floor((cx+r)/c),j0=Math.floor((cy-r)/c),j1=Math.floor((cy+r)/c);
  let n=0;
  for(let i=i0;i<=i1&&n<FP_MAX_PELO;i++)for(let j=j0;j<=j1&&n<FP_MAX_PELO;j++){
    let x=(i+.12+.76*fpAzar(i,j,1))*c,y=(j+.12+.76*fpAzar(i,j,2))*c;
    const d=hyp(x,y);if(d>R)continue;
    let dx=x-cx,dy=y-cy,dc=hyp(dx,dy);if(dc>r)continue;
    const h=fpAzar(i,j,3);
    if(h>hairDensity(L,x,y))continue;
    /* la pulga aparta los pelos que tiene encima: no atraviesan la cámara */
    if(dc<3.6){if(dc<.01){dx=1;dy=0;dc=1}x=cx+dx/dc*3.6;y=cy+dy/dc*3.6}
    const k=fpAzar(i,j,4);
    o.position.set(x,fpAlt(d)-.4,y);o.rotation.set((h-.5)*.34,k*TAU,(k-.5)*.34);
    const s=.17+h*.12;o.scale.set(s,(15+k*10)*FP.largo,s);o.updateMatrix();
    m.setMatrixAt(n,o.matrix);
    col.copy(FP.cPelo).lerp(FP.cPelo2,fpAzar(i,j,5)*.7);m.setColorAt(n,col);
    n++;
  }
  m.count=n;m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;
}
function fpAmenazas(cx,cy,alto){
  const o=FP.aux,th=G.threats;
  /* uñas */
  const un=th.filter(t=>t.k==='nails');
  FP.unas.forEach((g,i)=>{
    const t=un[i];g.visible=!!t;if(!t)return;
    const u=g.userData,gap=t.w/4;
    g.position.set(t.x,fpAlt(hyp(t.x,t.y)),t.y);g.rotation.y=-t.a;
    u.franja.scale.set(t.len,1,t.w);
    let tx,ty,al=1;
    if(t.stage===0){const k=clamp(t.t/t.warn,0,1);u.mf.opacity=.22+k*.4+.12*Math.sin(t.t*18)**2;tx=-t.len*.2;ty=lerp(95,15,k)}
    else{const q=clamp((t.t-t.warn)/.55,0,1);u.mf.opacity=.5*(1-q);
      if(q<.3){tx=lerp(-t.len/2,t.len/2,q/.3);ty=lerp(15,0,Math.min(1,q/.12))}else{tx=t.len/2;ty=lerp(0,70,(q-.3)/.7)}}
    u.dedos.forEach((d,j)=>{
      const rr=gap*.42;d.position.set(tx,ty,-t.w/2+gap*(j+.5));
      d.userData.c.scale.set(rr,2.6,rr);d.userData.c.position.y=rr+28.6;
      d.userData.u.scale.set(rr*1.5,rr*1.7,rr*1.4);d.userData.u.position.set(rr*.5,rr*.9,0);
    });
  });
  /* peine */
  const cb=th.find(t=>t.k==='comb'),P=FP.peine;
  P.g.visible=!!cb&&cb.t>=cb.warn;P.carril.visible=!!cb;
  if(cb){
    const ejeY=cb.axis==='y';
    P.carril.position.set(ejeY?cb.g:0,.35,ejeY?0:cb.g);P.carril.scale.set(ejeY?cb.gap:R*2,1,ejeY?R*2:cb.gap);
    if(P.g.visible){
      P.g.position.set(ejeY?0:cb.pos,0,ejeY?cb.pos:0);P.g.rotation.y=ejeY?0:-Math.PI/2;
      let n=0;
      for(let x=-138;x<140&&n<60;x+=5.2){
        if(Math.abs(x-cb.g)<cb.gap/2)continue;
        o.position.set(x+1.3,4,0);o.rotation.set(0,0,0);o.scale.set(1.5,46,2.6);o.updateMatrix();P.dientes.setMatrixAt(n++,o.matrix);
      }
      P.dientes.count=n;P.dientes.instanceMatrix.needsUpdate=true;
      P.puerta.position.set(cb.g,10,0);P.puerta.scale.set(cb.gap,30,.3);
    }
  }
  /* champú y baño */
  const sh=th.find(t=>t.k==='shampoo'||t.k==='bano');
  let bajoAgua=false;
  const r=sh?Math.max(0,sh.r==null?124:sh.r):999;
  FP.espuma.visible=!!sh&&r<R+24;
  FP.islas.forEach((g,i)=>{const s=sh&&sh.spots[i];g.visible=!!s;if(s)g.position.set(s.x,fpAlt(hyp(s.x,s.y)),s.y)});
  if(FP.espuma.visible){
    const p=FP.espuma.geometry.attributes.position,NF=FP.NF,base=fpAlt(r)-1;
    for(let j=0;j<NF;j++){
      const a=j/NF*TAU,c=Math.cos(a),s=Math.sin(a),w=.8*Math.sin(j*2.1+G.t*3);
      p.setXYZ(j*3,c*r,base,s*r);p.setXYZ(j*3+1,c*r,FP_ESPUMA+w,s*r);p.setXYZ(j*3+2,c*160,FP_ESPUMA,s*160);
    }
    p.needsUpdate=true;
    FP.burb.visible=r>1;
    if(r>1){for(let i=0;i<28;i++){const a=i/28*TAU+G.t*.2,b=2.2+1.6*Math.sin(i*7.3+G.t*3);o.position.set(Math.cos(a)*r,FP_ESPUMA-1+Math.sin(i*3.1)*3,Math.sin(a)*r);o.rotation.set(0,0,0);o.scale.setScalar(Math.abs(b)+1.2);o.updateMatrix();FP.burb.setMatrixAt(i,o.matrix)}FP.burb.instanceMatrix.needsUpdate=true}
    bajoAgua=hyp(cx,cy)>=r&&alto<FP_ESPUMA;
  }else FP.burb.visible=false;
  /* secadora */
  const dr=th.find(t=>t.k==='dryer');
  FP.viento.visible=FP.secadora.visible=!!dr;
  if(dr){
    const dx=Math.cos(dr.a),dy=Math.sin(dr.a),k=dr.t<dr.warn?dr.t/dr.warn*.45:1,q=seeded(dr.seed*1000|0);
    FP.viento.material.opacity=.65*k;
    for(let i=0;i<70;i++){
      const off=q()*110-55,ph=q(),vel=.9+q()*.9,al=2+q()*20,tt=((G.t*vel+ph)%1)*130-65,l=6+q()*10;
      o.position.set(cx-dy*off+dx*tt,al,cy+dx*off+dy*tt);o.rotation.set(0,-dr.a,0);o.scale.set(l,.22,.22);o.updateMatrix();FP.viento.setMatrixAt(i,o.matrix);
    }
    FP.viento.instanceMatrix.needsUpdate=true;
    FP.secadora.position.set(-dx*(R+34),34,-dy*(R+34));FP.secadora.rotation.y=-dr.a;
  }
  return bajoAgua;
}
/* Flechas en el borde para lo que queda fuera de la vista. */
function fpFlechas(cx,cy,yaw){
  const p=G.player,lista=[];
  if(p&&mode==='play'){
    G.threats.forEach(t=>{
      if(t.k==='nails'){if(t.stage===0)lista.push([t.x,t.y,'peligro'])}
      else if(t.k==='comb'){const pos=t.t<t.warn?-t.dir*128:t.pos;lista.push(t.axis==='y'?[cx,pos,'peligro']:[pos,cy,'peligro'])}
      else if(t.k==='dryer')lista.push([cx-Math.cos(t.a)*60,cy-Math.sin(t.a)*60,'peligro']);
      else if(!p.hidden){
        /* champú: la isla seca más cercana. Baño: el mechón más cercano. */
        const zs=t.k==='shampoo'?t.spots:G.w.tufts;let b=null,bd=1e9;
        zs.forEach(z=>{const d=hyp(z.x-cx,z.y-cy);if(d<bd){bd=d;b=z}});
        if(b&&bd>b.r*.6)lista.push([b.x,b.y,'refugio']);
      }
    });
  }
  const els=$('fpFlechas').children,mit=FP.hfov/2*.86,top=$('hud').offsetHeight,cyP=top+(FP.H-top-92)/2;
  for(let i=0;i<els.length;i++){
    const el=els[i],t=lista[i];
    if(!t){if(!el.hidden)el.hidden=true;continue}
    const rel=angDiff(Math.atan2(t[0]-cx,-(t[1]-cy)),yaw);
    if(Math.abs(rel)<mit||hyp(t[0]-cx,t[1]-cy)<6){if(!el.hidden)el.hidden=true;continue}
    const x=FP.W/2+Math.sin(rel)*(FP.W/2-30),y=cyP-Math.cos(rel)*(FP.H-top-92)*.36;
    el.hidden=false;el.className=t[2];
    el.style.transform=`translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotate(${rel.toFixed(3)}rad)`;
  }
}
function fpMinimapa(yaw){
  const cvm=$('fpMapa'),c=cvm.getContext('2d'),s=cvm.width/220,L=G.L;
  c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,cvm.width,cvm.height);
  c.setTransform(s,0,0,s,cvm.width/2,cvm.height/2);
  c.save();c.beginPath();c.arc(0,0,R+6,0,TAU);c.clip();
  c.fillStyle=L.skin;c.globalAlpha=.92;c.beginPath();c.arc(0,0,R,0,TAU);c.fill();c.globalAlpha=1;
  c.fillStyle=hexA(L.hair,.75);G.w.tufts.forEach(t=>{c.beginPath();c.arc(t.x,t.y,t.r,0,TAU);c.fill()});
  c.fillStyle='rgba(120,200,255,.7)';G.w.gels.forEach(z=>{c.beginPath();c.arc(z.x,z.y,z.r,0,TAU);c.fill()});
  G.threats.forEach(t=>{
    if(t.k==='shampoo'||t.k==='bano'){
      const r=Math.max(0,t.r==null?124:t.r);
      c.fillStyle='rgba(198,241,239,.9)';c.beginPath();c.arc(0,0,R+6,0,TAU);if(r>0)c.arc(0,0,r,0,TAU,true);c.fill('evenodd');
      c.strokeStyle='#ffc933';c.lineWidth=3;t.spots.forEach(z=>{c.fillStyle=L.skin;c.beginPath();c.arc(z.x,z.y,z.r,0,TAU);c.fill();c.stroke()});
    }else if(t.k==='comb'){
      const ejeY=t.axis==='y';
      c.fillStyle='rgba(115,240,130,.45)';if(ejeY)c.fillRect(t.g-t.gap/2,-R,t.gap,R*2);else c.fillRect(-R,t.g-t.gap/2,R*2,t.gap);
      const pos=t.t<t.warn?-t.dir*(R+2):t.pos;
      c.strokeStyle='#17907f';c.lineWidth=7;c.beginPath();if(ejeY){c.moveTo(-R,pos);c.lineTo(R,pos)}else{c.moveTo(pos,-R);c.lineTo(pos,R)}c.stroke();
    }else if(t.k==='nails'){
      c.save();c.translate(t.x,t.y);c.rotate(t.a);c.fillStyle=t.stage===0?`rgba(224,33,63,${.45+.4*Math.sin(t.t*18)**2})`:'rgba(120,10,25,.8)';c.fillRect(-t.len/2,-t.w/2,t.len,t.w);c.restore();
    }else if(t.k==='dryer'){
      c.strokeStyle='rgba(255,255,255,.85)';c.lineWidth=4;const dx=Math.cos(t.a),dy=Math.sin(t.a);
      for(let i=-1;i<=1;i++){const ox=-dy*i*38,oy=dx*i*38;c.beginPath();c.moveTo(ox-dx*40,oy-dy*40);c.lineTo(ox+dx*40,oy+dy*40);c.lineTo(ox+dx*40-(dx-dy)*12,oy+dy*40-(dy+dx)*12);c.stroke()}
    }
  });
  c.restore();
  c.strokeStyle='rgba(22,7,9,.85)';c.lineWidth=4;c.beginPath();c.arc(0,0,R,0,TAU);c.stroke();
  G.casa.comida.forEach(k=>{c.fillStyle=COMIDA_COL[k.tipo];c.strokeStyle='#1d0a08';c.lineWidth=1.5;c.beginPath();c.arc(k.x,k.y,6,0,TAU);c.fill();c.stroke()});
  c.fillStyle='#fff6e6';c.strokeStyle='#8a6a58';c.lineWidth=1;G.eggs.forEach(e=>{c.beginPath();c.arc(e.x,e.y,3.6,0,TAU);c.fill();c.stroke()});
  c.fillStyle='#3b1a12';G.fleas.forEach(f=>{if(f.alive&&f!==G.player){c.beginPath();c.arc(f.x,f.y,4.4,0,TAU);c.fill()}});
  const x=G.player?G.player.x:FP.cx,y=G.player?G.player.y:FP.cy;
  c.save();c.translate(x,y);c.rotate(yaw);c.fillStyle='#ffc933';c.strokeStyle='#160709';c.lineWidth=2.5;
  c.beginPath();c.moveTo(0,-15);c.lineTo(10,11);c.lineTo(0,5);c.lineTo(-10,11);c.closePath();c.fill();c.stroke();c.restore();
}
function fpRender(dt){
  if(!FP.listo||!G||!G.fp)return;
  const ahora=performance.now(),real=ahora-FP.tPrev;FP.tPrev=ahora;
  if(mode==='play'&&real<400)fpMedir(real);
  const F=G.fp,p=G.player&&G.player.alive?G.player:null,k=1-Math.exp(-dt*14);
  /* cámara: sigue a la pulga controlada; si solo quedan huevos, espera mirando al más cercano */
  if(p){
    if(p!==FP.ultimo){F.yaw=Math.atan2(Math.cos(p.a),-Math.sin(p.a));FP.ultimo=p}
    FP.cx=lerp(FP.cx,p.x,k);FP.cy=lerp(FP.cy,p.y,k);
  }else{
    FP.ultimo=null;
    let b=null,bd=1e9;G.eggs.forEach(e=>{const d=hyp(e.x-FP.cx,e.y-FP.cy);if(d<bd){bd=d;b=e}});
    if(b&&bd>1&&mode==='play')F.yaw+=angDiff(Math.atan2(b.x-FP.cx,-(b.y-FP.cy)),F.yaw)*(1-Math.exp(-dt*3));
  }
  FP.yawVis+=angDiff(F.yaw,FP.yawVis)*(1-Math.exp(-dt*22));
  const cx=FP.cx,cy=FP.cy,pica=!!(p&&p.biting);
  const enIsla=G.threats.some(t=>t.k==='shampoo'&&t.spots.some(s=>hyp(s.x-cx,s.y-cy)<s.r));
  FP.baja=lerp(FP.baja,pica?2.6:0,1-Math.exp(-dt*8));
  FP.sube=lerp(FP.sube,enIsla?FP_ESPUMA+2.5:0,1-Math.exp(-dt*6));
  const anda=p&&hyp(p.vx||0,p.vy||0)>4,bal=!REDUCED&&anda?Math.sin(p.step*.9)*.3:0;
  const tiembla=!REDUCED&&G.shake?G.shake*.12:0;
  const alto=fpAlt(hyp(cx,cy))+FP_CAM-FP.baja+FP.sube+bal;
  FP.cam.position.set(cx+(tiembla?rand(-tiembla,tiembla):0),alto+(tiembla?rand(-tiembla,tiembla):0),cy);
  FP.cam.rotation.set(-.13-(pica?.1:0),-FP.yawVis,0);
  fpPelo(cx,cy);
  /* gel o cera */
  FP.geles.forEach((m,i)=>{const z=G.w.gels[i];m.visible=!!z;if(z){m.position.set(z.x,fpAlt(hyp(z.x,z.y)),z.y);m.scale.set(z.r,z.r*.22,z.r)}});
  /* colonia: la pulga controlada no se dibuja (son tus ojos) */
  const otras=G.fleas.filter(f=>f.alive&&f!==p);
  FP.pulgas.forEach((g,i)=>{
    const f=otras[i];g.visible=!!f;if(!f)return;
    g.position.set(f.x,fpAlt(hyp(f.x,f.y))+(f.biting?-.6:Math.abs(Math.sin(f.step))*.5),f.y);g.rotation.y=-f.a;
    g.userData.m.color.setHex(f.biting?0xa11230:0x4a2016);
  });
  FP.huevos.forEach((m,i)=>{
    const e=G.eggs[i];m.visible=!!e;if(!e)return;
    const s=1+e.t/HATCH*.3;m.position.set(e.x,fpAlt(hyp(e.x,e.y))+1.5,e.y);m.rotation.y=e.seed;m.scale.set(2.5*s,1.7*s,1.7*s);
  });
  FP.comida.forEach((g,i)=>{
    const c=G.casa.comida[i];g.visible=!!c;if(!c)return;
    g.position.set(c.x,fpAlt(hyp(c.x,c.y))+Math.sin(c.t*4)*.6,c.y);g.userData.a.rotation.y=c.t*2;
    g.userData.mm.color.set(COMIDA_COL[c.tipo]);g.userData.mh.color.set(COMIDA_COL[c.tipo]);
  });
  const bajoAgua=fpAmenazas(cx,cy,alto);
  FP.ren.render(FP.scene,FP.cam);
  /* tintes, palanca, flechas y minimapa (DOM) */
  if($('hud').offsetHeight!==FP.hudH)fpTam();        /* el HUD crece cuando aparecen efectos */
  $('fpPica').style.opacity=pica?.3:0;
  $('fpOculta').style.opacity=p&&p.hidden?.62:0;
  $('fpAgua').style.opacity=bajoAgua?.55:0;
  const j=$('fpJoy');
  if(joy&&mode==='play'){
    const dx=joy.x-joy.sx,dy=joy.y-joy.sy,m=hyp(dx,dy),q=m>30?30/m:1,b=$('app').getBoundingClientRect();
    j.hidden=false;j.style.transform=`translate(${joy.sx-b.left-30}px,${joy.sy-b.top-30}px)`;
    j.firstElementChild.style.transform=`translate(${(dx*q).toFixed(1)}px,${(dy*q).toFixed(1)}px)`;
  }else if(!j.hidden)j.hidden=true;
  fpFlechas(cx,cy,FP.yawVis);
  FP.mapaT-=dt;if(FP.mapaT<=0||mode!=='play'){FP.mapaT=.1;fpMinimapa(FP.yawVis)}
}
