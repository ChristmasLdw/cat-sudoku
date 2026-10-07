'use strict';
const Q=require('./economy-rules.js');
const schema=`
 create table if not exists wallets (
 player_id bigint primary key references players(id) on delete cascade,
 coins integer not null default 60 check(coins>=0),bell integer not null default 2 check(bell>=0),brush integer not null default 2 check(brush>=0),
 new_clears integer not null default 0,revision integer not null default 0);
 create table if not exists economy_ledger (
 player_id bigint not null references players(id) on delete cascade,id text not null,kind text not null,
 request jsonb not null,receipt jsonb not null,attempt_id text,day date not null default (now() at time zone 'Asia/Shanghai')::date,
 created_at timestamptz not null default now(),primary key(player_id,id));
 create index if not exists economy_attempt_idx on economy_ledger(player_id,attempt_id,kind);
`;
function wallet(r){return {coins:r.coins,bell:r.bell,brush:r.brush,newClears:r.new_clears,revision:r.revision};}
async function lock(db,id){await db.query('insert into wallets(player_id) values($1) on conflict do nothing',[id]);return wallet((await db.query('select * from wallets where player_id=$1 for update',[id])).rows[0]);}
async function save(db,id,w){await db.query('update wallets set coins=$2,bell=$3,brush=$4,new_clears=$5,revision=revision+1 where player_id=$1',[id,w.coins,w.bell,w.brush,w.newClears]);w.revision++;return w;}
async function receipt(db,id,key){return (await db.query('select request,receipt from economy_ledger where player_id=$1 and id=$2',[id,key])).rows[0];}
async function add(db,id,key,kind,request,result,attemptId=null){await db.query('insert into economy_ledger(player_id,id,kind,request,receipt,attempt_id) values($1,$2,$3,$4,$5,$6)',[id,key,kind,JSON.stringify(request),JSON.stringify(result),attemptId]);}
async function balance(pool,id){return (await pool.query('insert into wallets(player_id) values($1) on conflict(player_id) do update set player_id=excluded.player_id returning *',[id])).rows.map(wallet)[0];}
async function award(db,id,run,first,inserted,w){
 const old=await receipt(db,id,'reward:'+run.id);if(old)return {reward:old.receipt,wallet:w};
 if(!inserted)return {reward:{coins:0,bell:0,legacy:true},wallet:w};
 const count=Number((await db.query("select count(*) from economy_ledger where player_id=$1 and kind='reward' and day=(now() at time zone 'Asia/Shanghai')::date and receipt->>'first'='false' and (receipt->>'coins')::int>0",[id])).rows[0].count);
 const grant=Q.reward(first,run,w.newClears,count);w.coins+=grant.coins;w.bell+=grant.bell;if(first)w.newClears++;
 await save(db,id,w);await add(db,id,'reward:'+run.id,'reward',{},grant,run.id);return {reward:grant,wallet:w};
}
async function operate(pool,id,kind,body,catalog){
 if(!['buy','use'].includes(kind)||!Q.ITEMS[body?.item]||!/^[a-zA-Z0-9-]{16,80}$/.test(body?.id||''))throw Object.assign(new Error('道具请求无效。'),{status:400});
 const request={kind,item:body.item};if(kind==='use'){request.attemptId=body.attemptId;request.levelId=body.levelId;request.board=body.board;if(!/^[a-zA-Z0-9-]{16,80}$/.test(body.attemptId||''))throw Object.assign(new Error('本局编号无效。'),{status:400});}
 const db=await pool.connect();try{
  await db.query('begin');const w=await lock(db,id),old=await receipt(db,id,body.id);
  if(old){if(JSON.stringify(old.request)!==JSON.stringify(JSON.parse(JSON.stringify(request)))){
    // jsonb object keys are reordered; compare normalized values instead.
    const keys=Object.keys(request);if(keys.length!==Object.keys(old.request).length||keys.some(k=>JSON.stringify(old.request[k])!==JSON.stringify(request[k])))throw Object.assign(new Error('请重试原来的操作。'),{status:409});
   }await db.query('commit');return {...old.receipt,wallet:w};}
  let effect=null;
  if(kind==='buy'){if(w.coins<Q.ITEMS[body.item].price)throw Object.assign(new Error('猫爪币不够，通关后再来吧。'),{status:400});w.coins-=Q.ITEMS[body.item].price;w[body.item]++;}
  else{
   if((await db.query('select 1 from attempts where player_id=$1 and id=$2',[id,body.attemptId])).rowCount)throw Object.assign(new Error('这一局已经结束，请开始新一局。'),{status:400});
   const l=catalog.find(l=>l.id===body.levelId);if(!l)throw Object.assign(new Error('关卡不存在。'),{status:400});
   effect=Q.effect(l,body.board,body.item);if(w[body.item]<1)throw Object.assign(new Error('道具用完了，可以去商店兑换。'),{status:400});w[body.item]--;
  }
  await save(db,id,w);const result={ok:true,item:body.item,effect};await add(db,id,body.id,kind,request,result,body.attemptId);await db.query('commit');return {...result,wallet:w};
 }catch(e){await db.query('rollback');throw e;}finally{db.release();}
}
module.exports={schema,lock,award,balance,operate};
