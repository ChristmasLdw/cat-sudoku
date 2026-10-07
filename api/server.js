'use strict';

// 猫猫数独 · 账号与排行榜服务
// 身份来自澜图回声（Lantecho）的 OAuth 2.1 / OIDC，本服务只保管 client_secret、换取令牌、
// 建立自己的会话，并把进度与成绩存在自己的数据库里。玩家的密码永远不经过这里。

const http = require('node:http');
const crypto = require('node:crypto');
const { Pool } = require('pg');
const {validateAttempt,period}=require('./scoring.cjs');
const catalog=require('./catalog.json');
const catalogIds=new Set(catalog.map(l=>l.id));
const economy=require('./economy.cjs');
const sms = require('./providers/sms');
const wechat = require('./providers/wechat');

const PORT = Number(process.env.PORT || 3020);
const BIND_ADDR = process.env.BIND_ADDR || '127.0.0.1';
const PUBLIC_ORIGIN = (process.env.PUBLIC_ORIGIN || 'https://christmasldw.com').replace(/\/+$/, '');
const BASE_PATH = (process.env.BASE_PATH || '/cat-sudoku').replace(/\/+$/, '');
const ISSUER = (process.env.LANTECHO_ISSUER || 'https://lantecho.christmasldw.com/api/auth').replace(/\/+$/, '');
const CLIENT_ID = process.env.LANTECHO_CLIENT_ID || '';
const CLIENT_SECRET = process.env.LANTECHO_CLIENT_SECRET || '';
const REDIRECT_URI = `${PUBLIC_ORIGIN}${BASE_PATH}/api/auth/callback`;
const GAME_URL = `${PUBLIC_ORIGIN}${BASE_PATH}/`;

const COOKIE_PATH = BASE_PATH;
const SESSION_COOKIE = 'catsudoku_session';
const STATE_COOKIE = 'catsudoku_state';
const SESSION_TTL_DAYS = 180;
const STATE_TTL_SECONDS = 600;

// A sanity ceiling for a number the client computes, NOT the size of the level table. The route order
// lives in the game's journey.js and grows (162 -> 196 puzzles in one release), so pinning this to the
// current count silently clamped `reached` for everyone who had already got further. Keep it far above
// any plausible route so the clamp only ever rejects garbage.
const MAX_REACHED = 10000;
const MAX_BODY_BYTES = 96 * 1024;
const MAX_COMPLETED = 600;
const LEADERBOARD_LIMIT = 50;
const TZ = 'Asia/Shanghai';

// ---- 账号中心
// 内置头像只存 key，前端按 key 画 SVG，所以服务端必须和前端用同一份白名单。
const AVATAR_KEYS = [
  'mint', 'peach', 'sky', 'lilac', 'coral', 'sage',
  'sand', 'clay', 'slate', 'rose', 'teal', 'ink',
];
const NAME_MAX = 16;
const CODE_TTL_MINUTES = 5;
const CODE_MAX_ATTEMPTS = 5;
const CODE_RESEND_SECONDS = 60;
const CODE_DAILY_LIMIT = 8;
const PHONE_RE = /^1[3-9]\d{9}$/;

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 4 });

// ---------------------------------------------------------------- 小工具

const b64url = (input) =>
  Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const randomToken = (bytes = 32) => b64url(crypto.randomBytes(bytes));
const sha256 = (text) => crypto.createHash('sha256').update(text).digest();

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of String(header).split(';')) {
    const eq = part.indexOf('=');
    if (eq < 1) continue;
    out[part.slice(0, eq).trim()] = decodeURIComponent(part.slice(eq + 1).trim());
  }
  return out;
}

function cookieHeader(name, value, { maxAge, path = COOKIE_PATH, httpOnly = true } = {}) {
  const bits = [`${name}=${encodeURIComponent(value)}`, `Path=${path}`, 'Secure', 'SameSite=Lax'];
  if (httpOnly) bits.push('HttpOnly');
  if (typeof maxAge === 'number') bits.push(`Max-Age=${maxAge}`);
  return bits.join('; ');
}

function sendJson(res, status, body, headers = {}) {
  const payload = Buffer.from(JSON.stringify(body));
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': payload.length,
    'Cache-Control': 'no-store',
    ...headers,
  });
  res.end(payload);
}

