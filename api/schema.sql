-- 猫猫数独 · 账号与排行榜
-- 身份来自澜图回声（Lantecho）的 OIDC，这里只保存 sub 与展示用资料，绝不保存密码。
-- 手机号与微信是「附加绑定」：换绑、解绑都不影响澜图回声这个主身份。

create table if not exists players (
  id            bigserial primary key,
  lantecho_sub  text        not null unique,
  email         text,
  display_name  text        not null default '无名猫',
  avatar_url    text,
  created_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now()
);

-- 账号中心新增字段。avatar_key 指内置猫猫头像（只存 key，前端按 key 画 SVG）；
-- phone 存 11 位大陆手机号；wechat_* 来自开放平台网站应用的授权。
alter table players add column if not exists avatar_key         text;
alter table players add column if not exists phone              text;
alter table players add column if not exists phone_verified_at  timestamptz;
alter table players add column if not exists wechat_unionid     text;
alter table players add column if not exists wechat_openid      text;
alter table players add column if not exists wechat_name        text;
alter table players add column if not exists wechat_avatar      text;
alter table players add column if not exists wechat_bound_at    timestamptz;

-- 一个手机号 / 一个微信号只能挂在一个账号上；允许为空，所以用部分唯一索引。
create unique index if not exists players_phone_uniq  on players (phone)          where phone is not null;
create unique index if not exists players_wechat_uniq on players (wechat_unionid) where wechat_unionid is not null;

-- 短信验证码。只存哈希，不存明文；同一手机号可以有多条历史，取最新一条未消费的。
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

-- 进度与设置：每个账号一份。completed 存关卡 id 数组（关卡 id 可能随内容重新生成，所以按数组存原样）。
create table if not exists progress (
  player_id       bigint primary key references players(id) on delete cascade,
  completed       jsonb       not null default '[]'::jsonb,
  learned         jsonb       not null default '[]'::jsonb,
  current_level   text,
  reached         integer     not null default 0,
  prefs           jsonb       not null default '{}'::jsonb,
  updated_at      timestamptz not null default now()
);

-- 每日快照：日榜/周榜/总榜都从这里聚合。
-- reached 只增不减（同一个玩家同一天取最大值），避免"当天归零"让人以为战绩被清空。
create table if not exists snapshots (
  player_id        bigint  not null references players(id) on delete cascade,
  day              date    not null,
  reached          integer not null default 0,
  completed_count  integer not null default 0,
  updated_at       timestamptz not null default now(),
  primary key (player_id, day)
);

create index if not exists snapshots_day_reached_idx on snapshots (day, reached desc);
create index if not exists snapshots_player_idx on snapshots (player_id);

-- 登录会话：浏览器只拿到随机 token，真实身份在服务端。
create table if not exists sessions (
  token       text        primary key,
  player_id   bigint      not null references players(id) on delete cascade,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null,
  user_agent  text
);

create index if not exists sessions_player_idx on sessions (player_id);
create index if not exists sessions_expiry_idx on sessions (expires_at);
