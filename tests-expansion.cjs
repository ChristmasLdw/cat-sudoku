const assert=require('node:assert/strict'),crypto=require('node:crypto'),L=require('./levels.js'),J=require('./journey.js'),{fingerprint}=require('./generate-levels.cjs');
const arranged=J.arrange(L),extra=arranged.slice(96,196);
assert.equal(crypto.createHash('sha256').update(JSON.stringify(arranged.slice(0,196))).digest('hex'),'c888bc6b19b8b2d06c446274c2696d81f8d6360fe28df6ee994207e2a0190aa2','The recovered 196 production boards and playing order must stay unchanged');
assert.equal(extra.length,100);
assert.equal(new Set(L.map(fingerprint)).size,L.length,'No duplicate region layout, including rotations, reflections or color relabeling');
for(const [i,l] of extra.entries()){
 assert.equal(l.expansion.group,Math.floor(i/20)+1);
 assert.equal(l.size,[7,8,8,9,9][Math.floor(i/20)]);
 assert.equal(J.unitFor(l).id,11+Math.floor(i/20));
 assert(J.startBoard(l).every(v=>v===0));
 assert.deepEqual(J.unitFor(l).lessons,[]);
}
const saved={completed:arranged.slice(0,62).map(l=>l.id),learned:[0,1,10],current:arranged[61].id};
assert.deepEqual(J.validProgress(saved,arranged),{...saved,stale:[],skills:{seen:[],practiced:[]}},'Existing progress survives expansion');
console.log('PASS 100 appended empty boards, recovered 196 boards/order/progress unchanged, correct groups, symmetry-aware deduplication.');

const pack=arranged.slice(196),report=require('./level-pack-200-report.json').levels,{rate}=require('./rate-level.cjs');
assert.equal(arranged.length,396);assert.equal(pack.length,200);assert.equal(report.length,200);
assert.deepEqual(pack.reduce((a,l)=>(a[l.size]=(a[l.size]||0)+1,a),{}),{6:55,7:55,8:55,9:35});
assert.deepEqual(pack.reduce((a,l)=>(a[J.difficultyFor(l)]=(a[J.difficultyFor(l)]||0)+1,a),{}),{2:37,3:46,4:103,5:14});
let streak=1;
for(const [i,l] of pack.entries()){
 assert.equal(l.expansion.pack,'more-200-20261007');assert.equal(l.expansion.position,i+1);assert.equal(J.unitFor(l).id,16);assert.equal(J.unitFor(l).lessons.length,0);assert(J.startBoard(l).every(v=>v===0));
 assert.equal(report[i].id,l.id);assert.equal(report[i].number,197+i);assert.equal(rate(l).difficulty,J.difficultyFor(l),'Difficulty must match actual deductions');
 if(i){streak=J.difficultyFor(l)===J.difficultyFor(pack[i-1])?streak+1:1;assert(streak<=4);}
}
for(let i=0;i<200;i+=20)assert(new Set(pack.slice(i,i+20).map(J.difficultyFor)).size>=3,'Difficulty is mixed along the route');
console.log('PASS 200 appended empty levels, measured difficulty labels, mixed order, all 396 symmetry-unique boards; original 196 hash unchanged');
