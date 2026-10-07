'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('app.js','utf8');
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return {promise,resolve,reject};};
(async()=>{
 const requests=[],saved=[],timers=[];
 const context={account:{signedIn:true,player:{id:1}},apiSaving:false,apiSavedRevision:0,apiRevision:1,apiRetry:1000,apiCache:{progress:{learned:[1]}},apiNote:'',apiSaveTimer:0,store:{set:(...a)=>saved.push(a)},apiFetch:(_p,o)=>{const d=deferred();requests.push({d,body:JSON.parse(o.body)});return d.promise;},document:{body:{dataset:{view:'home'}}},clearTimeout(){},setTimeout(fn){timers.push(fn);return 1;}};
 vm.createContext(context);vm.runInContext(source.slice(source.indexOf('async function pushAccountState(){'),source.indexOf("window.addEventListener('online'")),context);
 const first=context.pushAccountState();context.apiCache={progress:{learned:[1,2]}};context.apiRevision=2;await context.pushAccountState();assert.equal(requests.length,1);requests[0].d.resolve({ok:true});await first;assert.equal(context.apiSavedRevision,1);assert.equal(timers.length,1);
 const second=timers.pop()();assert.deepEqual(requests[1].body.progress.learned,[1,2]);requests[1].d.resolve({ok:true});await second;assert.equal(context.apiSavedRevision,2);assert.equal(saved.at(-1)[1],null);
 context.apiRevision=3;const fail=context.pushAccountState();requests[2].d.reject(new Error('offline'));await fail;assert.equal(context.apiSavedRevision,2);assert(timers.length);assert.match(context.apiNote,/自动重试/);
 const ranks=[],tabs={querySelectorAll:()=>[]},rank={rankSequence:0,rankRange:'all',rankRows:null,rankBusy:false,$:()=>tabs,renderRank(){},apiFetch:()=>{const d=deferred();ranks.push(d);return d.promise;}};
 vm.createContext(rank);vm.runInContext(source.slice(source.indexOf('async function loadRank(range){'),source.indexOf('function renderRank(){')),rank);
 const all=rank.loadRank('all'),day=rank.loadRank('day');ranks[1].resolve({range:'day',entries:[]});await day;ranks[0].resolve({range:'all',entries:[]});await all;assert.equal(rank.rankRows.range,'day');assert.equal(rank.rankBusy,false);
 console.log('PASS latest leaderboard request wins, writes during in-flight save are retained, failed writes retry, outbox clears only for acknowledged revision');
})().catch(e=>{console.error(e);process.exitCode=1;});
