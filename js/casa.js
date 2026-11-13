/* ---------- Modo Casa: vista de la casa y conexión con el motor de cabeza ---------- */
const CASA_KEY='pulga2-casa';
const VEL=(()=>{try{const v=+new URLSearchParams(location.search).get('vel');return v>0?v:1}catch(e){return 1}})();
let CS=null,casaOn=false,casaRefT=0,casaNoticias=[];
const RG=Casa.REGLAS;
const nombre=id=>Casa.INFO[id].nombre;
const SIGLA={mama:'Ma',papa:'Pa',joven:'Jo',nino:'Ni',nina:'Na',perro:'Pe',gato:'Ga',huron:'Hu',conejo:'Co'};
const plural=(n,uno,varios)=>n+' '+(n===1?uno:varios);
const conColonia=id=>CS.hu[id].adultas+CS.hu[id].huevos>0;

/* ---------- Perfiles de cabeza (mismo formato que LEVELS) ---------- */
const PERFIL_BASE={place:'Casa',strands:2300,len:[6,11],tufts:8,tuftR:[12,17],first:9,every:9,nailWarn:1.2,nailAim:20,combSpeed:40,zone:.7};
const HUESPEDES={
 nino:{skin:'#ecb98f',hair:'#3f2415',strands:2300,tufts:9,tuftR:[13,18],shirt:'#2f6f9f',threats:{nails:5,comb:3},first:14,every:11,nailWarn:1.35,nailAim:26,combSpeed:36,zone:.8,bg:['#2e4b3b','#284335']},
 nina:{skin:'#f0c49f',hair:'#6b3a1e',strands:2600,len:[7,12],tufts:10,tuftR:[13,18],shirt:'#c0507a',threats:{nails:5,comb:3},first:14,every:11,nailWarn:1.35,nailAim:26,combSpeed:36,zone:.8,bg:['#4b3b2e','#433528']},
 joven:{skin:'#d9a077',hair:'#15110f',strands:2500,len:[7,12],tufts:7,shirt:'#59407f',threats:{nails:4,comb:2,dryer:4},first:10,every:9.5,nailWarn:1.15,nailAim:22,combSpeed:42,zone:.7,bg:['#2a3b57','#24334c']},
 mama:{skin:'#ecb98f',hair:'#6b2c1a',strands:2400,tufts:7,tuftR:[12,16],shirt:'#a8483a',threats:{nails:7,comb:1,dryer:1},first:7,every:7,nailWarn:1.05,nailAim:16,combSpeed:44,zone:.55,bg:['#5a382c','#4d2f25']},
 papa:{skin:'#f0c49f',hair:'#2e2620',strands:1800,len:[4,8],tufts:6,tuftR:[10,13],shirt:'#3d4a58',threats:{nails:8,dryer:1},first:7,every:7,nailWarn:1.05,nailAim:14,combSpeed:44,zone:.5,bg:['#3b4150','#343a48']},
 perro:{dog:true,paw:true,bloodMul:1.7,skin:'#d9a55f',hair:'#9c6426',strands:2700,len:[8,13],tufts:13,shirt:'#3f6b34',threats:{nails:5},first:8,every:8,nailWarn:1.05,nailAim:18,bg:['#335c2b','#2c5126']},
 gato:{dog:true,lengua:true,bloodMul:1.2,skin:'#e9cfb5',hair:'#d98a3d',strands:2800,len:[6,10],tufts:11,tuftR:[11,16],shirt:'#5b4a7a',threats:{nails:6},first:5,every:4.5,nailWarn:1.1,nailAim:18,bg:['#3f3550','#372e46']},
 huron:{dog:true,inquieto:true,bloodMul:1.3,skin:'#e8d2bd',hair:'#8a7560',strands:2600,len:[6,10],tufts:10,tuftR:[11,15],shirt:'#7a5a3e',threats:{nails:5},first:7,every:8,zone:.65,bg:['#4a3a2a','#403224']},
 conejo:{dog:true,bloodMul:1.1,skin:'#f2d6cf',hair:'#e8e1d8',strands:2400,len:[7,11],tufts:3,tuftR:[10,13],shirt:'#6d8f5a',threats:{nails:4},first:10,every:13,zone:.75,bg:['#3d5a3a','#354f33']}
};
function casaPerfil(id){
  const hu=CS.hu[id];
  return Object.assign({},PERFIL_BASE,HUESPEDES[id],{id,who:nombre(id),gels:hu.gel?(id==='joven'?5:3):0,collar:id==='perro'&&CS.collar});
}

