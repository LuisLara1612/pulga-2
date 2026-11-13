/* ---------- Simulación de la casa ----------
   Lógica pura del modo Casa: reloj, rutinas, calendario, colonias por huésped, contagio,
   higiene, veterinario, habilidades, victoria y derrota. No toca el DOM: se prueba con node. */
const Casa=(()=>{
const REGLAS={
  MIN_POR_SEG:6,            /* 1 hora del juego = 10 s reales */
  INICIO_MIN:6*60,          /* la partida empieza el día 1 a las 06:00 */
  BANO_CADA_H:23, BANO_DUR_MIN:40, PEINADO_DUR_MIN:20, BLOQUEO_MIN:30, AVISO_BANO_MIN:60,
  VET_CADA_DIAS:30, VET_HORA:10, AVISO_VET_H:24, VET_FUERA_H:4,
  REVISION_P:.35, REVISION_HORA:11, AVISO_REVISION_MIN:60,
  UMBRAL_INFESTADO:3, TOPE:20,
  HUEVO_P:.07, NACE_P:.5, MUERTE_P:.015,
  BANO_MAX:.9, BANO_ESCONDIDA:.5, FRAC_ESCONDIDA:.3,
  PEINADO_HUEVOS:.6, PEINADO_CRIAS:.6, PEINE_MAMA:.3, REVISION:.55, CERA_P:.35,
  DUR_ADULTO:.6, DUR_HURON:.6, CONTACTO_P:.85,
  METAS_JOVEN:[3,6,9], ENERGIA_INICIO:40, ENERGIA_H:3, ENERGIA_SUDOR:35,
  COSTO:{coraza:40,salto:30,camuflaje:35},
  FP_BANOS:2, FP_ADULTAS:10, FP_PRIMER_BANO_H:6,   /* modo Primera persona */
  grupos:{
    nino:{contagio:.32,dispersion:.45,comida:1.3,banoMuerte:.88},
    joven:{contagio:.18,dispersion:.22,comida:1,banoMuerte:.7},
    adulto:{contagio:.06,dispersion:.1,comida:.5,banoMuerte:.88},
    mascota:{contagio:.22,dispersion:.25,comida:1.2,banoMuerte:0}
  }
};
const PERSONAS=['mama','papa','joven','nino','nina'];
const MASCOTAS=['perro','gato','huron','conejo'];
const HABILIDADES=['coraza','salto','camuflaje'];
const INFO={
  mama:{nombre:'Mamá',grupo:'adulto',edad:38},
  papa:{nombre:'Papá',grupo:'adulto',edad:41},
  joven:{nombre:'Joven',grupo:'joven',edad:15},
  nino:{nombre:'Niño',grupo:'nino',edad:9},
  nina:{nombre:'Niña',grupo:'nino',edad:6},
  perro:{nombre:'Perro',grupo:'mascota',rasgo:'Mucha sangre, pero puede traer collar antipulgas.'},
  gato:{nombre:'Gato',grupo:'mascota',rasgo:'Se lame: los ataques llegan más seguido.'},
  huron:{nombre:'Hurón',grupo:'mascota',rasgo:'Se mueve sin parar: el lomo te empuja y sus contactos son más seguidos, pero cortos.'},
  conejo:{nombre:'Conejo',grupo:'mascota',rasgo:'Tranquilo, pero tiene pocos mechones donde esconderse.'}
};
const GRUPO_TXT={nino:'Niño de 5 a 13 años',joven:'Joven de 14 a 17 años',adulto:'Adulto de 18 a 45 años',mascota:'Mascota'};
const PRIMER_BANO={papa:6.5*60,mama:9*60,joven:17*60,nina:19*60,nino:20*60};
/* [hora, a, b, qué pasa, minutos] — M es la mascota */
const CONTACTOS=[
  [7,'nino','nina','juntan cabezas en el desayuno',100],
  [7.3,'mama','nino','abrazo de despedida',90],
  [7.45,'papa','nina','abrazo de despedida',90],
  [10.5,'nino','nina','juegan en el recreo',90],
  [15.5,'nino','M','carga a la mascota',90],
  [16.2,'nino','nina','juegan en la sala',110],
  [16.8,'joven','nino','videojuegos en la sala',100],
  [17.5,'joven','M','acaricia a la mascota',90],
  [18.2,'mama','nina','abrazo',90],
  [19.5,'papa','joven','juntos en el sofá',90],
  [20.2,'mama','joven','abrazo',90],
  [20.6,'nina','M','acaricia a la mascota',90],
  [21.2,'nino','nina','duermen juntos',130],
  [21.6,'nina','M','la mascota duerme con ella',110],
  [22.5,'mama','papa','abrazo de buenas noches',90]
];

/* azar con semilla (para pruebas) */
function azar(s){return()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function binom(n,p,rng){let k=0;for(let i=0;i<n;i++)if(rng()<p)k++;return k}

/* ---------- Reloj ---------- */
const dia=m=>Math.floor(m/1440)+1;
const hora=m=>(m%1440)/60;
const diaEscuela=d=>(d-1)%7<5;
const DIAS=['lun','mar','mié','jue','vie','sáb','dom'];
function textoHora(m){const mm=Math.floor(m%1440),h=Math.floor(mm/60),n=mm%60;return String(h).padStart(2,'0')+':'+String(n).padStart(2,'0')}
function textoDia(m){const d=dia(m);return 'Día '+d+' ('+DIAS[(d-1)%7]+')'}
function minutosPorSeg(vel){return REGLAS.MIN_POR_SEG*(vel||1)}

const grupo=id=>INFO[id].grupo;
const esPersona=id=>PERSONAS.includes(id);

/* ---------- Rutinas ---------- */
function donde(e,id,m){
  const h=hora(m),esc=diaEscuela(dia(m)),hu=e.hu[id];
  if(hu.fueraHasta>m)return{lugar:'veterinario',cuarto:'veterinario'};
  if(hu.banoHasta>m)return{lugar:'casa',cuarto:'bano'};
  if(id==='nino'||id==='nina'){
    if(esc&&h>=8&&h<14)return{lugar:'escuela',cuarto:'escuela'};
    return{lugar:'casa',cuarto:h>=21||h<7?'cuarto-ninos':h<8?'cocina':'sala'};
  }
  if(id==='joven'){
    if(esc&&h>=7&&h<15)return{lugar:'prepa',cuarto:'prepa'};
    return{lugar:'casa',cuarto:h>=16.5&&h<21?'sala':'cuarto-joven'};
  }
  if(id==='papa'&&esc&&h>=8&&h<17)return{lugar:'trabajo',cuarto:'trabajo'};
  if(id==='mama'||id==='papa')return{lugar:'casa',cuarto:h>=23||h<6?'cuarto-papas':h<8?'cocina':'sala'};
  return{lugar:'casa',cuarto:h>=21||h<7?'cuarto-ninos':'sala'};
}
const LUGAR_TXT={casa:'En casa',escuela:'En la escuela',prepa:'En la prepa',trabajo:'En el trabajo',veterinario:'En el veterinario'};
const CUARTO_TXT={cocina:'Cocina',sala:'Sala',bano:'Baño','cuarto-papas':'Recámara de los papás','cuarto-ninos':'Recámara de los niños','cuarto-joven':'Recámara del joven'};

/* ---------- Partida ---------- */
function huespedVacio(){return{adultas:0,huevos:0,recientes:0,bloqueoHasta:0,banoHasta:0,fueraHasta:0,proxBano:0,gel:false,pielSeca:false}}
function nueva(mascota,rng){
  if(!MASCOTAS.includes(mascota))throw new Error('Mascota desconocida: '+mascota);
  const R=REGLAS,e={version:1,min:R.INICIO_MIN,horaHecha:Math.floor(R.INICIO_MIN/60),mascota,collar:mascota==='perro'&&rng()<.6,
    hu:{},cola:[],contactos:[],hab:{coraza:false,salto:false,camuflaje:false},energia:R.ENERGIA_INICIO,perdidas:0,
    vetMin:(R.VET_CADA_DIAS-1)*1440+R.VET_HORA*60,sig:1};
  [...PERSONAS,mascota].forEach(id=>e.hu[id]=huespedVacio());
  e.hu.nino.adultas=1;
  PERSONAS.forEach(id=>{e.hu[id].proxBano=PRIMER_BANO[id];agendar(e,{t:PRIMER_BANO[id],tipo:'bano',id})});
  agendarVet(e);
  planificarDia(e,1,rng);
  agendar(e,{t:1440,tipo:'dia'});
  return e;
}
/* Partida de una sola cabeza (modo Primera persona): sin mascota, contactos, días ni veterinario. */
function nuevaCabeza(id,rng){
  if(!PERSONAS.includes(id))throw new Error('Cabeza desconocida: '+id);
  const R=REGLAS,e={version:1,soloCabeza:true,min:R.INICIO_MIN,horaHecha:Math.floor(R.INICIO_MIN/60),mascota:null,collar:false,
    hu:{},cola:[],contactos:[],hab:{coraza:false,salto:false,camuflaje:false},energia:0,perdidas:0,vetMin:Infinity,sig:1};
  PERSONAS.forEach(p=>e.hu[p]=huespedVacio());
  e.hu[id].adultas=1;
  const t=R.INICIO_MIN+R.FP_PRIMER_BANO_H*60;
  e.hu[id].proxBano=t;agendar(e,{t,tipo:'bano',id});
  return e;
}
/* 'victoria', 'derrota' o null. banos: baños sobrevividos. hu.adultas debe incluir la reserva. */
function metaCabeza(e,id,banos){
  const R=REGLAS,hu=e.hu[id];
  if(!hu.adultas&&!hu.huevos)return 'derrota';
  if(banos>=R.FP_BANOS&&hu.adultas>=R.FP_ADULTAS)return 'victoria';
  return null;
}
/* Gira la entrada (x derecha, y abajo; "adelante" es y=-1) por la mirada. yaw 0 mira hacia -y; positivo gira a la derecha. */
function rotarEntrada(mv,yaw){const c=Math.cos(yaw),s=Math.sin(yaw);return{x:mv.x*c-mv.y*s,y:mv.x*s+mv.y*c}}
const huespedes=e=>e.mascota?[...PERSONAS,e.mascota]:[...PERSONAS];
function agendar(e,ev){ev.n=e.sig++;let i=e.cola.length;while(i>0&&(e.cola[i-1].t>ev.t))i--;e.cola.splice(i,0,ev)}
function agendarVet(e){agendar(e,{t:e.vetMin-REGLAS.AVISO_VET_H*60,tipo:'aviso-vet'});agendar(e,{t:e.vetMin,tipo:'vet'})}
function planificarDia(e,d,rng){
  const R=REGLAS,base=(d-1)*1440,M=e.mascota;
  const lista=[];
  CONTACTOS.forEach(([h,a,b,tipo,dur])=>{
    a=a==='M'?M:a;b=b==='M'?M:b;
    const dormir=tipo.startsWith('duermen')||tipo.includes('duerme');
    if(!dormir&&rng()>R.CONTACTO_P)return;
    let du=dur;
    if(grupo(a)==='adulto'||grupo(b)==='adulto')du*=R.DUR_ADULTO;
    const pet=a===M||b===M;
    if(pet&&M==='huron')du*=R.DUR_HURON;
    lista.push({t:base+Math.round(h*60+(rng()-.5)*30),a,b,que:tipo,dur:Math.round(du)});
    if(pet&&M==='huron')lista.push({t:base+Math.round(h*60+90+(rng()-.5)*30),a,b,que:tipo,dur:Math.round(du)});
  });
  lista.forEach(c=>{if(c.t>=e.min)agendar(e,Object.assign({tipo:'contacto'},c))});
  if(diaEscuela(d)){
    [['nino',7*60+40],['nina',7*60+50]].forEach(([id,m])=>{if(base+m>=e.min)agendar(e,{t:base+m,tipo:'peinado-mama',id})});
    if(rng()<R.REVISION_P&&base+R.REVISION_HORA*60>=e.min)agendar(e,{t:base+R.REVISION_HORA*60,tipo:'revision'});
  }
}

/* ---------- Colonias ---------- */
function bloqueado(e,id){return e.min<e.hu[id].bloqueoHasta}
function pasoHora(e,id,rng){
  const R=REGLAS,hu=e.hu[id],g=R.grupos[grupo(id)];
  if(!hu.adultas&&!hu.huevos)return;
  const bloq=bloqueado(e,id);
  let nac=0;
  if(!bloq){nac=binom(hu.huevos,R.NACE_P,rng);hu.huevos-=nac;hu.adultas+=nac}
  hu.recientes=nac;
  const muertas=binom(hu.adultas,R.MUERTE_P,rng);hu.adultas-=muertas;e.perdidas+=muertas;
  if(!bloq){const lugar=R.TOPE-hu.adultas-hu.huevos;hu.huevos+=Math.min(Math.max(0,lugar),binom(hu.adultas,R.HUEVO_P*g.comida*(hu.gel?.6:1),rng))}
  if(hu.adultas>R.TOPE)hu.adultas=R.TOPE;
}
/* esc: una entrada por pulga adulta, true si está escondida. Devuelve quién vive. */
function sobrevivenBano(esc,gr,rng){
  const R=REGLAS,g=R.grupos[gr],vive=esc.map(h=>rng()>=g.banoMuerte*(h?R.BANO_ESCONDIDA:1));
  const min=esc.length?Math.max(1,Math.ceil(esc.length*(1-R.BANO_MAX)-1e-9)):0;
  let n=vive.filter(Boolean).length;
  for(const pref of[true,false])for(let i=0;i<esc.length&&n<min;i++)if(!vive[i]&&esc[i]===pref){vive[i]=true;n++}
  return vive;
}
function escondidas(n){const k=Math.round(n*REGLAS.FRAC_ESCONDIDA);return Array.from({length:n},(_,i)=>i<k)}
function banoEstadistico(e,id,rng){
  const hu=e.hu[id],vive=sobrevivenBano(escondidas(hu.adultas),grupo(id),rng),v=vive.filter(Boolean).length;
  e.perdidas+=hu.adultas-v;hu.adultas=v;hu.recientes=Math.min(hu.recientes,v);
}
function peinadoEstadistico(e,id,rng){
  const R=REGLAS,hu=e.hu[id],h=hu.huevos?Math.max(1,binom(hu.huevos,R.PEINADO_HUEVOS,rng)):0,c=binom(Math.min(hu.recientes,hu.adultas),R.PEINADO_CRIAS,rng);
  hu.huevos-=h;hu.adultas-=c;hu.recientes-=c;e.perdidas+=c;
}
function matarAlgunas(e,id,p,rng){const hu=e.hu[id],k=binom(hu.adultas,p,rng);hu.adultas-=k;e.perdidas+=k;return k}
/* Conteo <-> cabeza activa: en pantalla caben MAX_PANTALLA pulgas, el resto queda en reserva. */
const MAX_PANTALLA=14;
function aCabeza(hu){const n=Math.min(hu.adultas,MAX_PANTALLA);return{pantalla:n,reserva:hu.adultas-n,huevos:hu.huevos}}
function aConteo(hu,vivas,reserva,huevos){hu.adultas=vivas+reserva;hu.huevos=huevos;hu.recientes=Math.min(hu.recientes,hu.adultas)}
/* contagio pasivo de "de" hacia "a". La pulga que controla la persona nunca se pasa sola. */
function contagio(e,de,a,rng,activo){
  const R=REGLAS,s=e.hu[de],d=e.hu[a],g=R.grupos[grupo(de)];
  const libres=Math.max(0,s.adultas-(de===activo?1:0));
  const p=g.contagio*clamp(s.adultas/8,.25,1),pd=g.dispersion*(s.pielSeca?2:1);
  let na=binom(libres,p,rng);
  na+=binom(Math.min(s.recientes,libres-na),pd,rng);
  let nh=binom(s.huevos,Math.min(1,pd*.5),rng);
  s.pielSeca=false;
  const cabe=Math.max(0,R.TOPE-d.adultas-d.huevos);
  na=Math.min(na,cabe);nh=Math.min(nh,cabe-na);
  if(!na&&!nh)return null;
  s.adultas-=na;s.huevos-=nh;s.recientes=Math.min(s.recientes,s.adultas);
  d.adultas+=na;d.huevos+=nh;
  return{tipo:'contagio',de,a,adultas:na,huevos:nh};
}

/* ---------- Eventos ---------- */
function procesar(e,ev,rng,activo,out){
  const R=REGLAS,t=ev.t;
  if(ev.tipo==='dia'){planificarDia(e,dia(t),rng);agendar(e,{t:t+1440,tipo:'dia'});out.push({tipo:'dia',dia:dia(t)});return}
  if(ev.tipo==='bano'){
    const hu=e.hu[ev.id];hu.banoHasta=t+R.BANO_DUR_MIN;hu.gel=false;
    hu.proxBano=t+R.BANO_CADA_H*60;agendar(e,{t:hu.proxBano,tipo:'bano',id:ev.id});
    agendar(e,{t:t+R.BANO_DUR_MIN,tipo:'bano-fin',id:ev.id});
    out.push({tipo:'bano',id:ev.id,activo:ev.id===activo});return;
  }
  if(ev.tipo==='bano-fin'){
    if(ev.id!==activo)banoEstadistico(e,ev.id,rng);
    agendar(e,{t,tipo:'peinado',id:ev.id});
    out.push({tipo:'bano-fin',id:ev.id,activo:ev.id===activo});return;
  }
  if(ev.tipo==='peinado'){
    const hu=e.hu[ev.id];
    if(ev.id!==activo)peinadoEstadistico(e,ev.id,rng);
    hu.bloqueoHasta=t+R.PEINADO_DUR_MIN+R.BLOQUEO_MIN;
    if(ev.id==='joven'||grupo(ev.id)==='adulto'&&rng()<R.CERA_P)hu.gel=true;
    out.push({tipo:'peinado',id:ev.id,activo:ev.id===activo,gel:hu.gel});return;
  }
  if(ev.tipo==='peinado-mama'){
    if(donde(e,'mama',t).lugar!=='casa'||donde(e,ev.id,t).lugar!=='casa')return;
    if(ev.id!==activo)matarAlgunas(e,ev.id,R.PEINE_MAMA,rng);
    out.push({tipo:'peinado-mama',id:ev.id,activo:ev.id===activo});return;
  }
  if(ev.tipo==='revision'){
    ['nino','nina'].forEach(id=>{
      if(donde(e,id,t).lugar!=='escuela')return;
      if(id!==activo)matarAlgunas(e,id,R.REVISION,rng);
      out.push({tipo:'revision',id,activo:id===activo});
    });return;
  }
  if(ev.tipo==='contacto'){
    const pa=donde(e,ev.a,t),pb=donde(e,ev.b,t);
    if(pa.lugar!==pb.lugar||pa.cuarto==='bano'||pb.cuarto==='bano'||pa.lugar==='veterinario')return;
    const c={id:ev.n,a:ev.a,b:ev.b,que:ev.que,fin:t+ev.dur,lugar:pa.lugar};
    e.contactos.push(c);
    agendar(e,{t:c.fin,tipo:'contacto-fin',cid:c.id});
    out.push(Object.assign({tipo:'contacto',t},c));return;
  }
  if(ev.tipo==='contacto-fin'){
    const i=e.contactos.findIndex(c=>c.id===ev.cid);if(i<0)return;
    const c=e.contactos.splice(i,1)[0];
    [[c.a,c.b],[c.b,c.a]].forEach(([x,y])=>{const r=contagio(e,x,y,rng,activo);if(r)out.push(r)});
    out.push({tipo:'contacto-fin',cid:c.id,a:c.a,b:c.b});return;
  }
  if(ev.tipo==='aviso-vet'){out.push({tipo:'aviso-vet',mascota:e.mascota});return}
  if(ev.tipo==='vet'){
    const hu=e.hu[e.mascota];e.perdidas+=hu.adultas;
    out.push({tipo:'vet',mascota:e.mascota,activo:e.mascota===activo,adultas:hu.adultas,huevos:hu.huevos});
    hu.adultas=0;hu.huevos=0;hu.recientes=0;hu.fueraHasta=t+R.VET_FUERA_H*60;
    e.vetMin+=R.VET_CADA_DIAS*1440;agendarVet(e);return;
  }
}
/* Avanza el reloj dMin minutos del juego. Devuelve los eventos que pasaron, en orden. */
function avanzar(e,dMin,rng,activo){
  const fin=e.min+dMin,out=[];
  for(;;){
    const hSig=(e.horaHecha+1)*60,c=e.cola[0];
    if(c&&c.t<=hSig&&c.t<=fin){e.min=Math.max(e.min,c.t);e.cola.shift();procesar(e,c,rng,activo,out);continue}
    if(hSig>fin)break;
    e.min=hSig;e.horaHecha++;
    huespedes(e).forEach(id=>{if(id!==activo)pasoHora(e,id,rng)});
    if(HABILIDADES.some(h=>e.hab[h]))e.energia=Math.min(100,e.energia+REGLAS.ENERGIA_H);
    out.push({tipo:'hora',hora:hSig});
  }
  e.min=fin;
  revisarHabilidades(e).forEach(h=>out.push({tipo:'habilidad',nombre:h}));
  return out;
}
function revisarHabilidades(e){
  if(e.soloCabeza)return [];
  const n=e.hu.joven.adultas,nuevas=[];
  REGLAS.METAS_JOVEN.forEach((m,i)=>{const h=HABILIDADES[i];if(n>=m&&!e.hab[h]&&HABILIDADES.slice(0,i).every(x=>e.hab[x])){e.hab[h]=true;nuevas.push(h)}});
  return nuevas;
}
function usarHabilidad(e,h){
  if(!e.hab[h])return 'bloqueada';
  const c=REGLAS.COSTO[h];if(e.energia<c)return 'sin-energia';
  e.energia-=c;return 'ok';
}

/* ---------- Estado de la partida ---------- */
const infestado=(e,id)=>e.hu[id].adultas>=REGLAS.UMBRAL_INFESTADO;
function resultado(e){
  if(PERSONAS.every(id=>infestado(e,id)))return 'victoria';
  if(huespedes(e).every(id=>!e.hu[id].adultas&&!e.hu[id].huevos))return 'derrota';
  return null;
}
function avisos(e){
  const R=REGLAS,l=[];
  const vet=e.vetMin-e.min;
  if(vet<=R.AVISO_VET_H*60&&vet>0)l.push({tipo:'vet',min:vet,txt:INFO[e.mascota].nombre+' va al veterinario en '+horas(vet)+'. Saca la colonia antes.'});
  e.cola.forEach(c=>{if(c.tipo==='revision'&&c.t-e.min<=R.AVISO_REVISION_MIN&&c.t>=e.min)l.push({tipo:'revision',min:c.t-e.min,txt:'Revisión de piojos en la escuela en '+horas(c.t-e.min)+'.'})});
  PERSONAS.forEach(id=>{const m=e.hu[id].proxBano-e.min;if(m<=R.AVISO_BANO_MIN&&m>0)l.push({tipo:'bano',id,min:m,txt:INFO[id].nombre+' se baña en '+horas(m)+'.'})});
  return l.sort((a,b)=>a.min-b.min);
}
function horas(m){return m<60?Math.max(1,Math.ceil(m))+' min':Math.round(m/60)+' h'}

const api={MAX_PANTALLA,aCabeza,aConteo,agendar,REGLAS,PERSONAS,MASCOTAS,HABILIDADES,INFO,GRUPO_TXT,LUGAR_TXT,CUARTO_TXT,CONTACTOS,PRIMER_BANO,
  azar,binom,dia,hora,diaEscuela,textoHora,textoDia,minutosPorSeg,grupo,esPersona,donde,nueva,nuevaCabeza,metaCabeza,rotarEntrada,huespedes,planificarDia,
  bloqueado,pasoHora,sobrevivenBano,escondidas,banoEstadistico,peinadoEstadistico,contagio,avanzar,revisarHabilidades,usarHabilidad,
  infestado,resultado,avisos,horas};
return api;
})();
if(typeof module!=='undefined')module.exports=Casa;
