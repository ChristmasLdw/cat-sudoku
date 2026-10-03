const assert=require('node:assert/strict'),E=require('./engine.js'),H=require('./hints.js'),T=require('./tutorial.js'),J=require('./journey.js'),levels=J.arrange(require('./levels.js'));
let checked=0;const seen=new Set();
for(const l of levels){
 const solution=E.solve(l,1)[0],truth=new Set(solution.map((c,r)=>r*l.size+c));
 for(let run=0;run<20;run++){
  let seed=run*7919+l.size*31;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const b=run===0?J.startBoard(l):Array.from({length:l.size*l.size},(_,i)=>truth.has(i)?(random()<run/24?2:0):(random()<run/22?1:0));
  for(let lesson=0;lesson<13;lesson++){
   const before=b.slice(),g=T.plan(l,b,lesson);assert.deepEqual(b,before,'planner must not edit the actual game');if(!g)continue;
   seen.add(lesson);assert(g.targets.length);assert(!T.satisfied(g,b));
   for(const i of g.targets){assert.equal(b[i],0);assert.equal(truth.has(i),g.value===2,'unsafe lesson '+lesson+' in '+l.id);}
   const after=b.slice();g.targets.forEach(i=>after[i]=g.value);assert(T.satisfied(g,after));assert(H.feasible(l,after));
   const partial=after.slice();partial[g.targets[0]]=0;assert(!T.satisfied(g,partial));partial[g.targets[0]]=g.value===2?1:2;assert(!T.satisfied(g,partial));
   if(g.gesture==='drag'){assert(g.targets.length>=2);for(let i=1;i<g.targets.length;i++)assert.equal(g.targets[i]-g.targets[i-1],g.axis==='row'?1:l.size);}
   checked++;
  }
 }
 const impossible=Array(l.size*l.size).fill(1);for(let lesson=0;lesson<13;lesson++)assert.equal(T.plan(l,impossible,lesson),null);
}
for(let lesson=4;lesson<=12;lesson++){
 const g=T.plan(T.level,T.lessons[lesson].board,lesson);assert(g,'reference technique '+lesson+' must have an applicable in-place guide');
}
const fixtures=require('./hint-test-fixtures.json');for(const [kind,f]of Object.entries(fixtures)){
 const l=levels.find(l=>l.id===f.id);if(['complete','trial'].includes(kind))continue;
 const h=H.find(l,f.board,{kinds:[kind]});assert(h&&h.kind===kind,kind+' targeted hint');
}
assert.equal(T.plan(levels[0],J.startBoard(levels[0]),14).control,'hint-request');
assert.equal(T.plan(levels[0],J.startBoard(levels[0]),13,{root:0}).control,'trial-return');
assert.equal(T.plan(levels[0],J.startBoard(levels[0]),13,{root:null}),null);
assert.equal(T.satisfied({targets:[],control:'hint-request'},[]),false);
console.log('PASS '+checked+' safe, non-mutating live-board guides; all '+seen.size+' board lessons exercised; wrong/partial actions do not complete; contiguous drag runs; contradiction suppression and scoped hint selection.');
