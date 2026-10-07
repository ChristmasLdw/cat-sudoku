/* Completed runs only. No unfinished board is persisted. */
(function(root){'use strict';
function valid(run){return run&&typeof run.id==='string'&&typeof run.levelId==='string'&&Number.isInteger(run.elapsedMs)&&run.elapsedMs>=0&&run.elapsedMs<=86400000&&['hints','conflicts','guides'].every(k=>Number.isInteger(run[k])&&run[k]>=0);}
function independent(run){return run.hints===0&&run.guides===0;}
function merge(a=[],b=[]){const best=new Map();for(const r of [...a,...b])if(valid(r)){const key=JSON.stringify([r.owner||'guest',r.levelId,independent(r)]),old=best.get(key);if(!old||r.elapsedMs<old.elapsedMs||(r.elapsedMs===old.elapsedMs&&r.conflicts<old.conflicts))best.set(key,r);}return [...best.values()];}
function summarize(run,previous=[]){
 const peers=previous.filter(r=>valid(r)&&r.id!==run.id&&r.levelId===run.levelId&&independent(r)===independent(run));
 const best=peers.length?Math.min(...peers.map(r=>r.elapsedMs)):null;
 return {independent:independent(run),bestMs:Math.min(run.elapsedMs,best??Infinity),improvedMs:best===null?null:Math.max(0,best-run.elapsedMs),first:best===null,title:independent(run)?(run.conflicts===0?'独立完成 · 零冲突':'独立完成'):'借助线索完成'};
}
// Entering a visible board starts the clock, even before the first board action.
// `started` is interaction/history state and must never gate elapsed time.
function activeTime(g,visible,modal,view){return Boolean(g&&!g.paused&&!g.won&&visible&&!modal&&view==='game');}
const api={valid,independent,merge,summarize,activeTime};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CatResults=api;
})(typeof globalThis!=='undefined'?globalThis:this);
