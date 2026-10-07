const assert=require('node:assert/strict'),E=require('./engine.js'),J=require('./journey.js'),levels=require('./levels.js'),fixtures=require('./screenshot-levels.json');
const imported=levels.filter(l=>l.source?.type==='user-screenshot');
assert.equal(levels.length,396);assert.equal(imported.length,7);assert.deepEqual(imported.map(l=>l.source.referenceLevel),[89,81,80,79,78,75,74]);
assert.deepEqual(imported.map(l=>l.size),[9,8,7,8,8,9,9]);
assert.deepEqual(imported.flatMap(l=>l.source.photos).sort((a,b)=>a-b),[1,2,3,4,5,6,7,8,9]);
for(const fixture of fixtures){
 const l=imported.find(l=>l.id===fixture.id);assert(l);assert.equal(fixture.legend.length,l.size);assert.deepEqual(l.regions.map(row=>row.map(i=>fixture.legend[i]).join('')),fixture.symbols);
 assert.equal(E.validateLevel(l),true);assert.equal(E.solve(l,2).length,1);assert(l.regionColors.every(c=>/^#[\da-f]{6}$/i.test(c)));assert.equal(new Set(l.regionColors).size,l.size);
 assert(J.startBoard(l).every(v=>v===E.EMPTY));assert.deepEqual(J.forLevel(l).givens,[]);assert(J.unitFor(l).testPack);assert.deepEqual(J.unitFor(l).lessons,[]);
 const b=J.startBoard(l);b[0]=E.CAT;b[1]=E.MARK;assert(J.startBoard(l).every(v=>v===E.EMPTY),'reset must not retain test markings');
}
assert.deepEqual(J.arrange(levels).slice(89,96).map(l=>l.id),[89,79,75,78,80,74,81].map(n=>'screenshot-'+n));
const reference89=fixtures.find(l=>l.source.referenceLevel===89);assert.equal(reference89.symbols[1][6],'Y','cat-covered r2c7 is yellow, not orange fur');
console.log('PASS 9 photos deduplicated into 7 exact region layouts, screenshot numbers, colors, unique solutions, fresh empty starts/resets, no givens/onboarding, and appended order.');
