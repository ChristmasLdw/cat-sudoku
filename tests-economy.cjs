'use strict';
const assert=require('node:assert/strict'),Q=require('./economy.js'),E=require('./engine.js'),catalog=require('./api/catalog.json');
assert.equal(Q.day(Date.parse('2026-10-07T15:59:59Z')),'2026-10-07');assert.equal(Q.day(Date.parse('2026-10-07T16:00:00Z')),'2026-10-08');
assert.equal(Q.reward(true,{hints:0,guides:0,conflicts:0},0,0).coins,40);assert.equal(Q.reward(true,{hints:1},0,0).coins,30);assert.equal(Q.reward(false,{},0,3).coins,0);assert.equal(Q.reward(true,{},4,0).bell,1);
for(const l of catalog){
 const board=Array(l.size*l.size).fill(0);for(const i of l.givens||[])board[i]=2;
 const before=board.slice(),out=Q.effect(l,board,'bell'),solution=E.solve({...l,name:l.id},2)[0];assert.deepEqual(board,before);assert.equal(out.value,2);for(const i of out.targets){assert.equal(i%l.size,solution[Math.floor(i/l.size)]);board[i]=2;}
 const brush=Q.effect(l,board,'brush');for(const i of brush.targets)assert.notEqual(i%l.size,solution[Math.floor(i/l.size)]);
 const wrong=Array(l.size*l.size).fill(0);wrong[solution[0]]=1;assert.throws(()=>Q.effect(l,wrong,'bell'));
}
assert.equal(require('node:fs').readFileSync('economy.js','utf8'),require('node:fs').readFileSync('api/economy-rules.js','utf8'));
console.log('PASS 196 levels: safe bell/brush effects, no mutation, wrong notes rejected; reward amounts, daily cap and Beijing midnight');