/* ---------- Alimentos ---------- */
const COMIDA={nino:['frituras','dulces','piel'],joven:['sudor','grasa'],adulto:['comida']};
const COMIDA_CADA={nino:5,joven:8,adulto:14};
const COMIDA_TXT={
  frituras:'Frituras: tus huevos nacen antes y cuestan menos sangre',
  dulces:'Dulces: más velocidad para esquivar',
  piel:'Piel seca: en el siguiente contacto pasan más huevos y crías',
  sudor:'Sudor: recargas energía para tus habilidades',
  grasa:'Grasa: mucha sangre, pero resbalas',
  comida:'Comida escasa: un poco de sangre en un lugar peligroso'
};
const EF_DUR={frituras:15,dulces:10,grasa:10};
const trasOreja=f=>Math.abs(f.x)>78&&Math.abs(f.y)<22;
function casaNuevaComida(tipos){
  const tipo=tipos[Math.random()*tipos.length|0];let x,y;
  if(G.casa.grupo==='adulto'){
    if(Math.random()<.5){const a=Math.PI/2+rand(-.5,.5),d=rand(72,90);x=Math.cos(a)*d;y=Math.sin(a)*d}
    else{x=(Math.random()<.5?-1:1)*rand(80,90);y=rand(-16,16)}
  }else{const a=rand(0,TAU),d=Math.sqrt(Math.random())*84;x=Math.cos(a)*d;y=Math.sin(a)*d}
  return{tipo,x,y,t:0};
}
function casaComer(tipo){
  const C=G.casa,hu=CS.hu[C.id];
  if(EF_DUR[tipo])C.ef[tipo]=G.t+EF_DUR[tipo];
  if(tipo==='piel')hu.pielSeca=true;
  if(tipo==='sudor')CS.energia=Math.min(100,CS.energia+RG.ENERGIA_SUDOR);
  if(tipo==='grasa')G.blood=Math.min(100,G.blood+45);
  if(tipo==='comida')G.blood=Math.min(100,G.blood+30);
  toast(COMIDA_TXT[tipo],false,2.2);SFX.hatch();
}
const efecto=k=>G&&G.casa&&G.casa.ef[k]>G.t;

/* ---------- Ganchos que usa juego.js ---------- */
function casaBloqueada(){return Casa.bloqueado(CS,G.casa.id)}
function casaCostoHuevo(){return efecto('frituras')?22:EGG_COST}
function casaLlena(){return adults()+G.casa.reserva+G.eggs.length>=RG.TOPE}
function casaVelocidad(){return efecto('dulces')?1.5:1}
function casaResbala(){return efecto('grasa')}
function casaEclosion(){return casaBloqueada()?0:efecto('frituras')?1.8:1}
function casaEscondida(f){
  const C=G.casa;
  if(f===G.player&&C.camHasta>G.t&&G.w.gels.some(z=>hyp(z.x-f.x,z.y-f.y)<z.r))return true;
  return G.threats.some(t=>t.k==='bano')&&trasOreja(f);
}
function casaDeReserva(){
  if(!G.casa.reserva)return null;
  G.casa.reserva--;const a=rand(0,TAU),d=rand(10,70),f=makeFlea(Math.cos(a)*d,Math.sin(a)*d,true);f.shield=false;G.fleas.push(f);return f;
}
function casaCabezaUpdate(dt){
  const C=G.casa,L=G.L;
  G.drift=L.inquieto?{x:Math.cos(G.t*.8)*10,y:Math.sin(G.t*1.1)*8}:null;
  if(C.lensHasta&&G.t>C.lensHasta){G.lens=null;C.lensHasta=0}
  const tipos=COMIDA[C.grupo];
  if(tipos&&!G.threats.some(t=>t.k==='bano')){
    C.comidaT-=dt;
    if(C.comidaT<=0){if(C.comida.length<4)C.comida.push(casaNuevaComida(tipos));C.comidaT=COMIDA_CADA[C.grupo]*(CS.hu[C.id].gel?1.8:1)*rand(.8,1.2)}
  }
  const p=G.player;
  if(p&&p.alive)C.comida=C.comida.filter(k=>{if(hyp(k.x-p.x,k.y-p.y)<7){casaComer(k.tipo);return false}return true});
  C.comida.forEach(k=>k.t+=dt);
}
const COMIDA_COL={frituras:'#f2b531',dulces:'#ff5f9e',piel:'#fff6e6',sudor:'#7fd4ff',grasa:'#e9c46a',comida:'#c0392b'};
function casaDibujo(c){
  G.casa.comida.forEach(k=>{
    const s=1+Math.sin(k.t*5)*.12;c.save();c.translate(k.x,k.y);c.scale(s,s);
    c.fillStyle=COMIDA_COL[k.tipo];c.strokeStyle='#1d0a08';c.lineWidth=.6;
    if(k.tipo==='frituras'){c.beginPath();c.moveTo(-3.5,2.5);c.lineTo(0,-3.5);c.lineTo(3.5,2.5);c.closePath();c.fill();c.stroke()}
    else if(k.tipo==='piel'){[[-2,-1],[1.5,-2],[0,1.8]].forEach(([x,y])=>{c.beginPath();c.ellipse(x,y,1.8,1.1,x,0,TAU);c.fill();c.stroke()})}
    else if(k.tipo==='sudor'){c.beginPath();c.moveTo(0,-4);c.quadraticCurveTo(3.5,1,0,3.2);c.quadraticCurveTo(-3.5,1,0,-4);c.fill();c.stroke()}
    else{c.beginPath();c.arc(0,0,k.tipo==='grasa'?3.4:2.8,0,TAU);c.fill();c.stroke();if(k.tipo==='dulces'){c.strokeStyle='#fff';c.beginPath();c.moveTo(-2,-1);c.lineTo(2,1);c.stroke()}}
    c.restore();
  });
}
function casaColonia(){
  const a=adults()+G.casa.reserva,e=G.eggs.length,id=G.casa.id,falta=RG.UMBRAL_INFESTADO-a;
  return 'Colonia: '+a+(e?' · '+e+(e>1?' huevos':' huevo'):'')+(Casa.esPersona(id)?(falta>0?' · faltan '+falta:' · infestado'):' · ancla');
}
function casaHud(){
  const C=G.casa,hu=CS.hu[C.id],lugar=Casa.donde(CS,C.id,CS.min);
  setTxt($('hudPlace'),'cplace',Casa.textoDia(CS.min)+' · '+Casa.textoHora(CS.min)+' · '+Casa.LUGAR_TXT[lugar.lugar]);
  const any=Casa.HABILIDADES.some(h=>CS.hab[h]);
  if($('enWrap').hidden===any){$('enWrap').hidden=!any;layout()}
  if(any){$('barEn').style.transform=`scaleX(${CS.energia/100})`;setTxt($('enLabel'),'en','Energía: '+Math.round(CS.energia))}
  $('btnHab').hidden=!any||!!G.jump;
  const ef=[];
  if(efecto('frituras'))ef.push('Frituras '+Math.ceil(C.ef.frituras-G.t)+' s');
  if(efecto('dulces'))ef.push('Dulces '+Math.ceil(C.ef.dulces-G.t)+' s');
  if(efecto('grasa'))ef.push('Grasa '+Math.ceil(C.ef.grasa-G.t)+' s');
  if(hu.pielSeca)ef.push('Piel seca');
  if(G.player&&G.player.shield)ef.push('Coraza');
  if(C.saltoHasta>G.t)ef.push('Salto doble '+Math.ceil(C.saltoHasta-G.t)+' s');
  if(C.camHasta>G.t)ef.push('Camuflaje '+Math.ceil(C.camHasta-G.t)+' s');
  if(hu.gel)ef.push(C.id==='joven'?'Gel':'Cera');
  if(casaBloqueada())ef.push('Sin reproducción '+Math.ceil(hu.bloqueoHasta-CS.min)+' min');
  setTxt($('efChip'),'ef',ef.join(' · '));
  if(Casa.esPersona(C.id)){
    const m=hu.proxBano-CS.min;
    if(m<=RG.AVISO_BANO_MIN&&m>0&&C.avisoBano!==hu.proxBano){C.avisoBano=hu.proxBano;toast(nombre(C.id)+' se baña en '+Casa.horas(m)+': reparte la colonia',true,2.6)}
  }
}

