/* Reversible hypothesis checkpoints and local deduction checks. */
(function(root){
  'use strict';
  const E=typeof module!=='undefined'&&module.exports?require('./engine.js'):root.CatPuzzle;
  function copyNotes(notes){return notes.map(note=>({...note}));}
  function create(board,notes=[]){return{baseBoard:board.slice(),baseNotes:copyNotes(notes),root:null};}
  function clone(trial){return trial?{baseBoard:trial.baseBoard.slice(),baseNotes:copyNotes(trial.baseNotes),root:trial.root}:null;}
  function choose(trial,board,index){
    if(!trial||trial.root!==null)throw Error('请先开始一个新的假设');
    if(!Number.isInteger(index)||index<0||index>=board.length||board[index]===E.CAT)throw Error('请选择还没有猫的格子');
    const next=clone(trial);next.root=index;return next;
  }
  function restore(trial,exclude=false){
    if(!trial)throw Error('没有正在进行的假设');
    const board=trial.baseBoard.slice(),notes=copyNotes(trial.baseNotes);
    if(trial.root!==null){
      const old=notes.findIndex(note=>note.index===trial.root);if(old!==-1)notes.splice(old,1);
      notes.push({index:trial.root,excluded:exclude});
      if(exclude)board[trial.root]=E.MARK;
    }
    return{board,notes};
  }
  // Respect the player's X notes. No solution lookup: only immediate rule conflicts
  // and rows/columns/regions with no remaining legal place for a cat.
  function contradictions(level,board){
    const result=E.inspect(level,board);if(result.issues.length)return result.issues;
    const n=level.size,cats=[],usedRows=new Set(),usedCols=new Set(),usedRegions=new Set();
    board.forEach((value,i)=>{if(value!==E.CAT)return;const r=Math.floor(i/n),c=i%n;cats.push([r,c]);usedRows.add(r);usedCols.add(c);usedRegions.add(level.regions[r][c]);});
    const rows=new Set(),cols=new Set(),regions=new Set();
    board.forEach((value,i)=>{
      if(value!==E.EMPTY)return;const r=Math.floor(i/n),c=i%n,region=level.regions[r][c];
      if(usedRows.has(r)||usedCols.has(c)||usedRegions.has(region)||cats.some(([rr,cc])=>Math.abs(rr-r)<=1&&Math.abs(cc-c)<=1))return;
      rows.add(r);cols.add(c);regions.add(region);
    });
    const issues=[];
    for(let i=0;i<n;i++){
      if(!usedRows.has(i)&&!rows.has(i))issues.push('第 '+(i+1)+' 行已无处放猫');
      if(!usedCols.has(i)&&!cols.has(i))issues.push('第 '+(i+1)+' 列已无处放猫');
      if(!usedRegions.has(i)&&!regions.has(i))issues.push('区域 '+String.fromCharCode(65+i)+' 已无处放猫');
    }
    return issues;
  }
  const api={create,clone,choose,restore,contradictions,copyNotes};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CatTrial=api;
})(typeof globalThis!=='undefined'?globalThis:this);
