'use strict';
const H=require('./hints.js'),E=require('./engine.js');
// Rate actual deductions from an empty board, not grid size or an arbitrary random label.
function rate(level){
 const board=Array(level.size**2).fill(0),techniques={};let difficulty=2,steps=0;
 for(;steps<level.size**2*2;steps++){
  const hint=H.find(level,board);techniques[hint.kind]=(techniques[hint.kind]||0)+1;
  if(hint.kind==='complete')return {difficulty,steps,techniques};
  if(hint.kind==='trial')return {difficulty:5,steps,techniques};
  if(hint.value===undefined||!hint.targets.length)throw Error('Unexpected deduction: '+hint.kind);
  const grade=hint.kind==='lookahead-region'||hint.kind.includes('pair')?4:hint.kind==='exclude'||hint.kind.endsWith('-single')?2:3;
  difficulty=Math.max(difficulty,grade);let changed=false;
  for(const i of hint.targets)if(board[i]!==hint.value){board[i]=hint.value;changed=true;}
  if(!changed||E.inspect(level,board).issues.length)throw Error('Invalid deduction while rating '+level.id);
 }
 throw Error('Rating did not converge: '+level.id);
}
module.exports={rate};
