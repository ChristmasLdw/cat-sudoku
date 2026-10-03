/* Cat Sudoku — original puzzle engine. No dependencies. */
(function (root) {
  'use strict';
  const EMPTY = 0, MARK = 1, CAT = 2;
  function validateLevel(level) {
    const n = level.size;
    if (!Number.isInteger(n) || n < 4 || n > 9) throw new Error('size 必须是 4–9 的整数');
    if (!level.id || typeof level.name !== 'string') throw new Error('关卡需要 id 和 name');
    if (!Array.isArray(level.regions) || level.regions.length !== n || level.regions.some(row => !Array.isArray(row) || row.length !== n || row.some(v => !Number.isInteger(v) || v < 0 || v >= n))) throw new Error('regions 必须是 size × size 的区域编号矩阵');
    for (let region = 0; region < n; region++) {
      const cells = [];
      level.regions.forEach((row,r) => row.forEach((v,c) => { if (v === region) cells.push(r*n+c); }));
      if (!cells.length) throw new Error('每个区域编号都必须存在');
      const visited = new Set([cells[0]]), queue = [cells[0]];
      while (queue.length) {
        const i = queue.pop(), r = Math.floor(i/n), c = i%n;
        for (const [rr,cc] of [[r-1,c],[r+1,c],[r,c-1],[r,c+1]]) {
          const j = rr*n+cc;
          if (rr>=0 && rr<n && cc>=0 && cc<n && level.regions[rr][cc]===region && !visited.has(j)) { visited.add(j); queue.push(j); }
        }
      }
      if (visited.size !== cells.length) throw new Error('同一区域必须上下左右连通');
    }
    return true;
  }
  function inspect(level, board) {
    const n = level.size;
    if (!Array.isArray(board) || board.length !== n*n || board.some(v => ![EMPTY,MARK,CAT].includes(v))) throw new Error('棋盘状态无效');
    const rows = Array.from({length:n},()=>[]), columns = Array.from({length:n},()=>[]), regions = Array.from({length:n},()=>[]), cats = [], bad = new Set(), issues = [];
    board.forEach((v,i) => {
      if (v!==CAT) return;
      const r = Math.floor(i/n), c = i%n;
      cats.push(i); rows[r].push(i); columns[c].push(i); regions[level.regions[r][c]].push(i);
    });
    for (const [groups,label] of [[rows,'行'],[columns,'列'],[regions,'区域']]) groups.forEach((cells,i)=>{
      if (cells.length>1) { cells.forEach(v=>bad.add(v)); issues.push((label==='区域' ? '区域 '+String.fromCharCode(65+i) : '第 '+(i+1)+' '+label)+'有多只猫'); }
    });
    let touching = false;
    for (let a=0;a<cats.length;a++) for (let b=a+1;b<cats.length;b++) {
      const i=cats[a],j=cats[b];
      if (Math.abs(Math.floor(i/n)-Math.floor(j/n))<=1 && Math.abs(i%n-j%n)<=1) {bad.add(i);bad.add(j);touching=true;}
    }
    if (touching) issues.push('猫咪不能相邻，包括斜角');
    const emptyGroups=groups=>groups.flatMap((cells,i)=>cells.length===0?[i]:[]);
    const missing={rows:emptyGroups(rows),columns:emptyGroups(columns),regions:emptyGroups(regions)};
    return {cats:cats.length, rows:rows.filter(g=>g.length===1).length, columns:columns.filter(g=>g.length===1).length, regions:regions.filter(g=>g.length===1).length, missing, conflicts:[...bad], issues, won:cats.length===n && bad.size===0};
  }
  // Enumerate solutions by row. X marks are notes, so solve() only uses region data.
  function solve(level, limit=2) {
    validateLevel(level);
    const n=level.size, solutions=[], placement=[];
    function search(r,cols,regs) {
      if (solutions.length>=limit) return;
      if (r===n) {solutions.push([...placement]);return;}
      for(let c=0;c<n;c++) {
        const region=level.regions[r][c];
        if ((cols&(1<<c)) || (regs&(1<<region)) || (r>0 && Math.abs(placement[r-1]-c)<=1)) continue;
        placement.push(c); search(r+1,cols|(1<<c),regs|(1<<region));placement.pop();
      }
    }
    search(0,0,0);return solutions;
  }
  function setCell(board,index,value) {
    if (!Number.isInteger(index) || index<0 || index>=board.length || ![EMPTY,MARK,CAT].includes(value)) throw new Error('格子或标记无效');
    const next=board.slice();next[index]=value;return next;
  }
  const api={EMPTY,MARK,CAT,validateLevel,inspect,solve,setCell};
  if(typeof module!=='undefined' && module.exports) module.exports=api;
  else root.CatPuzzle=api;
})(typeof globalThis!=='undefined'?globalThis:this);