/* ---------- Entrar y salir de cabezas ---------- */
function casaEntrar(id){
  const hu=CS.hu[id];
  if(hu.adultas<1)return false;
  const L=casaPerfil(id);
  mode='play';
  G=newGame(L,false,{id,grupo:Casa.grupo(id),reserva:0,comida:[],comidaT:3,ef:{},saltoHasta:0,camHasta:0,lensHasta:0,avisoBano:0});
  G.tut=-1;
  const c=Casa.aCabeza(hu);G.casa.reserva=c.reserva;
  for(let i=0;i<c.pantalla;i++){
    let x=0,y=18;
    if(i){const t=G.w.tufts.length&&Math.random()<.6?G.w.tufts[Math.random()*G.w.tufts.length|0]:null;if(t){x=t.x+rand(-.5,.5)*t.r;y=t.y+rand(-.5,.5)*t.r}else{const a=rand(0,TAU),d=rand(10,80);x=Math.cos(a)*d;y=Math.sin(a)*d}}
    const f=makeFlea(x,y,i>0);f.shield=false;G.fleas.push(f);
  }
  G.player=G.fleas[0];
  for(let i=0;i<c.huevos;i++){const a=rand(0,TAU),d=rand(8,80);G.eggs.push({x:Math.cos(a)*d,y:Math.sin(a)*d,t:rand(0,HATCH*.7),seed:rand(0,TAU)})}
  showOnly(null);
  $('hud').hidden=false;$('btnEgg').hidden=false;$('btnJump').hidden=true;$('hint').hidden=true;$('btnCasa').hidden=false;$('efChip').hidden=false;
  $('hudWho').textContent=nombre(id);$('patWrap').hidden=true;
  lastHud={};casaHud();
  layout();keys.clear();joy=null;audioOn();
  const pista=Casa.esPersona(id)?{nino:'contagia mucho y hay mucha comida',joven:'pulgas resistentes: aquí ganas habilidades',adulto:'poca comida y muchas uñas'}[Casa.grupo(id)]:Casa.INFO[id].rasgo.toLowerCase();
  toast(nombre(id)+(Casa.esPersona(id)?' ('+Casa.INFO[id].edad+' años)':'')+': '+pista+(L.collar?' Trae collar antipulgas: evita la zona verde.':''),false,3);
  if(hu.banoHasta>CS.min)casaBanoCabeza();
  return true;
}
function casaSync(){if(G&&G.casa)Casa.aConteo(CS.hu[G.casa.id],adults(),G.casa.reserva,G.eggs.length)}
function casaSoltar(){if(G&&G.casa){casaSync();CS.perdidas+=G.lost}G=null}
function casaSalir(){if(!G||!G.casa||G.jump)return;casaSoltar();casaVista()}
function casaSaltoFin(){
  const de=G.casa.id,a=G.contact&&G.contact.destino;
  casaSync();CS.perdidas+=G.lost;
  if(!a){G=null;casaVista();return}
  CS.hu[de].adultas=Math.max(0,CS.hu[de].adultas-1);CS.hu[a].adultas++;
  G=null;SFX.win();
  casaEntrar(a);
}
function casaCabezaPerdida(){
  const id=G.casa.id;casaSoltar();
  casaNoticia('Perdiste la cabeza de '+nombre(id)+'.');
  if(Casa.resultado(CS)==='derrota')casaFinal('derrota');else casaVista();
}

