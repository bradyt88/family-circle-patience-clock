const board=document.querySelector('#board'),draw=document.querySelector('#draw'),kings=document.querySelector('#kings');let S,timer,deal;
const suits=[['♠','b'],['♥','r'],['♦','r'],['♣','b']],ranks=[['A',1],...Array.from({length:9},(_,i)=>[i+2,i+2]),['J',11],['Q',12],['K',13]];

function deck(){let a=[];for(const[s,c]of suits)for(const[r,v]of ranks)a.push({s,c,r,v});return a}
function shuffle(a){for(let i=a.length-1;i;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function card(x,back=false){let e=document.createElement('div');e.className='card '+(back?'back':'face')+(x?.c==='r'?' red':'');if(!back)e.textContent=x.r+x.s;return e}

function fresh(){
 clearInterval(timer);clearInterval(deal);
 S={p:{},placed:{},draw:[],k:[],at:'draw',moves:0,seen:0,time:0,phase:'deal',paused:false,deck:shuffle(deck()),dealIndex:0,pending:null};
 for(let i=1;i<=12;i++){S.p[i]=[];S.placed[i]=[]}
 build();
 document.querySelector('#modal').classList.add('off');
 document.querySelector('#pause').textContent='Pause';
 document.querySelector('#status').textContent='Shuffling a fresh 52-card deck…';
 document.querySelector('#indicator').textContent='Dealing the clock…';
 render();
 const seq=[];for(let round=0;round<4;round++){for(let p=1;p<=12;p++)seq.push({type:'pile',p});seq.push({type:'draw'})}
 let i=0;
 deal=setInterval(()=>{
   const move=seq[i++],x=S.deck[S.dealIndex++];
   if(move.type==='draw')S.draw.push(x);else S.p[move.p].push(x);
   render();
   const target=move.type==='draw'?draw:document.querySelector('.slot[data-p="'+move.p+'"] .stack');
   target.animate([{transform:'scale(.88)'},{transform:'scale(1.08)'},{transform:'scale(1)'}],{duration:220});
   if(i>=seq.length){
     clearInterval(deal);
     setTimeout(()=>{
       S.phase='play';
       document.querySelector('#status').textContent='Clock dealt. Click the highlighted pile to reveal its top card.';
       document.querySelector('#indicator').textContent='Click DRAW to begin';
       startTimer();
       render();
     },450);
   }
 },120);
}

function build(){
 board.innerHTML='';
 for(let p=1;p<=12;p++){
   let e=document.createElement('div');e.className='slot';e.dataset.p=p;
   let a=(p-3)*30*Math.PI/180;
   e.style.left=(50+42*Math.cos(a))+'%';e.style.top=(50+42*Math.sin(a))+'%';
   e.innerHTML='<label>'+p+'</label><div class="stack"></div>';
   e.addEventListener('click',()=>revealFrom(p));
   board.appendChild(e);
 }
 draw.onclick=()=>revealFrom('draw');
}

function backs(el,n){
 el.innerHTML='';
 for(let i=0;i<Math.min(n,4);i++){let c=card(null,true);c.style.transform='translate(-50%,-50%) translate('+i*2+'px,'+i*2+'px)';c.style.zIndex=i;el.appendChild(c)}
}

function render(){
 for(let p=1;p<=12;p++){
   let st=document.querySelector('.slot[data-p="'+p+'"]'),el=st.querySelector('.stack');el.innerHTML='';
   backs(el,S.p[p].length);
   (S.placed[p]||[]).forEach((x,i)=>{let c=card(x);c.style.transform='translate(-50%,-50%) translate('+i*2+'px,'+i*2+'px)';c.style.zIndex=10+i;el.appendChild(c)});
   st.classList.toggle('active',S.phase==='play'&&S.at===p&&!S.pending);
 }
 backs(draw,S.draw.length);
 kings.innerHTML='';
 S.k.forEach((x,i)=>{let c=card(x);c.style.transform='translate(-50%,-50%) translate('+i*2+'px,'+i*2+'px)';kings.appendChild(c)});
 draw.parentElement.classList.toggle('active',S.phase==='play'&&S.at==='draw'&&S.draw.length>0&&!S.pending);
 document.querySelector('#moves').textContent=S.moves;
 document.querySelector('#seen').textContent=S.seen;
 document.querySelector('#time').textContent=fmt(S.time);
 document.querySelector('#kc').textContent=S.k.length+' / 4';
 document.querySelector('#dc').textContent=S.draw.length+' cards';
}

function fmt(n){return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0')}
function startTimer(){if(timer)return;timer=setInterval(()=>{if(!S.paused&&S.phase==='play'){S.time++;document.querySelector('#time').textContent=fmt(S.time)}},1000)}

function revealFrom(source){
 if(S.phase!=='play'||S.paused||S.pending)return;
 if(source==='draw'){
   if(!S.draw.length)return;
   if(S.at!=='draw')return;
   S.pending=S.draw.pop();
 }else{
   if(S.at!==source||!S.p[source].length)return;
   S.pending=S.p[source].pop();
 }
 S.seen++;S.moves++;
 document.querySelector('#status').textContent='Drag '+S.pending.r+S.pending.s+' to the correct position.';
 document.querySelector('#indicator').textContent=S.pending.v===13?'Drag the King to KINGS':'Drag it to '+S.pending.v+" o'clock";
 render();
 showPending();
}

function showPending(){
 if(!S.pending)return;
 const x=S.pending;
 const el=card(x);
 el.classList.add('draggable-card');
 el.style.position='fixed';el.style.left='50%';el.style.top='50%';el.style.margin=0;el.style.zIndex=1000;
 document.body.appendChild(el);
 S.dragEl=el;
 const sourceType=S.at;S.pendingSource=sourceType;
 if(sourceType)placeAtSource(el,sourceType);
 else{
   const anchor=S.at==='draw'?draw:document.querySelector('.slot[data-p="'+S.at+'"] .stack');
   const r=anchor.getBoundingClientRect();el.style.left=(r.left+r.width/2)+'px';el.style.top=(r.top+r.height/2)+'px';
 }
 el.addEventListener('pointerdown',startDrag);el.addEventListener('click',e=>e.stopPropagation());
 }

function placeAtSource(el,source){
 const anchor=source==='draw'?draw:document.querySelector('.slot[data-p="'+source+'"] .stack');
 if(!anchor)return;
 const r=anchor.getBoundingClientRect();el.style.left=(r.left+r.width/2)+'px';el.style.top=(r.top+r.height/2)+'px';
}

function startDrag(ev){
 if(!S.pending||S.paused||S.phase!=='play')return;
 ev.preventDefault();S.dragging=true;S.dragEl.classList.add('dragging');
 S.dragOffsetX=0;S.dragOffsetY=0;
 S.dragEl.setPointerCapture(ev.pointerId);
 highlightTarget();
 S.dragEl.onpointermove=e=>{S.dragEl.style.left=e.clientX+'px';S.dragEl.style.top=e.clientY+'px';highlightTarget(e.clientX,e.clientY)};
 S.dragEl.onpointerup=e=>{S.dragEl.releasePointerCapture?.(e.pointerId);finishDrag(e.clientX,e.clientY)};S.dragEl.onpointercancel=e=>{S.dragEl.releasePointerCapture?.(e.pointerId);finishDrag(e.clientX,e.clientY)};
}

function highlightTarget(x,y){
 document.querySelectorAll('.drop-target,.drop-wrong').forEach(e=>e.classList.remove('drop-target','drop-wrong'));
 if(x==null)return;
 const target=getTargetAt(x,y);
 if(target){
   if(isCorrectTarget(target))target.el.classList.add('drop-target');else target.el.classList.add('drop-wrong');
 }
}

function getTargetAt(x,y){
 const els=document.elementsFromPoint(x,y);
 for(const el of els){
   const slot=el.closest?.('.slot');if(slot)return {type:'slot',p:Number(slot.dataset.p),el:slot};
   if(el.closest?.('#kings'))return {type:'kings',el:kings.parentElement};
 }
 return null;
}

function isCorrectTarget(t){return S.pending&&((S.pending.v===13&&t.type==='kings')||(S.pending.v!==13&&t.type==='slot'&&t.p===S.pending.v))}
function finishDrag(x,y){
 if(!S.dragEl)return;
 const target=getTargetAt(x,y);
 highlightTarget();
 
 if(!isCorrectTarget(target)){
   S.dragEl.classList.remove('dragging');
   const source=S.pendingSource;
   setTimeout(()=>{if(S.dragEl){placeAtSource(S.dragEl,source);S.dragEl.classList.remove('dragging')}},80);
   S.statusReturn=true;
   return;
 }
 const xcard=S.pending;
 S.dragEl.remove();
 S.dragEl=null;
 S.dragging=false;
 S.pending=null;
 if(xcard.v===13){
   S.k.push(xcard);
   if(S.k.length===4){render();return setTimeout(()=>end(S.seen===52),400)}
   S.at='draw';
   document.querySelector('#status').textContent='King placed. Click DRAW to reveal the next card.';
   document.querySelector('#indicator').textContent='Click DRAW';
 }else{
   S.placed[xcard.v].push(xcard);
   S.at=xcard.v;
   document.querySelector('#status').textContent='Card placed. Click the '+xcard.v+" o'clock pile to reveal its top card.";
   document.querySelector('#indicator').textContent='Click '+xcard.v+" o'clock";
 }
 render();
 if(S.seen===52)return setTimeout(()=>end(true),400);
}

function end(win){
 S.phase=win?'win':'loss';clearInterval(timer);render();
 document.querySelector('#rk').textContent=win?'CLOCK COMPLETE':'FOURTH KING';
 document.querySelector('#rt').textContent=win?'You Completed the Clock':'The Clock Has Stopped';
 document.querySelector('#rx').textContent=win?'All 52 cards were revealed.':'The fourth King was revealed before all 52 cards could be exposed.';
 document.querySelector('#fm').textContent=S.moves;
 document.querySelector('#ft').textContent=fmt(S.time);
 document.querySelector('#fs').textContent=S.seen;
 document.querySelector('#modal').classList.remove('off');
}

document.querySelector('#new').onclick=()=>fresh();
document.querySelector('#again').onclick=()=>fresh();
document.querySelector('#pause').onclick=()=>{
 if(S.phase!=='play'||S.pending)return;
 S.paused=!S.paused;
 document.querySelector('#pause').textContent=S.paused?'Resume':'Pause';
 document.querySelector('#status').textContent=S.paused?'Game paused.':'Continue by dragging the revealed card.';
};
fresh();