function sendRedirect(res, location, headers = {}) {
  res.writeHead(302, { Location: location, 'Cache-Control': 'no-store', ...headers });
  res.end();
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(Object.assign(new Error('请求体过大'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function readJson(req) {
  const raw = await readBody(req);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') throw new Error('not an object');
    return parsed;
  } catch {
    throw Object.assign(new Error('请求内容不是合法 JSON'), { status: 400 });
  }
}

// Lantecho 只给了授权码这一种授权方式，且令牌端点只接受带密钥的机密客户端，
// 所以换令牌这一步必须发生在服务端，浏览器拿不到 client_secret。
async function postForm(url, form, headers = {}) {
  const body = new URLSearchParams(form).toString();
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json', ...headers },
    body,
    signal: AbortSignal.timeout(15000),
  });
  const text = await response.text();
  let data = null;
  try { data = JSON.parse(text); } catch { data = { raw: text.slice(0, 500) }; }
  return { ok: response.ok, status: response.status, data };
}

// ---------------------------------------------------------------- 账号中心小工具

// 手机号只回显打码后的样子，接口里永远不出完整号码 —— 账号中心用不到明文。
const maskPhone = (phone) => (phone ? `${phone.slice(0, 3)}****${phone.slice(-4)}` : null);
const maskEmail = (email) => {
  if (!email) return null;
  const at = email.lastIndexOf('@');
  if (at < 1) return null;
  const name = email.slice(0, at);
  const head = name.slice(0, Math.min(2, name.length));
  return `${head}${'*'.repeat(Math.max(1, name.length - head.length))}${email.slice(at)}`;
};

// 会话对外只给一个不可逆的短 id，令牌本身绝不离开服务端。
const sessionId = (token) => `s${crypto.createHash('sha256').update(token).digest('hex').slice(0, 20)}`;

// 把 user-agent 翻成一句人话；翻不出来就给个保守的默认值，不显示原始 UA。
function parseDevice(ua) {
  const raw = String(ua || '');
  if (!raw) return '未知设备';
  const system =
    /iPhone|iPad|iPod/i.test(raw) ? (/iPad/i.test(raw) ? 'iPad' : 'iPhone')
    : /Android/i.test(raw) ? (/HarmonyOS|HUAWEI|HONOR|Xiaomi|Redmi|OPPO|vivo|OnePlus|realme/i.test(raw) ? 'Android 手机' : 'Android')
    : /Macintosh|Mac OS X/i.test(raw) ? 'Mac'
    : /Windows/i.test(raw) ? 'Windows'
    : /Linux/i.test(raw) ? 'Linux'
    : '';
  const browser =
    /MicroMessenger/i.test(raw) ? '微信'
    : /Edg\//i.test(raw) ? 'Edge'
    : /OPR\/|Opera/i.test(raw) ? 'Opera'
    : /Firefox\//i.test(raw) ? 'Firefox'
    : /Chrome\//i.test(raw) ? 'Chrome'
    : /Safari\//i.test(raw) ? 'Safari'
    : '';
  if (system && browser) return `${system} · ${browser}`;
  return system || browser || '未知设备';
}

// Android / Linux 上的 Chrome 系列会在 UA 尾部带机型串（如 "CPH2451 Build/…"），
// 有的话补在括号里，方便用户认出是哪台手机。
function deviceDetail(ua) {
  const raw = String(ua || '');
  const match = raw.match(/;\s*([A-Za-z0-9][A-Za-z0-9 _-]{2,24})\s+Build\//);
  return match ? match[1].trim() : '';
}

// ---------------------------------------------------------------- 数据库

async function initSchema() {
  await pool.query(`
    create table if not exists players (
      id            bigserial primary key,
      lantecho_sub  text        not null unique,
      email         text,
      display_name  text        not null default '无名猫',
      avatar_url    text,
      created_at    timestamptz not null default now(),
      last_seen_at  timestamptz not null default now()
    );
    create table if not exists progress (
      player_id       bigint primary key references players(id) on delete cascade,
      completed       jsonb       not null default '[]'::jsonb,
      learned         jsonb       not null default '[]'::jsonb,
      current_level   text,
      reached         integer     not null default 0,
      prefs           jsonb       not null default '{}'::jsonb,
      updated_at      timestamptz not null default now()
    );
    alter table progress add column if not exists prefs jsonb not null default '{}'::jsonb;
    alter table progress add column if not exists skills jsonb not null default '{"seen":[],"practiced":[]}'::jsonb;
    create table if not exists scoring_meta (key text primary key, created_at timestamptz not null default now());
    insert into scoring_meta(key) values ('first-clear-v2') on conflict do nothing;
    create table if not exists completions (
      player_id bigint not null references players(id) on delete cascade,
      level_id text not null, completed_at timestamptz,
      primary key(player_id,level_id)
    );
    create index if not exists completions_time_idx on completions(completed_at);
    create table if not exists attempts (
      player_id bigint not null references players(id) on delete cascade,
      id text not null, level_id text not null, elapsed_ms integer not null,
      hints integer not null, conflicts integer not null, guides integer not null,
      finished_at timestamptz not null default now(), primary key(player_id,id)
    );
    -- Historical totals are retained, but no invented timestamps are assigned to them.
    insert into completions(player_id,level_id)
      select p.player_id, x.id from progress p cross join lateral jsonb_array_elements_text(p.completed) x(id)
      on conflict do nothing;
    create table if not exists snapshots (
      player_id        bigint  not null references players(id) on delete cascade,
      day              date    not null,
      reached          integer not null default 0,
      completed_count  integer not null default 0,
      updated_at       timestamptz not null default now(),
      primary key (player_id, day)
    );
    create index if not exists snapshots_day_reached_idx on snapshots (day, reached desc);
    -- Recover measurable legacy daily increases without inventing per-level timestamps.
    create table if not exists legacy_period_credits (
      player_id bigint not null references players(id) on delete cascade,
      day date not null, completed_count integer not null check(completed_count>0),
      previous_count integer not null, snapshot_count integer not null,
      recorded_at timestamptz not null, primary key(player_id,day)
    );
    with prior as (
      select s.*,max(completed_count) over(partition by player_id order by day
        rows between unbounded preceding and 1 preceding) as previous_count
      from snapshots s where s.updated_at < (select created_at from scoring_meta where key='first-clear-v2')
    )
    insert into legacy_period_credits(player_id,day,completed_count,previous_count,snapshot_count,recorded_at)
      select player_id,day,completed_count-previous_count,previous_count,completed_count,updated_at
      from prior where previous_count is not null and completed_count>previous_count
      on conflict do nothing;
    ${economy.schema}
    create table if not exists sessions (
      token       text        primary key,
      player_id   bigint      not null references players(id) on delete cascade,
      created_at  timestamptz not null default now(),
      expires_at  timestamptz not null,
      user_agent  text
    );
    create index if not exists sessions_player_idx on sessions (player_id);
    create index if not exists sessions_expiry_idx on sessions (expires_at);

    alter table players add column if not exists avatar_key        text;
    alter table players add column if not exists phone             text;
    alter table players add column if not exists phone_verified_at timestamptz;
    alter table players add column if not exists wechat_unionid    text;
    alter table players add column if not exists wechat_openid     text;
    alter table players add column if not exists wechat_name       text;
    alter table players add column if not exists wechat_avatar     text;
    alter table players add column if not exists wechat_bound_at   timestamptz;
    create unique index if not exists players_phone_uniq  on players (phone)          where phone is not null;
    create unique index if not exists players_wechat_uniq on players (wechat_unionid) where wechat_unionid is not null;

    create table if not exists phone_codes (
      id          bigserial   primary key,
      phone       text        not null,
      player_id   bigint      references players(id) on delete cascade,
      code_hash   text        not null,
      purpose     text        not null default 'bind',
      attempts    integer     not null default 0,
      consumed_at timestamptz,
      expires_at  timestamptz not null,
      created_at  timestamptz not null default now()
    );
    create index if not exists phone_codes_lookup_idx on phone_codes (phone, created_at desc);
  `);
  await pool.query('delete from sessions where expires_at < now()');
  await pool.query('delete from phone_codes where created_at < now() - interval \'2 days\'');
}

async function loadPlayer(req) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[SESSION_COOKIE];
  if (!token) return null;
  const { rows } = await pool.query(
    `select p.id, p.lantecho_sub, p.email, p.display_name, p.avatar_url, p.avatar_key,
            p.phone, p.phone_verified_at, p.wechat_unionid, p.wechat_name, p.wechat_avatar, p.wechat_bound_at,
            s.expires_at
       from sessions s join players p on p.id = s.player_id
      where s.token = $1 and s.expires_at > now()`,
    [token]
  );
  const row = rows[0];
  // 带上令牌，账号中心要靠它标出「这台设备」。
  return row ? { ...row, session_token: token } : null;
}

// 公开给浏览器的玩家资料。邮箱、手机号一律打码，令牌与 unionid 不出服务端。
function publicPlayer(player) {
  return {
    id: Number(player.id),
    name: player.display_name,
    avatarKey: player.avatar_key || null,
    avatar: player.avatar_url || null,
  };
}

function publicBindings(player) {
  return {
    email: { bound: Boolean(player.email), masked: maskEmail(player.email) },
    phone: {
      bound: Boolean(player.phone),
      masked: maskPhone(player.phone),
      verifiedAt: player.phone_verified_at || null,
    },
    wechat: {
      bound: Boolean(player.wechat_unionid),
      name: player.wechat_name || null,
      avatar: player.wechat_avatar || null,
      boundAt: player.wechat_bound_at || null,
    },
  };
}

// 前端据此决定按钮是「去绑定」还是「服务未接入」，不猜。
function publicServices() {
  return {
    sms: { available: sms.configured(), provider: sms.provider(), missing: sms.missing() },
    wechat: { available: wechat.configured(), provider: wechat.provider(), missing: wechat.missing() },
  };
}

async function createSession(playerId, req) {
  const token = randomToken(32);
  const expires = new Date(Date.now() + SESSION_TTL_DAYS * 86400000);
  await pool.query(
    'insert into sessions (token, player_id, expires_at, user_agent) values ($1, $2, $3, $4)',
    [token, playerId, expires, String(req.headers['user-agent'] || '').slice(0, 300)]
  );
  await pool.query('update players set last_seen_at = now() where id = $1', [playerId]);
  return token;
}

// ---------------------------------------------------------------- 进度

// `reached` is the one field the client has to compute for us: it is the position of the furthest
// level cleared on the route, and the route order lives in the game's journey table, not here. The
// game sends it as a *sibling* of `progress` (`{progress, prefs, reached}`), because the progress
// document itself has no such key - reading it out of `input` alone would silently pin every player
// to 0. Keep the nested lookup as a fallback so an older payload still records something.
function sanitizeProgress(input, reachedInput) {
  const completed = Array.isArray(input.completed)
    ? [...new Set(input.completed.filter((id) => typeof id === 'string' && id.length > 0 && id.length <= 64))].slice(0, MAX_COMPLETED)
    : [];
  const learned = Array.isArray(input.learned)
    ? [...new Set(input.learned.filter((n) => Number.isInteger(n) && n >= 0 && n < 1000))]
    : [];
  const current = typeof input.current === 'string' && input.current.length <= 64 ? input.current : null;
  const provided = reachedInput ?? input.reached;
  const rawReached = Number(provided);
  const reached = provided != null && Number.isFinite(rawReached)
    ? Math.max(0, Math.min(MAX_REACHED, Math.trunc(rawReached)))
    : 0;
  const clean=a=>Array.isArray(a)?[...new Set(a.filter(n=>Number.isInteger(n)&&n>=0&&n<16))]:[];
  return { completed, learned, current, reached, skills:{seen:clean(input.skills?.seen),practiced:clean(input.skills?.practiced)} };
}

// Preferences are a fixed set of switches, so anything else in the payload is dropped rather than
// stored. Progress and preferences travel in the same document, which keeps the game to one read
// while reconciling and one debounced write while playing.
const PREF_KEYS = ['sound', 'motion', 'haptic', 'letters', 'live'];
function sanitizePrefs(input) {
  const out = {};
  if (input && typeof input === 'object') {
    for (const key of PREF_KEYS) if (typeof input[key] === 'boolean') out[key] = input[key];
  }
  return out;
}

async function loadPrefs(playerId) {
  const { rows } = await pool.query('select prefs from progress where player_id = $1', [playerId]);
  return rows[0]?.prefs ?? {};
}

async function savePrefs(playerId, prefs) {
  if (!Object.keys(prefs).length) return;
  await pool.query(
    `insert into progress (player_id, prefs) values ($1, $2::jsonb)
     on conflict (player_id) do update set prefs = progress.prefs || excluded.prefs`,
    [playerId, JSON.stringify(prefs)]
  );
}

async function saveProgress(playerId,data){
  // Completion lists are server-owned. Only a validated /complete request adds a new one.
  await pool.query(`insert into progress(player_id,learned,current_level,skills)
    values($1,$2::jsonb,$3,$4::jsonb) on conflict(player_id) do update set
    learned=(select coalesce(jsonb_agg(distinct v),'[]'::jsonb) from jsonb_array_elements(progress.learned || excluded.learned) v),
    current_level=coalesce(excluded.current_level,progress.current_level),
    skills=jsonb_build_object(
      'seen',(select coalesce(jsonb_agg(distinct v),'[]'::jsonb) from jsonb_array_elements(coalesce(progress.skills->'seen','[]'::jsonb) || (excluded.skills->'seen')) v),
      'practiced',(select coalesce(jsonb_agg(distinct v),'[]'::jsonb) from jsonb_array_elements(coalesce(progress.skills->'practiced','[]'::jsonb) || (excluded.skills->'practiced')) v)),
    updated_at=now()`,[playerId,JSON.stringify(data.learned),catalogIds.has(data.current)?data.current:null,JSON.stringify(data.skills)]);
}
async function recordAttempt(playerId,body){
 const run=validateAttempt(body,catalog),db=await pool.connect();
 try{
  await db.query('begin');
  await db.query('insert into progress(player_id) values($1) on conflict do nothing',[playerId]);
  // Serialize this player's completions; simultaneous devices cannot replace one another.
  await db.query('select player_id from progress where player_id=$1 for update',[playerId]);
  const wallet=await economy.lock(db,playerId);
  const used=await db.query("select 1 from economy_ledger where player_id=$1 and attempt_id=$2 and kind='use' limit 1",[playerId,run.id]);
  if(used.rowCount)run.hints=Math.max(1,run.hints);
  const inserted=await db.query(`insert into attempts(player_id,id,level_id,elapsed_ms,hints,conflicts,guides)
    values($1,$2,$3,$4,$5,$6,$7) on conflict do nothing returning id`,[playerId,run.id,run.levelId,run.elapsedMs,run.hints,run.conflicts,run.guides]);
  let firstClear=false;
  if(inserted.rowCount){
   const first=await db.query('insert into completions(player_id,level_id,completed_at) values($1,$2,now()) on conflict do nothing returning level_id',[playerId,run.levelId]);
   firstClear=Boolean(first.rowCount);
   await db.query(`update progress set completed=(select coalesce(jsonb_agg(distinct v),'[]'::jsonb) from jsonb_array_elements(completed || $2::jsonb) v), reached=greatest(reached,$3),updated_at=now() where player_id=$1`,[playerId,JSON.stringify([run.levelId]),catalog.findIndex(l=>l.id===run.levelId)+1]);
  }
  const grant=await economy.award(db,playerId,run,firstClear,Boolean(inserted.rowCount),wallet);
  await db.query('commit');return {ok:true,firstClear,...grant};
 }catch(e){await db.query('rollback');throw e;}finally{db.release();}
}
async function loadResults(playerId){
 const {rows}=await pool.query('select distinct on (level_id,(hints=0 and guides=0)) id,level_id,elapsed_ms,hints,conflicts,guides,finished_at from attempts where player_id=$1 order by level_id,(hints=0 and guides=0),elapsed_ms,conflicts,finished_at',[playerId]);
 return rows.map(r=>({id:r.id,levelId:r.level_id,elapsedMs:r.elapsed_ms,hints:r.hints,conflicts:r.conflicts,guides:r.guides,finishedAt:r.finished_at.toISOString()}));
}

// One personal best per player, with assisted and independent runs kept separate.
async function levelLeaderboard(levelId,mode,playerId){
 if(!catalogIds.has(levelId))throw Object.assign(new Error('关卡不存在'),{status:404});
 const independent=mode!=='assisted';
 const {rows}=await pool.query(`with best as (
   select distinct on (player_id) player_id,elapsed_ms,conflicts,finished_at from attempts
   where level_id=$1 and ((hints=0 and guides=0)=$2)
   order by player_id,elapsed_ms,conflicts,finished_at
 ), ranked as (
   select b.*,rank() over(order by elapsed_ms)::int as rank,p.display_name,p.avatar_key,p.avatar_url
   from best b join players p on p.id=b.player_id
 ) select * from ranked order by rank,conflicts,finished_at,player_id`,[levelId,independent]);
 const entry=r=>({rank:r.rank,name:r.display_name,avatarKey:r.avatar_key,avatar:r.avatar_url,elapsedMs:r.elapsed_ms,conflicts:r.conflicts,isMe:String(r.player_id)===String(playerId)});
 const mine=rows.find(r=>String(r.player_id)===String(playerId));
 const ahead=mine?rows.filter(r=>r.elapsed_ms<mine.elapsed_ms).at(-1):null;
 return {levelId,mode:independent?'independent':'assisted',total:rows.length,entries:rows.slice(0,50).map(entry),me:mine?entry(mine):null,gapMs:ahead?mine.elapsed_ms-ahead.elapsed_ms:null};
}

async function loadProgress(playerId) {
  const { rows } = await pool.query(
    'select completed, learned, current_level, reached, skills, updated_at from progress where player_id = $1',
    [playerId]
  );
  if (!rows[0]) return { completed: [], learned: [], current: null, reached: 0, updatedAt: null };
  const row = rows[0];
  return {
    completed: row.completed ?? [],
    learned: row.learned ?? [],
    skills: row.skills ?? {seen:[],practiced:[]},
    current: row.current_level ?? null,
    reached: row.reached ?? 0,
    updatedAt: row.updated_at,
  };
}

// ---------------------------------------------------------------- 排行榜

// Natural calendar periods. First clears only; repeats and settings writes never score.
async function leaderboard(range,playerId,now=new Date()){
 const bounds=range==='all'?null:period(range,now);
 const args=bounds?[bounds.start,bounds.end]:[];
 const where=bounds?'where c.completed_at >= $1::timestamptz and c.completed_at < $2::timestamptz':'';
 const legacy=bounds?`union all select h.player_id,h.completed_count,h.recorded_at,h.completed_count as legacy
   from legacy_period_credits h
   where h.day >= ($1::timestamptz at time zone 'Asia/Shanghai')::date
     and h.day < ($2::timestamptz at time zone 'Asia/Shanghai')::date`:'';
 const {rows}=await pool.query(`with events as (
   select c.player_id,1 as amount,c.completed_at as recorded_at,0 as legacy from completions c ${where}
   ${legacy}
 ), scores as (
   select player_id,sum(amount)::int as completed,max(recorded_at) as achieved_at,sum(legacy)::int as legacy_completed
   from events group by player_id
 ), ranked as (
   select s.*,rank() over(order by completed desc)::int as rank,p.display_name,p.avatar_url,p.avatar_key
   from scores s join players p on p.id=s.player_id
 ) select * from ranked order by rank,achieved_at asc nulls last,player_id`,args);
 const entry=r=>({rank:r.rank,name:r.display_name,avatar:r.avatar_url||null,avatarKey:r.avatar_key||null,completed:r.completed,legacyCompleted:r.legacy_completed,isMe:playerId?String(r.player_id)===String(playerId):false});
 const meta=await pool.query("select created_at from scoring_meta where key='first-clear-v2'");
 return {range,entries:rows.slice(0,LEADERBOARD_LIMIT).map(entry),me:rows.find(r=>String(r.player_id)===String(playerId))?entry(rows.find(r=>String(r.player_id)===String(playerId))):null,
   period:bounds,trackingSince:meta.rows[0]?.created_at,includesLegacy:rows.some(r=>r.legacy_completed>0),metric:range==='all'?'累计首次通关':'期间新增通关'};
}

// ---------------------------------------------------------------- 账号中心

async function loadPlayerById(id) {
  const { rows } = await pool.query('select * from players where id = $1', [id]);
  return rows[0] ?? null;
}

// 每次改完账号资料都回一份完整快照，前端不用再追问一次。
async function accountPayload(id) {
  const player = await loadPlayerById(id);
  return { player: publicPlayer(player), bindings: publicBindings(player), services: publicServices() };
}

const codeHash = (phone, code) => crypto.createHash('sha256').update(`${phone}:${code}`).digest('hex');

function badRequest(message) {
  return Object.assign(new Error(message), { status: 400, exposed: true });
}

// 昵称去掉控制字符、收拢空白，剩下的长度由调用处判断。
function sanitizeName(input) {
  return String(input).replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim();
}

const normalizePhone = (input) => String(input || '').replace(/[\s-]/g, '');

async function handlePatchProfile(req, res) {
  const player = await loadPlayer(req);
  if (!player) return sendJson(res, 401, { error: 'unauthenticated' });
  const body = await readJson(req);
  const sets = [];
  const params = [];
  if ('name' in body) {
    const name = sanitizeName(body.name);
    if (!name || name.length > NAME_MAX) throw badRequest(`昵称需要 1~${NAME_MAX} 个字`);
    params.push(name);
    sets.push(`display_name = $${params.length}`);
  }
  if ('avatarKey' in body) {
    const key = body.avatarKey;
    if (key !== null && !AVATAR_KEYS.includes(key)) throw badRequest('没有这个头像');
    params.push(key);
    sets.push(`avatar_key = $${params.length}`);
  }
  if (!sets.length) throw badRequest('没有要修改的内容');
  params.push(player.id);
  await pool.query(`update players set ${sets.join(', ')}, last_seen_at = now() where id = $${params.length}`, params);
  sendJson(res, 200, { ok: true, ...(await accountPayload(player.id)) });
}

// ---- 手机号绑定：发码 → 校验 → 落库。验证码只存哈希，绑定不影响澜图回声这个主身份。

async function handlePhoneSend(req, res) {
  const player = await loadPlayer(req);
  if (!player) return sendJson(res, 401, { error: 'unauthenticated' });
  const body = await readJson(req);
  const phone = normalizePhone(body.phone);
  if (!PHONE_RE.test(phone)) throw badRequest('请输入正确的 11 位手机号');
  if (!sms.configured()) {
    return sendJson(res, 503, { error: 'sms_not_configured', missing: sms.missing() });
  }
  const { rows } = await pool.query(
    `select count(*)::int as total, max(created_at) as last
       from phone_codes
      where phone = $1 and created_at > now() - interval '1 day'`,
    [phone]
  );
  const stat = rows[0];
  if (stat.total >= CODE_DAILY_LIMIT) {
    return sendJson(res, 429, { error: 'send_limit', message: '这个号码今天收到的验证码有点多，请明天再试。' });
  }
  if (stat.last) {
    const waited = Date.now() - new Date(stat.last).getTime();
    if (waited < CODE_RESEND_SECONDS * 1000) {
      return sendJson(res, 429, {
        error: 'too_soon',
        wait: Math.ceil((CODE_RESEND_SECONDS * 1000 - waited) / 1000),
        message: `请 ${Math.ceil((CODE_RESEND_SECONDS * 1000 - waited) / 1000)} 秒后再获取验证码。`,
      });
    }
  }
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  const sent = await sms.sendVerificationCode(phone, code, CODE_TTL_MINUTES);
  if (!sent.ok) {
    return sendJson(res, 502, { error: 'sms_failed', detail: sent.detail || '短信服务暂时不可用' });
  }
  await pool.query(
    `insert into phone_codes (phone, player_id, code_hash, purpose, expires_at)
     values ($1, $2, $3, 'bind', now() + ($4 || ' minutes')::interval)`,
    [phone, player.id, codeHash(phone, code), String(CODE_TTL_MINUTES)]
  );
  // devCode 只在 console 自测通道出现，生产（tencent）拿不到。
  sendJson(res, 200, { ok: true, ttl: CODE_TTL_MINUTES * 60, ...(sent.devCode ? { devCode: sent.devCode } : {}) });
}

async function handlePhoneVerify(req, res) {
  const player = await loadPlayer(req);
  if (!player) return sendJson(res, 401, { error: 'unauthenticated' });
  const body = await readJson(req);
  const phone = normalizePhone(body.phone);
  const code = String(body.code || '').trim();
  if (!PHONE_RE.test(phone)) throw badRequest('请输入正确的 11 位手机号');
  if (!/^\d{6}$/.test(code)) throw badRequest('请输入 6 位验证码');

  const { rows } = await pool.query(
    `select id, code_hash, attempts from phone_codes
      where phone = $1 and consumed_at is null and expires_at > now()
      order by created_at desc limit 1`,
    [phone]
  );
  const record = rows[0];
  if (!record) return sendJson(res, 400, { error: 'code_expired', message: '验证码已过期，请重新获取。' });
  if (record.attempts >= CODE_MAX_ATTEMPTS) {
    await pool.query('update phone_codes set consumed_at = now() where id = $1', [record.id]);
    return sendJson(res, 429, { error: 'too_many_attempts', message: '错误次数太多，请重新获取验证码。' });
  }
  const expected = Buffer.from(record.code_hash, 'hex');
  const actual = Buffer.from(codeHash(phone, code), 'hex');
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
    await pool.query('update phone_codes set attempts = attempts + 1 where id = $1', [record.id]);
    return sendJson(res, 400, { error: 'code_mismatch', message: '验证码不对，再试一次。' });
  }
  await pool.query('update phone_codes set consumed_at = now() where id = $1', [record.id]);
  try {
    await pool.query('update players set phone = $1, phone_verified_at = now() where id = $2', [phone, player.id]);
  } catch (error) {
    // 唯一索引挡住「同一个号挂两个账号」，这是正常业务分支，不是故障。
    if (error.code === '23505') {
      return sendJson(res, 409, { error: 'phone_taken', message: '这个手机号已经绑定过另一个账号了。' });
    }
    throw error;
  }
  sendJson(res, 200, { ok: true, ...(await accountPayload(player.id)) });
}