/* ---------- Eventos de higiene dentro de la cabeza ---------- */
function casaBanoCabeza(){
  G.threats=G.threats.filter(t=>t.k==='nails');
  G.threats.push({k:'bano',t:0,fill:2,hold:3,drain:1.5,spots:[]});
  G.casa.comida=[];
  if(G.w.gels.length){G.w.gels=[];buildLayers()}
  toast(nombre(G.casa.id)+' se está bañando: escóndete en un mechón o detrás de las orejas',true,3);SFX.warn();
}
function casaTiradaBano(){
  const C=G.casa,vivas=G.fleas.filter(f=>f.alive);
  const vive=Casa.sobrevivenBano([...vivas.map(f=>f.hidden),...Casa.escondidas(C.reserva)],C.grupo,Math.random);
  vivas.forEach((f,i)=>{if(!vive[i])kill(f,'Se la llevó el baño')});
  const rv=vive.slice(vivas.length).filter(Boolean).length;G.lost+=C.reserva-rv;C.reserva=rv;
  setTimeout(()=>{if(G&&G.casa===C)toast('Terminó el baño: quedan '+(adults()+C.reserva)+' adultas',false,2)},900);
}
function casaPeinadoCabeza(gel){
  const C=G.casa;
  spawn('comb');G.queue=['dryer'];G.spawnT=1;
  let quitados=0;
  G.eggs=G.eggs.filter(e=>{const hid=G.w.tufts.some(t=>hyp(t.x-e.x,t.y-e.y)<t.r);if(!hid&&Math.random()<RG.PEINADO_HUEVOS){splat(e.x,e.y,'#f8e8d8',5);quitados++;return false}return true});
  if(!quitados&&G.eggs.length){const e=G.eggs.shift();splat(e.x,e.y,'#f8e8d8',5)}
  G.fleas.forEach(f=>{if(f.alive&&f.born!=null&&G.t-f.born<20&&!f.hidden&&Math.random()<RG.PEINADO_CRIAS)kill(f,'El peine se llevó a una cría')});
  if(gel){G.L=casaPerfil(C.id);G.w.gels=genWorld(G.L).gels;buildLayers()}
  toast('Peinado y secado: 30 minutos sin reproducción'+(gel?(C.id==='joven'?'. Le pusieron gel':'. Le pusieron cera'):''),true,2.6);
}
function casaPeineMama(){
  const C=G.casa;spawn('comb');C.reserva-=Casa.binom(C.reserva,RG.PEINE_MAMA,Math.random);
  toast('Mamá peina a '+nombre(C.id)+': cruza por el hueco verde',true,2.4);
}
function casaRevision(){
  const C=G.casa;spawn('comb');G.lens={x:0,y:-60,prog:0};C.lensHasta=G.t+20;
  C.reserva-=Casa.binom(C.reserva,RG.REVISION,Math.random);
  toast('Revisión de piojos: peine y lupa con pinzas',true,2.6);
}
function casaContagioCabeza(x,act){
  const C=G.casa;
  if(x.de===act){
    let n=x.adultas;const r=Math.min(n,C.reserva);C.reserva-=r;n-=r;
    G.fleas.filter(f=>f.alive&&f!==G.player).slice(0,n).forEach(f=>f.alive=false);
    G.eggs.splice(0,x.huevos);
    toast((x.adultas+x.huevos>1?'Se pasaron ':'Se pasó ')+(x.adultas?x.adultas+(x.adultas>1?' pulgas':' pulga'):'')+(x.adultas&&x.huevos?' y ':'')+(x.huevos?x.huevos+(x.huevos>1?' huevos':' huevo'):'')+' a '+nombre(x.a),false,2);
  }
  if(x.a===act){
    for(let i=0;i<x.adultas;i++){if(adults()>=Casa.MAX_PANTALLA){C.reserva++;continue}const a=rand(0,TAU),f=makeFlea(Math.cos(a)*85,Math.sin(a)*85,true);f.shield=false;G.fleas.push(f)}
    for(let i=0;i<x.huevos;i++){const a=rand(0,TAU),d=rand(50,85);G.eggs.push({x:Math.cos(a)*d,y:Math.sin(a)*d,t:0,seed:rand(0,TAU)})}
    toast('Llegaron '+[x.adultas?plural(x.adultas,'pulga','pulgas'):'',x.huevos?plural(x.huevos,'huevo','huevos'):''].filter(Boolean).join(' y ')+' desde '+nombre(x.de),false,2);
  }
}
function casaAbrirContacto(x,act){
  const otro=x.a===act?x.b:x.a,ch=[Math.PI,0,-.75,-2.4,.6,2.5];
  G.contact={a:ch[Math.random()*ch.length|0],w:G.L.zone,t:0,dur:(x.fin-CS.min)/Casa.minutosPorSeg(VEL),open:true,slide:0,cid:x.id,destino:otro};
  toast(nombre(x.a)+' y '+nombre(x.b)+': '+x.que+'. ¡Salta a '+nombre(otro)+'!',false,2.8);SFX.warn();$('btnJump').hidden=false;
}

