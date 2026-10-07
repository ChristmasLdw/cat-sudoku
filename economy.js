/* Shared reward rules and deterministic, validated item effects. No real-money purchases. */
(function(root){
'use strict';
const ITEMS={bell:{name:'寻猫铃',price:40,description:'确认一只猫的位置，并在棋盘上高亮。'},brush:{name:'排除刷',price:15,description:'按已有的猫，一次标好同行、同列、同色和相邻格。'}};
function fail(message){throw Object.assign(new Error(message),{status:400});}
function fresh(){return {coins:60,bell:2,brush:2,newClears:0,revision:0};}
function day(now=Date.now()){return new Date(Number(now)+8*3600000).toISOString().slice(0,10);}
function reward(first,run,newClears,replays){const bonus=first&&!run.hints&&!run.guides&&!run.conflicts?10:0;return {coins:first?30+bonus:replays<3?5:0,bell:first&&(newClears+1)%5===0?1:0,bonus,first,replayLimit:!first&&replays>=3};}
function effect(level,board,item){
 if(!ITEMS[item])fail('没有这种道具。');
 const n=level.size;if(!Array.isArray(board)||board.length!==n*n||board.some(v=>![0,1,2].includes(v)))fail('棋盘数据无效。');
 if((level.givens||[]).some(i=>board[i]!==2))fail('固定线索不能移动。');
 // Solve the original region map, not the player's guesses. Never endorse a wrong hypothesis.
 const solutions=[],p=[];function search(r,cols,regs){if(solutions.length>=2)return;if(r===n){solutions.push(p.slice());return;}for(let c=0;c<n;c++){const k=level.regions[r][c];if(cols.has(c)||regs.has(k)||(r&&Math.abs(c-p[r-1])<=1))continue;p[r]=c;cols.add(c);regs.add(k);search(r+1,cols,regs);cols.delete(c);regs.delete(k);}}
 search(0,new Set(),new Set());if(solutions.length!==1)fail('这关暂时不能使用道具，请使用免费提示。');
 const answer=solutions[0].map((c,r)=>r*n+c);
 if(board.some((v,i)=>v===2&&!answer.includes(i))||answer.some(i=>board[i]===1))fail('当前有猫或叉标错了，先用免费提示检查；这次不扣道具。');
 const cats=board.flatMap((v,i)=>v===2?[i]:[]);
 if(item==='bell'){const i=answer.find(i=>board[i]!==2);if(i===undefined)fail('猫咪已经找齐，不需要道具。');return {targets:[i],value:2};}
 const targets=board.flatMap((v,i)=>v===0&&cats.some(j=>Math.floor(i/n)===Math.floor(j/n)||i%n===j%n||level.regions[Math.floor(i/n)][i%n]===level.regions[Math.floor(j/n)][j%n]||(Math.abs(Math.floor(i/n)-Math.floor(j/n))<=1&&Math.abs(i%n-j%n)<=1))?[i]:[]);
 if(!targets.length)fail('先确认一只猫，或这些位置已经标好；这次不扣道具。');return {targets,value:1};
}
const api={ITEMS,fresh,day,reward,effect};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CatEconomy=api;
})(typeof globalThis!=='undefined'?globalThis:this);
