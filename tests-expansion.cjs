const assert=require('node:assert/strict'),crypto=require('node:crypto'),L=require('./levels.js'),J=require('./journey.js'),{fingerprint}=require('./generate-levels.cjs');
const arranged=J.arrange(L),extra=arranged.slice(96);
assert.equal(crypto.createHash('sha256').update(JSON.stringify(arranged)).digest('hex'),'c888bc6b19b8b2d06c446274c2696d81f8d6360fe28df6ee994207e2a0190aa2','The recovered 196 production boards and playing order must stay unchanged');
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
