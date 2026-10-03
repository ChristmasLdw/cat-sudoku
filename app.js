/* Cat Sudoku: pointer painting, keyboard play, local synthesized feedback. */
(function(){
'use strict';
const E=window.CatPuzzle,T=window.CatTrial,J=window.CatJourney,levels=J.arrange(window.CAT_LEVELS),$=id=>document.getElementById(id);
const defaultColors=['#bca9e2','#f2c66d','#8fcbbb','#eca0ae','#90bde1','#d4cf8b','#c8ae95','#b8d585','#a8b0d9'];let colors=defaultColors;
const catSVG='<svg class="cat" aria-hidden="true"><use href="#cat-icon"/></svg>';
const crossSVG='<svg class="cross" viewBox="0 0 40 40" aria-hidden="true"><path d="m8 8 24 24M32 8 8 32" fill="none"/></svg>';
const sessions=new Map(),reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
let tutorial=null;let journey=J.validProgress(null,levels);try{journey=J.validProgress(JSON.parse(localStorage.getItem('cat-garden-journey-v1')||'null'),levels);}catch(_){}
function saveJourney(){try{localStorage.setItem('cat-garden-journey-v1',JSON.stringify(journey));}catch(_){}}
let levelIndex=0,mode='cycle',focused=0,manualCheck=false,cells=[],lastTick=performance.now(),stroke=null,lastTouch=0,celebrationTimer;
let prefs={sound:true,motion:true,haptic:false,letters:false,live:true};
try{const saved=JSON.parse(localStorage.getItem('cat-garden-preferences-v2')||'null');if(saved)for(const key of Object.keys(prefs))if(typeof saved[key]==='boolean')prefs[key]=saved[key];}catch(_){}
let audioContext,masterGain,lastBrushSound=0,lastTap=null,activeHint=null;
function unlockAudio(){
  if(!prefs.sound)return;
  try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
    if(!audioContext){audioContext=new Audio();masterGain=audioContext.createGain();masterGain.gain.value=.14;masterGain.connect(audioContext.destination);}
    if(audioContext.state==='suspended')audioContext.resume().catch(()=>{});
  }catch(_){}
}
function sound(kind,brush=false){
  if(!prefs.sound||!audioContext||audioContext.state==='closed')return;
  const now=performance.now();if(brush&&now-lastBrushSound<45)return;if(brush)lastBrushSound=now;
  try{
    function voice(frequency,delay,duration,amplitude=.5,type='sine',endFrequency=frequency){
      const oscillator=audioContext.createOscillator(),gain=audioContext.createGain(),t=audioContext.currentTime+delay;
      oscillator.type=type;oscillator.frequency.setValueAtTime(frequency,t);if(endFrequency!==frequency)oscillator.frequency.exponentialRampToValueAtTime(endFrequency,t+Math.min(.07,duration));
      gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(amplitude,t+.006);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
      oscillator.connect(gain);gain.connect(masterGain);oscillator.start(t);oscillator.stop(t+duration+.03);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
    }
    if(kind==='cat'){
      const count=game()?E.inspect(currentLevel(),game().board).cats:1;
      const base=[392,440,494,523,587,659,698,784,880][Math.max(0,Math.min(8,count-1))];
      voice(170,0,.12,.38,'sine',65);             // soft landing
      voice(1400,0,.032,.16,'triangle',450);      // crisp attack
      voice(base*.72,.015,.25,.72,'triangle',base);// rising pluck
      voice(base*1.5,.075,.27,.34);               // bright fifth
      voice(base*2,.125,.30,.25);                // sparkle
      voice(base,.23,.22,.12);                   // short echo
    }else if(kind==='win'){
      [523,659,784,1047,1319].forEach((f,i)=>{voice(f,i*.10,.30,.58,'triangle');voice(f*1.5,i*.10+.03,.34,.16);});
      voice(262,0,.65,.25);
    }else if(kind==='trial'){
      voice(330,0,.13,.4,'triangle');voice(440,.08,.19,.32);voice(587,.15,.19,.15);
    }else if(kind==='error'){
      voice(185,0,.15,.4,'triangle',150);voice(140,.08,.15,.3);
    }else if(kind==='mark')voice(850,0,.055,.48,'sine',600);
    else voice(350,0,.075,.4,'sine',220);
  }catch(_){}
}
function motionOn(){return prefs.motion&&!reduceMotion.matches;}
function feedback(index,value,brush=false){
  const cell=cells[index];if(motionOn()&&cell?.animate){cell.getAnimations().forEach(a=>a.cancel());cell.animate([{transform:'scale(.91)'},{transform:'scale(1.045)'},{transform:'scale(1)'}],{duration:180,easing:'ease-out'});const glyph=cell.querySelector('.cat,.cross');if(glyph)glyph.animate([{transform:'scale(.45)',opacity:.35},{transform:'scale(1.12)',opacity:1},{transform:'scale(1)',opacity:1}],{duration:value===E.CAT?240:150,easing:'ease-out'});}
  if(!game().won)sound(value===E.CAT?(E.inspect(currentLevel(),game().board).conflicts.includes(index)?'error':game().trial?'trial':'cat'):value===E.MARK?'mark':'erase',brush);
  if(prefs.haptic&&navigator.vibrate)try{navigator.vibrate(value===E.CAT?14:7);}catch(_){}
}
function celebrate(){
  clearTimeout(celebrationTimer);$('celebration').replaceChildren();if(!motionOn())return;
  for(let i=0;i<18;i++){const bit=document.createElement('i');bit.style.setProperty('--x',(5+i*5.1)+'%');bit.style.setProperty('--color',colors[i%colors.length]);bit.style.setProperty('--delay',(i%5)*.045+'s');$('celebration').append(bit);}
  celebrationTimer=setTimeout(()=>$('celebration').replaceChildren(),1600);
}
function applyPrefs(){
  for(const [key,id] of Object.entries({sound:'sound-setting',motion:'motion-setting',haptic:'haptic-setting',letters:'letters-setting',live:'live-check'}))$(id).checked=prefs[key];
  document.body.classList.toggle('show-letters',prefs.letters);document.body.classList.toggle('no-motion',!prefs.motion);
  if(masterGain)masterGain.gain.value=prefs.sound ? .14 : 0;
  if(!motionOn()){$('celebration').replaceChildren();document.getAnimations().forEach(a=>a.cancel());}
}
if(new URLSearchParams(location.search).get('embed')==='1')document.body.classList.add('embed');
try{const ids=new Set();if(!Array.isArray(levels)||!levels.length)throw Error('没有关卡');levels.forEach(l=>{E.validateLevel(l);if(ids.has(l.id))throw Error('重复的关卡 id');ids.add(l.id);});}catch(error){$('status').textContent='关卡数据错误：'+error.message;$('status').hidden=false;return;}
function currentLevel(){return levels[levelIndex];}
function game(){return sessions.get(currentLevel().id);}
function newGame(level){return{board:J.startBoard(level),givens:J.forLevel(level).givens.slice(),history:[],elapsed:0,started:false,paused:false,won:false,trial:null,trialNotes:[]};}
function modalOpen(){return $('settings-dialog').open||$('levels-dialog').open||$('tutorial-dialog').open;}
function time(ms){const seconds=Math.floor(ms/1000);return String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');}
function tick(){const now=performance.now(),g=game();if(g&&g.started&&!g.paused&&!g.won&&!document.hidden&&!modalOpen())g.elapsed+=now-lastTick;lastTick=now;if(g)$('timer').textContent=time(g.elapsed);}
function record(kind='move'){tick();const g=game();g.history.push({board:g.board.slice(),elapsed:g.elapsed,started:g.started,paused:g.paused,won:g.won,trial:T.clone(g.trial),trialNotes:T.copyNotes(g.trialNotes),kind});}
function levelButtons(){
 const scroll=$('levels-dialog').scrollTop;$('level-list').replaceChildren();
 for(const unit of J.config.units){
  const inUnit=levels.map((l,index)=>({l,index})).filter(({l})=>J.unitFor(l).id===unit.id),done=inUnit.filter(({l})=>journey.completed.includes(l.id)).length;
  const section=document.createElement('details');section.className='unit-map';section.open=J.unitFor(currentLevel()).id===unit.id;
  const summary=document.createElement('summary');summary.textContent=(unit.testPack?unit.name:'单元 '+(unit.id+1)+' · '+unit.name)+'　'+done+'/'+inUnit.length;section.append(summary);
  const intro=document.createElement('button');intro.className='unit-intro';intro.textContent=(journey.learned.includes(unit.id)?'复习：':'新技巧：')+unit.tag;intro.addEventListener('click',()=>{const next=inUnit.find(({l})=>!journey.completed.includes(l.id))||inUnit[0];closeDialog('levels-dialog');selectLevel(next.index);tutorial?.openUnit(unit,true);});if(unit.lessons.length)section.append(intro);
  const grid=document.createElement('div');grid.className='unit-nodes';
  for(const {l,index}of inUnit){const b=document.createElement('button');b.className='level-button';b.setAttribute('aria-current',String(index===levelIndex));b.setAttribute('aria-label',(l.source?.type==='user-screenshot'?l.name:'第 '+(index+1)+' 关')+'，'+l.size+' × '+l.size+(journey.completed.includes(l.id)?'，已完成':''));
   const number=document.createElement('span');number.className='level-no';number.textContent=l.source?.referenceLevel??index+1;const size=document.createElement('span');size.className='level-size';size.textContent=(l.source?'截图 · ':'')+l.size+' × '+l.size;b.append(number,size);
   if(journey.completed.includes(l.id)){const check=document.createElement('span');check.className='level-complete';check.textContent='✓';b.append(check);}
   b.addEventListener('click',()=>{closeDialog('levels-dialog');selectLevel(index);sound('erase');});grid.append(b);
  }section.append(grid);$('level-list').append(section);
 }$('level-total').textContent=J.config.units.filter(u=>!u.testPack).length+' 个单元 + 截图测试 · '+journey.completed.length+'/'+levels.length+' 关完成';$('levels-dialog').scrollTop=scroll;
}
function selectLevel(index){
  if(!Number.isInteger(index)||index<0||index>=levels.length)throw Error('关卡编号无效');finishStroke(true);tutorial?.stop();lastTap=null;clearHint();tick();levelIndex=index;manualCheck=false;focused=0;
  const l=currentLevel();colors=l.regionColors||defaultColors;if(!sessions.has(l.id))sessions.set(l.id,newGame(l));
  $('level-title').textContent=l.source?.type==='user-screenshot'?l.name:'第 '+(index+1)+' 关';$('level-subtitle').textContent=l.size+' × '+l.size+(game().givens.length?' · '+game().givens.length+' 只猫已就位':(l.source?' · 原始空盘':' · 自由推理'));
  const unit=J.unitFor(l),unitLevels=levels.filter(item=>J.unitFor(item).id===unit.id);$('unit-name').textContent=unit.testPack?unit.name:'单元 '+(unit.id+1)+' · '+unit.name;$('unit-position').textContent=(unitLevels.findIndex(item=>item.id===l.id)+1)+' / '+unitLevels.length;$('unit-focus').textContent=unit.tag;
  journey.current=l.id;saveJourney();
  $('board').style.setProperty('--n',l.size);$('board').setAttribute('aria-rowcount',l.size);$('board').setAttribute('aria-colcount',l.size);$('board').replaceChildren();cells=[];
  for(let r=0;r<l.size;r++){const row=document.createElement('div');row.setAttribute('role','row');row.style.display='contents';for(let c=0;c<l.size;c++){
    const i=r*l.size+c,b=document.createElement('button');b.className='cell';b.dataset.index=i;b.type='button';b.setAttribute('role','gridcell');b.setAttribute('aria-rowindex',r+1);b.setAttribute('aria-colindex',c+1);b.style.setProperty('--cell-color',colors[l.regions[r][c]]);
    b.addEventListener('click',ev=>{if(ev.detail===0){unlockAudio();act(i);}});
    b.addEventListener('contextmenu',ev=>{ev.preventDefault();if(ev.pointerType==='touch'||performance.now()-lastTouch<800||stroke)return;unlockAudio();act(i,'mark');});
    b.addEventListener('focus',()=>{focused=i;cells.forEach((cell,j)=>cell.tabIndex=j===i?0:-1);});b.addEventListener('keydown',ev=>onCellKey(ev,i));row.append(b);cells.push(b);
  }$('board').append(row);}
  clearTimeout(celebrationTimer);$('celebration').replaceChildren();lastTick=performance.now();render();levelButtons();
}
function render(message,quiet=false,guideEvent={}){
  const l=currentLevel(),g=game();syncHint();const result=E.inspect(l,g.board),show=prefs.live||manualCheck||Boolean(g.trial),wasWon=g.won;g.won=result.won;
  cells.forEach((b,i)=>{const r=Math.floor(i/l.size),c=i%l.size,region=l.regions[r][c],v=g.board[i],conflict=show&&result.conflicts.includes(i);
    if(b.dataset.state!==String(v)){b.innerHTML='<span class="region-letter" aria-hidden="true">'+String.fromCharCode(65+region)+'</span>'+(v===E.CAT?catSVG:v===E.MARK?crossSVG:'');b.dataset.state=v;}
    const trialRoot=g.trial?.root===i,changed=Boolean(g.trial&&g.board[i]!==g.trial.baseBoard[i]);
    const note=(!trialRoot&&!changed)?g.trialNotes.find(item=>item.index===i):null;
    b.classList.toggle('given-cat',g.givens.includes(i));b.classList.toggle('trial-root',trialRoot);b.classList.toggle('trial-change',changed);b.classList.toggle('trial-rejected',Boolean(note?.excluded));b.classList.toggle('trial-tried',Boolean(note&&!note.excluded));
    const badgeText=trialRoot?'假':note?(note.excluded?'排':'试'):'';let badge=b.querySelector('.trial-badge');
    if(badgeText){if(!badge){badge=document.createElement('span');badge.className='trial-badge';badge.setAttribute('aria-hidden','true');b.append(badge);}badge.textContent=badgeText;}else badge?.remove();
    const hintTarget=Boolean(activeHint?.hint.targets.includes(i))&&(activeHint.hint.value===undefined||v!==activeHint.hint.value),hintEvidence=Boolean(activeHint?.hint.evidence?.includes(i));
    b.classList.toggle('hint-target',hintTarget);b.classList.toggle('hint-evidence',hintEvidence);
    let preview=b.querySelector('.hint-preview');if(hintTarget&&activeHint.hint.value!==undefined&&v===E.EMPTY){if(!preview){preview=document.createElement('span');preview.className='hint-preview';preview.setAttribute('aria-hidden','true');b.append(preview);}preview.innerHTML=activeHint.hint.value===E.CAT?catSVG:crossSVG;}else preview?.remove();
    b.classList.toggle('conflict',conflict);b.setAttribute('aria-label','第 '+(r+1)+' 行，第 '+(c+1)+' 列，区域 '+String.fromCharCode(65+region)+'，'+['空白','已标记排除','猫咪'][v]+(g.givens.includes(i)?'，已安置的固定猫':'')+(trialRoot?'，假设起点':changed?'，本轮假设改动':note?(note.excluded?'，上次假设后手动排除':'，之前试过的假设'):'')+(conflict?'，存在冲突':''));b.setAttribute('aria-selected',String(v===E.CAT));b.tabIndex=i===focused?0:-1;b.disabled=g.paused||g.won;
  });
  $('board').classList.toggle('hinting',Boolean(activeHint&&(activeHint.hint.targets.length||activeHint.hint.evidence?.length)));$('board').inert=g.paused;$('board-shell').style.visibility=g.paused?'hidden':'visible';$('cat-count').textContent=result.cats+' / '+l.size;$('progress').max=l.size;$('progress').value=Math.min(l.size,result.cats);$('progress').setAttribute('aria-valuetext','已放 '+result.cats+' 只，需要 '+l.size+' 只');$('timer').textContent=time(g.elapsed);
  $('undo').disabled=!g.history.length;$('reset').disabled=!g.started&&!g.board.some(Boolean);$('pause').disabled=g.won;$('pause').textContent=g.paused?'▷':'Ⅱ';$('pause').setAttribute('aria-label',g.paused?'继续游戏':'暂停游戏');$('pause-cover').hidden=!g.paused;$('check').disabled=g.paused;$('hint-request').disabled=g.paused||g.won;
  if(!quiet){$('status').className='status';if(g.won){$('status').textContent='每行、每列、每种颜色都刚刚好。';$('status').classList.add('success');}
    else if(g.paused)$('status').textContent='游戏和计时已暂停。';else if(show&&result.issues.length){$('status').textContent=result.issues.join('；')+'。';$('status').classList.add('error');}
    else $('status').textContent=message||(g.started?'慢慢想，不着急。':'猫咪不能挨在一起，斜角也不行。');}
  $('win').hidden=!g.won;$('win-detail').textContent='用时 '+time(g.elapsed)+' · '+l.size+' 只猫，各得其所。';$('next').textContent=levelIndex<levels.length-1?'下一关':'再玩这一关';
  renderTrial();
  tutorial?.sync({...guideEvent,painting:Boolean(stroke?.painting)});drawHint();
  if(g.won&&!wasWon){if(!journey.completed.includes(l.id)){journey.completed.push(l.id);saveJourney();}sound('win');celebrate();$('next').focus();}if(wasWon!==g.won)levelButtons();
}
function locationName(index){const n=currentLevel().size;return '第 '+(Math.floor(index/n)+1)+' 行第 '+(index%n+1)+' 列';}
function renderTrial(){
  const g=game(),trial=g.trial,latest=g.trialNotes[g.trialNotes.length-1],panel=$('trial-panel');
  panel.classList.toggle('active-trial',Boolean(trial));panel.classList.toggle('returned-trial',!trial&&Boolean(latest));
  $('trial-start').disabled=g.paused||g.won||Boolean(trial);
  $('trial-return').disabled=g.paused||!trial;$('trial-return').textContent=trial?.root===null?'取消选择':'撤回假设';
  $('trial-reject').disabled=g.paused||!trial||trial.root===null;
  const issues=trial&&trial.root!==null?T.contradictions(currentLevel(),g.board):[];
  $('trial-keep').disabled=g.paused||!trial||trial.root===null||issues.length>0;
  panel.setAttribute('aria-label',trial?(trial.root===null?'请在棋盘选择假设起点':'假设起点：'+locationName(trial.root)):'假设推演');
}
function startTrial(){finishStroke(true);const g=game();if(g.paused||g.won||g.trial)return;unlockAudio();record('trial-start');g.trial=T.create(g.board,g.trialNotes);g.started=true;render('点一格，开始这次假设。');sound('trial');}
function chooseTrialRoot(index){
  const g=game();if(!g.trial||g.trial.root!==null)return;
  if(g.board[index]===E.CAT){render('请选择还没有猫的格子作为假设起点。');return;}
  record();g.trial=T.choose(g.trial,g.board,index);g.board=E.setCell(g.board,index,E.CAT);focused=index;g.started=true;manualCheck=false;render();feedback(index,E.CAT);
}
function returnTrial(exclude=false){
  finishStroke(true);const g=game();if(!g.trial||g.paused)return;const root=g.trial.root;record('trial-return');
  const restored=T.restore(g.trial,exclude);g.board=restored.board;g.trialNotes=restored.notes;g.trial=null;manualCheck=false;$('celebration').replaceChildren();
  render(root===null?'已取消假设。':exclude?'已撤回整轮推演，并手动排除假设起点。':'已撤回整轮推演，原来的标记已恢复。');levelButtons();sound('erase');
  if(root!==null){focused=root;cells[root].focus({preventScroll:true});}
}
function keepTrial(){
  finishStroke(true);const g=game();if(!g.trial||g.trial.root===null||g.paused||T.contradictions(currentLevel(),g.board).length)return;
  record('trial-keep');g.trialNotes=g.trialNotes.filter(note=>g.board[note.index]===g.trial.baseBoard[note.index]);g.trial=null;render('已保留本轮推演。仍可用撤销恢复。');sound('cat');
}
function act(index,chosen=mode){const g=game();if(g.paused||g.won||modalOpen())return;if(g.trial?.root===null){chooseTrialRoot(index);return;}const old=g.board[index],value=chosen==='cat'?(old===E.CAT?E.EMPTY:E.CAT):chosen==='mark'?(old===E.MARK?E.EMPTY:E.MARK):(old===E.EMPTY?E.MARK:E.EMPTY);setCell(index,value);}
function setCell(index,value){const g=game();if(g.paused||g.won||modalOpen())return;if(g.givens.includes(index)){render('这只猫已安置，是本关的固定线索。');return;}if(g.trial?.root===null){if(value===E.CAT)chooseTrialRoot(index);else render('先点一格作为假设猫。');return;}if(g.trial?.root===index&&value!==E.CAT){render('假设起点已锁定。用“撤回假设”恢复原盘。');return;}const next=E.setCell(g.board,index,value);if(g.board[index]===value)return;record();g.board=next;g.trialNotes=g.trialNotes.filter(note=>note.index!==index);g.started=true;focused=index;manualCheck=false;render();feedback(index,value);}

function tapCell(index){
 const g=game(),now=performance.now();
 if(mode!=='cycle'||g.trial?.root===null){lastTap=null;act(index);return;}
 if(lastTap&&lastTap.index===index&&lastTap.level===levelIndex&&now-lastTap.time<420&&g.history.length===lastTap.after){
  const before=lastTap.before,historyLength=g.history.length;lastTap=null;setCell(index,E.CAT);
  if(g.history.length===historyLength+1){g.history.splice(historyLength-1,2,before);}
 }else{
  const previous=g.history.length;act(index);lastTap=g.history.length>previous?{index,level:levelIndex,time:now,after:g.history.length,before:g.history[g.history.length-1]}:null;
 }
}
function hintKey(){return currentLevel().id+':'+game().board.join('')+':'+(game().trial?'trial:'+game().trial.root:'normal');}
function clearHint(){
 activeHint=null;$('hint-panel').hidden=true;$('hint-lines').replaceChildren();$('board').classList.remove('hinting');delete $('board').dataset.hintKind;$('hint-request').setAttribute('aria-expanded','false');
 cells.forEach(cell=>{cell.classList.remove('hint-target','hint-evidence','hint-lost','hint-choice');cell.removeAttribute('aria-describedby');cell.querySelectorAll('.hint-preview,.hint-step,.hint-lost-x').forEach(el=>el.remove());});
}
function syncHint(){
 if(!activeHint||activeHint.key===hintKey())return;
 const g=game(),h=activeHint.hint,changed=g.board.flatMap((v,i)=>v!==activeHint.board[i]?[i]:[]);
 if(activeHint.trial!==(g.trial?'trial:'+g.trial.root:'normal')||h.value===undefined||changed.some(i=>!h.targets.includes(i)||(g.board[i]!==h.value&&g.board[i]!==E.EMPTY&&!(h.value===E.CAT&&g.board[i]===E.MARK)))||h.targets.every(i=>g.board[i]===h.value)){clearHint();return;}
 activeHint.key=hintKey();activeHint.board=g.board.slice();
}
function presentHint(hint){
 tutorial?.stop();clearHint();const g=game();activeHint={hint,key:hintKey(),board:g.board.slice(),trial:g.trial?'trial:'+g.trial.root:'normal'};
 const visual=window.CatHints.visual(currentLevel(),g.board,hint);activeHint.visual=visual;
 $('hint-title').textContent=visual.title;$('hint-short').textContent=visual.text;$('hint-text').textContent=hint.text||visual.text;$('hint-more').open=false;
 $('hint-kicker').textContent=g.trial?'💡 当前假设中的线索':'💡 看棋盘上的线索';$('hint-equation').replaceChildren();
 for(const token of visual.tokens){const el=document.createElement('span');el.textContent=token.label;el.className=token.color===undefined?'hint-token':'hint-color';if(token.color!==undefined)el.style.setProperty('--region-color',colors[token.color]);$('hint-equation').append(el);}
 $('hint-apply').hidden=hint.value===undefined;$('hint-apply').textContent=hint.value===2?'放入猫咪':'标记这些 ×';
 $('hint-legend').hidden=hint.value===undefined;$('hint-legend').replaceChildren();
 const legend=hint.kind==='lookahead-region'?['假：试放一只猫','红 ×：这个颜色无处放']:hint.kind?.endsWith('-single')?['亮格：唯一候选','虚线猫：待确认']:['① 金框：依据','② 虚线：待操作'];for(const label of legend){const item=document.createElement('span');item.textContent=label;$('hint-legend').append(item);}
 $('hint-request').setAttribute('aria-expanded','true');render();
 const br=$('board').getBoundingClientRect(),headroom=$('hint-panel').offsetHeight+24;if(br.top<headroom||br.bottom>innerHeight-20)window.scrollTo({top:Math.max(0,scrollY+br.top-headroom),behavior:'instant'});positionHint();
}
function requestHint(){
 finishStroke(true);lastTap=null;const g=game();if(g.paused||g.won||modalOpen())return;unlockAudio();
 if(g.trial?.root===null){presentHint({kind:'info',title:'先选一个假设起点',short:'点一个空格试着放猫；原盘已经保存。',targets:[],evidence:window.CatHints.candidates(currentLevel(),g.board)});return;}
 presentHint(window.CatHints.find(currentLevel(),g.board));
}
function applyHint(){
 const g=game();if(!activeHint||activeHint.key!==hintKey()||g.paused||g.won)return;
 const {targets,value}=activeHint.hint;if(value===undefined)return;
 const changes=targets.filter(i=>g.board[i]!==value&&i!==g.trial?.root);if(!changes.length)return;
 record('hint');for(const i of changes)g.board[i]=value;g.trialNotes=g.trialNotes.filter(note=>!changes.includes(note.index));g.started=true;lastTap=null;clearHint();render();feedback(changes[0],value);
}
let hintLayoutFrame=0;
function positionHint(){
 cancelAnimationFrame(hintLayoutFrame);hintLayoutFrame=requestAnimationFrame(()=>{
  if(!activeHint||$('hint-panel').hidden)return;const card=$('hint-panel'),board=$('board'),r=board.getBoundingClientRect(),vw=document.documentElement.clientWidth,vh=innerHeight;
  const width=Math.min(370,vw-24);card.style.width=width+'px';const height=card.offsetHeight;let x=Math.max(12,Math.min(r.left,vw-width-12)),y=r.top-height-12;
  if(vw-r.right>width+28){x=r.right+18;y=Math.max(12,Math.min(r.top,vh-height-12));}
  else if(r.left>width+28){x=r.left-width-18;y=Math.max(12,Math.min(r.top,vh-height-12));}
  else if(y<8){const rects=activeHint.hint.targets.map(i=>cells[i].getBoundingClientRect());const top=rects.length?Math.min(...rects.map(t=>t.top)):r.top,bottom=rects.length?Math.max(...rects.map(t=>t.bottom)):r.bottom;if(top>height+20)y=top-height-12;else if(bottom+height+20<vh)y=bottom+12;else y=8;}
  card.style.left=x+'px';card.style.top=Math.max(8,Math.min(y,vh-height-8))+'px';drawHintLines();
 });
}
function drawHint(){
 const g=game();if(!activeHint)return;if(g.won||g.paused){clearHint();return;}$('hint-panel').hidden=false;
 const h=activeHint.hint;$('board').dataset.hintKind=h.kind;const remaining=h.targets.filter(i=>h.value===undefined||g.board[i]!==h.value);
 for(const [i,cell]of cells.entries()){
  cell.querySelectorAll('.hint-step,.hint-lost-x').forEach(el=>el.remove());cell.classList.toggle('hint-choice',h.value===undefined&&h.targets.includes(i));
  const lost=h.kind==='lookahead-region'&&h.evidence?.includes(i);cell.classList.toggle('hint-lost',Boolean(lost));
  if(lost){const glyph=document.createElement('span');glyph.className='hint-lost-x';glyph.textContent='×';glyph.setAttribute('aria-hidden','true');cell.append(glyph);}
  const tag=h.kind==='lookahead-region'&&i===remaining[0]?'假':i===remaining[0]?(h.value===undefined?'?':'②'):i===h.evidence?.[0]?'①':'';
  if(tag){const badge=document.createElement('span');badge.className='hint-step';badge.textContent=tag;badge.setAttribute('aria-hidden','true');cell.append(badge);cell.setAttribute('aria-describedby','hint-title hint-short');}
 }
 positionHint();
}
function drawHintLines(){
 const svg=$('hint-lines');svg.replaceChildren();if(!activeHint)return;const n=currentLevel().size,r=$('board').getBoundingClientRect();svg.setAttribute('viewBox','0 0 '+r.width+' '+r.height);svg.style.width=r.width+'px';svg.style.height=r.height+'px';
 const ns='http://www.w3.org/2000/svg';
 for(const {axis,index}of activeHint.visual.axes){const first=cells[axis==='row'?index*n:index].getBoundingClientRect(),last=cells[axis==='row'?index*n+n-1:(n-1)*n+index].getBoundingClientRect(),rect=document.createElementNS(ns,'rect');rect.setAttribute('x',first.left-r.left+2);rect.setAttribute('y',first.top-r.top+2);rect.setAttribute('width',last.right-first.left-4);rect.setAttribute('height',last.bottom-first.top-4);rect.setAttribute('rx','8');svg.append(rect);}
 if(activeHint.hint.kind==='lookahead-region'&&activeHint.hint.evidence?.length){const a=cells[activeHint.hint.targets[0]].getBoundingClientRect(),b=cells[activeHint.hint.evidence[0]].getBoundingClientRect(),line=document.createElementNS(ns,'path');line.setAttribute('d','M '+(a.left+a.width/2-r.left)+' '+(a.top+a.height/2-r.top)+' L '+(b.left+b.width/2-r.left)+' '+(b.top+b.height/2-r.top));line.setAttribute('stroke-dasharray','5 5');svg.append(line);}
}
$('hint-more').addEventListener('toggle',positionHint);
window.addEventListener('resize',positionHint);window.addEventListener('scroll',positionHint,{passive:true});

// A stroke records one undo snapshot. Revisits never toggle and cats are protected.
function paint(index){if(!stroke||stroke.visited.has(index)||game().trial?.root===null)return;stroke.visited.add(index);const g=game();if(g.board[index]===E.CAT||g.board[index]===stroke.value)return;if(!stroke.changed)record();g.board[index]=stroke.value;g.trialNotes=g.trialNotes.filter(note=>note.index!==index);g.started=true;stroke.changed++;focused=index;manualCheck=false;render(undefined,true);feedback(index,stroke.value,true);}
function startPainting(){if(!stroke||stroke.painting||game().trial?.root===null)return;lastTap=null;clearTimeout(stroke.timer);stroke.painting=true;$('board').classList.add('painting');cells[stroke.start].classList.remove('pressing');paint(stroke.start);}
function paintPoint(x,y){const cell=document.elementFromPoint(x,y)?.closest('.cell');if(cell&&$('board').contains(cell))paint(Number(cell.dataset.index));}
function paintSegment(x1,y1,x2,y2){const rect=$('board').getBoundingClientRect(),step=Math.max(3,rect.width/currentLevel().size/4),steps=Math.min(500,Math.max(1,Math.ceil(Math.hypot(x2-x1,y2-y1)/step)));for(let i=0;i<=steps;i++)paintPoint(x1+(x2-x1)*i/steps,y1+(y2-y1)*i/steps);}
function finishStroke(cancelled=false,event){
  if(!stroke)return;const s=stroke;clearTimeout(s.timer);
  if(event&&s.painting&&!cancelled)paintSegment(s.x,s.y,event.clientX,event.clientY);
  cells[s.start]?.classList.remove('pressing');$('board').classList.remove('painting');stroke=null;
  if(s.type==='touch')lastTouch=performance.now();try{if($('board').hasPointerCapture(s.id))$('board').releasePointerCapture(s.id);}catch(_){}
  if(s.painting){if(s.changed)render((s.value===E.MARK?'已标记 ':'已擦除 ')+s.changed+' 格，撤销可一次恢复。',false,{gesture:'drag'});}
  else if(!cancelled)tapCell(s.start);
}
$('board').addEventListener('pointerdown',ev=>{
  if(ev.button!==0||!ev.isPrimary||stroke||game().paused||game().won||modalOpen())return;
  const cell=ev.target.closest('.cell');if(!cell)return;ev.preventDefault();unlockAudio();const index=Number(cell.dataset.index);cell.focus({preventScroll:true});
  stroke={id:ev.pointerId,type:ev.pointerType,start:index,x:ev.clientX,y:ev.clientY,originX:ev.clientX,originY:ev.clientY,value:game().board[index]===E.MARK?E.EMPTY:E.MARK,visited:new Set(),changed:0,painting:false,timer:null};
  if(ev.pointerType==='touch')lastTouch=performance.now();cell.classList.add('pressing');try{$('board').setPointerCapture(ev.pointerId);}catch(_){}stroke.timer=setTimeout(startPainting,260);
});
$('board').addEventListener('pointermove',ev=>{
  if(!stroke||ev.pointerId!==stroke.id)return;if(!(ev.buttons&1)){finishStroke(true);return;}ev.preventDefault();
  if(!stroke.painting&&Math.hypot(ev.clientX-stroke.originX,ev.clientY-stroke.originY)>7)startPainting();
  if(stroke.painting)paintSegment(stroke.x,stroke.y,ev.clientX,ev.clientY);stroke.x=ev.clientX;stroke.y=ev.clientY;
});
$('board').addEventListener('pointerup',ev=>{if(stroke&&ev.pointerId===stroke.id)finishStroke(false,ev);});
$('board').addEventListener('pointercancel',ev=>{if(stroke&&ev.pointerId===stroke.id)finishStroke(true);});
$('board').addEventListener('lostpointercapture',()=>finishStroke(true));
window.addEventListener('blur',()=>finishStroke(true));
function undo(){finishStroke(true);lastTap=null;const g=game();if(!g.history.length)return;tick();const elapsed=g.elapsed,paused=g.paused,started=g.started,{kind,...state}=g.history.pop();Object.assign(g,state);if(kind!=='reset'){g.elapsed=elapsed;g.paused=paused;g.started=started;}manualCheck=false;lastTick=performance.now();$('celebration').replaceChildren();render('已撤销上一步。');levelButtons();sound('erase');if(!g.paused&&!g.won)cells[focused].focus({preventScroll:true});}
function reset(){finishStroke(true);const g=game();if(!g.started&&!g.board.some(Boolean))return;record('reset');const history=g.history;Object.assign(g,newGame(currentLevel()));g.history=history;manualCheck=false;lastTick=performance.now();$('celebration').replaceChildren();closeDialog('settings-dialog');render('已重置，撤销可以恢复。');levelButtons();sound('erase');}
function pause(){finishStroke(true);const g=game();if(g.won)return;tick();g.paused=!g.paused;lastTick=performance.now();render();if(g.paused)$('resume').focus();else cells[focused].focus({preventScroll:true});}
function check(){
 if(game().paused||modalOpen())return;finishStroke(true);tick();manualCheck=true;const l=currentLevel(),g=game(),result=E.inspect(l,g.board);
 if(result.issues.length||!window.CatHints.feasible(l,g.board)){presentHint(window.CatHints.find(l,g.board));sound('error');return;}
 presentHint({kind:'check',title:'检查棋盘',targets:[],evidence:window.CatHints.candidates(l,g.board),tokens:[{label:result.missing.rows.length+' 行缺猫'},{label:result.missing.columns.length+' 列缺猫'},{label:result.missing.regions.length+' 色缺猫'}]});
}
function onCellKey(ev,index){
  const n=currentLevel().size,r=Math.floor(index/n),c=index%n;let target;
  if(ev.key==='ArrowLeft')target=r*n+Math.max(0,c-1);if(ev.key==='ArrowRight')target=r*n+Math.min(n-1,c+1);if(ev.key==='ArrowUp')target=Math.max(0,r-1)*n+c;if(ev.key==='ArrowDown')target=Math.min(n-1,r+1)*n+c;if(ev.key==='Home')target=r*n;if(ev.key==='End')target=r*n+n-1;
  if(target!==undefined){ev.preventDefault();cells[target].focus();return;}if(ev.ctrlKey||ev.metaKey||ev.altKey)return;unlockAudio();
  if(ev.key.toLowerCase()==='x'){ev.preventDefault();act(index,'mark');}if(ev.key.toLowerCase()==='c'){ev.preventDefault();act(index,'cat');}if(ev.key==='Delete'||ev.key==='Backspace'){ev.preventDefault();setCell(index,E.EMPTY);}tutorial?.sync({gesture:'keyboard'});
}
function closeDialog(id){if($(id).open)$(id).close();lastTick=performance.now();}
function openDialog(id){finishStroke(true);clearHint();tick();unlockAudio();if(id==='levels-dialog')levelButtons();$(id).showModal();tutorial?.sync();lastTick=performance.now();}
$('settings-open').addEventListener('click',()=>openDialog('settings-dialog'));$('levels-open').addEventListener('click',()=>openDialog('levels-dialog'));
for(const id of ['settings-dialog','levels-dialog'])$(id).addEventListener('close',()=>{lastTick=performance.now();tutorial?.sync();});
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>closeDialog(b.dataset.close)));
for(const [key,id] of Object.entries({sound:'sound-setting',motion:'motion-setting',haptic:'haptic-setting',letters:'letters-setting',live:'live-check'}))$(id).addEventListener('change',()=>{prefs[key]=$(id).checked;applyPrefs();try{localStorage.setItem('cat-garden-preferences-v2',JSON.stringify(prefs));}catch(_){}if(key==='sound'&&prefs.sound){unlockAudio();sound('cat');}manualCheck=false;render();});
reduceMotion.addEventListener('change',applyPrefs);
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{finishStroke(true);unlockAudio();mode=b.dataset.mode;lastTap=null;document.querySelectorAll('[data-mode]').forEach(btn=>btn.setAttribute('aria-pressed',String(btn===b)));$('gesture-note').innerHTML=(mode==='cycle'?'单击标 × · 双击放猫':mode==='cat'?'单击放猫，再点一次清空':'单击标 ×，再点一次清空')+'<br><strong>按住拖动连标 ×，从 × 开始可擦除</strong>';sound('erase');}));
$('hint-close').addEventListener('click',clearHint);
$('hint-request').addEventListener('click',requestHint);$('hint-apply').addEventListener('click',applyHint);$('hint-dismiss').addEventListener('click',()=>{clearHint();});
$('trial-start').addEventListener('click',startTrial);$('trial-return').addEventListener('click',()=>returnTrial(false));$('trial-reject').addEventListener('click',()=>returnTrial(true));$('trial-keep').addEventListener('click',keepTrial);
document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&activeHint){clearHint();$('hint-request').focus({preventScroll:true});}});
$('undo').addEventListener('click',()=>{unlockAudio();undo();});$('reset').addEventListener('click',reset);$('pause').addEventListener('click',pause);$('resume').addEventListener('click',pause);$('check').addEventListener('click',()=>{unlockAudio();check();});
$('next').addEventListener('click',()=>{if(game().trial)keepTrial();if(levelIndex<levels.length-1)selectLevel(levelIndex+1);else reset();$('level-title').scrollIntoView({block:'start'});});
document.addEventListener('keydown',ev=>{if((ev.ctrlKey||ev.metaKey)&&ev.key.toLowerCase()==='z'&&!ev.shiftKey&&!modalOpen()){ev.preventDefault();undo();}});
document.addEventListener('visibilitychange',()=>{finishStroke(true);tick();lastTick=performance.now();});
applyPrefs();selectLevel(Math.max(0,levels.findIndex(l=>l.id===journey.current)));setInterval(tick,250);
tutorial=window.CatTutorial.mount({get colors(){return colors;},catSVG,crossSVG,
 context(){const g=game();return{level:currentLevel(),unit:J.unitFor(currentLevel()),board:g.board,paused:g.paused,won:g.won,trial:g.trial,modal:modalOpen()};},
 beforeOpen(){finishStroke(true);clearHint();lastTap=null;tick();closeDialog('settings-dialog');closeDialog('levels-dialog');},
 afterClose(){lastTick=performance.now();},onShow(){},onUnavailable(){presentHint({kind:'info',title:'这里暂时用不上这个技巧',short:'继续试试，或点提示找另一条线索。',targets:[]});},
 onUnitComplete(id){if(!journey.learned.includes(id)){journey.learned.push(id);saveJourney();}levelButtons();}
});

if(document.modelContext?.registerTool){const lifecycle=new AbortController();try{Promise.resolve(document.modelContext.registerTool({name:'read_cat_garden',title:'读取猫咪棋盘',description:'只读当前关卡、标记和规则冲突，不揭示答案。',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute(input){if(!input||Object.keys(input).length)throw Error('此工具不接受参数');return{level:currentLevel(),board:game().board.slice(),paused:game().paused,trial:T.clone(game().trial),trialNotes:T.copyNotes(game().trialNotes),...E.inspect(currentLevel(),game().board)};}},{signal:lifecycle.signal})).catch(()=>{});}catch(_){}window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});}
})();
