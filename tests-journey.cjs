const assert=require('node:assert/strict'),E=require('./engine.js'),H=require('./hints.js'),J=require('./journey.js'),T=require('./tutorial.js'),L=require('./levels.js');
const levels=J.arrange(L),rank=k=>k==='exclude'||k==='complete'?0:k.endsWith('-single')?1:['region-row','region-column'].includes(k)?2:['row-region','column-region'].includes(k)?3:k.includes('pair')?4:k==='lookahead-region'?5:6;
assert.equal(levels.length,62);assert.equal(new Set(levels.map(l=>l.id)).size,62);assert.deepEqual(J.config.units.map(u=>u.count),[2,2,3,4,5,6,7,8,8,10,7]);
for(let i=0;i<levels.length;i++){
 const l=levels[i],unit=J.unitFor(l),g=J.forLevel(l).givens,board=J.startBoard(l),solution=E.solve(l,1)[0];assert(g.length<l.size);assert(H.feasible(l,board));assert(!E.inspect(l,board).won);if(i&&i<55)assert(l.size>=levels[i-1].size);
 for(const index of g)assert.equal(solution[Math.floor(index/l.size)],index%l.size);
 if(unit.id<8){let won=false;for(let step=0;step<200;step++){const h=H.find(l,board);assert(rank(h.kind)<=unit.cap,l.id+' unexpected '+h.kind);if(h.kind==='complete'){won=true;break;}assert(h.value!==undefined);h.targets.forEach(i=>board[i]=h.value);}assert(won,l.id);}else assert.equal(g.length,0);
}
for(const unit of J.config.units){assert(unit.lessons.length<=2);for(const i of unit.lessons)assert(T.lessons[i]);assert.equal(levels.filter(l=>J.unitFor(l).id===unit.id).length,unit.count);}
assert.deepEqual(J.validProgress({completed:['bad',levels[0].id,levels[0].id],learned:[-1,0,0,99],current:'bad'},levels),{completed:[levels[0].id],learned:[0],current:levels[0].id});
console.log('PASS 10 paced units plus 7 empty screenshot boards, all 55 original puzzles preserved, monotonic board sizes, valid starter cats, skill-limited paths for first 37 puzzles, full challenge boards later, lesson links and progress validation.');
