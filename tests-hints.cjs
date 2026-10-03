const assert=require('node:assert/strict'),E=require('./engine.js'),H=require('./hints.js'),T=require('./tutorial.js'),levels=require('./levels.js');
let count=0,kinds=new Set();
for(const level of levels){
 const n=level.size,solution=E.solve(level,1)[0],trueCats=new Set(solution.map((c,r)=>r*n+c));
 for(let run=0;run<48;run++){
  let seed=run*7919+level.size*31;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const board=Array.from({length:n*n},(_,i)=>trueCats.has(i)?(random()<run/65?2:0):(random()<run/60?1:0));
  assert(H.feasible(level,board));const hint=H.find(level,board);kinds.add(hint.kind);
  if(hint.value!==undefined){assert(hint.targets.length);for(const i of hint.targets){assert.equal(board[i],0);assert.equal(trueCats.has(i),hint.value===2,level.id+' '+hint.kind+' '+i);}const after=board.slice();hint.targets.forEach(i=>after[i]=hint.value);assert(H.feasible(level,after));}count++;
 }
 const solved=Array(n*n).fill(1);trueCats.forEach(i=>solved[i]=2);assert.equal(H.find(level,solved).kind,'complete');
 const broken=Array(n*n).fill(0);broken[solution[0]]=1;assert.equal(H.find(level,broken).kind,'contradiction');
}
assert.equal(H.find(levels[0],Array(25).fill(1)).kind,'contradiction');
const conflict=Array(25).fill(0);conflict[0]=conflict[1]=2;assert.equal(H.find(levels[0],conflict).kind,'conflict');
for(const lesson of T.lessons){
 if(lesson.gesture==='rollback'){assert(!H.feasible(T.level,lesson.board));const reset=Array(25).fill(0);reset[0]=1;assert(H.feasible(T.level,reset));continue;}
 assert(H.feasible(T.level,lesson.board),lesson.title);const after=lesson.board.slice();if(lesson.value!==undefined)lesson.targets.forEach(i=>after[i]=lesson.value);assert(H.feasible(T.level,after),lesson.title+' result');
}
console.log('PASS '+count+' legal partial boards across '+levels.length+' levels, sound hint actions, impossible marks, conflicts, completion and all 15 teaching fixtures.');console.log('Techniques exercised:',[...kinds].join(', '));

for(const [kind,fixture] of Object.entries(require('./hint-test-fixtures.json'))){const level=levels.find(l=>l.id===fixture.id),hint=H.find(level,fixture.board);assert.equal(hint.kind,kind);const solution=E.solve(level,1)[0],truth=new Set(solution.map((c,r)=>r*level.size+c));if(hint.value!==undefined)for(const i of hint.targets)assert.equal(truth.has(i),hint.value===2,kind);}
console.log('PASS regression fixtures for recorded hint outcomes, including both pair and reverse locking directions.');
