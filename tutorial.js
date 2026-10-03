/* Contextual guides on the live board. Static examples below also serve as logic fixtures. */
(function(root){
'use strict';
const level={id:'tutorial',name:'新手小课堂',size:5,regions:[[0,0,2,1,1],[0,0,2,1,1],[2,2,2,1,1],[3,2,2,4,4],[2,2,2,4,4]]};
const board=(cats=[],marks=[])=>Array.from({length:25},(_,i)=>cats.includes(i)?2:marks.includes(i)?1:0);
const lessons=[
 {title:'单击：记一个 ×',text:'每行、每列、每种颜色都要恰好一只猫。× 是你排除的位置，不是猫。这一行已经有猫，单击发光格，把它排除。',board:board([1]),targets:[0],value:1,gesture:'single'},
 {title:'双击：确认一只猫',text:'快速双击同一格（手机连点两下）就能放猫。这里先告诉你一个确定位置：双击发光格。放错了可单击清空，或使用撤销。',board:board(),targets:[1],value:2,gesture:'double'},
 {title:'按住拖动：批量标 ×',text:'按住左键，从最左侧发光格滑到最右侧，把这三格一起标 ×。手机按住滑动也可以。从已有 × 开始会连续擦除；一整笔只需撤销一次。键盘也可逐格按 X。',board:board([1]),targets:[2,3,4],value:1,gesture:'drag'},
 {title:'别忘了斜角',text:'猫咪周围八格都不能再放猫，斜着相邻也不行。已有猫的同一行、同一列、同种颜色也都可以排除。先单击它斜下方的发光格。',board:board([1]),targets:[5],value:1},
 {title:'一种颜色只剩一格',text:'紫色区域 A 还没有猫，其余格子已经排除，只剩发光格。每种颜色必须有一只猫，所以双击这里放猫。',board:board([],[0,5,6]),targets:[1],value:2},
 {title:'一行只剩一格',text:'第 3 行还没有猫，其余位置都排除了，只剩中间这格。每行必须有一只猫，所以双击发光格。',board:board([],[10,11,13,14]),targets:[12],value:2},
 {title:'一列只剩一格',text:'第 4 列还没有猫，只剩最后一行能够放猫。列的判断和行一样：只剩一个合法位置，就能确定它。双击发光格。',board:board([],[3,8,13,18]),targets:[23],value:2},
 {title:'一种颜色锁定一行',text:'紫色 A 只在第 1 行还有候选。无论猫在紫色哪一格，第 1 行的猫都会是紫色。把这一行其他颜色的三个发光格标 ×。',board:board([],[5,6]),targets:[2,3,4],value:1},
 {title:'一种颜色锁定一列',text:'黄色 B 的候选全部在第 5 列。因此第 5 列的猫一定是黄色，这一列其他颜色的两个发光格可以排除。',board:board([],[3,8,13]),targets:[19,24],value:1},
 {title:'反过来：一行锁定颜色',text:'第 5 行只剩蓝色 E 能放猫，所以蓝色的猫一定在第 5 行。蓝色在第 4 行的两个发光格就能排除。一列只剩一种颜色时，也同样适用。',board:board([],[20,21,22]),targets:[18,19],value:1},
 {title:'两种颜色占住两行',text:'紫色 A、黄色 B 的候选都只在前两行。这两种颜色各需要一只猫，会占满前两行，所以前两行的绿色格都能排除。两列也同理。',board:board([],[13,14]),targets:[2,7],value:1},

 {title:'两列只剩两种颜色',text:'第 3、4 列的候选只有绿色 C 和蓝色 E。两列各要一只猫，会用掉这两种颜色，所以绿色、蓝色在其他列的发光格都能排除。两行只剩两种颜色也同理。',board:board([],[3,8,13]),targets:[10,11,16,20,21,19,24],value:1},
 {title:'假设会让另一种颜色消失',text:'先在脑中试一下：如果左上角是猫，第 1 列其他格就不能放猫，粉色 D 会一个候选也不剩。每种颜色都必须有猫，这个假设不成立，所以左上角可以标 ×。不用真的放下假设猫，也能完成这一步推理。',board:board(),targets:[0],value:1},
 {title:'假设不是答案，矛盾后再撤回',text:'现在试着假设左上角有猫，但粉色 D 只有第 4 行第 1 列这一个格子，同列已有猫，D 就无处放猫，产生矛盾。点击下面的撤回按钮，恢复原盘并记住排除的起点。正式游戏也有这组假设按钮。',board:board([0]),targets:[0,15],value:1,gesture:'rollback'},
 {title:'学会自己找下一步',text:'优先排除已有猫影响的位置，再找颜色、行、列的唯一候选，然后看行列与颜色的交叉限制。卡住时点“推理提示”：先看原因和高亮，再决定是否应用。× 也可能标错，若提示矛盾请回查。',board:board([1,9,12,15,23]),targets:[],gesture:'finish'}
];
const H=typeof module!=='undefined'&&module.exports?require('./hints.js'):root.CatHints;
const kinds={1:['region-single','row-single','column-single'],4:['region-single'],5:['row-single'],6:['column-single'],7:['region-row'],8:['region-column'],9:['row-region','column-region'],10:['pair-row','pair-column'],11:['lines-pair-row','lines-pair-column'],12:['lookahead-region']};
// Every suggested board edit is derived from this board's constraints, never an answer lookup.
function plan(level,board,lesson,trial=null){
 const n=level.size,row=i=>Math.floor(i/n),col=i=>i%n,pos=i=>'第 '+(row(i)+1)+' 行第 '+(col(i)+1)+' 列';
 if(lesson===14)return{title:'卡住了，就看一条线索',text:'点「推理提示」，先看理由与高亮的位置。想明白后再决定是否应用。',control:'hint-request',targets:[]};
 if(lesson===13){
  if(trial&&trial.root!==null)return{title:'试过的路，可以退回来',text:'点击「撤回假设」恢复开始前的棋盘。起点会留下「试」标记，帮你记住试过哪里；发现矛盾也要先检查本轮有没有误标。',control:'trial-return',targets:[]};
  if(trial)return null;
  const next=H.find(level,board);if(next.kind!=='trial')return null;
  return{...next,title:'不确定时，先留一条退路',text:'这组候选暂时拿不准。点「开始假设」保存原盘，再选一个候选试试。中途可以撤回整轮推演。',control:'trial-start',targets:[],evidence:next.targets};
 }
 if(!H.feasible(level,board))return null;
 const cats=board.flatMap((v,i)=>v===2?[i]:[]),available=new Set(H.candidates(level,board));
 if(lesson===0){for(const cat of cats){const i=board.findIndex((v,j)=>v===0&&row(j)===row(cat));if(i!==-1)return{title:'点一下，排除这一格',text:'这一行已经有猫了。单击发光格标 ×，表示「这里不是猫」。',targets:[i],evidence:[cat],value:1};}return null;}
 if(lesson===2){
  for(const axis of ['row','column'])for(let line=0;line<n;line++){
   let run=[];for(let k=0;k<=n;k++){const i=axis==='row'?line*n+k:k*n+line;if(k<n&&board[i]===0&&!available.has(i))run.push(i);else{if(run.length>=2)return{title:'按住，轻轻划过去',text:'这些格子都已被现有猫排除。按住左键（手机按住），沿箭头划过发光格，就能一笔标 ×。整笔可以一次撤销。',targets:run.slice(0,3),evidence:cats,value:1,gesture:'drag',axis};run=[];}}
  }return null;
 }
 if(lesson===3){for(const cat of cats)for(let i=0;i<board.length;i++)if(board[i]===0&&Math.abs(row(i)-row(cat))===1&&Math.abs(col(i)-col(cat))===1)return{title:'斜着挨在一起，也不行',text:'发光格在这只猫的斜角。猫咪不能接触，所以单击它标 ×。',targets:[i],evidence:[cat],value:1};return null;}
 if(!kinds[lesson])return null;
 const hint=H.find(level,board,{kinds:kinds[lesson]});if(!hint||hint.value===undefined)return null;
 const action=hint.value===2?'双击发光格，确认猫咪。':'把发光格标 ×，也可以按住拖动。';
 return{...hint,title:lesson===1?'连点两下，猫咪到家':hint.title,text:hint.text+' '+action,gesture:lesson===1?'double':undefined};
}
function satisfied(guide,board){return guide.value!==undefined&&guide.targets.length>0&&guide.targets.every(i=>board[i]===guide.value);}
function mount(options){
 const $=id=>document.getElementById(id),card=$('coach'),grid=$('board'),KEY='cat-garden-coach-v2';
 let learned=[],pending=null,active=null,lastKey='',lastBoard=[],layoutFrame=0;
 const finishedLevels=new Set(),dismissed=new Set();
 try{const value=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(value))learned=[...new Set(value.filter(i=>Number.isInteger(i)&&i>=0&&i<lessons.length))];}catch(_){}
 const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(learned));}catch(_){}};
 function clean(){card.hidden=true;grid.classList.remove('coaching');document.querySelectorAll('.coach-target,.coach-evidence,.coach-control').forEach(el=>{el.classList.remove('coach-target','coach-evidence','coach-control');el.removeAttribute('aria-describedby');});grid.querySelectorAll('.coach-ghost,.coach-arrow').forEach(el=>el.remove());}
 function stop(){active=null;pending=null;lastKey='';clean();}
 function complete(){
  const context=options.context(),id=active.lesson;if(!learned.includes(id))learned.push(id);save();
  if(context.unit.lessons.every(i=>learned.includes(i)))options.onUnitComplete(context.unit.id);
  finishedLevels.add(context.level.id);stop();
 }
 function position(){
  cancelAnimationFrame(layoutFrame);layoutFrame=requestAnimationFrame(()=>{
   if(!active||card.hidden)return;
   const bounds=grid.getBoundingClientRect(),vw=document.documentElement.clientWidth,vh=window.innerHeight;
   const width=Math.min(340,vw-24);card.style.width=width+'px';const h=card.offsetHeight;
   const targets=active.control?[$(active.control)]:active.targets.map(i=>grid.querySelector('[data-index="'+i+'"]')).filter(Boolean);
   const rects=targets.map(el=>el.getBoundingClientRect()),top=Math.min(...rects.map(r=>r.top)),bottom=Math.max(...rects.map(r=>r.bottom));
   let x,y;if(vw-bounds.right>=width+28){x=bounds.right+18;y=Math.max(12,Math.min(top,vh-h-12));card.dataset.side='right';}
   else if(bounds.left>=width+28){x=bounds.left-width-18;y=Math.max(12,Math.min(top,vh-h-12));card.dataset.side='left';}
   else {x=Math.max(12,Math.min(bounds.left,vw-width-12));y=bounds.top-h-12;card.dataset.side='above';if(y<8){if(top>=h+20)y=top-h-12;else if(bottom+h+20<=vh){y=bottom+12;card.dataset.side='below';}else y=8;}}
   card.style.left=x+'px';card.style.top=Math.max(8,Math.min(y,vh-h-8))+'px';card.style.setProperty('--coach-tip',Math.max(18,Math.min(width-30,(rects[0].left+rects[0].right)/2-x-6))+'px');
  });
 }
 function draw(){
  clean();if(!active)return;const context=options.context();if(context.paused||context.modal||document.hidden)return;
  card.hidden=false;card.dataset.lesson=active.lesson;grid.classList.add('coaching');
  $('coach-kicker').textContent='边玩边学 · '+context.unit.name;$('coach-title').textContent=active.title;
  const shortText=active.kind?H.visual(context.level,context.board,active).text:({0:'同行已有猫，单击亮格标 ×。',2:'按住左键或手指，沿箭头划过亮格。',3:'斜角也不能挨着猫，单击亮格标 ×。',13:'点亮起的按钮，保存或恢复这轮假设。',14:'点提示，看当前棋盘上的线索。'}[active.lesson]||active.text);$('coach-text').replaceChildren();for(const part of shortText.split(/([A-I])/)){if(/^[A-I]$/.test(part)){const swatch=document.createElement('span');swatch.className='hint-color';swatch.style.setProperty('--region-color',options.colors[part.charCodeAt(0)-65]);swatch.textContent=part;$('coach-text').append(swatch);}else $('coach-text').append(document.createTextNode(part));}
  $('coach-action').textContent=active.control?'直接点亮起的按钮':active.gesture==='drag'?'按住起点 → 划过亮格':active.value===2?'双击亮格 · 键盘可按 C':'单击亮格 · 键盘可按 X';
  for(const i of active.evidence||[])grid.querySelector('[data-index="'+i+'"]')?.classList.add('coach-evidence');
  for(const i of active.targets){const cell=grid.querySelector('[data-index="'+i+'"]');if(!cell||context.board[i]===active.value)continue;cell.classList.add('coach-target');cell.setAttribute('aria-describedby','coach-title coach-text');
   if(context.board[i]===0){const ghost=document.createElement('span');ghost.className='coach-ghost';ghost.setAttribute('aria-hidden','true');ghost.innerHTML=active.value===2?options.catSVG:options.crossSVG;cell.append(ghost);}
   if(active.gesture==='drag'){const arrow=document.createElement('span');arrow.className='coach-arrow';arrow.textContent=active.axis==='row'?'→':'↓';arrow.setAttribute('aria-hidden','true');cell.append(arrow);}
  }
  if(active.control){$(active.control).classList.add('coach-control');$(active.control).setAttribute('aria-describedby','coach-title coach-text');}
  if(!active.revealed){const target=active.control?$(active.control):grid.querySelector('[data-index="'+active.targets[0]+'"]');if(target){const rect=target.getBoundingClientRect();if(rect.top<16||rect.bottom>window.innerHeight-16)target.scrollIntoView({block:'center',behavior:'instant'});}active.revealed=true;}
  options.onShow();position();
 }
 function sync(event={}){
  const context=options.context();if(!pending&&!active)return;
  if(context.trial&&(active?.lesson??pending?.lesson)!==13){clean();return;}
  if(active){
   if(active.control&&event.control===active.control){complete();return;}
   if(!event.painting&&satisfied(active,context.board)){complete();return;}
   if(context.won){stop();return;}
   if(active){
    const changes=context.board.flatMap((v,i)=>v!==lastBoard[i]?[i]:[]);
    if(changes.some(i=>!active.targets.includes(i))){active=null;lastKey='';}
   }
  }
  lastBoard=context.board.slice();
  if(context.won){stop();return;}
  if(!active&&pending&&!context.paused&&!context.modal&&!context.trial){
   const key=context.level.id+':'+context.board.join('');if(key!==lastKey){lastKey=key;const guide=plan(context.level,context.board,pending.lesson,context.trial);if(guide)active={...guide,lesson:pending.lesson};}
  }else if(!active&&pending&&pending.lesson===13&&!context.paused&&!context.modal){const guide=plan(context.level,context.board,13,context.trial);if(guide)active={...guide,lesson:13};}
  draw();
 }
 function openUnit(unit,replay=false){
  stop();const context=options.context();if(context.won||(!replay&&(finishedLevels.has(context.level.id)||dismissed.has(context.level.id))))return;
  const lesson=replay?unit.lessons[0]:unit.lessons.find(i=>!learned.includes(i));if(lesson===undefined)return;
  pending={lesson};sync();
 }
 function openLesson(lesson){options.beforeOpen();stop();pending={lesson};sync();if(!active&&!options.context().won){options.onUnavailable('当前棋盘暂时没有这个技巧适用的位置；继续玩，出现时会自动高亮。');}}
 $('coach-close').onclick=()=>{dismissed.add(options.context().level.id);stop();};
 for(const id of ['trial-start','trial-return','hint-request'])$(id).addEventListener('click',()=>{if(active?.control===id)complete();},true);
 const library=$('tutorial-dialog');
 const summaries=['单击空格标 ×，再点可清空。× 表示你认为这里没有猫。','快速双击同一格确认猫咪；也可切换「放猫」模式单击。','按住鼠标左键或手指滑动，连续标 ×；从 × 开始则擦除。','猫咪周围八格都不能有另一只猫，斜角也算。','同一种颜色只剩一个合法位置，这里就是猫。','一行只剩一个合法位置，这里就是猫。','一列只剩一个合法位置，这里就是猫。','一种颜色的候选都在一行，这一行的其他颜色可排除。','一种颜色的候选都在一列，这一列的其他颜色可排除。','一行或一列只剩一种颜色，该颜色在其他行列的格子可排除。','两种颜色的候选占据同两行或两列，那两行或两列的其他颜色可排除。','两行或两列只剩同两种颜色，这两种颜色在其他行列的格子可排除。','假设一个格子有猫，若会让其他颜色无处放猫，这个格子就可以排除。','开始假设保存原盘，撤回假设恢复整轮；「试」留下起点，「排」表示你手动排除的起点。','卡住时看推理提示，先读原因，再决定自己操作或快速应用。'];
 lessons.forEach((lesson,i)=>{const details=document.createElement('details'),summary=document.createElement('summary'),text=document.createElement('p'),button=document.createElement('button');summary.textContent=lesson.title;text.textContent=summaries[i];button.textContent='在当前棋盘看看';button.onclick=()=>{library.close();openLesson(i);};details.append(summary,text,button);$('skill-list').append(details);});
 function openLibrary(){options.beforeOpen();library.showModal();sync();}
 $('tutorial-open').onclick=openLibrary;$('tutorial-from-levels').onclick=openLibrary;$('tutorial-close').onclick=()=>library.close();library.addEventListener('close',()=>{options.afterClose();sync();});
 window.addEventListener('resize',position);window.addEventListener('scroll',position,{passive:true});document.addEventListener('visibilitychange',()=>sync());
 return{open:openLibrary,openUnit,stop,sync,visible:()=>!card.hidden};
}
const api={level,lessons,plan,satisfied,mount};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CatTutorial=api;
})(typeof globalThis!=='undefined'?globalThis:this);
