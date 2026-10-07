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
 {title:'学会自己找下一步',text:'优先排除已有猫影响的位置，再找颜色、行、列的唯一候选，然后看行列与颜色的交叉限制。卡住时点“推理提示”：先看原因和高亮，再决定是否应用。× 也可能标错，若提示矛盾请回查。',board:board([1,9,12,15,23]),targets:[],gesture:'finish'},
 {title:'一关一关排除干净',text:'开局先看还有哪几格能放猫，把其余空格全部标成 ×：先点一格，再按住划过一整串。全部排除完，最后一格就是猫，用双击确认。',board:board([1]),targets:[0],value:1}
];
const H=typeof module!=='undefined'&&module.exports?require('./hints.js'):root.CatHints;
const kinds={1:['region-single','row-single','column-single'],4:['region-single'],5:['row-single'],6:['column-single'],7:['region-row'],8:['region-column'],9:['row-region','column-region'],10:['pair-row','pair-column'],11:['lines-pair-row','lines-pair-column'],12:['lookahead-region']};
let tutorLevel='',tutorStart=null;
// Every suggested board edit is derived from this board's constraints, never an answer lookup.
function plan(level,board,lesson,trial=null,notes=[]){
 const n=level.size,row=i=>Math.floor(i/n),col=i=>i%n,pos=i=>'第 '+(row(i)+1)+' 行第 '+(col(i)+1)+' 列';
 if(lesson===14)return{title:'卡住了，就看一条线索',text:'点「推理提示」，先看理由与高亮的位置。想明白后再决定是否应用。',control:'hint-request',targets:[]};
 if(lesson===13){
  // A walk-through of 假设 + 撤回, driven by the real board:
  //   1. nothing under way -> point at a candidate that is actually WRONG, ask the player to try it
  //   2. a root is chosen and nothing broke -> keep going, or roll back
  //   3. the board is contradicted -> this is what a wrong guess looks like; send them to 排除起点
  // Which cell to offer is decided by asking the game whether placing a cat there breaks the board, so the
  // lesson always lands on a guess that genuinely fails. No stored answer is consulted.
  // A hypothesis that was rolled back leaves a note behind instead of a live trial, so the closing card has
  // to be reachable from the notes alone. `root` is that note's cell.
  const settled=notes.find(note=>note.excluded);
  if(settled)return{title:'排除成功',text:'那一格已经标成 ×，这轮假设也结束了。这就是「假设 + 排除起点」的完整用法：不确定就先试，试错了就一键排除，永远不会把棋盘玩坏。',targets:[],evidence:[settled.index],action:'学会了就关闭这张卡片',done:()=>true};
  if(trial&&trial.root!==null){
   const root=trial.root,broken=!H.feasible(level,board);
   // While a hypothesis runs, 提示 turns into 排除起点 (app.js renderTrial), so that is the button the
   // player has to press here.
   if(broken)return{title:'看，这就是猜错的样子',text:'棋盘已经走不通了 —— 这只猫放错了。点底栏的「排除起点」：棋盘立刻恢复原样，这一格直接标成 ×，以后不用再考虑它。',control:'hint-request',targets:[],evidence:[root],trialBroken:true};
   return{title:'这步还推得下去',text:'暂时没有矛盾。沿着这条假设继续推理；如果越走越窄，点底栏「撤回假设」回到起点，从另一个候选重来。',control:'trial-return',targets:[],evidence:[root]};
  }
  if(trial)return null;
  const next=H.find(level,board);
  if(next.kind!=='trial'||!next.targets.length)return null;
  // Offer a candidate that fails, so the lesson can actually show 排除起点 doing its job.
  const wrong=next.targets.find(i=>{const b=board.slice();b[i]=2;return !H.feasible(level,b);});
  const target=wrong===undefined?next.targets[0]:wrong;
  return{
   ...next,
   title:'这一步拿不准，就先假设一次',
   text:'这 '+next.targets.length+' 个候选都看不出对错。点底栏「假设」保存棋盘，然后双击最亮的那一格，把它当猫试试 —— 猜错了也没关系，棋盘不会丢。',
   control:'trial-open',
   // Every candidate is lit (that IS the puzzle: which of these?), and the one to try is the brightest.
   // A cell is not set to `value` here, so the highlight stays put until the player acts.
   targets:[target],scope:{type:'cells',cells:next.targets.slice()},
   action:'点底栏「假设」，再双击最亮的格子',
   gesture:'double',trialRoot:target,keepOpen:true,
  };
 }
 if(!H.feasible(level,board))return null;
 const cats=board.flatMap((v,i)=>v===2?[i]:[]),available=new Set(H.candidates(level,board));
 // The opening level is walked one small move at a time: place a cat where only one square is left,
 // then clear its row, its column and its eight neighbours, then look for the next cat. Every step is
 // derived from the live board, never from an answer lookup.

 function tutorStep(level,board){
  if(tutorLevel!==level.id){tutorLevel=level.id;tutorStart=board.slice();}
  const n=level.size,cand=new Set(H.candidates(level,board));
  const cats=board.flatMap((v,i)=>v===2?[i]:[]);
  const mine=cats.filter(i=>tutorStart[i]!==2);
  const markable=i=>board[i]===0&&!cand.has(i);
  // "Only one cell left" always has a scope: the colour, row or column it was counted in. Showing the
  // whole line is what tells the player WHERE to look - a lone lit cell does not.
  // Only frame a scope that actually tells the player where to look. A one-cell colour region frames
  // to the same square as the target, so it would add noise, not information.
  const scopeOf=(kind,cells)=>{
   if(!cells||cells.length<2)return null;
   return{type:kind==='region-single'?'region':kind==='row-single'?'row':'column',cells:cells.slice()};
  };
  const place=()=>{
   const h=H.find(level,board,{kinds:['region-single','row-single','column-single']});
   if(!h||h.value!==2||!h.targets.length)return null;
   return{title:'这里只剩一格了',text:(h.text||'这个颜色、这一行或这一列，只剩这一格还能放猫。')+' 双击发光的那一格，把猫放进去。',
    targets:h.targets,value:2,gesture:'double',scope:scopeOf(h.kind,h.evidence),evidence:h.evidence};
  };
  if(!mine.length)return place();
  const last=mine[mine.length-1];
  for(const cat of [last,...cats.filter(i=>i!==last)]){
   const row0=Math.floor(cat/n),col0=cat%n;
   const row=Array.from({length:n},(_,k)=>row0*n+k).filter(i=>i!==cat&&markable(i));
   if(row.length){const line=Array.from({length:n},(_,k)=>row0*n+k);
    return{title:'先把这只猫所在的行清掉',text:'同一行只能有一只猫，所以这一行剩下的空格都放不了。按住左键（手机按住）从亮格划到亮格，一笔标一串 ×。',targets:row,value:1,gesture:'drag',axis:'row',scope:{type:'row',cells:line},evidence:line};}
   const col=Array.from({length:n},(_,k)=>k*n+col0).filter(i=>i!==cat&&markable(i));
   if(col.length){const line=Array.from({length:n},(_,k)=>k*n+col0);
    return{title:'再把这只猫所在的列清掉',text:'每一列也只能有一只猫。这一列剩下的空格同样标 ×，一样按住划过去。',targets:col,value:1,gesture:'drag',axis:'column',scope:{type:'column',cells:line},evidence:line};}
   const around=[];
   for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){
    if(!dr&&!dc)continue;
    const rr=row0+dr,cc=col0+dc;
    if(rr<0||cc<0||rr>=n||cc>=n)continue;
    const i=rr*n+cc;
    if(markable(i))around.push(i);
   }
   if(around.length){const block=[];
    for(let rr=Math.max(0,row0-1);rr<=Math.min(n-1,row0+1);rr++)for(let cc=Math.max(0,col0-1);cc<=Math.min(n-1,col0+1);cc++)block.push(rr*n+cc);
    return{title:'还有它周围的八格',text:'猫咪上下左右和四个斜角都不能再放猫，斜着挨着也不行。把方框里这些亮格划掉。',targets:around,value:1,gesture:'drag',scope:{type:'box',cells:block},evidence:block};}
  }
  return place();
 }
 if(lesson===15){
  const step=tutorStep(level,board);
  if(!step)return null;
  // Only a full board ends the lesson - never a momentarily empty deduction, or the very first tap
  // of a double tap (which lands a × first) would close the guide before the cat is even placed.
  return{...step,done:board=>!board.some(v=>v===0),also:[0,1,2,3]};
 }
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
function satisfied(guide,board){if(guide.done)return guide.done(board);return guide.value!==undefined&&guide.targets.length>0&&guide.targets.every(i=>board[i]===guide.value);}
/* A hint kind -> the skill-library entries that explain it. Used for the 「掌握技巧」 counter: a skill
 * counts as used once the player has actually seen that reasoning applied to a real board, which is a
 * truer signal than "finished a guided lesson" now that only level 1 is guided. */