/* ---------- Reloj ---------- */
function casaTick(dt){
  if(!casaOn||!CS)return;
  const act=G&&G.casa?G.casa.id:null;
  if(act&&!G.jump)casaSync();
  const ev=Casa.avanzar(CS,dt*Casa.minutosPorSeg(VEL),Math.random,act);
  for(const x of ev){casaEvento(x,act);if(!casaOn)return}
  if(!(G&&G.jump)){const r=Casa.resultado(CS);if(r){casaFinal(r);return}}
  if(mode==='casa'){casaRefT-=dt;if(casaRefT<=0){casaRefresco();casaRefT=.25}}
}
function casaEvento(x,act){
  const aqui=!!act&&G&&G.casa&&G.casa.id===act;
  const t=x.tipo;
  if(t==='hora'){casaGuardar();return}
  if(t==='dia'){if(aqui)toast('Empieza el '+Casa.textoDia(CS.min).toLowerCase(),false,1.8);casaNoticia('Empieza el '+Casa.textoDia(CS.min).toLowerCase()+'.');return}
  if(t==='bano'){if(aqui&&x.activo)casaBanoCabeza();else if(conColonia(x.id))casaNoticia(nombre(x.id)+' se está bañando.');return}
  if(t==='bano-fin'){if(aqui&&x.activo)casaTiradaBano();else if(conColonia(x.id))casaNoticia(nombre(x.id)+' terminó de bañarse: '+(CS.hu[x.id].adultas===1?'queda 1 adulta.':'quedan '+CS.hu[x.id].adultas+' adultas.'));return}
  if(t==='peinado'){if(aqui&&x.activo)casaPeinadoCabeza(x.gel);return}
  if(t==='peinado-mama'){if(aqui&&x.activo)casaPeineMama();else if(conColonia(x.id))casaNoticia('Mamá peinó a '+nombre(x.id)+'.');return}
  if(t==='revision'){if(aqui&&x.activo)casaRevision();else if(conColonia(x.id))casaNoticia('Revisión de piojos a '+nombre(x.id)+' en la escuela.');return}
  if(t==='contacto'){if(aqui&&(x.a===act||x.b===act)&&!G.jump&&!G.contact)casaAbrirContacto(x,act);return}
  if(t==='contacto-fin'){if(aqui&&G.contact&&G.contact.cid===x.cid&&!G.jump){G.contact=null;$('btnJump').hidden=true;toast('Se separaron. Espera otro contacto',true,1.8)}return}
  if(t==='contagio'){if(aqui&&(x.de===act||x.a===act))casaContagioCabeza(x,act);casaNoticia((x.adultas?plural(x.adultas,'pulga','pulgas'):'')+(x.adultas&&x.huevos?' y ':'')+(x.huevos?plural(x.huevos,'huevo','huevos'):'')+' de '+nombre(x.de)+' a '+nombre(x.a)+'.');return}
  if(t==='aviso-vet'){const m='Mañana '+nombre(x.mascota).toLowerCase()+' va al veterinario: saca la colonia antes.';if(aqui)toast(m,true,3.2);casaNoticia(m);return}
  if(t==='vet'){
    const m=nombre(x.mascota)+' fue al veterinario'+(x.adultas+x.huevos?': perdiste '+x.adultas+' pulgas y '+x.huevos+' huevos.':'.');
    casaNoticia(m);
    if(aqui&&x.activo){CS.perdidas+=G.lost;G=null;if(Casa.resultado(CS)!=='derrota')casaVista()}
    else if(aqui)toast(m,true,2.6);
    return;
  }
  if(t==='habilidad'){
    const txt={coraza:'Coraza desbloqueada: aguanta un golpe de uñas, pata, lengua o pinzas.',salto:'Salto doble desbloqueado: saltas a otra cabeza desde más lejos.',camuflaje:'Camuflaje en gel desbloqueado: dentro del gel no te ven.'}[x.nombre];
    if(aqui)toast(txt,false,3);casaNoticia(txt);return;
  }
}

