(() => {
'use strict';
const $=(s,el=document)=>el.querySelector(s), $$=(s,el=document)=>Array.from(el.querySelectorAll(s));
const {scenes,chapters,defense}=window.WinStory, F=window.ProjectFinance;
const money=n=>n===null?'не измерен':new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2}).format(n)+' ₽';
const num=n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2}).format(n);
const pad=n=>String(n).padStart(2,'0');
const main=$('#main'), params=new URLSearchParams(location.search), motion=matchMedia('(prefers-reduced-motion: reduce)');
const motionModes=['auto','full','reduced','off'];
let storedMotion='auto';try{const saved=localStorage.getItem('win-alien-motion');if(motionModes.includes(saved))storedMotion=saved;}catch{}
const motionParam=params.get('effects');
let motionChoice=motionParam==='1'?'full':motionParam==='0'?'off':motionParam==='reduced'?'reduced':storedMotion;
let current=0,present=params.get('present')!=='0',effects=motionChoice!=='off',requestedEffects=effects,reducedEffects=false,timeline=null,transitionTimeline=null,navLock=0,route=params.get('route')==='defense'?'defense':'all';
let timerRunning=false,timerAccum=0,timerStart=0,toastTimeout;
const seen=new Set(), triggers=[];
main.innerHTML=scenes.map((s,i)=>`<section class="slide ${s.kind||''}" id="slide-${i+1}" aria-label="${i+1}. ${s.title}"><div class="scene-shell"><span class="scene-number" aria-hidden="true">${pad(i+1)} / ${scenes.length}</span>${s.html}</div></section>`).join('');
const slides=$$('.slide');
$('#contents-summary').textContent=`${scenes.length} экранов · ${chapters.length} главы`;
$('#chapter-nav').innerHTML=chapters.map(c=>`<a href="#slide-${c.start}" data-chapter="${c.start}">${c.name}</a>`).join('');
$('#contents-list').innerHTML=chapters.map(c=>`<div class="contents-group"><h3>${c.name}</h3>${scenes.slice(c.start-1,c.end).map((s,i)=>`<button data-goto="${c.start+i-1}"><b>${pad(c.start+i)}</b>${s.title}</button>`).join('')}</div>`).join('');
const finishAnimation=()=>{if(timeline){timeline.progress(1).pause();timeline.kill();timeline=null;}};
function finishTransition(){
 if(transitionTimeline){transitionTimeline.kill();transitionTimeline=null;}
 const moving=$$('.slide.is-leaving,.slide.is-entering');
 if(window.gsap&&moving.length)gsap.set(moving,{clearProps:'transform,opacity,visibility'});
 moving.forEach(s=>s.classList.remove('is-leaving','is-entering'));
 delete main.dataset.transitioning;
}
function transitionScene(from,to){
 if(!window.gsap||!effects||!present||document.hidden||from===to)return;
 const previous=slides[from],incoming=slides[to],direction=to>from?1:-1;
 const distance=Math.min(80,innerWidth*.085);
 previous.classList.add('is-leaving');incoming.classList.add('is-entering');
 main.dataset.transitioning=direction>0?'forward':'backward';
 transitionTimeline=gsap.timeline({onComplete:finishTransition});
 if(reducedEffects){
  transitionTimeline.to(previous,{autoAlpha:0,duration:.22,ease:'power1.inOut'},0);
  transitionTimeline.fromTo(incoming,{autoAlpha:0},{autoAlpha:1,duration:.3,ease:'power1.out'},.04);
  return;
 }
 transitionTimeline.to(previous,{x:-direction*distance*.7,autoAlpha:0,duration:.32,ease:'power2.inOut'},0);
 transitionTimeline.fromTo(incoming,{x:direction*distance,autoAlpha:0},{x:0,autoAlpha:1,duration:.48,ease:'power3.out'},.04);
}
function warmScenes(i){
 const list=itinerary(),next=list.find(n=>n>i);
 [i,next].filter(n=>n!==undefined).forEach(n=>$$('img',slides[n]).forEach(im=>{im.loading='eager';im.decode().catch(()=>{});}));
}
function playScene(i,force=false){
 if(!effects||document.hidden)return;
 if(seen.has(i)&&!force)return;
 finishAnimation();seen.add(i);
 if(!window.gsap)return;
 const slide=slides[i],animated=new Set();
 if(reducedEffects){
  const parts=$$('.beat',slide).filter(el=>!el.parentElement.closest('.beat'));
  timeline=gsap.timeline({onComplete(){gsap.set(parts,{clearProps:'opacity,visibility'});}});
  timeline.fromTo(parts,{autoAlpha:.25},{autoAlpha:1,duration:.28,stagger:{amount:.12},ease:'power1.out'});
  return;
 }
 timeline=gsap.timeline({defaults:{duration:.48,ease:'power3.out'},onComplete(){gsap.set([...animated],{clearProps:'transform,opacity,visibility,clipPath,transformOrigin'});}});
 // Each scene has a finite sequence; changing a calculator value never restarts it.
 function enter(selector,from={},at=.16,stagger=.08){
  const els=$$(selector,slide);if(!els.length)return;
  els.forEach(el=>animated.add(el));
  timeline.fromTo(els,{autoAlpha:0,...from},{autoAlpha:1,x:0,y:0,scale:1,rotation:0,clipPath:'inset(0% 0% 0% 0%)',stagger,duration:.5},at);
 }
 enter('.scene-title h2',{y:16},0);
 enter('.scene-title .lead',{y:8},.12);
 const kind=scenes[i].kind;
 if(kind==='hero'){
  enter('.cover-background',{scale:1.055},0);
  enter('.hero-copy h1',{x:-24},.1);
  enter('.hero-copy .lead,.hero-copy .button,.hero-author',{y:14},.24,.12);
  enter('.hero-proof',{y:10},.65);
 }else if(kind==='meeting-scene'){
  enter('.meeting-landscape',{scale:1.035},.08);
  enter('.meeting-people .person:first-child',{x:-60},.18);
  enter('.meeting-people .person:last-child',{x:60},.32);
  enter('.first-message',{x:28},.65);
 }else if(kind==='deal-scene'){
  enter('.deal-sale',{y:18},.18);
  enter('.deal-owner',{x:70},.55);
  enter('.deal-partner',{x:-70},.68);
 }else if(kind==='delivery-scene'){
  enter('.delivery-chat',{x:-28},.12);
  enter('.delivery-list>div',{x:46},.38,.15);
  enter('.access-rule',{y:10},.95);
 }else if(kind==='gantt-scene'){
  enter('.gantt-head',{y:8},.12);
  enter('.gantt-row>[role=rowheader]',{x:-12},.2,.045);
  enter('.gantt-bar',{scaleX:0,transformOrigin:'left center'},.32,.085);
  enter('.gantt-check',{scale:.5},.75,.075);
  enter('.gantt-risks p',{y:12},.9,.1);
 }else if(kind==='finance-scene'){
  enter('.finance-controls',{x:-24},.16);
  enter('.flow-row',{x:26},.3,.13);
  enter('.flow-result',{y:20},.95);
 }else if(kind==='estimate-scene'){
  enter('.estimate-table thead',{y:8},.14);
  enter('.estimate-table tbody tr',{x:-24},.28);
  enter('.estimate-table tfoot',{clipPath:'inset(0 100% 0 0)'},.48);
  enter('.estimate-funding,.provider-link,.estimate-periods',{y:10},.6,.08);
  enter('.work-estimate',{x:20},.85);
 }else if(['activation-scene','ready-scene'].includes(kind)){
  enter('.loader-window',{scale:.97},.12);
  enter('.loader-instruction p',{x:24},.35,.17);
 }else if(kind==='purchase-scene'){
  enter('.purchase-explanation',{x:-18},.12);
  enter('.purchase-receipt',{x:24},.4);
 }else if(kind==='creators-scene'){
  enter('.youtube-thumb',{scale:.96},.12);
  enter('.youtube-proof',{x:24},.38);
  enter('.simple-route span',{y:12},.65,.14);
 }else if(kind==='features-scene'){
  enter('.feature-gameplay',{scale:1.03},.12);
  enter('.loot-inset',{x:-28},.48);
  enter('.feature-facts article',{x:22},.28,.15);
  enter('.platform-ribbon,.plain-conclusion',{y:10},.8,.1);
 }else{
  const beats=$$('.beat',slide).filter(el=>!el.closest('.scene-title')&&!el.parentElement.closest('.beat'));
  beats.forEach(el=>animated.add(el));
  if(beats.length)timeline.fromTo(beats,{autoAlpha:0},{autoAlpha:1,duration:.4,stagger:{amount:.38}},.16);
  enter('.funnel-stage>div,.smart-list>div,.iteration-facts>li',{y:16},.25,.09);
  enter('.draw-arrow',{scaleX:0,transformOrigin:'left center'},.38,.12);
  enter('.scenario-bar',{scaleY:0,transformOrigin:'center bottom'},.3,.12);
 }
}
function itinerary(){return route==='defense'?defense.map(s=>s.index):scenes.map((_,i)=>i);}
function step(direction){const list=itinerary(),next=list.filter(n=>direction>0?n>current:n<current);if(next.length)goTo(direction>0?next[0]:next[next.length-1]);}
function setRoute(value){
 route=value==='defense'?'defense':'all';
 $$('[data-route]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.route===route)));
 $('#route-help').textContent=route==='defense'?'Стрелки проходят 14 основных экранов. Остальные можно открыть ниже.':'Стрелки проходят все 27 экранов. В каждом есть полный конспект.';
 if(route==='defense'&&!itinerary().includes(current))goTo(itinerary().find(i=>i>=current)??26);
 updateChrome();
}
function updateChrome(){
 const list=itinerary(),position=list.indexOf(current),short=defense.find(s=>s.index===current);
 $('#position').textContent=route==='defense'?`${position<0?'—':pad(position+1)} / ${list.length}`:`${pad(current+1)} / ${scenes.length}`;
 $('#current-title').textContent=scenes[current].title;
 $('#progress-fill').style.transform=`scaleX(${(current+1)/scenes.length})`;
 $('#prev').disabled=!list.some(i=>i<current);$('#next').disabled=!list.some(i=>i>current);
 $('#note-title').textContent=`${pad(current+1)}. ${scenes[current].title}`;
 $('#note-text').textContent=route==='defense'&&short?short.speech:scenes[current].notes;$('#note-cue').textContent=route==='defense'&&short?`Ориентир: ${short.seconds} секунд. ${scenes[current].cue}`:scenes[current].cue;
 $$('[data-chapter]').forEach(a=>{const c=chapters.find(c=>c.start===Number(a.dataset.chapter));const active=current+1>=c.start&&current+1<=c.end;a.setAttribute('aria-current',String(active));a.style.setProperty('--chapter-progress',active?(current+2-c.start)/(c.end+1-c.start):current+1>c.end?1:0);});
 $$('[data-goto]').forEach(b=>b.setAttribute('aria-current',String(Number(b.dataset.goto)===current)));
 try{const q=new URLSearchParams(location.search);if(route==='defense')q.set('route','defense');else q.delete('route');q.set('present',present?'1':'0');if(motionChoice==='auto')q.delete('effects');else q.set('effects',motionChoice==='full'?'1':motionChoice==='off'?'0':'reduced');history.replaceState(null,'',`${location.pathname}?${q}#slide-${current+1}`);}catch{}
}
function activate(i,animate=true){
 i=Math.max(0,Math.min(scenes.length-1,i));
 const previous=current,changed=i!==current;
 if(changed){finishAnimation();finishTransition();}
 current=i;
 slides.forEach((el,n)=>{el.classList.toggle('active',n===i);el.inert=present&&n!==i;});
 warmScenes(i);updateChrome();
 if(animate){if(changed)transitionScene(previous,i);playScene(i,present&&changed);}
}
function goTo(i){
 i=Math.max(0,Math.min(scenes.length-1,i));navLock=performance.now()+800;
 activate(i);
 if(!present){window.scrollTo({top:slides[i].offsetTop-parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header')),behavior:effects?'smooth':'instant'});}
 else slides[i].scrollTop=0;
}
function setMode(value,animate=true){
 finishAnimation();finishTransition();present=value;document.body.classList.toggle('present',present);
 $('#present-button').setAttribute('aria-pressed',String(present));$('#present-button').textContent=present?'Просмотр сайта ↗':'Выступление ↗';
 slides.forEach((el,n)=>el.inert=present&&n!==current);
 if(present){triggers.forEach(t=>t.disable());window.scrollTo({top:0,behavior:'instant'});}
 else{triggers.forEach(t=>t.enable());requestAnimationFrame(()=>{window.scrollTo({top:slides[current].offsetTop-parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header')),behavior:'instant'});window.ScrollTrigger?.refresh();});}
 activate(current,false);
 if(present&&animate)playScene(current,true);
}
function toggleEffects(value,userAction=false){
 requestedEffects=Boolean(value);
 if(userAction){motionChoice=value?'full':'off';saveMotion();}
 applyEffects();
 if(userAction)updateChrome();
}
function saveMotion(){try{localStorage.setItem('win-alien-motion',motionChoice);}catch{}}
function setMotion(choice){if(!motionModes.includes(choice))return;motionChoice=choice;requestedEffects=choice!=='off';saveMotion();applyEffects();updateChrome();if(effects)playScene(current,true);}
function applyEffects(){
 effects=requestedEffects;reducedEffects=effects&&(motionChoice==='reduced'||motionChoice==='auto'&&motion.matches);finishAnimation();finishTransition();document.body.classList.toggle('effects-off',!effects);
 document.body.classList.toggle('effects-reduced',reducedEffects);
 const label=!effects?'Эффекты: выкл.':reducedEffects?'Эффекты: мягкие':'Эффекты: вкл.';
 $('#effects').setAttribute('aria-pressed',String(effects));$('#effects').textContent=label;
 $('#replay').disabled=!effects;
 const extra=$('#contents-effects');if(extra){extra.textContent=label;extra.setAttribute('aria-pressed',String(effects));}
 $$('[data-motion]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.motion===motionChoice)));
 if($('#motion-status'))$('#motion-status').textContent=motionChoice==='auto'?(motion.matches?'Браузер просит уменьшить движение: включены мягкие появления без смещения.':'Полные анимации. Если система попросит уменьшить движение, останутся мягкие появления.'):'Ваш выбор сохраняется для новых окон. Его также содержит ссылка на текущий экран.';
 const hint=reducedEffects?'Мягкие появления. Нажмите для полной анимации; все режимы доступны в оглавлении.':'Переходы между слайдами и анимация содержимого. Настройки сохраняются.';
 $('#effects').title=hint;if(extra)extra.title=hint;
 if(window.gsap)gsap.set($('.cover-background'),{clearProps:'transform'});
}
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('toast-show');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>$('#toast').classList.remove('toast-show'),3500);}
function toggleNotes(value){const open=value??$('#notes').hidden;$('#notes').hidden=!open;$('#notes-button').setAttribute('aria-pressed',String(open));}
function elapsed(){return timerAccum+(timerRunning?performance.now()-timerStart:0);}
function renderTimer(){const secs=Math.floor(elapsed()/1000);$('#timer-display').textContent=`${pad(Math.floor(secs/60))}:${pad(secs%60)}`;$('#timer-toggle').firstChild.textContent=timerRunning?'Ⅱ ':'▶ ';$('#timer-toggle').setAttribute('aria-label',timerRunning?'Приостановить секундомер':'Запустить секундомер');}
function pauseTimer(){if(timerRunning){timerAccum=elapsed();timerRunning=false;renderTimer();}}
$('#timer-toggle').onclick=()=>{if(timerRunning)pauseTimer();else{timerStart=performance.now();timerRunning=true;renderTimer();}};
$('#timer-reset').onclick=()=>{timerAccum=0;timerStart=performance.now();timerRunning=false;renderTimer();};
setInterval(()=>{if(timerRunning)renderTimer();},250);
$('#prev').onclick=()=>step(-1);$('#next').onclick=()=>step(1);
$$('[data-route]').forEach(b=>b.onclick=()=>setRoute(b.dataset.route));
$('#present-button').onclick=()=>setMode(!present);
$('#effects').onclick=()=>setMotion(!effects||reducedEffects?'full':'off');
 $('#contents-effects').onclick=()=>setMotion(!effects||reducedEffects?'full':'off');
$$('[data-motion]').forEach(b=>b.onclick=()=>setMotion(b.dataset.motion));
$('#replay').onclick=()=>playScene(current,true);
$('#notes-button').onclick=()=>toggleNotes();$('#notes-close').onclick=()=>toggleNotes(false);
$('#contents-button').onclick=()=>$('#contents-dialog').showModal();
$('#share-button').onclick=async()=>{try{const url=new URL(location.href);if(url.protocol==='file:'){toast('Для отправки используйте опубликованную ссылку из файла «ССЫЛКА-НА-САЙТ.txt».');return;}url.searchParams.set('present','1');await navigator.clipboard.writeText(url.href);toast('Ссылка на текущий экран скопирована.');}catch{toast('Скопируйте адрес текущего экрана из строки браузера.');}};
async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{toast('Полный экран недоступен в этом окне. Можно открыть сайт в браузере.');}}
$('#fullscreen').onclick=fullscreen;
$('#demo-pause').onclick=()=>{pauseTimer();toast('Секундомер на паузе. Можно перейти в админку, затем продолжить показ.');};
const videoDialog=$('#video-dialog');
videoDialog.addEventListener('close',()=>$('#video-player').replaceChildren());
document.addEventListener('click',e=>{
 const video=e.target.closest('[data-video]');if(video){
  const id=video.dataset.video;if(!['60iMY4vpxWc','7Nlm1V_fG04'].includes(id))return;
  pauseTimer();$('#video-title').textContent=video.dataset.author+' · WIN ALIEN';
  $('#video-external').href='https://www.youtube.com/watch?v='+id;
  const frame=document.createElement('iframe');frame.title='Видео '+video.dataset.author;
  frame.src='https://www.youtube-nocookie.com/embed/'+id+'?autoplay=1&rel=0';
  frame.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';frame.allowFullscreen=true;
  frame.referrerPolicy='strict-origin-when-cross-origin';$('#video-player').replaceChildren(frame);
  videoDialog.showModal();return;
 }

 const zoom=e.target.closest('[data-zoom]');if(zoom){const im=$('img',zoom);$('#zoomed-image').src=im.src;$('#zoomed-image').alt=im.alt;$('#zoom-caption').textContent=im.alt;$('#image-dialog').showModal();return;}
 const goto=e.target.closest('[data-goto]');if(goto){$('#contents-dialog').close();goTo(Number(goto.dataset.goto));return;}
 const link=e.target.closest('a[href^="#slide-"]');if(link){e.preventDefault();goTo(Number(link.hash.slice(7))-1);return;}
 const mat=e.target.closest('[data-open-material]');if(mat)openMaterials(mat.dataset.openMaterial);
});
$$('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());
$$('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target!==d)return;const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}));
document.addEventListener('keydown',e=>{
 if($('dialog[open]')||e.target.closest('input,select,textarea,[contenteditable=true]'))return;
 const k=e.key.toLowerCase();
 if(['arrowright','arrowdown','pagedown',' '].includes(k)){if(present||k==='arrowright'){e.preventDefault();step(1);}}
 else if(['arrowleft','arrowup','pageup'].includes(k)){if(present||k==='arrowleft'){e.preventDefault();step(-1);}}
 else if(k==='p')setMode(!present);else if(k==='n')toggleNotes();else if(k==='f')fullscreen();else if(k==='r')playScene(current,true);
 else if(k==='home'){e.preventDefault();goTo(0);}else if(k==='end'){e.preventDefault();goTo(scenes.length-1);}else if(k==='escape'){toggleNotes(false);if(present)setMode(false);}
});
window.addEventListener('hashchange',()=>{const n=Number(location.hash.slice(7))-1;if(Number.isInteger(n)&&n>=0&&n<scenes.length)goTo(n);});
motion.addEventListener('change',applyEffects);
document.addEventListener('visibilitychange',()=>{if(document.hidden){finishAnimation();finishTransition();}});
function tabs(selector,onSelect){
 const buttons=$$(selector);
 function select(b,focus=false){buttons.forEach(el=>{el.setAttribute('aria-selected',String(el===b));el.tabIndex=el===b?0:-1;});onSelect(b);if(focus)b.focus();}
 buttons.forEach((b,i)=>{b.addEventListener('click',()=>select(b));b.addEventListener('keydown',e=>{let n;if(e.key==='ArrowRight')n=(i+1)%buttons.length;else if(e.key==='ArrowLeft')n=(i+buttons.length-1)%buttons.length;else if(e.key==='Home')n=0;else if(e.key==='End')n=buttons.length-1;if(n!==undefined){e.preventDefault();e.stopPropagation();select(buttons[n],true);}});});
 buttons.forEach((b,i)=>b.tabIndex=i? -1:0);return select;
}
const demos={
 projects:{image:'admin-projects',title:'Проекты и условия',text:'Свои цены, доля, ключи и статус каждого партнёра. Поиск конкретного ключа.',points:['Отдельный проект партнёра','Поиск по ключу','Тестеры отдельно от продаж']},
 issue:{image:'admin-issue',title:'Массовая выдача',text:'Платформа, срок и количество за один запрос. Отдельные ключи для тестеров и авторов видео.',points:['Несколько платформ и сроков','Количество и назначение','Срок начинается с активации']},
 finances:{image:'admin-finances',title:'Начисления и оплаты',text:'Сверяю начисленную долю, полученные выплаты и остаток к расчёту.',points:['Сводка по партнёру','История поступлений','Остаток к расчёту']},
 settings:{image:'admin-settings',title:'Условия партнёра',text:'Название проекта, контакт и доля. Условия сохраняются для новых выдач.',points:['Процент от цены','Момент начисления','Тарифы по срокам']}
};
tabs('[data-demo]',b=>{const d=demos[b.dataset.demo];$('#demo-image').src=`assets/${d.image}.png`;$('#demo-image').alt=`${d.title}. Настоящий интерфейс, данные тестовые.`;$('#demo-title').textContent=d.title;$('#demo-description').textContent=d.text;$('#demo-points').innerHTML=d.points.map(p=>`<li>${p}</li>`).join('');});
const state={...F.DEFAULTS};let model=F.calculate(state);
const advanced=[['server','Сервер, ₽/мес. · факт 560',0,1000000,1],['purchases','Покупок за жизнь клиента · гипотеза LTV',1,100,.1]];
$('#advanced-controls').innerHTML=advanced.map(([name,label,min,max,step])=>`<label>${label}<input type="number" name="${name}" min="${min}" max="${max}" step="${step}" value="${state[name]}"></label>`).join('');
function renderFinance(){
 model=F.calculate(state);
 $$('[data-value]').forEach(el=>{const key=el.dataset.value;el.textContent=money(model[key]);});
 $('#orders-label').textContent=num(model.orders);$('#share-label').textContent=`${num(model.share)}%`;
 $('#month-result').classList.toggle('negative',model.result<0);
 $('#break-even').textContent=model.breakEven===null?'Не достигается':`${num(model.breakEven)} ${model.breakEven%10===1&&model.breakEven%100!==11?'активация':model.breakEven%10>=2&&model.breakEven%10<=4&&!(model.breakEven%100>=12&&model.breakEven%100<=14)?'активации':'активаций'}`;
 $$('[data-example="owner"]').forEach(e=>e.textContent=money(700*model.share/100));
 $$('[data-example="partner"]').forEach(e=>e.textContent=money(700*(100-model.share)/100));
 $$('[data-share]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.share)===model.share)));
 $$('[data-orders]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.orders)===model.orders)));
 const scenarios=[20,50,100].map(orders=>F.calculate({...state,orders})),max=Math.max(...scenarios.map(s=>Math.abs(s.result)),1);
 $('#scenario-chart').innerHTML=scenarios.map(s=>`<div class="scenario-bar-wrap"><strong>${money(s.result)}</strong><div class="scenario-bar ${s.result<0?'negative':''}" style="--bar-height:${Math.max(3,Math.abs(s.result)/max*85)}px" aria-hidden="true"></div><span>${s.orders} активаций${s.result<0?' · убыток':''}</span></div>`).join('');
 $('#scenario-chart').setAttribute('role','img');$('#scenario-chart').setAttribute('aria-label',scenarios.map(s=>`${s.orders} активаций: ${money(s.result)}`).join('; '));
 if($('#materials-dialog').open&&$('[data-material="finance"]').getAttribute('aria-selected')==='true')renderMaterial('finance');
}
$('#finance-form').addEventListener('submit',e=>e.preventDefault());
$('#finance-form').addEventListener('input',e=>{if(e.target.name){state[e.target.name]=e.target.value;renderFinance();}});
$('#advanced-controls').addEventListener('input',e=>{if(e.target.name&&e.target.value!==''){state[e.target.name]=e.target.value;renderFinance();}});
$('#advanced-controls').addEventListener('change',e=>{if(e.target.value==='')e.target.value=F.DEFAULTS[e.target.name];const lo=Number(e.target.min),hi=Number(e.target.max);e.target.value=Math.min(hi,Math.max(lo,Number(e.target.value)));state[e.target.name]=Number(e.target.value);renderFinance();});
$('#costs-button').onclick=()=>$('#costs-dialog').showModal();
$$('[data-orders]').forEach(b=>b.onclick=()=>{state.orders=Number(b.dataset.orders);$('#orders').value=state.orders;renderFinance();});
$$('[data-share]').forEach(b=>b.onclick=()=>{state.share=Number(b.dataset.share);$('#share').value=state.share;renderFinance();});
$('#reset-model').onclick=()=>{Object.assign(state,F.DEFAULTS);$('#finance-form').reset();advanced.forEach(([key])=>$(`[name="${key}"]`,$('#advanced-controls')).value=state[key]);renderFinance();toast('Базовый сценарий восстановлен.');};
function renderMaterial(name){
 const el=$('#materials-content');el.setAttribute('aria-labelledby','material-'+name);
 if(name==='finance'){
  el.innerHTML=`<p><b>Учебный сценарий.</b> Автор отдельно сообщает о суммарном доходе около 70 000 ₽/мес. с трёх реселлеров и своего канала. Эта оценка не определяет параметры калькулятора. Единственный денежный расход проекта сейчас сервер Play2Go: 560 ₽/мес., Германия, подтверждено 13.11.2026. Он не растёт от количества активаций, цены или доли.</p><div class="table-scroll"><table><thead><tr><th>Показатель</th><th>Формула</th><th>Результат</th></tr></thead><tbody>${[
   ['Оборот сети','Активации × средний чек',money(model.turnover)],['Моя доля','Оборот × доля владельца',money(model.ownerRevenue)],['Партнёрам','Оборот − моя доля',money(model.resellerRevenue)],['Денежные расходы','Сервер, фиксированно за месяц',money(model.cashExpenses)],['Результат','Моя доля − сервер',money(model.result)],['Вклад активации','Цена × моя доля',money(model.contribution)],['Безубыточность','Сервер / вклад, округление вверх',model.breakEven??'Не достигается'],['CAC','Пока не измерен','Нет учёта стоимости привлечения'],['LTV по доле','Вклад × предполагаемое число покупок',money(model.ltv)]
  ].map(row=>'<tr>'+row.map(c=>`<td>${c}</td>`).join('')+'</tr>').join('')}</tbody></table></div><h3>Базовый пример</h3><p>50 платных активаций, моя доля 50%. Микс тарифов: 40 / 30 / 20 / 5 / 4 / 1% для 1 / 7 / 30 / 60 / 90 дней / безлимита. Структура продаж расчётная, средний чек 414 ₽. Оборот 20 700 ₽, моя доля 10 350 ₽, сервер 560 ₽, остаётся 9 790 ₽ до налогов и оплаты труда при полном расчёте партнёров.</p><p>Сервер покрывают 3 активации с этим средним чеком или 8 дневных по 140 ₽ при моей доле 50%. При нуле продаж результат −560 ₽, потому что сервер всё равно оплачен.</p><p>Отдельных денежных расходов на рекламу, комиссии и поддержку сейчас нет. CAC не измерен: нулевой рекламный бюджет сам по себе не доказывает бесплатное привлечение, время тоже является ресурсом. LTV при двух покупках является гипотезой. Разрабатываю самостоятельно, отдельные денежные расходы на свой труд не учитываю.</p>`;
 }else if(name==='research'){
  el.innerHTML=window.WinMaterials.research;
 }else if(name==='criteria'){
  el.innerHTML=window.WinMaterials.criteria;
 }else if(name==='sources'){
  el.innerHTML=`<h3>Подтверждённые сведения</h3><ul><li>Харламов Арсений Сергеевич, группа 2пр/25.</li><li>По данным октября 2026: один крупный партнёр GetCheats и три начинающих. Сервер Play2Go в Германии, 560 ₽/мес., повторно подтверждено 13.11.2026.</li><li>Тарифы автора: 140 / 350 / 700 / 900 / 1 200 / 2 000 ₽.</li><li>Со слов автора от 26.10.2026: выдачи по 100 ключей на каждый срок и платформу; дневные ключи почти распродали за пять дней. Это не выгрузка продаж и не подтверждение конкретной месячной выручки.</li></ul><h3>Настоящие материалы</h3><p>Скриншоты продукта, лоадера, карточки GetCheats, обзора Sarkov и фрагменты Telegram предоставлены автором. Вырезаны личные разговоры, ключи и идентификатор заказа скрыты. У панелей интерфейс настоящий, записи и суммы тестовые. На предоставленном кадре YouTube 3,2 тыс. просмотров; это не число покупок.</p><p><a href="https://getcheats.io/mobile/oxide-survival-island/win-alien-oxide-survival-island" target="_blank" rel="noopener">Карточка продукта на GetCheats ↗</a></p><p><a href="https://play2go.cloud/" target="_blank" rel="noopener">Провайдер сервера Play2Go ↗</a>. Стоимость указана со слов автора; публичный сайт провайдера сам по себе не подтверждает его конкретный платёж.</p><h3>Учебная основа</h3><p>Предоставленные материалы преподавателя: бюджет, юнит-экономика, финансирование, подготовка презентации, публичное выступление и репетиция питчинга. Использованы SMART, смета, CAC и LTV, гипотеза воронки, план CustDev, CJM, диаграмма Ганта и короткие итерации.</p><h3>Иллюстрации и предположения</h3><p>Обложка и персонажи с логотипами подготовлены при помощи AI по референсам автора. Остальные изображения — предоставленные промо, игровые кадры, интерфейсы и мемы. Мем с довольным покупателем не является отзывом. Логотипы взяты из материалов автора. Формулы и сценарии открыты, точная выручка не заявляется. 50 активаций в SMART это контрольная выборка качества учёта.</p><p>Сайт работает отдельно от системы ключей. Административных полномочий и доступа к базе ключей у презентации нет.</p>`;
 }else{
  const items=[['Что именно защищается?','Организация партнёрских продаж моего продукта: требования, ключи, проекты, условия, финмодель и контроль расчётов. Продукт и панель уже существуют.'],['Почему не просто таблица?','Таблица удобна для небольшого учёта. Мне нужны также массовая выдача, срок с активации, поиск ключа и управление статусом проекта на сервере. Панель объединяет эти действия, но её сопровождение требует времени.'],['Сколько вы реально зарабатываете?','По моим данным, с трёх реселлеров и моего канала в сумме выходит около 70 000 ₽ в месяц. Это оценка автора без приложенной выгрузки. Калькулятор показывает отдельные учебные сценарии.'],['Почему цель только 50 активаций?','Это контрольная выборка, по которой проверю правильность учёта и сверки. Это не план всех продаж. Цель на 30 дней также включает все четыре проекта и еженедельные сверки.'],['Откуда средний чек 414 ₽?','Это взвешенный средний по подтверждённым тарифам, но с предполагаемой структурой продаж: 40 / 30 / 20 / 5 / 4 / 1%. Реальные веса нужно получить из учёта.'],['Как посчитана безубыточность?','В базе сервер 560 ₽, моя доля с активации 207 ₽. 560 / 207 с округлением вверх даёт 3 активации. У дневного тарифа по 140 ₽ при доле 50% нужно 8 активаций. Налоги и мой труд в этой точке не учтены. Если вклад неположительный, безубыточность не достигается.'],['Где Agile и Scrum?','Обратную связь превращаю в небольшие задачи, вношу изменение и проверяю. Работаю один с AI-ассистентом, поэтому не называю это полноценной Scrum-командой.'],['Что делал сам и где использовал AI?','Я определял задачу, договаривался с партнёрами и тестерами, задавал требования и принимал результат. AI помогал с кодом, расчётами, иллюстрациями и оформлением. Моя задача на защите объяснить решения и ограничения.'],['Как проверю, что панель полезна?','Буду отслеживать ошибки выдач, время повторной выдачи, расхождения в сверках и долю проектов с актуальными условиями. Пока эффект в рублях или сэкономленных часах не измерен.'],['Какие основные риски?','Неоплата партнёром, зависимость от крупного канала, технические сбои, изменения игры и условий площадок. Нужны лимиты выдач, еженедельная сверка, резервные копии, несколько каналов и пересмотр плана по фактам.']];
  el.innerHTML='<p>Для репетиции: сначала объяснить продукт и цепочку продажи, затем показать панель, после этого перейти к экономике. Общее выступление 15–30 минут. После репетиции записать, что было непонятно и какие ответы требуют данных.</p>'+items.map(([q,a])=>`<details><summary>${q}</summary><p>${a}</p></details>`).join('');
 }
}
const selectMaterial=tabs('[data-material]',b=>renderMaterial(b.dataset.material));
function openMaterials(name='finance'){const b=$(`[data-material="${name}"]`)||$('[data-material="finance"]');selectMaterial(b);if(!$('#materials-dialog').open)$('#materials-dialog').showModal();$('#materials-dialog').scrollTop=0;}
$('#materials-button').onclick=()=>openMaterials();
function downloadModel(){
 const labels={orders:'Платные активации',share:'Моя доля, %',price:'Средний чек, ₽',server:'Сервер, ₽/мес.',purchases:'Покупок за жизнь клиента',turnover:'Оборот сети, ₽',ownerRevenue:'Моя доля, ₽',resellerRevenue:'Доля партнёров, ₽',contribution:'Вклад активации, ₽',cashExpenses:'Денежные расходы, ₽',result:'Результат до налогов и труда, ₽',breakEven:'Безубыточность, активаций',budget:'Денежный бюджет, ₽',cac:'CAC (не измерен), ₽',ltv:'Предварительный LTV по вкладу, ₽'};
 const rows=[['WIN ALIEN','Харламов Арсений Сергеевич · 2пр/25'],['Статус','Расчётный сценарий, не фактическая выручка'],['Тариф',state.tariff==='mix'?'Микс 40/30/20/5/4/1%':state.tariff==='0'?'Безлимит':state.tariff+' дней'],['Показатель','Значение'],...Object.entries(labels).map(([key,label])=>[label,model[key]??'Не определяется']),['Денежные расходы','Только сервер, фиксированно за месяц'],['Ограничения','До налогов и оплаты труда, при полном расчёте партнёров. Денежные расходы только сервер. CAC не измерен.']];
 const csv='\uFEFF'+rows.map(row=>row.map(v=>'"'+(typeof v==='number'?String(v).replace('.',','):String(v)).replaceAll('"','""')+'"').join(';')).join('\r\n');
 const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})),link=document.createElement('a');link.href=url;link.download='WIN-ALIEN-финмодель.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Текущий расчёт сохранён в CSV.');
}
$('#download-model').onclick=downloadModel;
let printRestore=null;
function preparePrint(){finishAnimation();printRestore={present,requestedEffects,motionChoice};toggleEffects(false);slides.forEach(s=>{s.inert=false;$$('img',s).forEach(im=>im.loading='eager');});}
window.addEventListener('beforeprint',preparePrint);
window.addEventListener('afterprint',()=>{if(printRestore){requestedEffects=printRestore.requestedEffects;motionChoice=printRestore.motionChoice;applyEffects();slides.forEach((s,i)=>s.inert=present&&current!==i);printRestore=null;}});
$('#print-button').onclick=()=>{$('#materials-dialog').close();window.print();};
renderFinance();renderTimer();applyEffects();
const initial=Number(location.hash.slice(7))-1;current=Number.isInteger(initial)&&initial>=0&&initial<scenes.length?initial:0;
setMode(present,false);setRoute(route);
if(window.gsap&&window.ScrollTrigger){
 gsap.registerPlugin(ScrollTrigger);
 triggers.push(ScrollTrigger.create({trigger:slides[0],start:'top top',end:'bottom top',onUpdate:t=>{if(effects&&!reducedEffects&&!present)gsap.set($('.cover-background'),{yPercent:-2*t.progress});}}));
 slides.forEach((slide,i)=>{triggers.push(ScrollTrigger.create({trigger:slide,start:'top 45%',end:'bottom 45%',onEnter:()=>{if(!present&&performance.now()>navLock)activate(i);},onEnterBack:()=>{if(!present&&performance.now()>navLock)activate(i);}}));});
 if(present)triggers.forEach(t=>t.disable());
}else{
 let raf=false;window.addEventListener('scroll',()=>{if(present||raf||performance.now()<navLock)return;raf=true;requestAnimationFrame(()=>{raf=false;const y=innerHeight*.45;const i=slides.findIndex(s=>{const r=s.getBoundingClientRect();return r.top<=y&&r.bottom>y;});if(i>=0&&i!==current)activate(i);});},{passive:true});
}
Promise.all([document.fonts.ready,...$$('img').filter(im=>im.loading!=='lazy').map(im=>im.decode().catch(()=>{}))]).then(()=>{window.ScrollTrigger?.refresh();goTo(current);playScene(current);});
window.addEventListener('resize',()=>{if(!present)window.ScrollTrigger?.refresh();});
window.WinPresentation={goTo,setMode,setRoute,setMotion,toggleEffects,pauseTimer,downloadModel,get motionMode(){return motionChoice;},get reducedEffects(){return reducedEffects;},get route(){return route;},get animationDuration(){return timeline?.duration()??0;},get transitionDuration(){return transitionTimeline?.duration()??0;},get current(){return current;},get present(){return present;},get effects(){return effects;},get model(){return {...model};},get elapsed(){return elapsed();}};
})();