async function handlePhoneUnbind(req, res) {
  const player = await loadPlayer(req);
  if (!player) return sendJson(res, 401, { error: 'unauthenticated' });
  await pool.query('update players set phone = null, phone_verified_at = null where id = $1', [player.id]);
  sendJson(res, 200, { ok: true, ...(await accountPayload(player.id)) });
}

// ---- 微信绑定：开放平台「网站应用」扫码。state 存在自己的 cookie 里，回调必须对得上。

const WECHAT_STATE_COOKIE = 'catsudoku_wechat_state';
const WECHAT_REDIRECT = () => `${PUBLIC_ORIGIN}${BASE_PATH}/api/auth/wechat/callback`;
const wechatBack = (flag) => `${GAME_URL}?wechat=${flag}#/me/security`;

async function handleWechatStart(req, res, url) {
  const player = await loadPlayer(req);
  if (!player) return sendRedirect(res, wechatBack('need_login'));
  if (!wechat.configured()) return sendRedirect(res, wechatBack('unavailable'));
  const state = randomToken(18);
  const cookie = cookieHeader(WECHAT_STATE_COOKIE, state, { maxAge: 600, path: `${BASE_PATH}/api` });
  // 真通道给微信扫码页；mock 通道给本服务自己的假授权页，两者后续流程完全一致。
  const mockCode = wechat.provider() === 'mock' ? String(url.searchParams.get('code') || '') : '';
  const target =
    wechat.authorizeUrl(WECHAT_REDIRECT(), state) ||
    `${PUBLIC_ORIGIN}${BASE_PATH}/api/auth/wechat/mock?state=${encodeURIComponent(state)}${mockCode ? `&code=${encodeURIComponent(mockCode)}` : ''}`;
  sendRedirect(res, target, { 'Set-Cookie': cookie });
}