/* ---------- Habilidades ---------- */
const HAB_INFO={coraza:['Coraza','aguanta un golpe'],salto:['Salto doble','saltas desde más lejos'],camuflaje:['Camuflaje en gel','oculta dentro del gel']};
function casaUsar(h){
  if(!G||!G.casa||!G.player||G.jump)return;
  if(h==='coraza'&&G.player.shield){toast('Ya traes la coraza puesta',false,1.4);return}
  const r=Casa.usarHabilidad(CS,h);
  if(r==='bloqueada'){toast('Esa habilidad aún no está desbloqueada',false,1.5);return}
  if(r==='sin-energia'){toast('Te falta energía: busca sudor en la cabeza del joven',true,1.8);return}
  if(h==='coraza'){G.player.shield=true;toast('Coraza lista: aguantas un golpe',false,1.6)}
  else if(h==='salto'){G.casa.saltoHasta=G.t+10;toast('Salto doble: 10 s para saltar desde más lejos',false,1.8)}
  else{G.casa.camHasta=G.t+12;toast('Camuflaje: 12 s ocultas dentro del gel',false,1.8)}
  casaMenu(false);
}
function casaMenu(abrir){
  const m=$('habMenu');
  if(!abrir){m.hidden=true;$('btnHab').setAttribute('aria-expanded','false');return}
  m.innerHTML=Casa.HABILIDADES.filter(h=>CS.hab[h]).map((h,i)=>`<button data-h="${h}">${HAB_INFO[h][0]} <small>${RG.COSTO[h]} de energía · ${HAB_INFO[h][1]}</small></button>`).join('');
  m.querySelectorAll('button').forEach(b=>b.onclick=()=>casaUsar(b.dataset.h));
  m.hidden=false;$('btnHab').setAttribute('aria-expanded','true');
}
press($('btnHab'),()=>casaMenu($('habMenu').hidden));
press($('btnCasa'),()=>casaSalir());
addEventListener('keydown',e=>{if(mode==='play'&&G&&G.casa&&['1','2','3'].includes(e.key))casaUsar(Casa.HABILIDADES[+e.key-1])});

