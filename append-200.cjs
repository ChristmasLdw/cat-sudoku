'use strict';
// One-time, reproducible 197–396 expansion. Optional argument: saved candidate pool.
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {generateLevels,fingerprint}=require('./generate-levels.cjs'),{rate}=require('./rate-level.cjs');
const L=require('./levels.js'),J=require('./journey.js'),E=require('./engine.js'),old=J.arrange(L);
assert.equal(old.length,196,'This pack may only be appended to the original 196 levels');
assert.equal(crypto.createHash('sha256').update(JSON.stringify(old)).digest('hex'),'c888bc6b19b8b2d06c446274c2696d81f8d6360fe28df6ee994207e2a0190aa2');
let pool=[];
if(process.argv[2])pool=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
else for(const size of [6,7,8,9]){pool.push(...generateLevels({size,count:size===9?35:100,seed:'cat-200-20261007-'+size,maxAttempts:600000,existing:[...L,...pool]}));console.log('Generated size '+size);}
for(const l of pool){E.validateLevel(l);assert.equal(E.solve(l,2).length,1);l.rating=rate(l);}
let state=0x20261007;function shuffle(a){for(let i=a.length-1;i>0;i--){state=(Math.imul(state,1664525)+1013904223)>>>0;const j=Math.floor(state/4294967296*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
const selected=[];
for(const size of [6,7,8,9]){
 const buckets=[2,3,4,5].map(d=>shuffle(pool.filter(l=>l.size===size&&l.rating.difficulty===d)));
 if(size===9){assert.equal(buckets.flat().length,35);selected.push(...buckets.flat());continue;}
 const easy=buckets[0].slice(0,11),medium=buckets[1].slice(0,14),very=buckets[3],hard=buckets[2].slice(0,55-easy.length-medium.length-very.length);
 const batch=[...easy,...medium,...hard,...very];assert.equal(batch.length,55);selected.push(...batch);
}
assert.equal(selected.length,200);
function mixed(a){let streak=1;for(let i=1;i<a.length;i++){streak=a[i].rating.difficulty===a[i-1].rating.difficulty?streak+1:1;if(streak>4)return false;}for(let i=0;i<a.length;i+=20)if(new Set(a.slice(i,i+20).map(l=>l.rating.difficulty)).size<3)return false;return true;}
let attempts=0;do{shuffle(selected);assert(++attempts<100000,'Unable to mix pack');}while(!mixed(selected));
const seen=new Set(L.map(fingerprint));for(const l of selected){const f=fingerprint(l);assert(!seen.has(f));seen.add(f);}
const config=JSON.parse(JSON.stringify(J.config));config.units.push({name:'自由漫游',tag:'混合难度 · 空盘自由推理',cap:5,lessons:[],id:16,start:196,count:200,extraPack:true});
const report=selected.map((l,i)=>({number:197+i,id:l.id,size:l.size,...l.rating}));
const additions=selected.map((l,i)=>{config.levels.push({id:l.id,unit:16,givens:[],difficulty:l.rating.difficulty});return {id:l.id,name:'漫游 '+(197+i),size:l.size,regions:l.regions,expansion:{pack:'more-200-20261007',position:i+1}};});
const all=[...L,...additions],source=fs.readFileSync('journey.js','utf8').replace(/\r\n/g,'\n'),a=source.indexOf('const config=')+13,b=source.indexOf(';\n// The table',a);
assert(b>a);const journey=source.slice(0,a)+JSON.stringify(config,null,2)+source.slice(b);
const data='/* Generated levels; each region is connected and each puzzle has one solution. */\n(function(root){\n  const levels = '+JSON.stringify(all,null,2)+';\n  if(typeof module!=="undefined" && module.exports) module.exports=levels; else root.CAT_LEVELS=levels;\n})(typeof globalThis!=="undefined"?globalThis:this);\n';
const catalog=[...old,...additions].map(l=>({id:l.id,size:l.size,regions:l.regions,givens:config.levels.find(c=>c.id===l.id).givens}));
fs.writeFileSync('levels.js',data);fs.writeFileSync('journey.js',journey);fs.writeFileSync('api/catalog.json',JSON.stringify(catalog,null,2)+'\n');
fs.writeFileSync('level-pack-200-report.json',JSON.stringify({pack:'more-200-20261007',seed:'cat-200-20261007',shuffleSeed:'0x20261007',levels:report},null,2)+'\n');
console.log('Appended 200; ratings:',JSON.stringify(report.reduce((a,l)=>(a[l.difficulty]=(a[l.difficulty]||0)+1,a),{})));