async function handleWechatMock(req, res, url) {
  if (wechat.provider() !== 'mock') return sendJson(res, 404, { error: 'not_found' });
  const state = String(url.searchParams.get('state') || '');
  const code = String(url.searchParams.get('code') || '') || `dev-${randomToken(8)}`;
  sendRedirect(res, `${WECHAT_REDIRECT()}?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`);
}

async function handleWechatCallback(req, res, url) {
  const clearState = cookieHeader(WECHAT_STATE_COOKIE, '', { maxAge: 0, path: `${BASE_PATH}/api` });
  const back = (flag) => sendRedirect(res, wechatBack(flag), { 'Set-Cookie': clearState });

  const player = await loadPlayer(req);
  if (!player) return back('need_login');
  const held = parseCookies(req.headers.cookie)[WECHAT_STATE_COOKIE] || '';
  const state = String(url.searchParams.get('state') || '');
  const code = String(url.searchParams.get('code') || '');
  if (!held || !state || held !== state || !code) return back('state_mismatch');

  const result = await wechat.exchange(code);
  if (!result.ok) {
    if (result.reason === 'not_configured') return back('unavailable');
    console.error('[cat-sudoku] wechat exchange failed', result.detail);
    return back('failed');
  }
  if (!result.unionid) return back('no_unionid');

  try {
    await pool.query(
      `update players
          set wechat_unionid  = $1,
              wechat_openid   = $2,
              wechat_name     = coalesce($3, wechat_name),
              wechat_avatar   = coalesce($4, wechat_avatar),
              wechat_bound_at = now()
        where id = $5`,
      [result.unionid, result.openid, (result.name || '').slice(0, 60) || null, (result.avatar || '').slice(0, 500) || null, player.id]
    );
  } catch (error) {
    if (error.code === '23505') return back('taken');
    throw error;
  }
  return back('ok');
}