/* ---------- Vista de la casa ---------- */
function casaNoticia(txt){casaNoticias.push({txt,hasta:performance.now()+6000});if(casaNoticias.length>4)casaNoticias.shift()}
function casaVista(){
  mode='casa';casaOn=true;G=null;closeSheet();showOnly('sCasa');$('btnCasa').hidden=true;
  $('casaFichas').innerHTML=Casa.huespedes(CS).map(id=>`<button class="ficha" data-id="${id}"><b>${nombre(id)}</b><span class="gr"></span><span class="lu"></span><span class="co"></span><span class="es"></span><span class="ba"></span></button>`).join('');
  $('casaFichas').querySelectorAll('.ficha').forEach(b=>b.onclick=()=>casaTocar(b.dataset.id));
  casaRefresco();casaGuardar();
}
function casaTocar(id){
  if(casaEntrar(id))return;
  sheet(`<div class="eyebrow">${nombre(id)}</div><h2>No hay pulgas aquí</h2><p>${nombre(id)} no tiene pulgas adultas. Llega por contagio: salta en un contacto desde otra cabeza o espera a que se pasen solas.</p><div class="actions"><button class="btn" id="bOk">Entendido</button></div>`);
  $('bOk').onclick=closeSheet;
}
const PLANO={cocina:[0,0,100,95],sala:[100,0,140,95],bano:[240,0,100,95],'cuarto-papas':[0,95,113,85],'cuarto-ninos':[113,95,114,85],'cuarto-joven':[227,95,113,85],escuela:[0,192,85,58],prepa:[85,192,85,58],trabajo:[170,192,85,58],veterinario:[255,192,85,58]};
const PLANO_TXT={cocina:'Cocina',sala:'Sala',bano:'Baño','cuarto-papas':'Papás','cuarto-ninos':'Niños','cuarto-joven':'Joven',escuela:'Escuela',prepa:'Prepa',trabajo:'Trabajo',veterinario:'Veterinario'};
function casaRefresco(){
  if(!CS)return;
  const ids=Casa.huespedes(CS),inf=Casa.PERSONAS.filter(id=>Casa.infestado(CS,id)).length;
  setTxt($('casaReloj'),'creloj',Casa.textoDia(CS.min)+' · '+Casa.textoHora(CS.min));
  setTxt($('cInf'),'cinf',inf+'/5');
  setTxt($('cTot'),'ctot',String(ids.reduce((s,id)=>s+CS.hu[id].adultas,0)));
  const ahora=performance.now();casaNoticias=casaNoticias.filter(n=>n.hasta>ahora);
  const av=Casa.avisos(CS).map(a=>`<li class="${a.tipo}">${a.txt}</li>`).concat(casaNoticias.map(n=>`<li class="nota">${n.txt}</li>`)).join('');
  if(lastHud.cav!==av){lastHud.cav=av;$('casaAvisos').innerHTML=av}
  /* plano */
  const por={};ids.forEach(id=>{const d=Casa.donde(CS,id,CS.min);(por[d.cuarto]=por[d.cuarto]||[]).push(id)});
  let s=`<svg viewBox="0 0 340 250" role="img" aria-label="Plano de la casa con la familia en su lugar">`;
  for(const k in PLANO){const [x,y,w,h]=PLANO[k],fuera=y>180;s+=`<rect x="${x+2}" y="${y+2}" width="${w-4}" height="${h-4}" rx="6" fill="${fuera?'#2a0e14':'#4a2028'}" stroke="rgba(248,232,216,.2)"/><text x="${x+8}" y="${y+15}">${PLANO_TXT[k]}</text>`}
  for(const k in por){const [x,y,w,h]=PLANO[k];por[k].forEach((id,i)=>{
    const cx=x+18+(i%4)*24,cy=y+(h>60?42:38)+Math.floor(i/4)*24,inf=Casa.infestado(CS,id)||!Casa.esPersona(id)&&CS.hu[id].adultas>0;
    s+=`<g class="tok"><circle cx="${cx}" cy="${cy}" r="10.5" fill="${Casa.esPersona(id)?'#f8e8d8':'#ffc933'}" stroke="${inf?'#e0213f':'rgba(0,0,0,.3)'}" stroke-width="${inf?3:1}"/><text x="${cx}" y="${cy+3.5}">${SIGLA[id]}</text></g>`;
  })}
  s+=`</svg>`;
  if(lastHud.cplano!==s){lastHud.cplano=s;$('casaPlano').innerHTML=s}
  /* fichas */
  $('casaFichas').querySelectorAll('.ficha').forEach(b=>{
    const id=b.dataset.id,hu=CS.hu[id],d=Casa.donde(CS,id,CS.min),per=Casa.esPersona(id),inf=per&&Casa.infestado(CS,id);
    const q=c=>b.querySelector(c);
    const gr=per?Casa.GRUPO_TXT[Casa.grupo(id)].replace(/ \d+ a \d+ años/,'')+' · '+Casa.INFO[id].edad+' años':'Mascota ancla';
    const lu=d.lugar==='casa'?'En casa · '+Casa.CUARTO_TXT[d.cuarto]:Casa.LUGAR_TXT[d.lugar]+' · ausente';
    const co=hu.adultas+(hu.adultas===1?' adulta':' adultas')+' · '+hu.huevos+(hu.huevos===1?' huevo':' huevos');
    const es=per?(inf?'Infestado':'Faltan '+(RG.UMBRAL_INFESTADO-hu.adultas)):(hu.adultas?'Colonia ancla':'Sin colonia');
    const ba=per?('Baño en '+Casa.horas(Math.max(0,hu.proxBano-CS.min))+(hu.gel?(id==='joven'?' · gel':' · cera'):'')+(Casa.bloqueado(CS,id)?' · sin reproducción':'')):('Veterinario en '+Math.max(0,Math.ceil((CS.vetMin-CS.min)/1440))+' días');
    if(q('.gr').textContent!==gr)q('.gr').textContent=gr;
    if(q('.lu').textContent!==lu)q('.lu').textContent=lu;
    if(q('.co').textContent!==co)q('.co').textContent=co;
    if(q('.es').textContent!==es)q('.es').textContent=es;
    if(q('.ba').textContent!==ba)q('.ba').textContent=ba;
    b.classList.toggle('inf',inf);
    b.setAttribute('aria-disabled',hu.adultas<1?'true':'false');
    b.setAttribute('aria-label',`${nombre(id)}, ${gr}, ${lu}, ${co}, ${es}. ${hu.adultas?'Toca para entrar':'Sin pulgas adultas'}`);
  });
}

