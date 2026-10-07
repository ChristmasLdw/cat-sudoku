'use strict';
function fail(message){const e=new Error(message);e.status=400;throw e;}
function validateAttempt(body,catalog){
 const l=catalog.find(l=>l.id===body?.levelId);if(!l)fail('关卡不存在，请刷新游戏。');
 if(!/^[a-zA-Z0-9-]{16,80}$/.test(body.id||''))fail('成绩编号无效。');
 const cats=body.cats,n=l.size;
 if(!Array.isArray(cats)||cats.length!==n||cats.some(c=>!Number.isInteger(c)||c<0||c>=n)||new Set(cats).size!==n)fail('猫咪位置不符合规则。');
 if(cats.some((c,r)=>r&&Math.abs(c-cats[r-1])<=1)||new Set(cats.map((c,r)=>l.regions[r][c])).size!==n)fail('猫咪位置不符合规则。');
 if(l.givens.some(i=>cats[Math.floor(i/n)]!==i%n))fail('固定线索不能移动。');
 for(const key of ['elapsedMs','hints','conflicts','guides'])if(!Number.isInteger(body[key])||body[key]<0||body[key]>(key==='elapsedMs'?86400000:10000))fail('成绩数据无效。');
 return {id:body.id,levelId:l.id,elapsedMs:body.elapsedMs,hints:body.hints,conflicts:body.conflicts,guides:body.guides};
}
// UTC timestamps for natural calendar periods in Asia/Shanghai (UTC+8).
function period(range,now=new Date()){
 const local=new Date(now.getTime()+8*3600000);let start=new Date(Date.UTC(local.getUTCFullYear(),local.getUTCMonth(),local.getUTCDate())-8*3600000);
 if(range==='week')start=new Date(start.getTime()-((local.getUTCDay()+6)%7)*86400000);
 return {start:start.toISOString(),end:new Date(start.getTime()+(range==='week'?7:1)*86400000).toISOString(),timezone:'Asia/Shanghai'};
}
module.exports={validateAttempt,period};