async function handleWechatUnbind(req, res) {
  const player = await loadPlayer(req);
  if (!player) return sendJson(res, 401, { error: 'unauthenticated' });
  await pool.query(
    `update players
        set wechat_unionid = null, wechat_openid = null, wechat_name = null,
            wechat_avatar = null, wechat_bound_at = null
      where id = $1`,
    [player.id]
  );
  sendJson(res, 200, { ok: true, ...(await accountPayload(player.id)) });
}

// ---- 登录设备：只暴露不可逆的短 id，令牌本身不出服务端。

async function handleSessions(req, res) {
  const player = await loadPlayer(req);
  if (!player) return sendJson(res, 401, { error: 'unauthenticated' });
  const { rows } = await pool.query(
    'select token, created_at, expires_at, user_agent from sessions where player_id = $1',
    [player.id]
  );
  const list = rows
    .map((row) => ({
      id: sessionId(row.token),
      device: parseDevice(row.user_agent),
      detail: deviceDetail(row.user_agent),
      current: row.token === player.session_token,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
    }))
    .sort((a, b) => Number(b.current) - Number(a.current) || new Date(b.createdAt) - new Date(a.createdAt));
  sendJson(res, 200, { sessions: list, total: list.length });
}

async function handleRevokeSessions(req, res) {
  const player = await loadPlayer(req);
  if (!player) return sendJson(res, 401, { error: 'unauthenticated' });
  const body = await readJson(req);

  if (body.all === true) {
    const result = await pool.query('delete from sessions where player_id = $1', [player.id]);
    sendJson(res, 200, { ok: true, removed: result.rowCount, signedOut: true }, {
      'Set-Cookie': cookieHeader(SESSION_COOKIE, '', { maxAge: 0 }),
    });
    return;
  }

  const id = typeof body.id === 'string' ? body.id : '';
  if (!id) throw badRequest('缺少要移除的设备');
  const { rows } = await pool.query('select token from sessions where player_id = $1', [player.id]);
  const target = rows.find((row) => sessionId(row.token) === id);
  if (!target) return sendJson(res, 404, { error: 'not_found', message: '这台设备已经不在登录列表里了。' });
  await pool.query('delete from sessions where token = $1', [target.token]);
  const signedOut = target.token === player.session_token;
  sendJson(res, 200, { ok: true, removed: 1, signedOut }, signedOut ? {
    'Set-Cookie': cookieHeader(SESSION_COOKIE, '', { maxAge: 0 }),
  } : {});
}

