'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const E = require('./engine.js');

function normalize(grid) {
  const labels = new Map();
  return grid.flat().map(value => {
    if (!labels.has(value)) labels.set(value, labels.size);
    return labels.get(value);
  }).join(',');
}

// Ignore color names, rotations, and mirror images when checking duplicates.
function fingerprint(level) {
  const variants = [];
  let grid = level.regions.map(row => row.slice());
  for (let turn = 0; turn < 4; turn++) {
    variants.push(normalize(grid), normalize(grid.map(row => row.slice().reverse())));
    grid = grid.map((row, r) => row.map((_, c) => grid[level.size - 1 - c][r]));
  }
  return level.size + ':' + variants.sort()[0];
}

function generateLevels({ size = 7, count = 10, seed = 'garden', existing = [], maxAttempts = 200000, onProgress = () => {} } = {}) {
  if (!Number.isInteger(size) || size < 5 || size > 9) throw Error('生成尺寸必须是 5–9 的整数。');
  if (!Number.isInteger(count) || count < 1 || count > 100) throw Error('每批数量必须是 1–100 的整数。');
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) throw Error('maxAttempts 必须是正整数。');
  let state = crypto.createHash('sha256').update(String(seed)).digest().readUInt32LE(0);
  const random = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
  function shuffle(values) {
    for (let i = values.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [values[i], values[j]] = [values[j], values[i]];
    }
    return values;
  }
  const seen = new Set(existing.map(fingerprint));
  const usedIds = new Set(existing.map(level => level.id));
  const result = [];
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    // First construct a legal permutation: one cat per row/column, no touching.
    const cats = [];
    function place(row, columns) {
      if (row === size) return true;
      for (const col of shuffle(Array.from({ length: size }, (_, i) => i))) {
        if ((columns & (1 << col)) || (row && Math.abs(cats[row - 1] - col) <= 1)) continue;
        cats.push(col);
        if (place(row + 1, columns | (1 << col))) return true;
        cats.pop();
      }
      return false;
    }
    if (!place(0, 0)) throw Error('无法生成合法的猫咪位置。');
    // Each cat seeds a region. Grow through orthogonal neighbors only.
    const grid = Array.from({ length: size }, () => Array(size).fill(-1));
    const edges = [];
    function occupy(r, c, region) {
      grid[r][c] = region;
      for (const [rr, cc] of [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]]) {
        if (rr >= 0 && rr < size && cc >= 0 && cc < size && grid[rr][cc] === -1) edges.push([rr, cc, region]);
      }
    }
    // Mark all seeds before growing, so one region cannot consume another seed.
    cats.forEach((c, r) => { grid[r][c] = r; });
    cats.forEach((c, r) => occupy(r, c, r));
    while (edges.length) {
      const pick = Math.floor(random() * edges.length);
      const edge = edges[pick];
      edges[pick] = edges[edges.length - 1];
      edges.pop();
      const [r, c, region] = edge;
      if (grid[r][c] === -1) occupy(r, c, region);
    }
    const level = { id: 'candidate', name: '新花园', size, regions: grid };
    // Stop the solver at two: finding a second answer is enough to reject.
    if (E.solve(level, 2).length !== 1) continue;
    const key = fingerprint(level);
    if (seen.has(key)) continue;
    const tag = crypto.createHash('sha256').update(key).digest('hex').slice(0, 16);
    level.id = 'garden-' + tag;
    if (usedIds.has(level.id)) continue;
    level.name = '新花园 ' + String(existing.length + result.length + 1).padStart(2, '0');
    seen.add(key);
    usedIds.add(level.id);
    result.push(level);
    onProgress({ generated: result.length, count, attempts: attempt });
    if (result.length === count) return result;
  }
  throw Error('达到尝试上限，只找到 ' + result.length + ' / ' + count + ' 个新关卡；未保存任何关卡。请减小数量、换 seed 或增大 --max-attempts。');
}

function serialize(levels) {
  return '/* Generated levels; each region is connected and each puzzle has one solution. */\n' +
    '(function(root){\n  const levels = ' + JSON.stringify(levels, null, 2) + ';\n' +
    '  if(typeof module!=="undefined" && module.exports) module.exports=levels; else root.CAT_LEVELS=levels;\n' +
    '})(typeof globalThis!=="undefined"?globalThis:this);\n';
}

function main(args) {
  const opts = { size: 7, count: 10, seed: crypto.randomBytes(6).toString('hex'), maxAttempts: 200000 };
  let append = false, output;
  for (let i = 0; i < args.length; i++) {
    const flag = args[i];
    if (flag === '--help') {
      console.log('node generate-levels.cjs --size 7 --count 10 [--seed garden] [--append | --output extra-levels.json] [--max-attempts 200000]\n--append 保留现有关卡并追加，修改前自动备份 levels.js。省略 --append 时只输出 JSON。');
      return;
    }
    if (flag === '--append') { append = true; continue; }
    if (!['--size', '--count', '--seed', '--output', '--max-attempts'].includes(flag)) throw Error('未知参数：' + flag);
    const value = args[++i];
    if (!value || value.startsWith('--')) throw Error(flag + ' 缺少值。');
    if (flag === '--output') output = value;
    else if (flag === '--seed') opts.seed = value;
    else opts[flag === '--max-attempts' ? 'maxAttempts' : flag.slice(2)] = Number(value);
  }
  if (append && output) throw Error('--append 与 --output 不能同时使用。');
  const source = path.join(__dirname, 'levels.js');
  const original = fs.readFileSync(source, 'utf8');
  const existing = require(source);
  existing.forEach(E.validateLevel);
  const outputPath = append ? source : path.resolve(output || 'extra-levels-' + crypto.createHash('sha256').update(opts.seed).digest('hex').slice(0, 8) + '.json');
  if (!append && fs.existsSync(outputPath)) throw Error('输出文件已存在，请换一个 --output 路径：' + outputPath);
  console.log('Seed: ' + opts.seed);
  const generated = generateLevels({ ...opts, existing, onProgress: p => console.log(p.generated + '/' + p.count + ' 已生成（尝试 ' + p.attempts + ' 次）') });
  if (append) {
    // Refuse to overwrite concurrent edits, and keep an exact byte-for-byte backup.
    if (fs.readFileSync(source, 'utf8') !== original) throw Error('生成期间 levels.js 已被修改，停止保存。');
    const suffix = new Date().toISOString().replace(/[:.]/g, '-') + '-' + crypto.randomBytes(3).toString('hex');
    const backup = source + '.' + suffix + '.bak';
    const temp = source + '.' + suffix + '.tmp';
    fs.writeFileSync(backup, original, { flag: 'wx' });
    fs.writeFileSync(temp, serialize([...existing, ...generated]), { flag: 'wx' });
    fs.renameSync(temp, source);
    console.log('已备份：' + backup + '\n已追加 ' + generated.length + ' 关。刷新游戏即可看到；单文件版请再运行 node build-single.cjs。');
  } else {
    fs.writeFileSync(outputPath, JSON.stringify(generated, null, 2) + '\n', { flag: 'wx' });
    console.log('已保存：' + outputPath + '\n这是独立关卡数据；要自动加入游戏，请改用 --append。');
  }
}

module.exports = { generateLevels, fingerprint };
if (require.main === module) {
  try { main(process.argv.slice(2)); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
