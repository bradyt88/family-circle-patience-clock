const board=document.querySelector('#board'),draw=document.querySelector('#draw'),kings=document.querySelector('#kings');let S,timer,deal;
const suits=[['♠','b'],['♥','r'],['♦','r'],['♣','b']],ranks=[['A',1],...Array.from({length:9},(_,i)=>[i+2,i+2]),['J',11],['Q',12],['K',13]];

function deck(){let a=[];for(const[s,c]of suits)for(const[r,v]of ranks)a.push({s,c,r,v});return a}
function shuffle(a){for(let i=a.length-1;i;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function card(x,back=false){let e=document.createElement('div');e.className='card '+(back?'back':'face')+(x?.c==='r'?' red':'');if(!back)e.textContent=x.r+x.s;return e}
function fresh(){
 clearInterval(timer);clearInterval(deal);
 S={p:{},draw:[],k:[],rev:{},at:'draw',moves:0,seen:0,time:0,phase:'deal',paused:false,deck:shuffle(deck()),dealIndex:0};
 for(let i=1;i<=12;i++)S.p[i]=[];
 build();
 document.querySelector('#modal').classList.add('off');
 document.querySelector('#pause').textContent='Pause';
 document.querySelector('#next').disabled=true;
 document.querySelector('#next').textContent='Reveal Card';
 document.querySelector('#status').textContent='Shuffling a fresh 52-card deck…';
 document.querySelector('#indicator').textContent='Dealing the clock…';
 render();
 const seq=[];for(let round=0;round<4;round++){for(let p=1;p<=12;p++)seq.push({type:'pile',p});seq.push({type:'draw'})}
 let i=0;
 deal=setInterval(()=>{
   const move=seq[i++],x=S.deck[S.dealIndex++];
   if(move.type==='draw')S.draw.push(x);else S.p[move.p].push(x);
   render();
   if(move.type==='pile'){
     const st=document.querySelector('.slot[data-p="'+move.p+'"] .stack');
     st.animate([{transform:'scale(.88)'},{transform:'scale(1.08)'},{transform:'scale(1)'}],{duration:220});
   }else{
     draw.animate([{transform:'scale(.88)'},{transform:'scale(1.08)'},{transform:'scale(1)'}],{duration:220});
   }
   if(i>=seq.length){
     clearInterval(deal);
     setTimeout(()=>{
       S.phase='ready';
       document.querySelector('#status').textContent='The clock is dealt. Press Reveal Card to begin.';
       document.querySelector('#indicator').textContent='Ready to play';
       document.querySelector('#next').disabled=false;
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
   board.appendChild(e);
 }
}
function backs(el,n){
 el.innerHTML='';
 for(let i=0;i<Math.min(n,4);i++){let c=card(null,true);c.style.transform='translate(-50%,-50%) translate('+i*2+'px,'+i*2+'px)';c.style.zIndex=i;el.appendChild(c)}
}
function render(){
 for(let p=1;p<=12;p++){
   let st=document.querySelector('.slot[data-p="'+p+'"]'),el=st.querySelector('.stack');el.innerHTML='';
   backs(el,S.p[p].length);
   (S.rev[p]||[]).forEach((x,i)=>{let c=card(x);c.style.transform='translate(-50%,-50%) translate('+i*2+'px,'+i*2+'px)';c.style.zIndex=10+i;el.appendChild(c)});
   st.classList.toggle('active',S.phase==='play'&&S.at===p);
 }
 backs(draw,S.draw.length);
 kings.innerHTML='';
 S.k.forEach((x,i)=>{let c=card(x);c.style.transform='translate(-50%,-50%) translate('+i*2+'px,'+i*2+'px)';kings.appendChild(c)});
 document.querySelector('#moves').textContent=S.moves;
 document.querySelector('#seen').textContent=S.seen;
 document.querySelector('#time').textContent=fmt(S.time);
 document.querySelector('#kc').textContent=S.k.length+' / 4';
 document.querySelector('#dc').textContent=S.draw.length+' cards';
}
function fmt(n){return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0')}
function startPlay(){
 if(S.phase!=='ready')return;
 S.phase='play';
 document.querySelector('#status').textContent='Reveal the top card of the DRAW pile.';
 document.querySelector('#indicator').textContent='Your turn';
 timer=setInterval(()=>{if(!S.paused&&S.phase==='play'){S.time++;document.querySelector('#time').textContent=fmt(S.time)}},1000);
 render();
}
function step(){
 if(S.phase==='ready')startPlay();
 if(S.phase!=='play'||S.paused)return;
 const x=S.at==='draw'?S.draw.pop():S.p[S.at].pop();
 if(!x)return end(false);
 S.moves++;S.seen++;
 if(x.v===13){
   S.k.push(x);
   render();
   if(S.k.length===4)return setTimeout(()=>end(S.seen===52),450);
   S.at='draw';
   document.querySelector('#status').textContent='King revealed — reveal the next card from DRAW.';
 }else{
   S.rev[x.v]??=[];S.rev[x.v].push(x);S.at=x.v;
   document.querySelector('#status').textContent=x.r==='A'?'Ace revealed — next pile is 1 o’clock.':x.r+' revealed — next pile is '+x.v+" o'clock.";
 }
 render();
 if(S.seen===52)return setTimeout(()=>end(true),450);
 document.querySelector('#indicator').textContent='Reveal the next card';
}
function end(win){
 S.phase=win?'win':'loss';clearInterval(timer);render();
 document.querySelector('#next').disabled=true;
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
 if(S.phase!=='play')return;
 S.paused=!S.paused;
 document.querySelector('#pause').textContent=S.paused?'Resume':'Pause';
 document.querySelector('#status').textContent=S.paused?'Game paused.':'Reveal the next card.';
};
document.querySelector('#next').onclick=()=>step();
fresh();