// ---- 注销：删掉玩家行，进度 / 快照 / 会话靠外键级联一起清掉。

async function handleDeleteAccount(req, res) {
  const player = await loadPlayer(req);
  if (!player) return sendJson(res, 401, { error: 'unauthenticated' });
  const body = await readJson(req);
  if (String(body.confirm || '').trim() !== '注销') {
    throw badRequest('请输入"注销"两个字来确认');
  }
  await pool.query('delete from players where id = $1', [player.id]);
  console.log(`[cat-sudoku] account deleted: player ${player.id}`);
  sendJson(res, 200, { ok: true }, {
    'Set-Cookie': cookieHeader(SESSION_COOKIE, '', { maxAge: 0 }),
  });
}

// ---------------------------------------------------------------- 路由

async function handleLogin(req, res) {
  if (!CLIENT_ID) {
    sendJson(res, 503, { error: 'not_configured', message: '登录尚未配置：缺少 LANTECHO_CLIENT_ID' });
    return;
  }
  const state = randomToken(16);
  const verifier = randomToken(48);
  const challenge = b64url(sha256(verifier));
  const authorize = new URL(`${ISSUER}/oauth2/authorize`);
  authorize.searchParams.set('response_type', 'code');
  authorize.searchParams.set('client_id', CLIENT_ID);
  authorize.searchParams.set('redirect_uri', REDIRECT_URI);
  authorize.searchParams.set('scope', 'openid profile email');
  authorize.searchParams.set('state', state);
  authorize.searchParams.set('code_challenge', challenge);
  authorize.searchParams.set('code_challenge_method', 'S256');
  sendRedirect(res, authorize.toString(), {
    'Set-Cookie': cookieHeader(STATE_COOKIE, `${state}.${verifier}`, {
      maxAge: STATE_TTL_SECONDS,
      path: `${BASE_PATH}/api`,
    }),
  });
}