/* ---------- Inicio, pausa, fin y guardado ---------- */
function casaCargar(){try{const s=JSON.parse(localStorage.getItem(CASA_KEY));if(s&&s.version===1&&s.hu&&s.cola)return s}catch(e){}return null}
function casaGuardar(){if(!CS)return;try{localStorage.setItem(CASA_KEY,JSON.stringify(CS))}catch(e){}}
function casaBorrar(){try{localStorage.removeItem(CASA_KEY)}catch(e){}}
let resetCasaArmed=false;
function casaNotaTitulo(){
  const s=casaCargar();
  $('btnStart').textContent=s?'Seguir en la casa':'Casa';
  $('btnResetCasa').hidden=!s;$('btnResetCasa').textContent='Borrar partida de Casa';resetCasaArmed=false;
  return s?`Casa: ${Casa.textoDia(s.min).toLowerCase()}, ${Casa.PERSONAS.filter(id=>Casa.infestado(s,id)).length} de 5 infestados`:'';
}
function casaElegirMascota(){
  sheet(`<div class="eyebrow">Partida nueva</div><h2>Elige la mascota</h2><p>La familia: mamá, papá, un joven y dos niños. Tu colonia empieza con una pulga en el niño. Ganas cuando las 5 personas tienen al menos 3 pulgas adultas al mismo tiempo.</p>
  <div class="pets">${Casa.MASCOTAS.map(id=>`<button data-m="${id}"><b>${nombre(id)}</b><span>${Casa.INFO[id].rasgo}</span></button>`).join('')}</div>
  <div class="actions"><button class="btn alt" id="bBack">Volver</button></div>`);
  $('sheetBody').querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>casaNueva(b.dataset.m));
  $('bBack').onclick=closeSheet;
}
function casaNueva(mascota){
  CS=Casa.nueva(mascota,Math.random);casaNoticias=[];casaGuardar();closeSheet();casaOn=true;
  casaEntrar('nino');
}
function casaPausa(){
  if(mode!=='play'&&mode!=='casa')return;
  const prev=mode,enCabeza=prev==='play';
  if(enCabeza)casaSync();
  mode='paused';casaGuardar();
  sheet(`<div class="eyebrow">${Casa.textoDia(CS.min)} · ${Casa.textoHora(CS.min)}</div><h2>Pausa</h2><p>El reloj de la casa está detenido. ${enCabeza?'Arrastra para moverte, suelta para picar y recoge la comida. Con teclado: flechas, E para huevo, espacio para saltar y 1, 2, 3 para habilidades.':'Toca a un integrante con pulgas para entrar a su cabeza.'}</p>
  <div class="actions"><button class="btn" id="bRes">Seguir</button>${enCabeza?'<button class="btn alt" id="bCasa">Ver la casa</button>':''}<button class="btn alt" id="bIni">Salir al inicio</button></div>`);
  $('bRes').onclick=()=>{closeSheet();mode=prev;lastT=performance.now()};
  if(enCabeza)$('bCasa').onclick=()=>{closeSheet();mode=prev;casaSalir()};
  $('bIni').onclick=casaAlInicio;
}
function casaAlInicio(){casaSoltar();casaGuardar();casaOn=false;closeSheet();startAttract();refreshTitle()}
function casaFinal(r){
  if(G&&G.casa)CS.perdidas+=G.lost;
  const vivas=Casa.huespedes(CS).reduce((s,id)=>s+CS.hu[id].adultas,0),d=Casa.dia(CS.min);
  casaOn=false;G=null;mode='over';showOnly('sCasa');casaRefresco();casaBorrar();
  if(r==='victoria'){SFX.win();sheet(`<div class="eyebrow">${Casa.textoDia(CS.min)} · ${Casa.textoHora(CS.min)}</div><h2>Toda la familia tiene pulgas</h2><p>Las 5 cabezas de la casa están infestadas al mismo tiempo.</p>
    <div class="stats"><div><b>${d}</b><span>Día</span></div><div><b>${vivas}</b><span>Pulgas vivas</span></div><div><b>${CS.perdidas}</b><span>Perdidas</span></div></div>`+casaFinBotones())}
  else{SFX.die();sheet(`<div class="eyebrow">Colonia eliminada</div><h2>La familia quedó limpia</h2><p>No queda ninguna pulga ni huevo en la casa. Reparte la colonia antes de cada baño y usa a la mascota como ancla.</p>
    <div class="stats"><div><b>${d}</b><span>Días</span></div><div><b>${CS.perdidas}</b><span>Perdidas</span></div><div><b>${nombre(CS.mascota)}</b><span>Mascota</span></div></div>`+casaFinBotones())}
  $('bNueva').onclick=casaElegirMascota;
  $('bIni').onclick=()=>{CS=null;closeSheet();startAttract();refreshTitle()};
}
const casaFinBotones=()=>`<div class="actions"><button class="btn" id="bNueva">Nueva partida</button><button class="btn alt" id="bIni">Volver al inicio</button></div>`;

$('btnStart').onclick=()=>{audioOn();const s=casaCargar();if(s){CS=s;casaNoticias=[];casaVista()}else casaElegirMascota()};
$('btnResetCasa').onclick=()=>{
  if(!resetCasaArmed){resetCasaArmed=true;$('btnResetCasa').textContent='Toca otra vez para borrar la casa';return}
  casaBorrar();CS=null;refreshTitle();
};
$('btnCasaPausa').onclick=casaPausa;
$('btnCasaSalir').onclick=casaAlInicio;
document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='casa')casaPausa()});
