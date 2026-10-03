'use strict';
const assert=require('node:assert/strict');
const E=require('./engine.js');
const levels=require('./levels.js');
let checks=0;
function test(name,fn){fn();checks++;console.log('PASS '+name);}
// Independent full permutation oracle: no reuse of the engine's search or inspection.
function oracle(level){const n=level.size,p=[],used=new Set(),answers=[];function visit(){if(p.length===n){if(p.some((c,r)=>r>0&&Math.abs(c-p[r-1])<=1))return;if(new Set(p.map((c,r)=>level.regions[r][c])).size===n)answers.push(p.slice());return;}for(let c=0;c<n;c++)if(!used.has(c)){used.add(c);p.push(c);visit();p.pop();used.delete(c);}}visit();return answers;}
for(const level of levels){test(level.name+': connected regions and exactly one independently verified solution',()=>{assert.equal(E.validateLevel(level),true);const solutions=oracle(level);assert.equal(solutions.length,1);assert.equal(JSON.stringify(E.solve(level,2)),JSON.stringify(solutions));const board=Array(level.size**2).fill(0);solutions[0].forEach((c,r)=>board[r*level.size+c]=2);assert.equal(E.inspect(level,board).won,true);assert.equal(E.inspect(level,board.map(v=>v===0?1:v)).won,true);board[solutions[0][0]]=0;assert.equal(E.inspect(level,board).won,false);});}
const level=levels[0],n=level.size;
function inspectAt(indices){const board=Array(n*n).fill(0);indices.forEach(i=>board[i]=2);return E.inspect(level,board);}
test('empty and X-only boards are not wins',()=>{assert.equal(inspectAt([]).won,false);assert.equal(E.inspect(level,Array(n*n).fill(1)).cats,0);});
test('row conflicts even across distant cells',()=>assert(inspectAt([0,n-1]).issues.some(s=>s.includes('第 1 行'))));
test('column conflicts even across distant rows',()=>assert(inspectAt([0,n*(n-1)]).issues.some(s=>s.includes('第 1 列'))));
test('all eight neighboring positions conflict',()=>{const center=2*n+2;for(const dr of [-1,0,1])for(const dc of [-1,0,1])if(dr||dc)assert(inspectAt([center,center+dr*n+dc]).issues.some(s=>s.includes('斜角')));});
test('same region conflicts without touching or sharing row/column',()=>{let found=false;for(let a=0;a<n*n;a++)for(let b=a+1;b<n*n;b++){const ra=Math.floor(a/n),rb=Math.floor(b/n),ca=a%n,cb=b%n;if(ra!==rb&&ca!==cb&&(Math.abs(ra-rb)>1||Math.abs(ca-cb)>1)&&level.regions[ra][ca]===level.regions[rb][cb]){assert(inspectAt([a,b]).issues.some(s=>s.startsWith('区域')));found=true;}}assert(found);});
test('updates are immutable and reject invalid input',()=>{const board=Array(n*n).fill(0);const next=E.setCell(board,0,2);assert.equal(board[0],0);assert.equal(next[0],2);assert.throws(()=>E.setCell(board,-1,2));assert.throws(()=>E.setCell(board,0,3));assert.throws(()=>E.inspect(level,[0]));});
test('malformed and disconnected level data rejected',()=>{assert.throws(()=>E.validateLevel({...level,size:2}));assert.throws(()=>E.validateLevel({...level,regions:[]}));const broken=JSON.parse(JSON.stringify(level));broken.regions[n-1][n-1]=0;assert.throws(()=>E.validateLevel(broken));});
test('missing cats are separate from conflicts, including X-only groups',()=>{const result=E.inspect(level,Array(n*n).fill(1)),all=Array.from({length:n},(_,i)=>i);assert.deepEqual(result.missing,{rows:all,columns:all,regions:all});assert.deepEqual(result.issues,[]);});
test('missing groups update from partial boards without hiding overfilled groups',()=>{const result=inspectAt([0,1]);assert(!result.missing.rows.includes(0));assert(!result.missing.columns.includes(0));assert(!result.missing.columns.includes(1));assert(!result.missing.regions.includes(level.regions[0][0]));assert.equal(result.missing.rows.length,n-1);assert(result.issues.length>0);});
test('a solved board has no missing cats; removing one identifies each affected group',()=>{const solution=E.solve(level,1)[0],board=Array(n*n).fill(1);solution.forEach((c,r)=>board[r*n+c]=2);assert.deepEqual(E.inspect(level,board).missing,{rows:[],columns:[],regions:[]});const row=2,col=solution[row];board[row*n+col]=1;assert.deepEqual(E.inspect(level,board).missing,{rows:[row],columns:[col],regions:[level.regions[row][col]]});});
console.log(checks+' test groups passed.');
