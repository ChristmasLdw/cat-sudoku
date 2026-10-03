const assert=require('node:assert/strict'),H=require('./hints.js'),L=require('./levels.js'),F=require('./hint-test-fixtures.json');
for(const [kind,f]of Object.entries(F)){
 const l=L.find(x=>x.id===f.id),before=JSON.stringify(f.board),h=H.find(l,f.board),v=H.visual(l,f.board,h);
 assert.equal(h.kind,kind);assert.equal(JSON.stringify(f.board),before);assert(v.title.length<30);assert(v.text.length<60);
 for(const token of v.tokens){assert.equal(typeof token.label,'string');assert(!token.label.includes('undefined'));if(token.color!==undefined)assert(Number.isInteger(token.color)&&token.color>=0&&token.color<l.size);}
 for(const {axis,index}of v.axes){assert(['row','column'].includes(axis));assert(index>=0&&index<l.size);}
 if(kind==='lines-pair-column'){assert.equal(v.axes.length,2);assert(v.axes.every(a=>a.axis==='column'));assert.equal(v.tokens.filter(t=>t.color!==undefined).length,2);}
}
const l=L.find(x=>x.id==='screenshot-89'),b=Array(l.size**2).fill(0);for(let i=0;i<l.size;i++)b[i]=1;
const h=H.find(l,b);assert.equal(h.kind,'contradiction');assert.deepEqual(h.blockedGroup,{type:'row',index:0});assert.deepEqual(h.evidence,[0,1,2,3,4,5,6,7,8]);assert(H.visual(l,b,h).tokens.some(t=>t.label==='第 1 行'));
console.log('PASS compact visual models for all hint fixtures, valid row/column frames and color chips, two-column/two-color correspondence, and explicit dead-row highlighting.');