const SKILL_OF={
 'exclude':[0,2,3],'region-single':[4],'row-single':[5],'column-single':[6],
 'region-row':[7],'region-column':[8],'row-region':[9],'column-region':[9],
 'pair-row':[10],'pair-column':[10],'lines-pair-row':[11],'lines-pair-column':[11],
 'lookahead-region':[12],'trial':[13],'complete':[14],
};
function mount(options){
  const $=id=>document.getElementById(id),card=$('coach'),grid=$('board'),KEY='cat-garden-coach-v2';
  // The trial actions now live on the bottom row: 假设 itself switches to 取消假设 / 撤回假设.
  const controlNode=id=>$(id==='trial-start'||id==='trial-return'?'trial-open':id);
  let learned=[],pending=null,active=null,lastKey='',lastBoard=[],layoutFrame=0,armed=null;
  const finishedLevels=new Set(),dismissed=new Set();
  try{const value=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(value))learned=[...new Set(value.filter(i=>Number.isInteger(i)&&i>=0&&i<lessons.length))];}catch(_){}
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(learned));}catch(_){}};
  // Called by the app whenever it shows a hint, so the counter reflects real play.
  function noteSkillUsed(kind){
    const skills=SKILL_OF[kind];if(!skills)return;
    let changed=false;
    for(const i of skills)if(!learned.includes(i)){learned.push(i);changed=true;}
    // 操作类技巧（单击/双击/拖动）在第一关的引导里就会点亮，这里只补齐纯推理技巧。
    if(changed){save();options.onShow();}
    return changed;
  }
 function layoutScope(){
  // Draw a frame around the line / colour the coach is pointing at, so the eye lands on the right
  // row, column or block before it looks for the single cell to act on. Rectangular scopes get one
  // dashed box; ragged ones (a colour region) fall back to per-cell rings.
  const shell=$('board-shell'),scope=active?.scope,old=shell.querySelector('.coach-frame');
  if(old)old.remove();
  if(!scope||!scope.cells.length||active.control)return;
  const cells=scope.cells.map(i=>grid.querySelector('[data-index="'+i+'"]')).filter(Boolean);
  if(!cells.length)return;
  const rects=cells.map(c=>c.getBoundingClientRect()),host=shell.getBoundingClientRect();
  const l=Math.min(...rects.map(r=>r.left))-host.left,t=Math.min(...rects.map(r=>r.top))-host.top;
  const rt=Math.max(...rects.map(r=>r.right))-host.left,bt=Math.max(...rects.map(r=>r.bottom))-host.top;
  const PAD=5,frame=document.createElement('div');
  frame.className='coach-frame'+(scope.type==='row'?' is-row':scope.type==='column'?' is-column':'');
  frame.style.left=l-PAD+'px';frame.style.top=t-PAD+'px';frame.style.width=rt-l+PAD*2+'px';frame.style.height=bt-t+PAD*2+'px';
  // A row or column is always a clean rectangle; a colour region may be ragged, and gaps between cells
  // make the bounding-box area test unreliable, so judge by row/column spread instead.
  const n=Number(grid.style.getPropertyValue('--n'))||cells.length;
  const rows=new Set(cells.map(c=>Math.floor(Number(c.dataset.index)/n))),cols=new Set(cells.map(c=>Number(c.dataset.index)%n));
  if(!(rows.size===1||cols.size===1))frame.classList.add('is-scattered');
  frame.setAttribute('aria-hidden','true');
  shell.append(frame);
 }
 function clean(){card.hidden=true;grid.classList.remove('coaching');document.body.classList.remove('coaching','coach-on-control');$('board-shell')?.querySelector('.coach-frame')?.remove();document.querySelectorAll('.coach-target,.coach-evidence,.coach-scope,.coach-control').forEach(el=>{el.classList.remove('coach-target','coach-evidence','coach-scope','coach-control','coach-demo-single','coach-demo-double','coach-demo-drag');el.removeAttribute('aria-describedby');});grid.querySelectorAll('.coach-ghost,.coach-arrow').forEach(el=>el.remove());}
 function stop(){active=null;pending=null;lastKey='';clean();}
 let advancing=false; function advance(guide,board){
  // One small move finished: either the whole board is done (lesson over) or look for the next move.
  if(advancing)return;
  if(guide.done&&!guide.done(board)){advancing=true;stop();pending={lesson:guide.lesson};sync();advancing=false;return;}
  complete();
 }
 function complete(){
  const context=options.context(),id=active.lesson;if(!learned.includes(id))learned.push(id);
  for(const extra of active.also||[])if(!learned.includes(extra))learned.push(extra);
  save();
  const unit=context.unit;
  if(unit.lessons.every(i=>learned.includes(i)))options.onUnitComplete(unit.id);
  finishedLevels.add(context.level.id);
  // One leg can carry several skills - keep going on the same board instead of stopping dead.
  const next=unit.lessons.find(i=>!learned.includes(i));
  stop();
  if(next!==undefined&&!context.won){pending={lesson:next};sync();if(!active)options.onUnavailable('很好，下一招马上出现：继续玩下去就会遇到。');}
 }
 function position(){
  cancelAnimationFrame(layoutFrame);layoutFrame=requestAnimationFrame(()=>{
   if(!active||card.hidden)return;
   const bounds=grid.getBoundingClientRect(),vw=document.documentElement.clientWidth,vh=window.innerHeight;
   const width=Math.min(340,vw-24);card.style.width=width+'px';const h=card.offsetHeight;
   const targets=active.control?[controlNode(active.control)]:active.targets.map(i=>grid.querySelector('[data-index="'+i+'"]')).filter(Boolean);
   // A closing card can point at nothing (it just says "you are done"), so fall back to the board centre.
   const rects=targets.map(el=>el.getBoundingClientRect());
   const top=rects.length?Math.min(...rects.map(r=>r.top)):bounds.top;
   const bottom=rects.length?Math.max(...rects.map(r=>r.bottom)):bounds.bottom;
   let x,y;if(vw-bounds.right>=width+28){x=bounds.right+18;y=Math.max(12,Math.min(top,vh-h-12));card.dataset.side='right';}
   else if(bounds.left>=width+28){x=bounds.left-width-18;y=Math.max(12,Math.min(top,vh-h-12));card.dataset.side='left';}
   else {x=Math.max(12,Math.min(bounds.left,vw-width-12));y=bounds.top-h-12;card.dataset.side='above';if(y<8){if(top>=h+20)y=top-h-12;else if(bottom+h+20<=vh){y=bottom+12;card.dataset.side='below';}else y=8;}}
   // The tip arrow follows whatever the card is anchored to; without a target it sits under the middle.
   const anchor=rects.length?(rects[0].left+rects[0].right)/2:(bounds.left+bounds.right)/2;
   card.style.left=x+'px';card.style.top=Math.max(8,Math.min(y,vh-h-8))+'px';card.style.setProperty('--coach-tip',Math.max(18,Math.min(width-30,anchor-x-6))+'px');
  });
 }
 function draw(){
  clean();if(!active)return;const context=options.context();if(context.paused||context.modal||document.hidden)return;
  card.hidden=false;card.dataset.lesson=active.lesson;grid.classList.add('coaching');
  document.body.classList.add('coaching');document.body.classList.toggle('coach-on-control',Boolean(active.control));
  $('coach-kicker').textContent='边玩边学 · '+context.unit.name;$('coach-title').textContent=active.title;
  // A lesson that wrote its own text (the 假设 walk-through) keeps it; only bare hints get the short visual form.
  const shortText=active.text||(active.kind?H.visual(context.level,context.board,active).text:({0:'同行已有猫，单击亮格标 ×。',2:'按住左键或手指，沿箭头划过亮格。',3:'斜角也不能挨着猫，单击亮格标 ×。',14:'点提示，看当前棋盘上的线索。'}[active.lesson]||active.text));$('coach-text').replaceChildren();for(const part of shortText.split(/([A-I])/)){if(/^[A-I]$/.test(part)){const swatch=document.createElement('span');swatch.className='hint-color';swatch.style.setProperty('--region-color',options.colors[part.charCodeAt(0)-65]);swatch.textContent=part;$('coach-text').append(swatch);}else $('coach-text').append(document.createTextNode(part));}
  $('coach-action').textContent=active.action||(active.control?'直接点亮起的按钮':active.gesture==='drag'?'按住起点 → 划过亮格':active.value===2?'双击亮格 · 键盘可按 C':'单击亮格 · 键盘可按 X');
  for(const i of active.scope?.cells||active.evidence||[])grid.querySelector('[data-index="'+i+'"]')?.classList.add('coach-scope');
  for(const i of active.evidence||[])if(!(active.scope?.cells||[]).includes(i))grid.querySelector('[data-index="'+i+'"]')?.classList.add('coach-evidence');
  for(const i of active.targets){const cell=grid.querySelector('[data-index="'+i+'"]');if(!cell||context.board[i]===active.value)continue;cell.classList.add('coach-target');cell.setAttribute('aria-describedby','coach-title coach-text');
   // Gesture rehearsal: the cell itself plays the move - one tap, two taps, or press-and-slide.
   const demo=active.gesture==='drag'?'drag':(active.gesture==='double'||active.value===2)?'double':active.value===1?'single':'';
   if(demo){cell.classList.add('coach-demo-'+demo);cell.style.setProperty('--demo-order',String(active.targets.indexOf(i)));}
   // No ghost preview at all: drawing the cat or the x before the player acts reads as "already done".
   // The frame, the lit scope, the ripple animation and the action line say everything that is needed.
   if(active.gesture==='drag'){const arrow=document.createElement('span');arrow.className='coach-arrow';arrow.textContent=active.axis==='row'?'→':'↓';arrow.setAttribute('aria-hidden','true');cell.append(arrow);}
  }
  if(active.control){const control=controlNode(active.control);control.classList.add('coach-control');control.setAttribute('aria-describedby','coach-title coach-text');}
  if(!active.revealed){const target=active.control?controlNode(active.control):(active.targets.length?grid.querySelector('[data-index="'+active.targets[0]+'"]'):null);if(target){const rect=target.getBoundingClientRect();if(rect.top<16||rect.bottom>window.innerHeight-16)target.scrollIntoView({block:'center',behavior:'instant'});}active.revealed=true;}
  options.onShow();position();layoutScope();
 }
 function sync(event={}){
  const context=options.context();if(!pending&&!active&&!armed)return;
  if(context.off){clean();return;}
  if(context.trial&&(active?.lesson??pending?.lesson)!==13){clean();return;}
 if(active){
  // A control the player has to follow up with a board action (the 假设 walk-through opens the mode and
  // then asks for a cell) must not end the lesson on click - it only hands over to the next step.
  if(active.control&&event.control===active.control&&!active.keepOpen){complete();return;}
  if(!event.painting&&satisfied(active,context.board)){advance(active,context.board);return;}
  if(context.won){stop();return;}
  // Lesson 13 re-plans itself from the live board on every step key change (see below), so it must not be
  // torn down here: the board changing IS how it moves forward. Clearing it would kill the walk-through
  // exactly when the player presses 假设 or picks a cell.
  if(active.lesson!==13){
   const changes=context.board.flatMap((v,i)=>v!==lastBoard[i]?[i]:[]);
   if(changes.some(i=>!active.targets.includes(i))){active=null;lastKey='';}
  }
 }
  lastBoard=context.board.slice();
  if(context.won){stop();return;}
  if(armed&&!active&&!pending&&!context.paused&&!context.modal&&!context.trial
   &&!learned.includes(armed)&&!dismissed.has(context.level.id)
   &&H.find(context.level,context.board).kind==='trial'){
   // Armed lesson: fire the moment the board runs out of forced moves. Until then it stays silent, because
   // "try a hypothesis" means nothing on a board the player can still work out on their own. Plan it right
   // away rather than waiting for the next sync, so the card appears in the same frame as the dead end.
   // The hint panel that led here is dismissed first: two cards at once would cover the board, and the board
   // is what this lesson is about.
   options.onDismissHint&&options.onDismissHint();
   pending={lesson:armed};armed=null;lastKey='';
   const guide=plan(context.level,context.board,pending.lesson,context.trial);
   active=guide?{...guide,lesson:pending.lesson,revealed:false}:null;
  }else if(pending&&pending.lesson===13&&!context.paused&&!context.modal){
   // The walk-through drives itself from the live board, so this branch re-plans whenever the step changes
   // rather than only when no card is up. A hypothesis that has already been rolled back lives on in
   // trialNotes, not in trial - that is how the "排除成功" closing card knows to appear.
   const notes=context.trialNotes||[];
   const root=context.trial&&context.trial.root!==null?String(context.trial.root):(notes.length?String(notes[notes.length-1].index):'none');
   const broken=context.trial&&context.trial.root!==null&&!H.feasible(context.level,context.board)?'broken':'ok';
   const key='L13:'+context.level.id+':'+root+':'+broken;
   if(key!==lastKey){
    lastKey=key;
    const guide=plan(context.level,context.board,13,context.trial,notes);
    active=guide?{...guide,lesson:13,revealed:false}:null;
   }
  }else if(!active&&pending&&!context.paused&&!context.modal&&!context.trial){
   const key=context.level.id+':'+context.board.join('');if(key!==lastKey){lastKey=key;const guide=plan(context.level,context.board,pending.lesson,context.trial);if(guide)active={...guide,lesson:pending.lesson};}
  }
  draw();
 }
 function openUnit(unit,replay=false){
  stop();const context=options.context();if(context.won||(!replay&&(finishedLevels.has(context.level.id)||dismissed.has(context.level.id))))return;
  const lesson=replay?unit.lessons[0]:unit.lessons.find(i=>!learned.includes(i));if(lesson===undefined)return;
  pending={lesson};sync();
 }
 // A lesson that only applies once the player actually hits the situation - the 假设 walk-through - has
 // nothing to show on an empty board. Arm it instead: the moment the board runs out of forced moves, the
 // card appears by itself. That is the only moment the lesson means anything, so it is the only moment it
 // should interrupt.
 function armWhenItMatters(lesson){
  armed=lesson;sync();
 }
 function openLesson(lesson){options.beforeOpen();stop();pending={lesson};sync();if(!active&&!options.context().won){options.onUnavailable('当前棋盘暂时没有这个技巧适用的位置；继续玩，出现时会自动高亮。');}}
 $('coach-close').onclick=()=>{dismissed.add(options.context().level.id);stop();};
 // `keepOpen` steps do their own bookkeeping: the 假设 walk-through opens the mode on this click and then
 // re-plans itself from the live board, so ending the lesson here would cut it off mid-sentence.
 for(const id of ['trial-open','trial-return','hint-request']){const el=controlNode(id);el.addEventListener('click',()=>{if(active?.control===id&&!active.keepOpen)complete();},true);}
 const library=$('tutorial-dialog');
 const summaries=['单击空格标 ×，再点可清空。× 表示你认为这里没有猫。','双击同一格确认猫咪，单击一次先标 ×。','按住鼠标左键或手指滑动，连续标 ×；从 × 开始则擦除。','猫咪周围八格都不能有另一只猫，斜角也算。','同一种颜色只剩一个合法位置，这里就是猫。','一行只剩一个合法位置，这里就是猫。','一列只剩一个合法位置，这里就是猫。','一种颜色的候选都在一行，这一行的其他颜色可排除。','一种颜色的候选都在一列，这一列的其他颜色可排除。','一行或一列只剩一种颜色，该颜色在其他行列的格子可排除。','两种颜色的候选占据同两行或两列，那两行或两列的其他颜色可排除。','两行或两列只剩同两种颜色，这两种颜色在其他行列的格子可排除。','假设一个格子有猫，若会让其他颜色无处放猫，这个格子就可以排除。','点底栏「假设」保存原盘，撤回假设恢复整轮；「试」留下起点，「排」表示你手动排除的起点。','卡住时看推理提示，先读原因，再决定自己操作或快速应用。'];
 lessons.forEach((lesson,i)=>{const details=document.createElement('details'),summary=document.createElement('summary'),text=document.createElement('p'),button=document.createElement('button');summary.textContent=lesson.title;text.textContent=summaries[i];button.textContent='在当前棋盘看看';button.onclick=()=>{library.close();if(options.onLessonRequest&&options.onLessonRequest(i))return;openLesson(i);};details.append(summary,text,button);$('skill-list').append(details);});
 function openLibrary(){options.beforeOpen();library.showModal();sync();}
 $('tutorial-open').onclick=openLibrary;$('tutorial-close').onclick=()=>library.close();library.addEventListener('close',()=>{options.afterClose();sync();});
 window.addEventListener('resize',()=>{position();layoutScope();});window.addEventListener('scroll',()=>{position();layoutScope();},{passive:true});document.addEventListener('visibilitychange',()=>sync());
 return{open:openLibrary,openUnit,openLesson,stop,sync,noteSkillUsed,learnedCount:()=>learned.length,visible:()=>!card.hidden,teaching:()=>Boolean(pending),armWhenItMatters};
}
const api={level,lessons,plan,satisfied,mount};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CatTutorial=api;
})(typeof globalThis!=='undefined'?globalThis:this);