async function handleCallback(req, res, url) {
  const cookies = parseCookies(req.headers.cookie);
  const held = cookies[STATE_COOKIE];
  const returnedState = url.searchParams.get('state') || '';
  const code = url.searchParams.get('code') || '';
  const errorParam = url.searchParams.get('error');

  const clearState = cookieHeader(STATE_COOKIE, '', { maxAge: 0, path: `${BASE_PATH}/api` });

  if (errorParam) {
    sendRedirect(res, `${GAME_URL}?login=denied`, { 'Set-Cookie': clearState });
    return;
  }
  if (!held || !code) {
    sendRedirect(res, `${GAME_URL}?login=invalid`, { 'Set-Cookie': clearState });
    return;
  }
  const [heldState, verifier] = held.split('.');
  if (!heldState || heldState !== returnedState) {
    sendRedirect(res, `${GAME_URL}?login=state_mismatch`, { 'Set-Cookie': clearState });
    return;
  }

  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const token = await postForm(`${ISSUER}/oauth2/token`, {
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: verifier,
    client_id: CLIENT_ID,
  }, { Authorization: `Basic ${basic}` });

  if (!token.ok || !token.data?.access_token) {
    console.error('[cat-sudoku] token exchange failed', token.status, token.data);
    sendRedirect(res, `${GAME_URL}?login=failed`, { 'Set-Cookie': clearState });
    return;
  }

  let profile = null;
  try {
    const response = await fetch(`${ISSUER}/oauth2/userinfo`, {
      headers: { Authorization: `Bearer ${token.data.access_token}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(15000),
    });
    if (response.ok) profile = await response.json();
  } catch (error) {
    console.error('[cat-sudoku] userinfo failed', error);
  }

  const sub = profile?.sub || token.data?.id_token_sub;
  if (!sub) {
    sendRedirect(res, `${GAME_URL}?login=failed`, { 'Set-Cookie': clearState });
    return;
  }

  const displayName = String(profile?.name || profile?.preferred_username || (profile?.email ? String(profile.email).split('@')[0] : '') || '无名猫').slice(0, 40);
  const avatar = typeof profile?.picture === 'string' && /^https?:\/\//.test(profile.picture) ? profile.picture.slice(0, 500) : null;
  const email = typeof profile?.email === 'string' ? profile.email.slice(0, 200) : null;

  const { rows } = await pool.query(
    `insert into players (lantecho_sub, email, display_name, avatar_url, last_seen_at)
     values ($1, $2, $3, $4, now())
     on conflict (lantecho_sub) do update
        set email = coalesce(excluded.email, players.email),
            display_name = excluded.display_name,
            avatar_url = coalesce(excluded.avatar_url, players.avatar_url),
            last_seen_at = now()
     returning id`,
    [sub, email, displayName, avatar]
  );

  const sessionToken = await createSession(rows[0].id, req);
  sendRedirect(res, `${GAME_URL}?login=ok`, {
    'Set-Cookie': [
      cookieHeader(SESSION_COOKIE, sessionToken, { maxAge: SESSION_TTL_DAYS * 86400 }),
      clearState,
    ],
  });
}

async function handleLogout(req, res) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[SESSION_COOKIE];
  if (token) await pool.query('delete from sessions where token = $1', [token]);
  sendJson(res, 200, { ok: true }, {
    'Set-Cookie': cookieHeader(SESSION_COOKIE, '', { maxAge: 0 }),
  });
}

// 退出其他设备：保留发起这次请求的会话，其余全部作废——和按钮上的文案一致。
async function handleLogoutAll(req, res) {
  const player = await loadPlayer(req);
  if (!player) return sendJson(res, 401, { error: 'unauthenticated' });
  const result = await pool.query(
    'delete from sessions where player_id = $1 and token <> $2',
    [player.id, player.session_token]
  );
  sendJson(res, 200, { ok: true, removed: result.rowCount });
}

async function handleMe(req, res) {
  const player = await loadPlayer(req);
  if (!player) {
    sendJson(res, 200, { signedIn: false, services: publicServices() });
    return;
  }
  sendJson(res, 200, {
    signedIn: true,
    player: publicPlayer(player),
    bindings: publicBindings(player),
    services: publicServices(),
    progress: await loadProgress(player.id),
    prefs: await loadPrefs(player.id),
  });
}

// The whole record in one document: boot asks once, then a single debounced PUT covers every later
// change. A signed-out visitor gets {signedIn:false} rather than an error, because that is a normal
// state and the game simply stays on localStorage.
async function handleGetState(req, res) {
  const player = await loadPlayer(req);
  if (!player) {
    sendJson(res, 200, { signedIn: false });
    return;
  }
  sendJson(res, 200, {
    signedIn: true,
    player: publicPlayer(player),
    progress: await loadProgress(player.id),
    prefs: await loadPrefs(player.id),
  });
}

async function handlePutState(req, res) {
  const player = await loadPlayer(req);
  if (!player) {
    sendJson(res, 401, { error: 'unauthenticated' });
    return;
  }
  const body = await readJson(req);
  // `reached` rides alongside `progress`, not inside it - see sanitizeProgress.
  const clean = sanitizeProgress(body.progress || {}, body.reached);
  await saveProgress(player.id, clean);
  await savePrefs(player.id, sanitizePrefs(body.prefs));
  sendJson(res, 200, { ok: true });
}

async function handleLeaderboard(req, res, url) {
  const requested = url.searchParams.get('range') || 'all';
  const range = ['all','week','day'].includes(requested) ? requested : 'all';
  const player = await loadPlayer(req);
  sendJson(res, 200, await leaderboard(range, player?.id ?? null));
}

async function route(req, res) {
  const url = new URL(req.url, PUBLIC_ORIGIN);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const method = req.method || 'GET';

  if (method === 'GET' && (path === '/health' || path === '/')) {
    sendJson(res, 200, {
      ok: true,
      service: 'cat-sudoku-api',
      configured: Boolean(CLIENT_ID && CLIENT_SECRET && process.env.DATABASE_URL),
      redirectUri: REDIRECT_URI,
      services: {
        sms: { provider: sms.provider(), ready: sms.configured(), missing: sms.missing() },
        wechat: { provider: wechat.provider(), ready: wechat.configured(), missing: wechat.missing() },
      },
    });
    return;
  }
  if (method === 'GET' && path === '/auth/login') return handleLogin(req, res);
  if (method === 'GET' && path === '/auth/callback') return handleCallback(req, res, url);
  if (method === 'POST' && path === '/auth/logout') return handleLogout(req, res);
  if (method === 'POST' && path === '/auth/logout-all') return handleLogoutAll(req, res);
  if (method === 'GET' && path === '/me') return handleMe(req, res);
  if (method === 'PATCH' && path === '/me/profile') return handlePatchProfile(req, res);
  if (method === 'GET' && path === '/state') return handleGetState(req, res);
  if (method === 'PUT' && path === '/state') return handlePutState(req, res);
  if(method==='GET' && path==='/level-leaderboard'){
    const player=await loadPlayer(req);
    return sendJson(res,200,await levelLeaderboard(url.searchParams.get('level'),url.searchParams.get('mode'),player?.id));
  }
  if ((method === 'POST' && path === '/complete') || (method === 'GET' && path === '/results')) {
    const player=await loadPlayer(req);if(!player){sendJson(res,401,{error:'unauthenticated'});return;}
    sendJson(res,200,method==='POST'?await recordAttempt(player.id,await readJson(req,res)):{results:await loadResults(player.id)});return;
  }
  if((method==='GET'&&path==='/economy')||(method==='POST'&&['/economy/buy','/economy/use'].includes(path))){
    const player=await loadPlayer(req);if(!player)return sendJson(res,401,{error:'unauthenticated'});
    if(method==='POST'&&req.headers.origin&&req.headers.origin!==PUBLIC_ORIGIN)return sendJson(res,403,{error:'origin'});
    return sendJson(res,200,method==='GET'?{wallet:await economy.balance(pool,player.id)}:await economy.operate(pool,player.id,path.split('/').pop(),await readJson(req),catalog));
  }
  if (method === 'GET' && path === '/leaderboard') return handleLeaderboard(req, res, url);
  if (method === 'POST' && path === '/auth/phone/send') return handlePhoneSend(req, res);
  if (method === 'POST' && path === '/auth/phone/verify') return handlePhoneVerify(req, res);
  if (method === 'POST' && path === '/auth/phone/unbind') return handlePhoneUnbind(req, res);
  if (method === 'GET' && path === '/auth/wechat/start') return handleWechatStart(req, res, url);
  if (method === 'GET' && path === '/auth/wechat/mock') return handleWechatMock(req, res, url);
  if (method === 'GET' && path === '/auth/wechat/callback') return handleWechatCallback(req, res, url);
  if (method === 'POST' && path === '/auth/wechat/unbind') return handleWechatUnbind(req, res);
  if (method === 'GET' && path === '/sessions') return handleSessions(req, res);
  if (method === 'POST' && path === '/sessions/revoke') return handleRevokeSessions(req, res);
  if (method === 'POST' && path === '/account/delete') return handleDeleteAccount(req, res);

  sendJson(res, 404, { error: 'not_found', path });
}

const server = http.createServer((req, res) => {
  route(req, res).catch((error) => {
    const status = Number(error?.status) || 500;
    if (status >= 500) console.error('[cat-sudoku] request failed', req.method, req.url, error);
    if (!res.headersSent) {
      // 4xx 的 message 是写给玩家看的中文，照原样透出；5xx 只说"服务端出错"，不泄漏内部细节。
      sendJson(res, status, status < 500
        ? { error: 'invalid_request', message: String(error?.message || error) }
        : { error: 'server_error', message: '服务端出错了，稍后再试。' });
    } else res.end();
  });
});

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  await initSchema();
  server.listen(PORT, BIND_ADDR, () => {
    console.log(`[cat-sudoku] listening on http://${BIND_ADDR}:${PORT}`);
    console.log(`[cat-sudoku] redirect_uri = ${REDIRECT_URI}`);
    console.log(`[cat-sudoku] oauth client configured: ${Boolean(CLIENT_ID && CLIENT_SECRET)}`);
  });
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(() => pool.end().then(() => process.exit(0)));
    setTimeout(() => process.exit(0), 3000).unref();
  });
}

module.exports={initSchema,pool,server,saveProgress,loadProgress,recordAttempt,leaderboard,levelLeaderboard,loadResults};
if(require.main===module)main().catch((error) => {
  console.error('[cat-sudoku] startup failed', error);
  process.exit(1);
});
