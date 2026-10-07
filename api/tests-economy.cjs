'use strict';
const assert=require('node:assert/strict'),{Pool}=require('pg'),crypto=require('node:crypto');
const schema='cat_shop_'+crypto.randomBytes(6).toString('hex'),admin=new Pool({connectionString:process.env.DATABASE_URL});
(async()=>{
 await admin.query('create schema '+schema);process.env.PGOPTIONS='-c search_path='+schema;
 const S=require('./server.js'),Q=require('./economy.cjs'),rules=require('./economy-rules.js'),catalog=require('./catalog.json');
 try{
  await S.initSchema();const id=(await S.pool.query("insert into players(lantecho_sub) values('shop-test') returning id")).rows[0].id;
  const solve=l=>{let board=Array(l.size*l.size).fill(0);for(const i of l.givens)board[i]=2;while(board.filter(v=>v===2).length<l.size){for(const i of rules.effect(l,board,'bell').targets)board[i]=2;}return board;};
  const run=(l,extra={})=>({id:crypto.randomUUID(),levelId:l.id,cats:Array.from({length:l.size},(_,r)=>solve(l).slice(r*l.size,(r+1)*l.size).indexOf(2)),elapsedMs:60000,hints:0,guides:0,conflicts:0,...extra});
  assert.equal((await Q.balance(S.pool,id)).coins,60);const first=run(catalog[0]);
  const [a,b]=await Promise.all([S.recordAttempt(id,first),S.recordAttempt(id,first)]);assert.equal(a.reward.coins,40);assert.equal(b.reward.coins,40);assert.equal((await Q.balance(S.pool,id)).coins,100);
  await Promise.all(Array.from({length:6},()=>S.recordAttempt(id,run(catalog[0]))));assert.equal((await Q.balance(S.pool,id)).coins,115,'only 3 replay rewards');
  const buy={id:crypto.randomUUID(),item:'bell'};await Promise.all([Q.operate(S.pool,id,'buy',buy,catalog),Q.operate(S.pool,id,'buy',buy,catalog)]);assert.equal((await Q.balance(S.pool,id)).coins,75);assert.equal((await Q.balance(S.pool,id)).bell,3);
  await assert.rejects(Q.operate(S.pool,id,'buy',{...buy,item:'brush'},catalog));
  const purchases=await Promise.allSettled(Array.from({length:10},()=>Q.operate(S.pool,id,'buy',{id:crypto.randomUUID(),item:'bell'},catalog)));assert.equal(purchases.filter(x=>x.status==='fulfilled').length,1);assert.equal((await Q.balance(S.pool,id)).coins,35);
  const l=catalog[1],attempt=run(l),board=Array(l.size*l.size).fill(0);for(const i of l.givens)board[i]=2;
  const use={id:crypto.randomUUID(),item:'bell',attemptId:attempt.id,levelId:l.id,board};const before=await Q.balance(S.pool,id);
  const [u,v]=await Promise.all([Q.operate(S.pool,id,'use',use,catalog),Q.operate(S.pool,id,'use',use,catalog)]);assert.deepEqual(u.effect,v.effect);assert.equal((await Q.balance(S.pool,id)).bell,before.bell-1);
  const bad={...use,id:crypto.randomUUID(),board:board.slice()};bad.board[attempt.cats[0]]=1;
  await assert.rejects(Q.operate(S.pool,id,'use',bad,catalog));assert.equal((await Q.balance(S.pool,id)).bell,before.bell-1);
  const assisted=await S.recordAttempt(id,attempt);assert.equal(assisted.reward.coins,30);assert.equal((await S.loadResults(id)).find(x=>x.id===attempt.id).hints,1,'server remembers item use even if client sends zero hints');
  await assert.rejects(Q.operate(S.pool,id,'use',{...use,id:crypto.randomUUID()},catalog),'ended game cannot use item');
  for(const l of catalog.slice(2,5))await S.recordAttempt(id,run(l));assert.equal((await Q.balance(S.pool,id)).newClears,5);assert.equal((await Q.balance(S.pool,id)).bell,before.bell);
  const history=await S.loadResults(id),wallet=await Q.balance(S.pool,id);await S.initSchema();await S.initSchema();assert.deepEqual(await Q.balance(S.pool,id),wallet);assert.deepEqual(await S.loadResults(id),history);
  // A retry on a later Beijing day must not move or duplicate the old replay grant.
  await S.pool.query("update economy_ledger set day=day-1 where player_id=$1 and kind='reward'",[id]);await S.recordAttempt(id,first);assert.equal((await Q.balance(S.pool,id)).coins,wallet.coins);await S.recordAttempt(id,run(catalog[0]));assert.equal((await Q.balance(S.pool,id)).coins,wallet.coins+5);
  const last=catalog.at(-1),lastClear=await S.recordAttempt(id,run(last));assert.equal(lastClear.firstClear,true);assert.equal(lastClear.reward.coins,40);assert((await S.loadProgress(id)).completed.includes(last.id),'New final level records and rewards correctly');
  S.server.listen(0,'127.0.0.1');await new Promise(r=>S.server.once('listening',r));const response=await fetch('http://127.0.0.1:'+S.server.address().port+'/economy');assert.equal(response.status,401);S.server.close();
  console.log('PASS isolated PostgreSQL economy: concurrent reward/buy/use idempotency, no overspend, invalid board no charge, assisted classification, five-clear gifts, migration preserves history, day reset, authentication');
 }finally{await S.pool.end();await admin.query('drop schema '+schema+' cascade');await admin.end();}
})().catch(e=>{console.error(e);process.exitCode=1;});
