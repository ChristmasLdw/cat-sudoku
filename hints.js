/* Explainable one-step hints. No saved solution is used. */
(function(root){
'use strict';
const E=typeof module!=='undefined'&&module.exports?require('./engine.js'):root.CatPuzzle;
function candidates(level,board){
 const n=level.size,cats=board.flatMap((v,i)=>v===2?[i]:[]);
 return board.flatMap((v,i)=>v===0&&!cats.some(j=>Math.floor(i/n)===Math.floor(j/n)||i%n===j%n||level.regions[Math.floor(i/n)][i%n]===level.regions[Math.floor(j/n)][j%n]||(Math.abs(Math.floor(i/n)-Math.floor(j/n))<=1&&Math.abs(i%n-j%n)<=1))?[i]:[]);
}
function feasible(level,board){
 if(E.inspect(level,board).issues.length)return false;
 const n=level.size,placement=[];
 function visit(r,cols,regs){
  if(r===n)return true;
  const fixed=board.slice(r*n,(r+1)*n).indexOf(2);
  for(let c=0;c<n;c++){
   if((fixed!==-1&&c!==fixed)||board[r*n+c]===1)continue;
   const region=level.regions[r][c];
   if((cols&(1<<c))||(regs&(1<<region))||(r&&Math.abs(placement[r-1]-c)<=1))continue;
   placement[r]=c;if(visit(r+1,cols|(1<<c),regs|(1<<region)))return true;
  }return false;
 }return visit(0,0,0);
}
function find(level,board,options={}){
 const accepts=kind=>!options.kinds||options.kinds.includes(kind);
 const n=level.size,result=E.inspect(level,board),pos=i=>'第 '+(Math.floor(i/n)+1)+' 行第 '+(i%n+1)+' 列',region=i=>level.regions[Math.floor(i/n)][i%n],letter=v=>String.fromCharCode(65+v);
 if(result.won)return{kind:'complete',title:'已经完成',text:'每行、每列、每种颜色都恰好一只猫。',targets:[]};
 if(result.issues.length)return{kind:'conflict',title:'先修正冲突',text:result.issues.join('；')+'。先撤销或移走冲突的猫，再继续推理。',targets:result.conflicts};
 if(!feasible(level,board)){
  const legal=new Set(candidates(level,board));let evidence=[],blockedGroup=null;
  for(const [key,type]of [['rows','row'],['columns','column'],['regions','region']])for(const index of result.missing[key]){
   const group=board.flatMap((v,i)=>(type==='row'?Math.floor(i/n)===index:type==='column'?i%n===index:region(i)===index)?[i]:[]);
   if(!blockedGroup&&!group.some(i=>legal.has(i))){evidence=group;blockedGroup={type,index};}
  }
  return{kind:'contradiction',title:'当前标记无法完成',text:'把现有猫和 × 都保留时，已经无法满足全部规则。某个猫位或排除可能有误；请撤销最近几步，或撤回当前假设。',targets:[],evidence,blockedGroup};
 }
 const available=candidates(level,board),set=new Set(available);
 const blocked=board.flatMap((v,i)=>v===0&&!set.has(i)?[i]:[]);
 if(blocked.length&&accepts('exclude')){const target=blocked[0],cat=board.findIndex((v,j)=>v===2&&(Math.floor(target/n)===Math.floor(j/n)||target%n===j%n||region(target)===region(j)||(Math.abs(Math.floor(target/n)-Math.floor(j/n))<=1&&Math.abs(target%n-j%n)<=1)));
  return{kind:'exclude',title:'先排除猫咪占用的位置',text:pos(cat)+'已有猫；同一行、同一列、同色区域和周围八格都不能再放猫。高亮格可以标 ×。',targets:blocked.filter(i=>Math.floor(i/n)===Math.floor(cat/n)||i%n===cat%n||region(i)===region(cat)||(Math.abs(Math.floor(i/n)-Math.floor(cat/n))<=1&&Math.abs(i%n-cat%n)<=1)),evidence:[cat],value:1};}
 const groups={region:[],row:[],column:[]};for(let i=0;i<n;i++){groups.region.push(available.filter(j=>region(j)===i));groups.row.push(available.filter(j=>Math.floor(j/n)===i));groups.column.push(available.filter(j=>j%n===i));}
 for(const [type,name]of [['region','颜色区域'],['row','行'],['column','列']])for(let i=0;i<n;i++)if(groups[type][i].length===1&&accepts(type+'-single')){const target=groups[type][i][0];return{kind:type+'-single',title:name+'只剩一格',text:(type==='region'?'颜色区域 '+letter(i):'第 '+(i+1)+' '+name)+'还没有猫，并且只剩 '+pos(target)+' 能放猫，所以这里必须放猫。',targets:[target],evidence:Array.from({length:n*n},(_,j)=>j).filter(j=>type==='region'?region(j)===i:type==='row'?Math.floor(j/n)===i:j%n===i),value:2};}
 for(let a=0;a<n;a++){
  const cells=groups.region[a];if(!cells.length)continue;
  for(const [axis,get]of [['row',i=>Math.floor(i/n)],['column',i=>i%n]]){
   const lines=[...new Set(cells.map(get))];if(lines.length!==1)continue;const line=lines[0],targets=groups[axis][line].filter(i=>region(i)!==a);
   if(targets.length&&accepts('region-'+axis))return{kind:'region-'+axis,title:'同色候选锁定一'+(axis==='row'?'行':'列'),text:'区域 '+letter(a)+' 的所有可放位置都在第 '+(line+1)+' '+(axis==='row'?'行':'列')+'。这'+(axis==='row'?'行':'列')+'的猫一定属于这个颜色，因此其他颜色的高亮格都可以排除。',targets,evidence:cells,value:1};
  }
 }
 for(const [axis,get,name]of [['row',i=>Math.floor(i/n),'行'],['column',i=>i%n,'列']])for(let a=0;a<n;a++){
  const cells=groups[axis][a];if(!cells.length)continue;const regs=[...new Set(cells.map(region))];if(regs.length!==1)continue;
  const targets=groups.region[regs[0]].filter(i=>get(i)!==a);if(targets.length&&accepts(axis+'-region'))return{kind:axis+'-region',title:'一'+name+'锁定一种颜色',text:'第 '+(a+1)+' '+name+'的可放位置全部属于区域 '+letter(regs[0])+'，这个颜色的猫必须在本'+name+'。该颜色在其他'+name+'的高亮格可排除。',targets,evidence:cells,value:1};
 }
 for(const [axis,get,name]of [['row',i=>Math.floor(i/n),'行'],['column',i=>i%n,'列']])for(let a=0;a<n;a++)for(let b=a+1;b<n;b++){
  if(!groups.region[a].length||!groups.region[b].length)continue;const lines=[...new Set([...groups.region[a],...groups.region[b]].map(get))];if(lines.length!==2)continue;
  const targets=available.filter(i=>lines.includes(get(i))&&region(i)!==a&&region(i)!==b);
  if(targets.length&&accepts('pair-'+axis))return{kind:'pair-'+axis,title:'两种颜色占两'+name,text:'区域 '+letter(a)+' 和 '+letter(b)+' 的猫只能放在第 '+lines.map(i=>i+1).join('、')+' '+name+'。两只猫会占满这两'+name+'，其他颜色在这两'+name+'里的格子可排除。',targets,evidence:[...groups.region[a],...groups.region[b]],value:1};
 }

 for(const [axis,get,name]of [['row',i=>Math.floor(i/n),'行'],['column',i=>i%n,'列']])for(let a=0;a<n;a++)for(let b=a+1;b<n;b++){
  const evidence=[...groups[axis][a],...groups[axis][b]];if(!groups[axis][a].length||!groups[axis][b].length)continue;
  const regs=[...new Set(evidence.map(region))];if(regs.length!==2)continue;
  const targets=available.filter(i=>regs.includes(region(i))&&get(i)!==a&&get(i)!==b);
  if(targets.length&&accepts('lines-pair-'+axis))return{kind:'lines-pair-'+axis,title:'两'+name+'只剩两种颜色',text:'第 '+(a+1)+'、'+(b+1)+' '+name+'的候选只属于区域 '+regs.map(letter).join('、')+'。两'+name+'各需要一只猫，会用掉这两种颜色，因此它们在其他'+name+'的高亮格都可排除。',targets,evidence,value:1};
 }
 for(const target of accepts('lookahead-region')?available:[]){
  const assumed=board.slice();assumed[target]=2;const next=candidates(level,assumed),occupied=new Set(assumed.flatMap((v,i)=>v===2?[region(i)]:[]));
  for(let r=0;r<n;r++)if(!occupied.has(r)&&!next.some(i=>region(i)===r))return{kind:'lookahead-region',title:'这个假设会封死另一种颜色',text:'假如 '+pos(target)+' 是猫，排除它的同行、同列、同色和周围八格后，区域 '+letter(r)+' 的候选会全部消失。但每种颜色都必须有猫，所以这个假设不成立，该格可以标 ×。',targets:[target],evidence:groups.region[r],value:1};
 }
 if(options.kinds&&!accepts('trial'))return null;
 const small=Object.values(groups).flat().filter(g=>g.length>1).sort((a,b)=>a.length-b.length)[0]||[];
 return{kind:'trial',title:'下一步可以尝试假设',text:'暂未找到基础规则能直接确定的一步。高亮的是同一组的 '+small.length+' 个候选，必须恰好选一个。可点“开始假设”试一个位置；只有在推演可靠且产生矛盾时，才能排除起点。',targets:small};
}
// Small visual vocabulary shared by on-board hints and user-requested coaching.
function visual(level,board,hint){
 const n=level.size,k=hint.kind||'info',region=i=>level.regions[Math.floor(i/n)][i%n],e=hint.evidence||[],t=hint.targets||[];
 const column=k.includes('column'),axis=column?'列':'行',line=i=>column?i%n:Math.floor(i/n);
 const lines=[...new Set(e.map(line))].sort((a,b)=>a-b),regions=[...new Set(e.map(region))];
 let title=hint.title,text='',tokens=[],axes=[];
 const colorTokens=rs=>rs.map(color=>({color,label:String.fromCharCode(65+color)}));
 if(k==='exclude'){title='已有猫，这些格不能再放';text='虚线 × 是这只猫排除的位置。';tokens=[{label:'① 已有猫'},{label:'→'},{label:'② ×'}];}
 else if(k.endsWith('-single')){
  title=k==='region-single'?'这个颜色，只剩一个位置':k==='row-single'?'这一行，只剩一个位置':'这一列，只剩一个位置';text='双击虚线猫，确认它的位置。';
  tokens=k==='region-single'?colorTokens([region(t[0])]):[{label:'第 '+(line(t[0])+1)+' '+axis}];tokens.push({label:'1 格'},{label:'→'},{label:'🐱'});if(k!=='region-single')axes=[{axis:column?'column':'row',index:line(t[0])}];
 }else if(k==='region-row'||k==='region-column'){
  title='这个颜色占住一'+axis;text='这'+axis+'其他颜色的虚线格，可以标 ×。';tokens=[...colorTokens(regions),{label:'→'},{label:'第 '+(lines[0]+1)+' '+axis}];axes=lines.map(index=>({axis:column?'column':'row',index}));
 }else if(k==='row-region'||k==='column-region'){
  title='这一'+axis+'，只剩一种颜色';text='这个颜色在其他'+axis+'的虚线格，可以标 ×。';tokens=[{label:'第 '+(lines[0]+1)+' '+axis},{label:'→'},...colorTokens(regions)];axes=lines.map(index=>({axis:column?'column':'row',index}));
 }else if(k.includes('pair')){
  const reverse=k.startsWith('lines-');title=reverse?'两'+axis+'，锁定两种颜色':'两种颜色，占住两'+axis;text=reverse?'这两色在其他'+axis+'的虚线格，可以排除。':'这两'+axis+'其他颜色的虚线格，可以排除。';tokens=[{label:'第 '+lines.map(i=>i+1).join('、')+' '+axis},{label:'↔'},...colorTokens(regions)];axes=lines.map(index=>({axis:column?'column':'row',index}));
 }else if(k==='lookahead-region'){
  title='假如这里是猫，就会矛盾';text='另一种颜色无处放猫，所以「假」格可排除。';tokens=[{label:'假设 🐱'},{label:'→'},...colorTokens(regions),{label:'0 位置'},{label:'→ ×'}];
 }else if(k==='trial'){title='这些候选，需要试一试';text='点「开始假设」，选一个亮格试；可整轮撤回。';tokens=[{label:t.length+' 个候选'},{label:'→'},{label:'恰好 1 只猫'}];}
 else if(k==='conflict'){title='这些猫发生了冲突';text='红框猫违反规则，请移走或撤销。';tokens=[{label:'红框 !'},{label:'→'},{label:'检查猫位'}];}
 else if(k==='contradiction'){title='当前标记走不通了';text='检查 × 和猫的位置，或撤销最近一步。';tokens=hint.blockedGroup?(hint.blockedGroup.type==='region'?colorTokens([hint.blockedGroup.index]):[{label:'第 '+(hint.blockedGroup.index+1)+' '+(hint.blockedGroup.type==='row'?'行':'列')}]):[{label:'当前标记'}];tokens.push({label:hint.blockedGroup?'0 个可放位置':'无完整解'},{label:'↶'});}
 else if(k==='check'){title='这些地方还需要猫';text='亮点是当前仍能放猫的位置。';tokens=hint.tokens||[];}
 else {text=hint.short||'继续在棋盘上操作即可。';tokens=hint.tokens||[];}
 return{title,text,tokens,axes};
}
const api={candidates,feasible,find,visual};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CatHints=api;
})(typeof globalThis!=='undefined'?globalThis:this);
