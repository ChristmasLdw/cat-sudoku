'use strict';
// Run only with an isolated search_path schema; never touches production tables.
const assert=require('node:assert/strict'),{Pool}=require('pg'),crypto=require('node:crypto');
const schema='cat_review_'+crypto.randomBytes(6).toString('hex');
const admin=new Pool({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:5000,query_timeout:10000});
(async()=>{
 await admin.query('create schema '+schema);console.log('Created isolated test schema');
 process.env.PGOPTIONS='-c search_path='+schema;
 const S=require('./server.js'),catalog=require('./catalog.json');
 try{
  await S.initSchema();console.log('Initialized isolated tables');
  const {rows:players}=await S.pool.query("insert into players(lantecho_sub,display_name) values ('test-a','测试甲'),('test-b','测试乙'),('test-c','测试丙') returning id");
  const [a,b,c]=players.map(p=>p.id),[l,l2]=catalog;
  function solve(l){const n=l.size,p=[],used=new Set(),regions=new Set();function go(r){if(r===n)return [...p];for(let col=0;col<n;col++){const k=l.regions[r][col];if(used.has(col)||regions.has(k)||(r&&Math.abs(col-p[r-1])<=1))continue;p.push(col);used.add(col);regions.add(k);const out=go(r+1);if(out)return out;p.pop();used.delete(col);regions.delete(k);}return null;}return go(0);}
  const run=(level,ms=50000,extra={})=>({id:crypto.randomUUID(),levelId:level.id,cats:solve(level),elapsedMs:ms,hints:0,conflicts:0,guides:0,...extra});
  const first=run(l);assert.equal((await S.recordAttempt(a,first)).firstClear,true);assert.equal((await S.recordAttempt(a,first)).firstClear,false);
  await S.recordAttempt(a,run(l,40000));await S.recordAttempt(b,run(l,30000));await S.recordAttempt(c,run(l,30000));
  await S.recordAttempt(a,run(l,10000,{hints:1}));
  let rank=await S.levelLeaderboard(l.id,'independent',a);assert.equal(rank.total,3);assert.deepEqual(rank.entries.map(e=>e.rank),[1,1,3]);assert.equal(rank.me.elapsedMs,40000);assert.equal(rank.gapMs,10000);
  rank=await S.levelLeaderboard(l.id,'assisted',a);assert.equal(rank.total,1);assert.equal(rank.me.elapsedMs,10000);
  await Promise.all([S.recordAttempt(a,run(l2)),S.saveProgress(a,{learned:[1],current:l.id,completed:catalog.map(x=>x.id),skills:{seen:[2],practiced:[3]}}),S.saveProgress(a,{learned:[2],current:l.id,skills:{seen:[4],practiced:[5]}})]);
  const progress=await S.loadProgress(a);assert.equal(progress.completed.length,2);assert.deepEqual(progress.learned.sort(),[1,2]);assert.deepEqual(progress.skills.seen.sort(),[2,4]);assert.deepEqual(progress.skills.practiced.sort(),[3,5]);
  assert.equal((await S.leaderboard('day',a)).me.completed,2);
  const bounds=require('./scoring.cjs').period('day');
  await S.pool.query('update completions set completed_at=$1::timestamptz-interval \'1 millisecond\' where player_id=$2 and level_id=$3',[bounds.start,a,l.id]);
  assert.equal((await S.leaderboard('day',a)).me.completed,1);assert.equal((await S.leaderboard('all',a)).me.completed,2);
  await S.pool.query('update completions set completed_at=null where player_id=$1',[a]);await S.initSchema();assert.equal((await S.leaderboard('day',a)).me,null);assert.equal((await S.leaderboard('all',a)).me.completed,2);
  await assert.rejects(S.recordAttempt(a,{...first,id:crypto.randomUUID(),cats:Array(l.size).fill(0)}));
  console.log('PASS isolated PostgreSQL: migration, idempotent completion, concurrent progress union, calendar filtering, historical totals, per-level ties/bests/modes and invalid proof');
 }finally{await S.pool.end();await admin.query('drop schema '+schema+' cascade');await admin.end();console.log('Removed isolated test schema');}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
