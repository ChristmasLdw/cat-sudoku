/* Cat Sudoku: pointer painting, keyboard play, local synthesized feedback. */
(function(){
'use strict';
const E=window.CatPuzzle,T=window.CatTrial,J=window.CatJourney,levels=J.arrange(window.CAT_LEVELS),$=id=>document.getElementById(id);
const defaultColors=['#bca9e2','#f2c66d','#8fcbbb','#eca0ae','#90bde1','#d4cf8b','#c8ae95','#b8d585','#a8b0d9'];let colors=defaultColors;
const catSVG='<svg class="cat" aria-hidden="true"><use href="#cat-icon"/></svg>';
// A solid x, not a stroked one: thin strokes go muddy against the darker region colours. Drawn as one
// path with nonzero fill so the two bars merge cleanly where they cross.
const crossSVG='<svg class="cross" viewBox="0 0 40 40" aria-hidden="true"><path d="M8.6 8.6 31.4 31.4 M31.4 8.6 8.6 31.4" fill="none" stroke="currentColor" stroke-width="8.4" stroke-linecap="round"/></svg>';
// 内置头像。服务端只存 key，画法在这里；两边共用同一份 key 列表（服务端 AVATAR_KEYS）。
const AVATARS=[
  {key:'mint',bg:'#b6d9cc',ink:'#22483f'},{key:'peach',bg:'#f2c66d',ink:'#6b4708'},
  {key:'sky',bg:'#90bde1',ink:'#1f4666'},{key:'lilac',bg:'#bca9e2',ink:'#40306b'},
  {key:'coral',bg:'#eca0ae',ink:'#7a2f3c'},{key:'sage',bg:'#b8d585',ink:'#40591f'},
  {key:'sand',bg:'#d4cf8b',ink:'#5d5620'},{key:'clay',bg:'#c8ae95',ink:'#5a4130'},
  {key:'slate',bg:'#a8b0d9',ink:'#333c6b'},{key:'rose',bg:'#e6b8d4',ink:'#6d2a55'},
  {key:'teal',bg:'#8fcbbb',ink:'#1e5145'},{key:'ink',bg:'#4a5a6b',ink:'#e7eef4'}
];
const AVATAR_MAP=new Map(AVATARS.map(a=>[a.key,a]));
function avatarSVG(key){
  const a=AVATAR_MAP.get(key);
  const bg=a?a.bg:'#eef4f0',ink=a?a.ink:'#327867';
  return '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="20" fill="'+bg+'"/><use href="#cat-icon" x="6.5" y="6.5" width="27" height="27" fill="'+ink+'"/></svg>';
}
const APP_VERSION='2026.10.4';
const sessions=new Map(),reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
// Progress store. Inside a Lantecho echo the page runs in an iframe with sandbox="allow-scripts" and
// deliberately no allow-same-origin, so localStorage throws there and the platform bridge
// (window.Lantecho.storage) is the only thing that survives a reload. The bridge is async and gets
// injected a beat after this script runs, so the game boots from the local copy and reconciles with
// the cloud as soon as the bridge appears - a plain web page simply stays on localStorage.
const JOURNEY_KEY='cat-garden-journey-v1',PREFS_KEY='cat-garden-preferences-v2';
// ---- Account channel. Players sign in through Lantecho (the site's identity provider), but the
// record itself lives in our own database, so progress follows the account across devices without
// the game having to become a Lantecho echo. Not signed in? Nothing here runs and localStorage
// carries the game exactly as before.
const API_BASE=(location.pathname.indexOf('/cat-sudoku')===0?'/cat-sudoku':'')+'/api';
let account=null,apiCache=null,apiSaveTimer=0,apiSaving=false,apiNote='';
async function apiFetch(path,options){
  const response=await fetch(API_BASE+path,{credentials:'same-origin',cache:'no-store',...options});
  let body=null;
  try{body=await response.json();}catch(_){body=null;}
  if(!response.ok){
    // 服务端 4xx 的 message 是写给玩家看的中文，带上去比只说 "HTTP 400" 有用得多。
    const error=new Error(body?.message||('HTTP '+response.status));
    error.status=response.status;error.code=body?.error||null;error.wait=Number(body?.wait)||0;
    throw error;
  }
  return body;
}
// How far the player has got, as a plain level number - that is what the leaderboards rank on.
function reachedIndex(j){
  let best=0;
  for(let i=0;i<levels.length;i++)if(j.completed.includes(levels[i].id)&&i+1>best)best=i+1;
  return best;
}
// One document per account: the journey and the preferences together, so a single debounced PUT
// covers both kinds of write. Reads are cached, because syncProgress asks for both keys in a row.
const apiStore={
  async get(key){
    if(!apiCache)apiCache=await apiFetch('/state');
    if(key===JOURNEY_KEY)return apiCache?.progress||null;
    if(key===PREFS_KEY)return apiCache?.prefs||null;
    return null;
  },
  async set(key,value){
    if(!apiCache)apiCache={};
    if(key===JOURNEY_KEY)apiCache.progress=value;
    if(key===PREFS_KEY)apiCache.prefs=value;
    clearTimeout(apiSaveTimer);
    apiSaveTimer=setTimeout(pushAccountState,1200);
  }
};
async function pushAccountState(){
  if(!account?.signedIn||apiSaving)return;
  apiSaving=true;
  try{
    await apiFetch('/state',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({progress:apiCache?.progress||null,prefs:apiCache?.prefs||null,reached:reachedIndex(journey)})});
    apiNote='已保存到账号';
  }catch(_){
    apiNote='这次没存上，下次操作会再试';
  }finally{
    apiSaving=false;
    if(document.body.dataset.view==='me')renderMe();
  }
}
function bridge(){
  if(account&&account.signedIn)return apiStore;
  const b=window.Lantecho&&window.Lantecho.storage;
  return b&&typeof b.get==='function'&&typeof b.set==='function'?b:null;
}
const store={get(key){try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):null;}catch(_){return null;}},set(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch(_){}}};
let writeChain=Promise.resolve(),cloudArmed=false;
// Local first (synchronous, so the first paint is right), then the cloud copy queued behind every
// earlier write. Cloud writes stay shut until the first reconcile has read the account's record:
// boot calls selectLevel -> saveJourney before the bridge is even up, and that would otherwise push
// an empty progress straight over the real one. A failed cloud write is dropped rather than retried
// in a loop; the next save carries the same state up anyway.
function persist(key,value){
  store.set(key,value);
  const b=bridge();
  if(!b||!cloudArmed)return;
  const snapshot=JSON.parse(JSON.stringify(value));
  writeChain=writeChain.then(()=>b.set(key,snapshot)).catch(()=>{});
}
// Union, never replace: playing offline on one device must not erase what the account already has.
function mergeProgress(local,cloud){
  const ids=new Set(levels.map(l=>l.id));
  const l=J.validProgress(local,levels),c=J.validProgress(cloud,levels);
  // The account's position wins - that is the cross-device record. Only when the cloud holds no
  // usable position yet (the very first sync) does this device's level stand.
  const current=ids.has(cloud?.current)?cloud.current:local.current;
  const merged=J.validProgress({completed:[...new Set([...l.completed,...c.completed])],learned:[...new Set([...l.learned,...c.learned])],current},levels);
  merged.stale=[...new Set([...l.stale,...c.stale])].filter(id=>!ids.has(id));
  return merged;
}
let tutorial=null;let journey=J.validProgress(store.get(JOURNEY_KEY),levels);
function saveJourney(){persist(JOURNEY_KEY,journey);}
// Reconcile once, right after boot: pull the cloud record, union it with this device's, push the
// result back, and move to the level the account was last on. A fresh device lands exactly where the
// player left off; a first-time echo visitor uploads the progress already sitting in this browser.
async function syncProgress(){
  const b=bridge();if(!b)return;
  let cloud=null;
  try{
    const cloudPrefs=await b.get(PREFS_KEY);
    if(cloudPrefs&&typeof cloudPrefs==='object'){let changed=false;for(const key of Object.keys(prefs))if(typeof cloudPrefs[key]==='boolean'&&prefs[key]!==cloudPrefs[key]){prefs[key]=cloudPrefs[key];changed=true;}if(changed)applyPrefs();}
    cloud=await b.get(JOURNEY_KEY);
  }catch(_){return;} // read failed: keep this session local rather than overwrite the account record
  journey=mergeProgress(journey,cloud);
  cloudArmed=true;
  saveJourney();
  const index=levels.findIndex(l=>l.id===journey.current);
  if(index>=0&&index!==levelIndex)selectLevel(index);
  renderPath();
  if(document.body.dataset.view==='home')centerCat(false);
}
function whenBridgeReady(run){
  if(bridge()){run();return;}
  const started=performance.now();
  (function probe(){
    if(bridge()){run();return;}
    if(performance.now()-started>10000)return;
    setTimeout(probe,150);
  })();
}
// ---- Account. Asking once at boot is enough: the session cookie is the proof, and /me also returns
// the record we merge in. Nothing here is allowed to break the game if the server is down.
let toastTimer=0;
function toast(text){
  const el=$('toast');if(!el)return;
  el.textContent=text;el.hidden=false;el.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>{el.classList.remove('is-on');setTimeout(()=>{el.hidden=true;},280);},2800);
}
function syncAccountUi(){document.body.classList.toggle('is-signed-in',Boolean(account&&account.signedIn));}
async function initAccount(){
  try{account=await apiFetch('/me');}catch(_){account={signedIn:false};}
  // /me already carries the record, so the first reconcile needs no second round trip.
  apiCache=account.signedIn?{progress:account.progress||null,prefs:account.prefs||null}:null;
  syncAccountUi();
  // 资料/绑定状态跟着账号走，账号一变就把当前子页重画一遍。
  renderedPanel=null;
  if(document.body.dataset.view==='me')renderMe();
}
function signIn(){location.href=API_BASE+'/auth/login';}

// ---- 账号中心 ----------------------------------------------------------------
// 「我的」是分组行，点进去是一屏子页。子页只在 #me-page 里换内容，底部标签和棋盘视图都不动——
// 这正是上一版的问题：点「游戏设置」会先 go('game') 跳进棋盘，再弹窗。
let mePanel='',renderedPanel=null,sessionCount=null;
const ME_PANELS=['profile','security','devices','settings','data','about'];
const PANEL_TITLES={profile:'个人资料',security:'账号与安全',devices:'登录设备',settings:'游戏设置',data:'本机数据',about:'关于猫猫数独'};
const PREF_ROWS=[
  ['sound','音效','清脆落点、上扬和音与通关旋律'],
  ['motion','点击动画','系统开启“减少动态效果”时自动关闭'],
  ['haptic','轻振动','仅在支持振动的设备上生效'],
  ['live','棋盘冲突标记','冲突的位置会实时框出来'],
  ['letters','显示区域字母','不依赖颜色也能区分区域'],
];

function el(tag,className,text){const node=document.createElement(tag);if(className)node.className=className;if(text!=null)node.textContent=text;return node;}
function fact(label,value){const row=el('div','fact');row.append(el('span',null,label),el('b',null,value));return row;}
function stateChip(bound,text){return el('span','bind-state'+(bound?' is-on':''),text);}
function whenText(iso){
  const t=new Date(iso).getTime();
  if(!Number.isFinite(t))return '';
  const gap=Date.now()-t;
  if(gap<60000)return '刚刚登录';
  if(gap<3600000)return Math.round(gap/60000)+' 分钟前登录';
  if(gap<86400000)return Math.round(gap/3600000)+' 小时前登录';
  if(gap<7*86400000)return Math.round(gap/86400000)+' 天前登录';
  const d=new Date(t);
  return `${d.getMonth()+1} 月 ${d.getDate()} 日登录`;
}
function avatarNode(player,large){
  const span=el('span','account-avatar'+(large?' is-lg':''));
  const key=player?.avatarKey;
  if(key&&AVATAR_MAP.has(key))span.insertAdjacentHTML('afterbegin',avatarSVG(key));
  else if(player?.avatar){const img=el('img');img.src=player.avatar;img.alt='';img.referrerPolicy='no-referrer';span.append(img);}
  else span.textContent=(player?.name||'猫').trim().slice(0,1);
  return span;
}
// 服务端回一份账号快照，前端把它并进 account，省一次 /me。
function absorbAccount(data){
  if(!account)account={};
  if(data.player)account.player=data.player;
  if(data.bindings)account.bindings=data.bindings;
  if(data.services)account.services=data.services;
  account.signedIn=true;
  syncAccountUi();
}

async function signOut(){
  try{await apiFetch('/auth/logout',{method:'POST'});}catch(_){}
  account={signedIn:false};apiCache=null;apiNote='';sessionCount=null;renderedPanel=null;
  syncAccountUi();go('me',false);renderMe();renderRank();
}

function renderMe(){
  const box=$('me-account');if(!box)return;
  const doneAll=journey.completed.length,tips=tutorial?.learnedCount()??0;
  const signedIn=Boolean(account&&account.signedIn);
  box.replaceChildren();
  const card=el('div'),who=el('div','account-who');
  const name=el('b'),note=el('span');
  if(signedIn){
    card.className='account-card is-link';
    card.append(avatarNode(account.player,false));
    name.textContent=account.player?.name||'已登录';
    note.textContent=apiNote||'进度已跟着账号保存';
    who.append(name,note);
    card.append(who,el('span','account-go','›'));
    card.addEventListener('click',()=>{unlockAudio();sound('erase');go('me/profile');});
    $('me-storage').textContent='进度保存在澜图回声账号里，换设备、清缓存、iOS 七天清理都不会丢。';
  }else{
    card.className='account-card is-guest';
    name.textContent='还没有登录';
    note.textContent='用澜图回声账号登录，进度和成绩就会跟着账号走，换设备还在。';
    const btn=el('button','account-in','登录');
    btn.addEventListener('click',()=>{unlockAudio();sound('cat');signIn();});
    who.append(name,note);
    card.append(who,btn);
    $('me-storage').textContent='现在进度只存在这台设备的浏览器里（'+levels.length+' 关的通关记录与技巧掌握情况），换设备或清除浏览器数据会丢。';
  }
  box.append(card);

  $('me-summary').textContent='已通关 '+doneAll+' / '+levels.length+' 关，掌握 '+tips+' / 16 个技巧';
  $('me-skill-count').textContent=tips+' / 16';
  $('me-version').textContent='v'+APP_VERSION;
  $('me-data-note').textContent=doneAll+' / '+levels.length+' 关';
  $('me-profile-note').textContent=signedIn?((account.player?.name)||'头像与昵称'):'登录后设置';
  if(signedIn){
    const bindings=account.bindings||{};
    const count=[bindings.phone?.bound,bindings.wechat?.bound].filter(Boolean).length;
    $('me-security-note').textContent=count?('已绑定 '+count+' 项'):'手机号 · 微信';
    $('me-devices-note').textContent=sessionCount==null?'管理已登录设备':(sessionCount+' 台设备');
  }else{
    $('me-security-note').textContent='登录后可用';
    $('me-devices-note').textContent='登录后可用';
  }
  // 账号状态还没拿到之前别渲染子页：否则会先画成"未登录"，等 initAccount 回来时
  // renderedPanel 已占位，就不再重画了（从微信跳回来时正好踩这个）。
  const showPanel=Boolean(mePanel&&account);
  $('me-home').hidden=showPanel;
  $('me-page').hidden=!showPanel;
  if(showPanel)renderMePanel(mePanel);
  else if(!mePanel)renderedPanel=null;
}

function renderMePanel(panel,force){
  const page=$('me-page');if(!page)return;
  if(!force&&renderedPanel===panel)return;
  renderedPanel=panel;
  const wrap=el('div');
  const back=el('button','page-back','‹');back.type='button';back.setAttribute('aria-label','返回我的');
  back.addEventListener('click',()=>{unlockAudio();sound('erase');go('me');});
  const heading=el('header','page-head');heading.append(back,el('h1',null,PANEL_TITLES[panel]||'设置'));
  wrap.append(heading);
  page.replaceChildren(wrap);

  const signedIn=Boolean(account&&account.signedIn);
  const openToGuests=panel==='settings'||panel==='data'||panel==='about';
  if(!signedIn&&!openToGuests){
    wrap.append(loginPrompt());
    return;
  }
  if(panel==='profile')panelProfile(wrap);
  else if(panel==='security')panelSecurity(wrap);
  else if(panel==='devices')panelDevices(wrap);
  else if(panel==='settings')panelSettings(wrap);
  else if(panel==='data')panelData(wrap);
  else if(panel==='about')panelAbout(wrap);
}

function loginPrompt(){
  const card=el('div','bind-card');
  card.append(el('strong',null,'登录后才能使用'));
  card.append(el('p',null,'用澜图回声账号登录，资料、手机号、微信和成绩都会跟着账号走。没有账号可以直接注册。'));
  const btn=el('button','me-primary','登录 / 注册');
  btn.addEventListener('click',()=>{unlockAudio();sound('cat');signIn();});
  card.append(btn);
  return card;
}

// ---- 个人资料：内置猫猫头像 + 昵称
function panelProfile(parent){
  const player=account.player||{};
  let chosen=player.avatarKey||null;
  const current=chosen;
  parent.append(el('p','page-note','头像和昵称会显示在排行榜上，保存后立刻生效。'));

  const grid=el('div','avatar-grid');
  for(const item of AVATARS){
    const btn=el('button','avatar-opt'+(item.key===chosen?' is-on':''));
    btn.type='button';btn.setAttribute('aria-label','头像 '+item.key);
    btn.insertAdjacentHTML('afterbegin',avatarSVG(item.key));
    btn.addEventListener('click',()=>{
      chosen=item.key;
      for(const other of grid.children)other.classList.toggle('is-on',other===btn);
      unlockAudio();sound('erase');
    });
    grid.append(btn);
  }
  parent.append(grid);

  const field=el('label','field');
  const input=el('input');input.type='text';input.maxLength=16;input.value=player.name||'';input.placeholder='给猫咪起个名字';
  field.append(el('span',null,'昵称'),input,el('small',null,'1~16 个字，允许和别人重名。'));
  parent.append(field);

  const save=el('button','me-primary','保存');
  save.addEventListener('click',async()=>{
    const name=input.value.trim();
    if(!name){toast('昵称不能是空的');input.focus();return;}
    if(name===player.name&&chosen===current){toast('没有改动');return;}
    save.disabled=true;save.textContent='保存中…';
    try{
      absorbAccount(await apiFetch('/me/profile',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,avatarKey:chosen})}));
      renderedPanel=null;renderMe();renderRank();toast('已保存');
    }catch(_){
      save.disabled=false;save.textContent='保存';toast('没保存上，稍后再试');
    }
  });
  parent.append(save);

  if(player.avatarKey){
    const reset=el('button','me-ghost','用回澜图回声带来的头像');
    reset.addEventListener('click',async()=>{
      reset.disabled=true;
      try{
        absorbAccount(await apiFetch('/me/profile',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({avatarKey:null})}));
        renderedPanel=null;renderMe();toast('已改用澜图回声头像');
      }catch(_){toast('没改成，稍后再试');reset.disabled=false;}
    });
    parent.append(reset);
  }
}

// ---- 账号与安全：邮箱（澜图回声）/ 手机号 / 微信
function panelSecurity(parent){
  const bindings=account.bindings||{},services=account.services||{};
  parent.append(el('p','page-note','手机号和微信是附加绑定，用于找回账号、在别的设备确认是你。登录本身仍然走澜图回声。'));

  const mail=el('div','bind-card');
  const mailHead=el('div','bind-head');
  mailHead.append(el('strong',null,'邮箱'),stateChip(bindings.email?.bound,bindings.email?.bound?bindings.email.masked:'未提供'));
  mail.append(mailHead,el('p',null,'这是澜图回声账号本身的信息，也是登录猫猫数独的主身份。要改邮箱请到澜图回声的账号设置里操作。'));
  parent.append(mail);

  parent.append(phoneCard(services.sms));
  parent.append(wechatCard(services.wechat));
}

function phoneCard(service){
  const bound=account.bindings?.phone||{};
  const card=el('div','bind-card');
  const head=el('div','bind-head');
  head.append(el('strong',null,'手机号'),stateChip(bound.bound,bound.bound?bound.masked:'未绑定'));
  card.append(head);
  card.append(el('p',null,bound.bound?'换绑需要重新验证新号码。':'绑定后可用短信验证确认是你本人。'));

  if(!service?.available){
    card.append(el('p','page-note','短信服务还没有接入，暂时不能绑定。接入后这里会出现「获取验证码」。'));
    return card;
  }

  const form=el('div');form.hidden=bound.bound!==true?false:true;
  const phoneField=el('label','field');
  const phoneInput=el('input');phoneInput.type='tel';phoneInput.inputMode='numeric';phoneInput.autocomplete='tel';phoneInput.placeholder='11 位手机号';
  phoneField.append(el('span',null,'手机号'),phoneInput);
  const codeRow=el('div','code-row');
  const codeField=el('label','field');
  const codeInput=el('input');codeInput.type='text';codeInput.inputMode='numeric';codeInput.autocomplete='one-time-code';codeInput.maxLength=6;codeInput.placeholder='6 位验证码';
  codeField.append(el('span',null,'验证码'),codeInput);
  const send=el('button',null,'获取验证码');send.type='button';
  codeRow.append(codeField,send);
  const submit=el('button','me-primary','确认绑定');
  form.append(phoneField,codeRow,el('p','page-note','验证码 5 分钟内有效，60 秒后可重发。'),submit);
  card.append(form);

  let tick=0;
  const countdown=seconds=>{
    clearInterval(tick);
    if(!seconds){send.disabled=false;send.textContent='获取验证码';return;}
    send.disabled=true;send.textContent=seconds+' 秒后重发';
    let left=seconds;
    tick=setInterval(()=>{left-=1;if(left<=0){clearInterval(tick);send.disabled=false;send.textContent='获取验证码';}else send.textContent=left+' 秒后重发';},1000);
  };
  send.addEventListener('click',async()=>{
    const phone=phoneInput.value.replace(/\D/g,'');
    if(!/^1[3-9]\d{9}$/.test(phone)){toast('请输入正确的 11 位手机号');phoneInput.focus();return;}
    send.disabled=true;send.textContent='发送中…';
    try{
      const data=await apiFetch('/auth/phone/send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone})});
      // console 自测通道会把验证码回带，直接填好省得翻日志；正式通道没有这个字段。
      if(data.devCode){codeInput.value=data.devCode;toast('已发送（自测通道，验证码已自动填入）');}
      else toast('验证码已发送');
      countdown(60);codeInput.focus();
    }catch(error){
      if(error.wait){countdown(error.wait);toast(error.message||('请 '+error.wait+' 秒后再试'));}
      else{send.disabled=false;send.textContent='获取验证码';toast(error.message||'没能发送验证码，稍后再试');}
    }
  });
  submit.addEventListener('click',async()=>{
    const phone=phoneInput.value.replace(/\D/g,'');
    const code=codeInput.value.trim();
    if(!/^1[3-9]\d{9}$/.test(phone)){toast('请输入正确的 11 位手机号');phoneInput.focus();return;}
    if(!/^\d{6}$/.test(code)){toast('请输入 6 位验证码');codeInput.focus();return;}
    submit.disabled=true;submit.textContent='验证中…';
    try{
      absorbAccount(await apiFetch('/auth/phone/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone,code})}));
      renderMePanel('security',true);renderMe();toast('手机号已绑定');
    }catch(_){submit.disabled=false;submit.textContent='确认绑定';toast(apiMessage(_,'验证没有通过，再试一次'));}
  });

  const actions=el('div','bind-actions');
  if(bound.bound){
    const swap=el('button','primary','更换手机号');
    swap.addEventListener('click',()=>{form.hidden=!form.hidden;if(!form.hidden)phoneInput.focus();});
    const off=el('button','danger','解绑');
    off.addEventListener('click',async()=>{
      const yes=await confirmAction({title:'解绑手机号',text:'解绑后需要重新验证才能再绑上。登录不受影响，随时可以再绑。',ok:'解绑',danger:true});
      if(!yes)return;
      try{
        absorbAccount(await apiFetch('/auth/phone/unbind',{method:'POST'}));
        renderMePanel('security',true);renderMe();toast('已解绑');
      }catch(_){toast('没解绑成功，稍后再试');}
    });
    actions.append(swap,off);
  }
  if(actions.children.length)card.append(actions);
  return card;
}

function wechatCard(service){
  const bound=account.bindings?.wechat||{};
  const card=el('div','bind-card');
  const head=el('div','bind-head');
  head.append(el('strong',null,'微信'),stateChip(bound.bound,bound.bound?(bound.name||'已绑定'):'未绑定'));
  card.append(head);
  card.append(el('p',null,bound.bound?'绑定的微信号可以在需要时确认你的身份。':'绑定微信后，多一种确认身份的方式。'));

  if(!service?.available){
    card.append(el('p','page-note','微信开放平台的应用还没有配置好，暂时不能绑定。配置后这里会出现「去绑定」。'));
    return card;
  }
  const actions=el('div','bind-actions');
  if(bound.bound){
    const off=el('button','danger','解绑');
    off.addEventListener('click',async()=>{
      const yes=await confirmAction({title:'解绑微信',text:'解绑后随时可以再绑回来。登录仍然用澜图回声账号。',ok:'解绑',danger:true});
      if(!yes)return;
      try{
        absorbAccount(await apiFetch('/auth/wechat/unbind',{method:'POST'}));
        renderMePanel('security',true);renderMe();toast('已解绑微信');
      }catch(_){toast('没解绑成功，稍后再试');}
    });
    actions.append(off);
  }else{
    const bind=el('button','primary','去绑定');
    bind.addEventListener('click',()=>{unlockAudio();sound('cat');location.href=API_BASE+'/auth/wechat/start';});
    actions.append(bind);
  }
  card.append(actions);
  return card;
}

// ---- 登录设备
async function panelDevices(parent){
  parent.append(el('p','page-note','下面这些设备现在都还登录着你的账号。不是你的设备就移除掉。'));
  const list=el('div','device-list');
  list.append(el('p','page-note','正在读取…'));
  parent.append(list);

  let data;
  try{data=await apiFetch('/sessions');}
  catch(_){list.replaceChildren(el('p','page-note','读取失败，稍后再试。'));return;}
  sessionCount=data.sessions.length;
  list.replaceChildren();
  if(!data.sessions.length)list.append(el('p','page-note','还没有登录记录。'));
  for(const item of data.sessions){
    const card=el('div','device-item'+(item.current?' is-current':''));
    const info=el('div');
    const line=el('div','device-name');
    line.append(el('span',null,item.device));
    if(item.current)line.append(el('span','device-tag','本机'));
    info.append(line,el('span','device-meta',[whenText(item.createdAt),item.detail].filter(Boolean).join(' · ')));
    card.append(info);
    if(!item.current){
      const kick=el('button','device-kick','移除');
      kick.addEventListener('click',async()=>{
        kick.disabled=true;
        try{await apiFetch('/sessions/revoke',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:item.id})});}
        catch(_){kick.disabled=false;toast('没移除成功，稍后再试');return;}
        sessionCount=Math.max(0,(sessionCount||1)-1);
        renderMePanel('devices',true);renderMe();toast('已移除该设备');
      });
      card.append(kick);
    }
    list.append(card);
  }

  if((data.sessions||[]).length>1){
    const all=el('button','me-ghost','退出其他所有设备');
    all.addEventListener('click',async()=>{
      const yes=await confirmAction({title:'退出其他所有设备',text:'其他设备上的登录会立刻失效，需要重新登录。这台设备保持登录。',ok:'全部退出',danger:true});
      if(!yes)return;
      all.disabled=true;
      try{await apiFetch('/auth/logout-all',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({})});}
      catch(_){all.disabled=false;toast('没成功，稍后再试');return;}
      sessionCount=1;
      renderMePanel('devices',true);renderMe();toast('其他设备已退出');
    });
    parent.append(all);
  }
  const out=el('button','me-danger','退出登录（本机）');
  out.addEventListener('click',()=>{unlockAudio();sound('erase');signOut();toast('已退出登录');});
  parent.append(out);
}

// ---- 游戏设置（就地改，不再跳进棋盘）
function panelSettings(parent){
  parent.append(el('p','page-note','这些开关跟着账号走，换设备登录后还是你习惯的样子。'));
  const list=el('div','set-list');
  for(const [key,title,desc] of PREF_ROWS){
    const item=el('div','set-item');
    const copy=el('div','set-copy');
    copy.append(el('b',null,title),el('small',null,desc));
    const toggle=el('button','set-toggle');
    toggle.type='button';toggle.dataset.prefToggle=key;
    toggle.setAttribute('aria-pressed',String(Boolean(prefs[key])));
    toggle.setAttribute('aria-label',title);
    item.append(copy,toggle);
    list.append(item);
  }
  parent.append(list);
  parent.append(el('p','page-note',account?.signedIn?'已同步到你的账号。':'现在只改这台设备；登录后会跟着账号保存。'));
}

// ---- 本机数据
function panelData(parent){
  const done=journey.completed.length,tips=tutorial?.learnedCount()??0;
  const facts=el('div','fact-list');
  facts.append(
    fact('本机通关',done+' / '+levels.length+' 关'),
    fact('掌握技巧',tips+' / 16 个'),
    fact('当前关卡','第 '+(levelIndex+1)+' 关'),
    fact('存档位置',account?.signedIn?'账号 + 本机':'仅本机浏览器')
  );
  parent.append(facts);
  const signedIn=Boolean(account?.signedIn);
  parent.append(el('p','page-note',signedIn
    ?'「清除本机进度」只清掉这台浏览器缓存的那一份。账号里的成绩不受影响，刷新后会重新同步回来。'
    :'这台浏览器保存的通关记录和技巧掌握情况会被清空，无法恢复。'));

  const clear=el('button','me-danger','清除本机进度');
  clear.addEventListener('click',async()=>{
    const yes=await confirmAction({
      title:'清除本机进度',
      text:signedIn?'这台浏览器缓存的进度会被清空，账号里的成绩不受影响。':'通关记录和技巧掌握情况会被清空，无法恢复。',
      ok:'清除',danger:true,
    });
    if(!yes)return;
    // 清完直接刷新，让启动流程重新从云端对账 —— 就地清空再写回会把空进度推上云。
    try{localStorage.removeItem(JOURNEY_KEY);}catch(_){}
    location.reload();
  });
  parent.append(clear);
}

// ---- 关于
function panelAbout(parent){
  const services=account?.services||{};
  const facts=el('div','fact-list');
  facts.append(
    fact('版本','v'+APP_VERSION),
    fact('关卡',levels.length+' 关'),
    fact('账号',account?.signedIn?'澜图回声已连接':'未登录'),
    fact('短信服务',services.sms?.available?'已接入':(services.sms?.provider?'配置不完整':'待配置')),
    fact('微信服务',services.wechat?.available?'已接入':(services.wechat?.provider?'配置不完整':'待配置'))
  );
  parent.append(facts);
  parent.append(el('p','page-note','棋盘、关卡和音效全部在本地运行，不联网也能玩。登录后只有通关记录、设置和排行榜会上传。'));
}

// ---- 二次确认弹窗：解绑、清除、注销都走这里，避免误触
let confirmResolve=null;
function confirmAction(options={}){
  const dialog=$('confirm-dialog');
  if(!dialog)return Promise.resolve(false);
  $('confirm-title').textContent=options.title||'确认';
  $('confirm-text').textContent=options.text||'';
  const field=$('confirm-field'),input=$('confirm-input');
  field.hidden=!options.expect;
  if(options.expect){$('confirm-field-label').textContent='请输入「'+options.expect+'」以确认';input.value='';dialog.dataset.expect=options.expect;}
  else dialog.dataset.expect='';
  const ok=$('confirm-ok');
  ok.textContent=options.ok||'确定';
  ok.classList.toggle('is-danger',Boolean(options.danger));
  dialog.returnValue='';
  dialog.showModal();
  return new Promise(resolve=>{confirmResolve=resolve;});
}
function apiMessage(error,fallback){return (error&&error.message)||fallback;}
// ---- Leaderboards. Reading is public, so a visitor can look before signing in; only their own row
// needs an account. Ranks on how many levels a player has cleared, taken as that player's best day.
let rankRange='all',rankRows=null,rankBusy=false;
async function loadRank(range){
  rankRange=range;
  const tabs=$('rank-tabs');
  if(tabs)for(const b of tabs.querySelectorAll('button')){const on=b.dataset.range===range;b.classList.toggle('is-on',on);b.setAttribute('aria-pressed',on?'true':'false');}
  if(rankBusy)return;
  rankBusy=true;rankRows=null;renderRank();
  try{rankRows=await apiFetch('/leaderboard?range='+range);}
  catch(_){rankRows={error:true,entries:[],me:null};}
  rankBusy=false;renderRank();
}
function renderRank(){
  const box=$('rank-cards');if(!box)return;
  box.replaceChildren();
  const say=text=>{const p=document.createElement('p');p.className='rank-empty';p.textContent=text;box.append(p);};
  // Where the player stands matters most on an empty board, so the line is built before the list and
  // shown in every state except "could not load".
  const mine=rankRows?.me;
  const standing=()=>{
    const p=document.createElement('p');p.className='rank-me';
    p.textContent=mine
      ?('你的排名 '+mine.rank+' · 通关 '+mine.completed+' 关')
      :(account&&account.signedIn?'你还没有上榜，过一关就会出现在这里。':'登录之后，你的成绩也会出现在这个榜上。');
    return p;
  };
  if(rankBusy&&!rankRows){say('正在读取榜单…');return;}
  if(rankRows?.error){say('榜单暂时读不到，稍后再试。');return;}
  const entries=rankRows?.entries||[];
  if(!entries.length){say('这个榜单还没有人上榜 —— 过一关就是第一名。');box.append(standing());return;}
  const list=document.createElement('ol');list.className='rank-list';
  for(const entry of entries){
    const li=document.createElement('li');li.className='rank-item'+(entry.isMe?' is-me':'');
    const no=document.createElement('b');no.className='rank-no';no.textContent=entry.rank;
    const who=document.createElement('span');who.className='rank-who';
    who.append(rankAvatar(entry),el('span',null,entry.name));
    const score=document.createElement('span');score.className='rank-score';score.textContent='通关 '+entry.completed+' 关';
    li.append(no,who,score);list.append(li);
  }
  box.append(list,standing());
}
// 排行榜头像：优先用玩家挑的内置头像，其次澜图回声带来的，最后退回首字。
function rankAvatar(entry){
  const span=el('span','rank-avatar');
  if(entry.avatarKey&&AVATAR_MAP.has(entry.avatarKey))span.insertAdjacentHTML('afterbegin',avatarSVG(entry.avatarKey));
  else if(entry.avatar){const img=el('img');img.src=entry.avatar;img.alt='';img.referrerPolicy='no-referrer';span.append(img);}
  else span.textContent=(entry.name||'猫').trim().slice(0,1);
  return span;
}
let levelIndex=0,mode='cycle',focused=0,manualCheck=false,cells=[],lastTick=performance.now(),stroke=null,lastTouch=0,celebrationTimer;
let prefs={sound:true,motion:true,haptic:true,letters:false,live:true};
try{const saved=JSON.parse(localStorage.getItem('cat-garden-preferences-v2')||'null');if(saved)for(const key of Object.keys(prefs))if(typeof saved[key]==='boolean')prefs[key]=saved[key];}catch(_){}
let audioContext,masterGain,lastBrushSound=0,lastBrushHaptic=0,lastTap=null,activeHint=null;
// Distinct feel per action: placements get a two-pulse "land + settle", marks a light tick,
// erases a firmer single buzz, conflicts and wins read as clear rumble patterns.
function haptic(pattern,brush=false){
  if(!prefs.haptic||!navigator.vibrate)return;
  const now=performance.now();
  if(brush){if(now-lastBrushHaptic<90)return;lastBrushHaptic=now;pattern=6;}
  try{navigator.vibrate(pattern);}catch(_){}
}
function unlockAudio(){
  if(!prefs.sound)return;
  try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
    if(!audioContext){audioContext=new Audio();masterGain=audioContext.createGain();masterGain.gain.value=.14;masterGain.connect(audioContext.destination);}
    if(audioContext.state==='suspended')audioContext.resume().catch(()=>{});
  }catch(_){}
}
function sound(kind,brush=false){
  if(!prefs.sound||!audioContext||audioContext.state==='closed')return;
  const now=performance.now();if(brush&&now-lastBrushSound<45)return;if(brush)lastBrushSound=now;
  try{
    function voice(frequency,delay,duration,amplitude=.5,type='sine',endFrequency=frequency){
      const oscillator=audioContext.createOscillator(),gain=audioContext.createGain(),t=audioContext.currentTime+delay;
      oscillator.type=type;oscillator.frequency.setValueAtTime(frequency,t);if(endFrequency!==frequency)oscillator.frequency.exponentialRampToValueAtTime(endFrequency,t+Math.min(.07,duration));
      gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(amplitude,t+.006);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
      oscillator.connect(gain);gain.connect(masterGain);oscillator.start(t);oscillator.stop(t+duration+.03);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
    }
    if(kind==='cat'){
      const count=game()?E.inspect(currentLevel(),game().board).cats:1;
      const base=[392,440,494,523,587,659,698,784,880][Math.max(0,Math.min(8,count-1))];
      voice(170,0,.12,.38,'sine',65);             // soft landing
      voice(1400,0,.032,.16,'triangle',450);      // crisp attack
      voice(base*.72,.015,.25,.72,'triangle',base);// rising pluck
      voice(base*1.5,.075,.27,.34);               // bright fifth
      voice(base*2,.125,.30,.25);                // sparkle
      voice(base,.23,.22,.12);                   // short echo
    }else if(kind==='win'){
      [523,659,784,1047,1319].forEach((f,i)=>{voice(f,i*.10,.30,.58,'triangle');voice(f*1.5,i*.10+.03,.34,.16);});
      voice(262,0,.65,.25);
    }else if(kind==='trial'){
      voice(330,0,.13,.4,'triangle');voice(440,.08,.19,.32);voice(587,.15,.19,.15);
    }else if(kind==='error'){
      voice(185,0,.15,.4,'triangle',150);voice(140,.08,.15,.3);
    }else if(kind==='mark')voice(850,0,.055,.48,'sine',600);
    else voice(350,0,.075,.4,'sine',220);
  }catch(_){}
}
function motionOn(){return prefs.motion&&!reduceMotion.matches;}
function feedback(index,value,brush=false){
  const cell=cells[index];if(motionOn()&&cell?.animate){cell.getAnimations().forEach(a=>a.cancel());cell.animate([{transform:'scale(.91)'},{transform:'scale(1.045)'},{transform:'scale(1)'}],{duration:180,easing:'ease-out'});const glyph=cell.querySelector('.cat,.cross');if(glyph)glyph.animate([{transform:'scale(.45)',opacity:.35},{transform:'scale(1.12)',opacity:1},{transform:'scale(1)',opacity:1}],{duration:value===E.CAT?240:150,easing:'ease-out'});}
  const conflict=value===E.CAT&&E.inspect(currentLevel(),game().board).conflicts.includes(index);
  if(!game().won)sound(conflict?'error':value===E.CAT?(game().trial?'trial':'cat'):value===E.MARK?'mark':'erase',brush);
  haptic(conflict?[22,60,30]:value===E.CAT?[13,45,21]:value===E.MARK?9:13,brush);
}
function celebrate(){
  clearTimeout(celebrationTimer);$('celebration').replaceChildren();if(!motionOn())return;
  for(let i=0;i<18;i++){const bit=document.createElement('i');bit.style.setProperty('--x',(5+i*5.1)+'%');bit.style.setProperty('--color',colors[i%colors.length]);bit.style.setProperty('--delay',(i%5)*.045+'s');$('celebration').append(bit);}
  celebrationTimer=setTimeout(()=>$('celebration').replaceChildren(),1600);
}
function applyPrefs(){
  for(const [key,id] of Object.entries({sound:'sound-setting',motion:'motion-setting',haptic:'haptic-setting',letters:'letters-setting',live:'live-check'}))$(id).checked=prefs[key];
  // 「我的 → 游戏设置」用的是同一份 prefs，开关状态跟着一起刷新，两边永远一致。
  for(const button of document.querySelectorAll('[data-pref-toggle]'))button.setAttribute('aria-pressed',String(Boolean(prefs[button.dataset.prefToggle])));
  document.body.classList.toggle('show-letters',prefs.letters);document.body.classList.toggle('no-motion',!prefs.motion);
  if(masterGain)masterGain.gain.value=prefs.sound ? .14 : 0;
  if(!motionOn()){$('celebration').replaceChildren();document.getAnimations().forEach(a=>a.cancel());}
}
function setPref(key,value){
  if(!(key in prefs))return;
  prefs[key]=Boolean(value);
  applyPrefs();
  persist(PREFS_KEY,prefs);
  if(key==='sound'&&prefs.sound){unlockAudio();sound('cat');}
  manualCheck=false;render();
}
if(new URLSearchParams(location.search).get('embed')==='1')document.body.classList.add('embed');
try{const ids=new Set();if(!Array.isArray(levels)||!levels.length)throw Error('没有关卡');levels.forEach(l=>{E.validateLevel(l);if(ids.has(l.id))throw Error('重复的关卡 id');ids.add(l.id);});}catch(error){$('status').textContent='关卡数据错误：'+error.message;$('status').hidden=false;return;}
function currentLevel(){return levels[levelIndex];}
function game(){return sessions.get(currentLevel().id);}
function newGame(level){return{board:J.startBoard(level),givens:J.forLevel(level).givens.slice(),history:[],elapsed:0,started:false,paused:false,won:false,trial:null,trialNotes:[]};}
function modalOpen(){return $('settings-dialog').open||$('tutorial-dialog').open||$('picker-dialog').open||$('confirm-dialog').open;}
function time(ms){const seconds=Math.floor(ms/1000);return String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');}
function tick(){const now=performance.now(),g=game();if(g&&g.started&&!g.paused&&!g.won&&!document.hidden&&!modalOpen())g.elapsed+=now-lastTick;lastTick=now;if(g)$('timer').textContent=time(g.elapsed);}
function record(kind='move'){tick();const g=game();g.history.push({board:g.board.slice(),elapsed:g.elapsed,started:g.started,paused:g.paused,won:g.won,trial:T.clone(g.trial),trialNotes:T.copyNotes(g.trialNotes),kind});}
// The home route: one continuous winding trail, one rung per level, no legs. 162 rungs in a column
// would make a 12,000px page, so the trail lives in its own scroll box and only the rungs around the
// viewport exist in the DOM. Every rung is placed absolutely on a track of fixed height, so the
// scroll geometry stays exact and nothing shifts as that window of rendered levels slides.
const STEP=74,KEEP=9;
let trailEl=null,trailH=0;
const nodeEls=new Map();
// Head and tail room, half the box each, so even the first and the last level can sit in the middle.
// Measured once per build and cached: paintTrail runs on every scroll frame and must not read layout.
let trailPadPx=200;
function measurePad(){
  const box=$('path-scroll');
  const vh=box&&box.clientHeight?box.clientHeight:innerHeight;
  trailPadPx=Math.max(150,Math.min(640,Math.round(vh*.5)));
}
function trailHeight(){return (levels.length-1)*STEP+trailPadPx*2;}
function nodeY(i){return trailPadPx+(levels.length-1-i)*STEP;}
// A gentle two-wave S - a six-level swing plus a slow drift - so the rungs read as a path, not a ladder.
function nodeX(i){return 50+23*Math.sin(i*Math.PI/3)+6*Math.sin(i*.5236+1.1);}
function buildTrail(path,total){
  path.replaceChildren();nodeEls.clear();
  const track=document.createElement('div');track.className='trail';track.style.height=total+'px';
  const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
  svg.setAttribute('class','trail-line');svg.setAttribute('viewBox','0 0 100 '+total);svg.setAttribute('preserveAspectRatio','none');
  let d='';
  for(let i=0;i<levels.length;i++)d+=(i?' L ':'M ')+nodeX(i)+' '+nodeY(i);
  const line=document.createElementNS(ns,'path');line.setAttribute('d',d);line.setAttribute('vector-effect','non-scaling-stroke');
  svg.append(line);track.append(svg);

  const cat=document.createElement('div');cat.className='trail-cat';cat.id='trail-cat';cat.setAttribute('aria-hidden','true');
  cat.innerHTML=catSVG;track.append(cat);

  path.append(track);trailEl=track;trailH=total;
}
function buildNode(i){
  const b=document.createElement('button');b.type='button';b.dataset.index=i;
  b.style.left=nodeX(i)+'%';b.style.top=nodeY(i)+'px';
  b.addEventListener('click',()=>{sound('erase');openLevel(i);});
  return b;
}
// Re-dress in place: a rung that scrolls back into view must show the progress it has by then.
function dressNode(el,i){
  const l=levels[i],done=journey.completed.includes(l.id),here=i===levelIndex;
  el.className='node'+(done?' is-done':'')+(here?' is-here':'');
  el.setAttribute('aria-label','第 '+(i+1)+' 关，'+l.size+' × '+l.size+(done?'，已完成':''));
  if(here)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');
  el.innerHTML='<span class="node-no">'+(l.source?.type==='user-screenshot'?l.source.referenceLevel:i+1)+'</span>'+(done?'<span class="node-tick">✓</span>':'');
}
// Everything outside the viewport is empty track, which is what keeps a 162-level trail cheap.
function paintTrail(){
  if(!trailEl)return;
  const n=levels.length,box=$('path-scroll');
  const vh=box&&box.clientHeight?box.clientHeight:innerHeight;
  const top=box?box.scrollTop:0,pad=trailPadPx;
  const hi=Math.ceil(n-1-(top-KEEP*STEP-pad)/STEP);
  const lo=Math.floor(n-1-(top+vh+KEEP*STEP-pad)/STEP);
  const from=Math.max(0,Math.min(lo,n-1)),to=Math.min(n-1,Math.max(hi,from));
  for(const [i,el] of nodeEls)if(i<from||i>to){el.remove();nodeEls.delete(i);}
  for(let i=from;i<=to;i++){
    let el=nodeEls.get(i);
    if(!el){el=buildNode(i);nodeEls.set(i,el);trailEl.append(el);}
    dressNode(el,i);
  }
}
// Repaint as the box scrolls, throttled to one frame so a flick does not queue a hundred repaints.
let trailQueued=false;
$('path-scroll').addEventListener('scroll',()=>{
  if(document.body.dataset.view!=='home'||trailQueued)return;
  trailQueued=true;requestAnimationFrame(()=>{trailQueued=false;paintTrail();});
},{passive:true});
function renderPath(){
  const path=$('path');if(!path)return;
  if(!trailEl||!path.contains(trailEl))measurePad();
  const total=trailHeight();
  if(!trailEl||trailH!==total||!path.contains(trailEl))buildTrail(path,total);
  paintTrail();
  moveCat(levelIndex,false);
  const doneAll=journey.completed.length,tips=tutorial?.learnedCount()??0;
  $('home-progress').textContent=doneAll+' / '+levels.length+' 关';
  $('home-skill').textContent='技巧 '+tips+' / 16';
  $('home-done').textContent='已通关 '+doneAll;
  $('me-skill-count').textContent=tips+' / 16';
  renderMe();
}
// Every level as a compact grid, so picking a specific number takes one tap instead of a long scroll.
function renderPicker(){
  const grid=$('picker-grid');if(!grid)return;grid.replaceChildren();
  levels.forEach((l,i)=>{
   const done=journey.completed.includes(l.id),here=i===levelIndex;
   const b=document.createElement('button');
   b.className='pick-node'+(done?' is-done':'')+(here?' is-here':'');
   b.dataset.index=i;b.dataset.state=done?'done':'todo';
   b.style.setProperty('--node-color',(l.regionColors||defaultColors)[l.regions[0][0]]||'#8fcbbb');
   b.setAttribute('aria-label','第 '+(i+1)+' 关，'+l.size+' × '+l.size+'，难度 '+J.difficultyFor(l)+' 只猫'+(done?'，已完成':''));
   if(here)b.setAttribute('aria-current','step');
   // Difficulty as a small pip strip in the corner: enough to pick a board by, too small to crowd the grid.
   b.innerHTML='<span>'+(i+1)+'</span><u class="pick-diff" data-level="'+J.difficultyFor(l)+'">'+'●'.repeat(J.difficultyFor(l))+'</u>'+(done?'<i>✓</i>':'');
   b.addEventListener('click',()=>{closeDialog('picker-dialog');openLevel(i);sound('erase');});
   grid.append(b);
  });
  $('picker-total').textContent=journey.completed.length+' / '+levels.length+' 关完成';
}
function moveCat(index,animate=true){
  const cat=$('trail-cat');if(!cat||index<0)return;
  cat.style.transition=animate?'':'none';
  cat.style.left=nodeX(index)+'%';cat.style.top=nodeY(index)+'px';
  cat.classList.toggle('is-moving',animate);
  if(animate)setTimeout(()=>cat.classList.remove('is-moving'),620);
}
// Park the current rung in the middle of the trail box. The geometry is known exactly, so this is
// arithmetic rather than a DOM measurement - the two can never drift apart.
function centerCat(smooth=true){
  const box=$('path-scroll');if(!box)return;
  const vh=box.clientHeight||innerHeight;
  const top=Math.max(0,Math.min(Math.max(0,box.scrollHeight-vh),nodeY(levelIndex)-vh*.5));
  box.scrollTo({top,behavior:smooth&&prefs.motion&&!reduceMotion.matches?'smooth':'instant'});
  paintTrail();
}
function selectLevel(index){
  if(!Number.isInteger(index)||index<0||index>=levels.length)throw Error('关卡编号无效');finishStroke(true);tutorial?.stop();lastTap=null;clearHint();tick();levelIndex=index;manualCheck=false;focused=0;
  const l=currentLevel();colors=l.regionColors||defaultColors;if(!sessions.has(l.id))sessions.set(l.id,newGame(l));
  $('level-title').textContent=l.source?.type==='user-screenshot'?l.name:'第 '+(index+1)+' 关';$('level-subtitle').textContent=l.size+' × '+l.size+(game().givens.length?' · '+game().givens.length+' 只猫已就位':(l.source?' · 原始空盘':' · 自由推理'));
  // Difficulty as a cat count, so a player can see what they are walking into before the first move.
  // Text only - the subtitle line is kept short on purpose so it never wraps on a phone.
  const tier=J.difficultyFor(l);
  $('level-subtitle').textContent+=' · 难度 '+'🐱'.repeat(tier)+' '+J.DIFFICULTY_TEXT[tier];
  journey.current=l.id;saveJourney();
  $('board').style.setProperty('--n',l.size);$('board').setAttribute('aria-rowcount',l.size);$('board').setAttribute('aria-colcount',l.size);$('board').replaceChildren();cells=[];
  for(let r=0;r<l.size;r++){const row=document.createElement('div');row.setAttribute('role','row');row.style.display='contents';for(let c=0;c<l.size;c++){
    const i=r*l.size+c,b=document.createElement('button');b.className='cell';b.dataset.index=i;b.type='button';b.setAttribute('role','gridcell');b.setAttribute('aria-rowindex',r+1);b.setAttribute('aria-colindex',c+1);b.style.setProperty('--cell-color',colors[l.regions[r][c]]);
    b.addEventListener('click',ev=>{if(ev.detail===0){unlockAudio();act(i);}});
    b.addEventListener('contextmenu',ev=>{ev.preventDefault();if(ev.pointerType==='touch'||performance.now()-lastTouch<800||stroke)return;unlockAudio();act(i,'mark');});
    b.addEventListener('focus',()=>{focused=i;cells.forEach((cell,j)=>cell.tabIndex=j===i?0:-1);});b.addEventListener('keydown',ev=>onCellKey(ev,i));row.append(b);cells.push(b);
  }$('board').append(row);}
  clearTimeout(celebrationTimer);$('celebration').replaceChildren();lastTick=performance.now();render();renderPath();
  const unit=J.unitFor(l);
  if(unit.lessons.length)setTimeout(()=>{if(document.body.dataset.view!=='game')return;
   // A lesson about a dead end (假设 + 撤回) is armed rather than shown: it waits for the board to actually
   // run out of forced moves, so it never interrupts a board the player can still work out on their own.
   if(unit.lessons.every(i=>i===13))tutorial?.armWhenItMatters(13);
   else tutorial?.openUnit(unit);
  },0);
 }
function render(message,quiet=false,guideEvent={}){
  const l=currentLevel(),g=game();syncHint();const result=E.inspect(l,g.board),show=prefs.live||manualCheck||Boolean(g.trial),wasWon=g.won;g.won=result.won;
  cells.forEach((b,i)=>{const r=Math.floor(i/l.size),c=i%l.size,region=l.regions[r][c],v=g.board[i],conflict=show&&result.conflicts.includes(i);
    if(b.dataset.state!==String(v)){b.innerHTML='<span class="region-letter" aria-hidden="true">'+String.fromCharCode(65+region)+'</span>'+(v===E.CAT?catSVG:v===E.MARK?crossSVG:'');b.dataset.state=v;}
    const trialRoot=g.trial?.root===i,changed=Boolean(g.trial&&g.board[i]!==g.trial.baseBoard[i]);
    const note=(!trialRoot&&!changed)?g.trialNotes.find(item=>item.index===i):null;
    b.classList.toggle('given-cat',g.givens.includes(i));b.classList.toggle('trial-root',trialRoot);b.classList.toggle('trial-change',changed);b.classList.toggle('trial-rejected',Boolean(note?.excluded));b.classList.toggle('trial-tried',Boolean(note&&!note.excluded));
    const badgeText=trialRoot?'假':note?(note.excluded?'排':'试'):'';let badge=b.querySelector('.trial-badge');
    if(badgeText){if(!badge){badge=document.createElement('span');badge.className='trial-badge';badge.setAttribute('aria-hidden','true');b.append(badge);}badge.textContent=badgeText;}else badge?.remove();
    const hintTarget=Boolean(activeHint?.hint.targets.includes(i))&&(activeHint.hint.value===undefined||v!==activeHint.hint.value),hintEvidence=Boolean(activeHint?.hint.evidence?.includes(i));
    b.classList.toggle('hint-target',hintTarget);b.classList.toggle('hint-evidence',hintEvidence);
    let preview=b.querySelector('.hint-preview');if(hintTarget&&activeHint.hint.value!==undefined&&v===E.EMPTY){if(!preview){preview=document.createElement('span');preview.className='hint-preview';preview.setAttribute('aria-hidden','true');b.append(preview);}preview.innerHTML=activeHint.hint.value===E.CAT?catSVG:crossSVG;}else preview?.remove();
    b.classList.toggle('conflict',conflict);b.setAttribute('aria-label','第 '+(r+1)+' 行，第 '+(c+1)+' 列，区域 '+String.fromCharCode(65+region)+'，'+['空白','已标记排除','猫咪'][v]+(g.givens.includes(i)?'，已安置的固定猫':'')+(trialRoot?'，假设起点':changed?'，本轮假设改动':note?(note.excluded?'，上次假设后手动排除':'，之前试过的假设'):'')+(conflict?'，存在冲突':''));b.setAttribute('aria-selected',String(v===E.CAT));b.tabIndex=i===focused?0:-1;b.disabled=g.paused||g.won;
  });
  $('board').classList.toggle('hinting',Boolean(activeHint&&(activeHint.hint.targets.length||activeHint.hint.evidence?.length)));$('board').inert=g.paused;$('board-shell').style.visibility=g.paused?'hidden':'visible';$('cat-count').textContent=result.cats+' / '+l.size;$('progress').max=l.size;$('progress').value=Math.min(l.size,result.cats);$('progress').setAttribute('aria-valuetext','已放 '+result.cats+' 只，需要 '+l.size+' 只');$('timer').textContent=time(g.elapsed);
  $('undo').disabled=!g.history.length;$('reset').disabled=!g.started&&!g.board.some(Boolean);$('pause').disabled=g.won;$('pause').textContent=g.paused?'▷':'Ⅱ';$('pause').setAttribute('aria-label',g.paused?'继续游戏':'暂停游戏');$('pause-cover').hidden=!g.paused;$('trial-open').disabled=g.paused||g.won||Boolean(g.trial);$('trial-open').setAttribute('aria-pressed',String(Boolean(g.trial)));$('hint-request').disabled=g.paused||g.won;
  if(!quiet){$('status').className='status';if(g.won){$('status').textContent='每行、每列、每种颜色都刚刚好。';$('status').classList.add('success');}
    else if(g.paused)$('status').textContent='游戏和计时已暂停。';else if(show&&result.issues.length){$('status').textContent=result.issues.join('；')+'。';$('status').classList.add('error');}
    else $('status').textContent=message||(g.started?'慢慢想，不着急。':'猫咪不能挨在一起，斜角也不行。');}
  $('win').hidden=!g.won;$('win-detail').textContent='用时 '+time(g.elapsed)+' · '+l.size+' 只猫，各得其所。';$('next').textContent=levelIndex<levels.length-1?'下一关':'再玩这一关';
  renderTrial();
  tutorial?.sync({...guideEvent,painting:Boolean(stroke?.painting)});drawHint();
  if(g.won&&!wasWon){if(!journey.completed.includes(l.id)){journey.completed.push(l.id);saveJourney();}haptic([28,55,28,55,28,55,80]);sound('win');celebrate();$('next').focus();}if(wasWon!==g.won)renderPath();
}
function locationName(index){const n=currentLevel().size;return '第 '+(Math.floor(index/n)+1)+' 行第 '+(index%n+1)+' 列';}
function setLabel(id,text){$(id).querySelector('.btn-label').textContent=text;}
function renderTrial(){
  const g=game(),trial=g.trial,bar=$('toolbar'),open=$('trial-open'),root=trial?.root??null;
  bar.classList.toggle('trial-mode',Boolean(trial));
  bar.setAttribute('aria-label',trial?'假设推演操作':'棋盘操作');
  const issues=trial&&root!==null?T.contradictions(currentLevel(),g.board):[];
  if(!trial){
   setLabel('trial-open','假设');setLabel('hint-request','提示');setLabel('tutorial-open','技巧');
   open.title='保存当前盘面，试着假设某格有猫';open.removeAttribute('aria-description');
   $('hint-request').disabled=g.paused||g.won;$('tutorial-open').disabled=false;return;
  }
  // The trial state is carried by the swapped button labels and the amber toolbar only — no extra text row.
  const hint=root===null?'已保存原盘：点一个空格当作假设起点':'假设起点 '+locationName(root)+(issues.length?'，发现 '+issues.length+' 处矛盾':'，这一轮随时可以退回');
  open.title=hint;open.setAttribute('aria-description',hint);
  setLabel('trial-open',root===null?'取消假设':'撤回假设');setLabel('hint-request','排除起点');setLabel('tutorial-open','保留推演');
  open.disabled=g.paused;$('hint-request').disabled=g.paused||root===null;$('tutorial-open').disabled=g.paused||root===null||issues.length>0;
}
function startTrial(){finishStroke(true);const g=game();if(g.paused||g.won||g.trial)return;unlockAudio();record('trial-start');g.trial=T.create(g.board,g.trialNotes);g.started=true;render('点一格，开始这次假设。');sound('trial');haptic([10,40,16]);}
function chooseTrialRoot(index){
  const g=game();if(!g.trial||g.trial.root!==null)return;
  if(g.board[index]===E.CAT){render('请选择还没有猫的格子作为假设起点。');return;}
  record();g.trial=T.choose(g.trial,g.board,index);g.board=E.setCell(g.board,index,E.CAT);focused=index;g.started=true;manualCheck=false;render();feedback(index,E.CAT);
}
function returnTrial(exclude=false){
  finishStroke(true);const g=game();if(!g.trial||g.paused)return;const root=g.trial.root;record('trial-return');
  const restored=T.restore(g.trial,exclude);g.board=restored.board;g.trialNotes=restored.notes;g.trial=null;manualCheck=false;$('celebration').replaceChildren();
  render(root===null?'已取消假设。':exclude?'已撤回整轮推演，并手动排除假设起点。':'已撤回整轮推演，原来的标记已恢复。');renderPath();sound('erase');haptic([10,40,16]);
  if(root!==null){focused=root;cells[root].focus({preventScroll:true});}
}
function keepTrial(){
  finishStroke(true);const g=game();if(!g.trial||g.trial.root===null||g.paused||T.contradictions(currentLevel(),g.board).length)return;
  record('trial-keep');g.trialNotes=g.trialNotes.filter(note=>g.board[note.index]===g.trial.baseBoard[note.index]);g.trial=null;render('已保留本轮推演。仍可用撤销恢复。');sound('cat');haptic([16,50,24]);
}
function act(index,chosen=mode){const g=game();if(g.paused||g.won||modalOpen())return;if(g.trial?.root===null){chooseTrialRoot(index);return;}const old=g.board[index],value=chosen==='cat'?(old===E.CAT?E.EMPTY:E.CAT):chosen==='mark'?(old===E.MARK?E.EMPTY:E.MARK):(old===E.EMPTY?E.MARK:E.EMPTY);setCell(index,value);}
function setCell(index,value){const g=game();if(g.paused||g.won||modalOpen())return;if(g.givens.includes(index)){render('这只猫已安置，是本关的固定线索。');return;}if(g.trial?.root===null){if(value===E.CAT)chooseTrialRoot(index);else render('先点一格作为假设猫。');return;}if(g.trial?.root===index&&value!==E.CAT){render('假设起点已锁定。用“撤回假设”恢复原盘。');return;}const next=E.setCell(g.board,index,value);if(g.board[index]===value)return;record();g.board=next;g.trialNotes=g.trialNotes.filter(note=>note.index!==index);g.started=true;focused=index;manualCheck=false;render();feedback(index,value);}

function tapCell(index){
 const g=game(),now=performance.now();
 if(mode!=='cycle'||g.trial?.root===null){lastTap=null;act(index);return;}
 if(lastTap&&lastTap.index===index&&lastTap.level===levelIndex&&now-lastTap.time<420&&g.history.length===lastTap.after){
  const before=lastTap.before,historyLength=g.history.length;lastTap=null;setCell(index,E.CAT);
  if(g.history.length===historyLength+1){g.history.splice(historyLength-1,2,before);}
 }else{
  const previous=g.history.length;act(index);lastTap=g.history.length>previous?{index,level:levelIndex,time:now,after:g.history.length,before:g.history[g.history.length-1]}:null;
 }
}
function hintKey(){return currentLevel().id+':'+game().board.join('')+':'+(game().trial?'trial:'+game().trial.root:'normal');}
function clearHint(){
 activeHint=null;$('hint-panel').hidden=true;$('hint-lines').replaceChildren();$('board').classList.remove('hinting');delete $('board').dataset.hintKind;$('hint-request').setAttribute('aria-expanded','false');
 cells.forEach(cell=>{cell.classList.remove('hint-target','hint-evidence','hint-lost','hint-choice');cell.removeAttribute('aria-describedby');cell.querySelectorAll('.hint-preview,.hint-step,.hint-lost-x').forEach(el=>el.remove());});
}
function syncHint(){
 if(!activeHint||activeHint.key===hintKey())return;
 const g=game(),h=activeHint.hint,changed=g.board.flatMap((v,i)=>v!==activeHint.board[i]?[i]:[]);
 if(activeHint.trial!==(g.trial?'trial:'+g.trial.root:'normal')||h.value===undefined||changed.some(i=>!h.targets.includes(i)||(g.board[i]!==h.value&&g.board[i]!==E.EMPTY&&!(h.value===E.CAT&&g.board[i]===E.MARK)))||h.targets.every(i=>g.board[i]===h.value)){clearHint();return;}
 activeHint.key=hintKey();activeHint.board=g.board.slice();
}
function noteSkillUsed(kind){
  // The skills counter used to tick up only when a guided lesson finished. Now that level 1 is the
  // only guided level, it tracks techniques the player has actually met on a board instead.
  tutorial?.noteSkillUsed?.(kind);
}
function presentHint(hint){
 // Asking for a hint must not tear down a running lesson. Without this, tapping 提示 to work a board
 // forward would silently close the 假设 walk-through at the exact moment the player needs it most.
 if(!tutorial?.teaching?.())tutorial?.stop();
 clearHint();const g=game();activeHint={hint,key:hintKey(),board:g.board.slice(),trial:g.trial?'trial:'+g.trial.root:'normal'};
  noteSkillUsed(hint.kind);
  const visual=window.CatHints.visual(currentLevel(),g.board,hint);activeHint.visual=visual;
 $('hint-title').textContent=visual.title;$('hint-short').textContent=visual.text;$('hint-text').textContent=hint.text||visual.text;$('hint-more').open=false;
 $('hint-kicker').textContent=g.trial?'💡 当前假设中的线索':'💡 看棋盘上的线索';$('hint-equation').replaceChildren();
 for(const token of visual.tokens){const el=document.createElement('span');el.textContent=token.label;el.className=token.color===undefined?'hint-token':'hint-color';if(token.color!==undefined)el.style.setProperty('--region-color',colors[token.color]);$('hint-equation').append(el);}
 $('hint-apply').hidden=hint.value===undefined;$('hint-apply').textContent=hint.value===2?'放入猫咪':'标记这些 ×';
 $('hint-legend').hidden=hint.value===undefined;$('hint-legend').replaceChildren();
 const legend=hint.kind==='lookahead-region'?['假：试放一只猫','红 ×：这个颜色无处放']:hint.kind?.endsWith('-single')?['亮格：唯一候选','虚线猫：待确认']:['① 金框：依据','② 虚线：待操作'];for(const label of legend){const item=document.createElement('span');item.textContent=label;$('hint-legend').append(item);}
 $('hint-request').setAttribute('aria-expanded','true');render();
 const br=$('board').getBoundingClientRect(),headroom=$('hint-panel').offsetHeight+24;if(br.top<headroom||br.bottom>innerHeight-20)window.scrollTo({top:Math.max(0,scrollY+br.top-headroom),behavior:'instant'});positionHint();
}
function requestHint(){
 finishStroke(true);lastTap=null;const g=game();if(g.paused||g.won||modalOpen())return;unlockAudio();
 if(g.trial?.root===null){presentHint({kind:'info',title:'先选一个假设起点',short:'点一个空格试着放猫；原盘已经保存。',targets:[],evidence:window.CatHints.candidates(currentLevel(),g.board)});return;}
 presentHint(window.CatHints.find(currentLevel(),g.board));
}
function applyHint(){
 const g=game();if(!activeHint||activeHint.key!==hintKey()||g.paused||g.won)return;
 const {targets,value}=activeHint.hint;if(value===undefined)return;
 const changes=targets.filter(i=>g.board[i]!==value&&i!==g.trial?.root);if(!changes.length)return;
 record('hint');for(const i of changes)g.board[i]=value;g.trialNotes=g.trialNotes.filter(note=>!changes.includes(note.index));g.started=true;lastTap=null;clearHint();render();feedback(changes[0],value);
}
let hintLayoutFrame=0;
function positionHint(){
 cancelAnimationFrame(hintLayoutFrame);hintLayoutFrame=requestAnimationFrame(()=>{
  if(!activeHint||$('hint-panel').hidden)return;const card=$('hint-panel'),board=$('board'),r=board.getBoundingClientRect(),vw=document.documentElement.clientWidth,vh=innerHeight;
  const width=Math.min(370,vw-24);card.style.width=width+'px';const height=card.offsetHeight;let x=Math.max(12,Math.min(r.left,vw-width-12)),y=r.top-height-12;
  if(vw-r.right>width+28){x=r.right+18;y=Math.max(12,Math.min(r.top,vh-height-12));}
  else if(r.left>width+28){x=r.left-width-18;y=Math.max(12,Math.min(r.top,vh-height-12));}
  else if(y<8){const rects=activeHint.hint.targets.map(i=>cells[i].getBoundingClientRect());const top=rects.length?Math.min(...rects.map(t=>t.top)):r.top,bottom=rects.length?Math.max(...rects.map(t=>t.bottom)):r.bottom;if(top>height+20)y=top-height-12;else if(bottom+height+20<vh)y=bottom+12;else y=8;}
  card.style.left=x+'px';card.style.top=Math.max(8,Math.min(y,vh-height-8))+'px';drawHintLines();
 });
}
function drawHint(){
 const g=game();if(!activeHint)return;if(g.won||g.paused){clearHint();return;}$('hint-panel').hidden=false;
 const h=activeHint.hint;$('board').dataset.hintKind=h.kind;const remaining=h.targets.filter(i=>h.value===undefined||g.board[i]!==h.value);
 for(const [i,cell]of cells.entries()){
  cell.querySelectorAll('.hint-step,.hint-lost-x').forEach(el=>el.remove());cell.classList.toggle('hint-choice',h.value===undefined&&h.targets.includes(i));
  const lost=h.kind==='lookahead-region'&&h.evidence?.includes(i);cell.classList.toggle('hint-lost',Boolean(lost));
  if(lost){const glyph=document.createElement('span');glyph.className='hint-lost-x';glyph.textContent='×';glyph.setAttribute('aria-hidden','true');cell.append(glyph);}
  const tag=h.kind==='lookahead-region'&&i===remaining[0]?'假':i===remaining[0]?(h.value===undefined?'?':'②'):i===h.evidence?.[0]?'①':'';
  if(tag){const badge=document.createElement('span');badge.className='hint-step';badge.textContent=tag;badge.setAttribute('aria-hidden','true');cell.append(badge);cell.setAttribute('aria-describedby','hint-title hint-short');}
 }
 positionHint();
}
function drawHintLines(){
 const svg=$('hint-lines');svg.replaceChildren();if(!activeHint)return;const n=currentLevel().size,r=$('board').getBoundingClientRect();svg.setAttribute('viewBox','0 0 '+r.width+' '+r.height);svg.style.width=r.width+'px';svg.style.height=r.height+'px';
 const ns='http://www.w3.org/2000/svg';
 for(const {axis,index}of activeHint.visual.axes){const first=cells[axis==='row'?index*n:index].getBoundingClientRect(),last=cells[axis==='row'?index*n+n-1:(n-1)*n+index].getBoundingClientRect(),rect=document.createElementNS(ns,'rect');rect.setAttribute('x',first.left-r.left+2);rect.setAttribute('y',first.top-r.top+2);rect.setAttribute('width',last.right-first.left-4);rect.setAttribute('height',last.bottom-first.top-4);rect.setAttribute('rx','8');svg.append(rect);}
 if(activeHint.hint.kind==='lookahead-region'&&activeHint.hint.evidence?.length){const a=cells[activeHint.hint.targets[0]].getBoundingClientRect(),b=cells[activeHint.hint.evidence[0]].getBoundingClientRect(),line=document.createElementNS(ns,'path');line.setAttribute('d','M '+(a.left+a.width/2-r.left)+' '+(a.top+a.height/2-r.top)+' L '+(b.left+b.width/2-r.left)+' '+(b.top+b.height/2-r.top));line.setAttribute('stroke-dasharray','5 5');svg.append(line);}
}
$('hint-more').addEventListener('toggle',positionHint);
window.addEventListener('resize',positionHint);window.addEventListener('scroll',positionHint,{passive:true});

// A stroke records one undo snapshot. Revisits never toggle and cats are protected.
function paint(index){if(!stroke||stroke.visited.has(index)||game().trial?.root===null)return;stroke.visited.add(index);const g=game();if(g.board[index]===E.CAT||g.board[index]===stroke.value)return;if(!stroke.changed)record();g.board[index]=stroke.value;g.trialNotes=g.trialNotes.filter(note=>note.index!==index);g.started=true;stroke.changed++;focused=index;manualCheck=false;render(undefined,true);feedback(index,stroke.value,true);}
function startPainting(){if(!stroke||stroke.painting||game().trial?.root===null)return;lastTap=null;clearTimeout(stroke.timer);stroke.painting=true;$('board').classList.add('painting');cells[stroke.start].classList.remove('pressing');paint(stroke.start);}
function paintPoint(x,y){const cell=document.elementFromPoint(x,y)?.closest('.cell');if(cell&&$('board').contains(cell))paint(Number(cell.dataset.index));}
function paintSegment(x1,y1,x2,y2){const rect=$('board').getBoundingClientRect(),step=Math.max(3,rect.width/currentLevel().size/4),steps=Math.min(500,Math.max(1,Math.ceil(Math.hypot(x2-x1,y2-y1)/step)));for(let i=0;i<=steps;i++)paintPoint(x1+(x2-x1)*i/steps,y1+(y2-y1)*i/steps);}
function finishStroke(cancelled=false,event){
  if(!stroke)return;const s=stroke;clearTimeout(s.timer);
  if(event&&s.painting&&!cancelled)paintSegment(s.x,s.y,event.clientX,event.clientY);
  cells[s.start]?.classList.remove('pressing');$('board').classList.remove('painting');stroke=null;
  if(s.type==='touch')lastTouch=performance.now();try{if($('board').hasPointerCapture(s.id))$('board').releasePointerCapture(s.id);}catch(_){}
  if(s.painting){if(s.changed)render((s.value===E.MARK?'已标记 ':'已擦除 ')+s.changed+' 格，撤销可一次恢复。',false,{gesture:'drag'});}
  else if(!cancelled)tapCell(s.start);
}
$('board').addEventListener('pointerdown',ev=>{
  if(ev.button!==0||!ev.isPrimary||stroke||game().paused||game().won||modalOpen())return;
  const cell=ev.target.closest('.cell');if(!cell)return;ev.preventDefault();unlockAudio();const index=Number(cell.dataset.index);cell.focus({preventScroll:true});
  stroke={id:ev.pointerId,type:ev.pointerType,start:index,x:ev.clientX,y:ev.clientY,originX:ev.clientX,originY:ev.clientY,value:game().board[index]===E.MARK?E.EMPTY:E.MARK,visited:new Set(),changed:0,painting:false,timer:null};
  if(ev.pointerType==='touch')lastTouch=performance.now();cell.classList.add('pressing');try{$('board').setPointerCapture(ev.pointerId);}catch(_){}stroke.timer=setTimeout(startPainting,260);
});
$('board').addEventListener('pointermove',ev=>{
  if(!stroke||ev.pointerId!==stroke.id)return;if(!(ev.buttons&1)){finishStroke(true);return;}ev.preventDefault();
  if(!stroke.painting&&Math.hypot(ev.clientX-stroke.originX,ev.clientY-stroke.originY)>7)startPainting();
  if(stroke.painting)paintSegment(stroke.x,stroke.y,ev.clientX,ev.clientY);stroke.x=ev.clientX;stroke.y=ev.clientY;
});
$('board').addEventListener('pointerup',ev=>{if(stroke&&ev.pointerId===stroke.id)finishStroke(false,ev);});
$('board').addEventListener('pointercancel',ev=>{if(stroke&&ev.pointerId===stroke.id)finishStroke(true);});
$('board').addEventListener('lostpointercapture',()=>finishStroke(true));
window.addEventListener('blur',()=>finishStroke(true));
function undo(){finishStroke(true);lastTap=null;const g=game();if(!g.history.length)return;tick();const elapsed=g.elapsed,paused=g.paused,started=g.started,{kind,...state}=g.history.pop();Object.assign(g,state);if(kind!=='reset'){g.elapsed=elapsed;g.paused=paused;g.started=started;}manualCheck=false;lastTick=performance.now();$('celebration').replaceChildren();render('已撤销上一步。');renderPath();sound('erase');haptic(9);if(!g.paused&&!g.won)cells[focused].focus({preventScroll:true});}
function reset(){finishStroke(true);const g=game();if(!g.started&&!g.board.some(Boolean))return;record('reset');const history=g.history;Object.assign(g,newGame(currentLevel()));g.history=history;manualCheck=false;lastTick=performance.now();$('celebration').replaceChildren();closeDialog('settings-dialog');render('已重置，撤销可以恢复。');renderPath();sound('erase');}
function pause(){finishStroke(true);const g=game();if(g.won)return;tick();g.paused=!g.paused;lastTick=performance.now();render();if(g.paused)$('resume').focus();else cells[focused].focus({preventScroll:true});}
function onCellKey(ev,index){
  const n=currentLevel().size,r=Math.floor(index/n),c=index%n;let target;
  if(ev.key==='ArrowLeft')target=r*n+Math.max(0,c-1);if(ev.key==='ArrowRight')target=r*n+Math.min(n-1,c+1);if(ev.key==='ArrowUp')target=Math.max(0,r-1)*n+c;if(ev.key==='ArrowDown')target=Math.min(n-1,r+1)*n+c;if(ev.key==='Home')target=r*n;if(ev.key==='End')target=r*n+n-1;
  if(target!==undefined){ev.preventDefault();cells[target].focus();return;}if(ev.ctrlKey||ev.metaKey||ev.altKey)return;unlockAudio();
  if(ev.key.toLowerCase()==='x'){ev.preventDefault();act(index,'mark');}if(ev.key.toLowerCase()==='c'){ev.preventDefault();act(index,'cat');}if(ev.key==='Delete'||ev.key==='Backspace'){ev.preventDefault();setCell(index,E.EMPTY);}tutorial?.sync({gesture:'keyboard'});
}
function closeDialog(id){if($(id).open)$(id).close();lastTick=performance.now();}
function openDialog(id){finishStroke(true);clearHint();tick();unlockAudio();if(id==='picker-dialog')renderPicker();$(id).showModal();tutorial?.sync();lastTick=performance.now();}
$('settings-open').addEventListener('click',()=>openDialog('settings-dialog'));$('levels-open').addEventListener('click',()=>go('home'));
$('picker-open').addEventListener('click',()=>{unlockAudio();sound('erase');openDialog('picker-dialog');});
$('picker-dialog').addEventListener('close',()=>renderPath());
for(const b of $('picker-dialog').querySelectorAll('.picker-filter button'))b.addEventListener('click',()=>{for(const o of $('picker-dialog').querySelectorAll('.picker-filter button'))o.classList.toggle('is-on',o===b);$('picker-grid').dataset.filter=b.dataset.filter;});
for(const id of ['settings-dialog','tutorial-dialog'])$(id).addEventListener('close',()=>{lastTick=performance.now();tutorial?.sync();});
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>closeDialog(b.dataset.close)));
// Tapping the dimmed area around a dialog closes it - the × button is no longer the only way out.
// Decided on pointerup/click with the press point checked too: iOS Safari never sends a click for a
// tap on a non-interactive element, and Android drops the click when the finger drifts a pixel
// (it reads as a scroll). A press that starts inside the card must never close it.
for(const dlg of document.querySelectorAll('dialog')){
 let press=null,seen=false;
 const outside=(x,y)=>{const r=dlg.getBoundingClientRect();return x<r.left||x>r.right||y<r.top||y>r.bottom;};
 const dismiss=()=>{unlockAudio();if(dlg.id)closeDialog(dlg.id);else dlg.close();};
 const clear=()=>{press=null;seen=false;};
 dlg.addEventListener('pointerdown',ev=>{seen=true;press=outside(ev.clientX,ev.clientY)?{x:ev.clientX,y:ev.clientY}:null;});
 dlg.addEventListener('pointercancel',clear);
 dlg.addEventListener('pointerup',ev=>{if(seen&&press&&outside(ev.clientX,ev.clientY))dismiss();press=null;});
 dlg.addEventListener('click',ev=>{const hadPointer=seen,p=press;clear();if(hadPointer&&!p)return;if(!outside(ev.clientX,ev.clientY))return;dismiss();});
}
// 设置开关统一走委托：棋盘里的设置弹窗和「我的 → 游戏设置」共用同一份 prefs，改哪边都一样。
document.addEventListener('change',ev=>{const input=ev.target?.closest?.('input[data-pref]');if(input)setPref(input.dataset.pref,input.checked);});
document.addEventListener('click',ev=>{const button=ev.target?.closest?.('[data-pref-toggle]');if(!button)return;unlockAudio();sound('erase');setPref(button.dataset.prefToggle,!prefs[button.dataset.prefToggle]);});
reduceMotion.addEventListener('change',applyPrefs);
$('hint-close').addEventListener('click',clearHint);
$('hint-request').addEventListener('click',requestHint);$('hint-apply').addEventListener('click',applyHint);$('hint-dismiss').addEventListener('click',()=>{clearHint();tutorial?.sync();});
// While a hypothesis runs, 提示 / 技巧 become 排除起点 / 保留推演 - intercepted here so the normal actions stay untouched.
$('toolbar').addEventListener('click',ev=>{
  if(!game()?.trial)return;const id=ev.target.closest('button')?.id;
  if(id==='hint-request'){ev.preventDefault();ev.stopPropagation();unlockAudio();returnTrial(true);}
  else if(id==='tutorial-open'){ev.preventDefault();ev.stopPropagation();unlockAudio();keepTrial();}
},true);
document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&activeHint){clearHint();$('hint-request').focus({preventScroll:true});}});
$('undo').addEventListener('click',()=>{unlockAudio();undo();});$('reset').addEventListener('click',reset);$('pause').addEventListener('click',pause);$('resume').addEventListener('click',pause);$('trial-open').addEventListener('click',()=>{unlockAudio();if(game().trial)returnTrial(false);else startTrial();});
$('next').addEventListener('click',()=>{if(game().trial)keepTrial();if(levelIndex<levels.length-1)selectLevel(levelIndex+1);else reset();$('level-title').scrollIntoView({block:'start'});});
document.addEventListener('keydown',ev=>{if((ev.ctrlKey||ev.metaKey)&&ev.key.toLowerCase()==='z'&&!ev.shiftKey&&!modalOpen()){ev.preventDefault();undo();}});
document.addEventListener('visibilitychange',()=>{finishStroke(true);tick();lastTick=performance.now();});

// ---- App shell: home trail / shop / rank / me, with the board living in its own full-screen view.
// 「我的」的子页走 #/me/<panel>，底部标签始终停在「我的」——换子页不该被当成换标签。
const VIEWS=['home','shop','rank','me'];
let currentView='home';
function go(view,push=true){
  const [base,panel]=String(view||'').split('/');
  const next=base==='game'||VIEWS.includes(base)?base:'home';
  const sub=next==='me'&&ME_PANELS.includes(panel)?panel:'';
  if(next==='game'){finishStroke(true);tick();window.scrollTo(0,0);}
  currentView=next;mePanel=sub;document.body.dataset.view=next;
  $('view-game').hidden=next!=='game';
  for(const id of VIEWS)$('view-'+id).hidden=id!==next;
  $('tabbar').hidden=next==='game';
  for(const b of $('tabbar').querySelectorAll('.tab')){const on=b.dataset.tab===next;b.classList.toggle('is-on',on);b.setAttribute('aria-current',on?'page':'false');}
  if(next==='home'){renderPath();centerCat(false);}
  if(next==='rank')loadRank(rankRange);
  if(next==='me'){renderMe();if(sub)window.scrollTo(0,0);}
  const hash='#/'+next+(sub?'/'+sub:'');
  if(push&&location.hash!==hash)history.pushState({view:next,panel:sub},'',hash);
  lastTick=performance.now();
}
function openLevel(index){go('game');selectLevel(index);}
$('tabbar').addEventListener('click',ev=>{const b=ev.target.closest('.tab');if(!b)return;unlockAudio();sound('erase');go(b.dataset.tab);});
$('rank-tabs').addEventListener('click',ev=>{const b=ev.target.closest('button[data-range]');if(!b)return;unlockAudio();sound('erase');loadRank(b.dataset.range);});
// 每个入口只在自己这一层做事：设置就地改、图鉴就地开弹窗，不再先跳进游戏视图。
for(const [id,panel] of Object.entries({'me-profile':'profile','me-security':'security','me-devices':'devices','me-settings':'settings','me-data':'data','me-about':'about'})){
  const node=$(id);if(!node)continue;
  node.addEventListener('click',()=>{unlockAudio();sound('erase');go('me/'+panel);});
}
$('me-library').addEventListener('click',()=>{unlockAudio();sound('erase');tutorial?.open();});
$('me-reset').addEventListener('click',async()=>{
  unlockAudio();sound('erase');
  const signedIn=Boolean(account?.signedIn);
  const yes=await confirmAction({
    title:'清除本机进度',
    text:signedIn?'这台浏览器缓存的进度会被清空，账号里的成绩不受影响，刷新后会重新同步回来。':'通关记录和技巧掌握情况会被清空，无法恢复。',
    ok:'清除',danger:true,
  });
  if(!yes)return;
  // 清完刷新，让启动流程重新与云端对账：就地清空再写回会把空进度推上云。
  try{localStorage.removeItem(JOURNEY_KEY);}catch(_){}
  location.reload();
});
$('confirm-ok').addEventListener('click',()=>{
  const dialog=$('confirm-dialog');
  const want=dialog.dataset.expect||'';
  const input=$('confirm-input');
  if(want&&input.value.trim()!==want){input.focus();input.select();return;}
  dialog.close('ok');
});
$('confirm-cancel').addEventListener('click',()=>closeDialog('confirm-dialog'));
$('confirm-dialog').addEventListener('close',()=>{const resolve=confirmResolve;confirmResolve=null;if(resolve)resolve($('confirm-dialog').returnValue==='ok');});
window.addEventListener('popstate',()=>go((location.hash||'#/home').slice(2),false));

applyPrefs();selectLevel(Math.max(0,levels.findIndex(l=>l.id===journey.current)));setInterval(tick,250);tutorial=window.CatTutorial.mount({get colors(){return colors;},catSVG,crossSVG,
 context(){const g=game();return{level:currentLevel(),unit:J.unitFor(currentLevel()),board:g.board,paused:g.paused,won:g.won,trial:g.trial,trialNotes:g.trialNotes,modal:modalOpen(),off:document.body.dataset.view!=='game'};},
 beforeOpen(){finishStroke(true);clearHint();lastTap=null;tick();closeDialog('settings-dialog');},
 afterClose(){lastTick=performance.now();},onShow(){renderPath();},onDismissHint(){clearHint();},onUnavailable(){presentHint({kind:'info',title:'这里暂时用不上这个技巧',short:'继续试试，或点提示找另一条线索。',targets:[]});},
 // 在「我的 → 技巧图鉴」里点「在当前棋盘看看」：先回到棋盘再开始这一课，用户不用自己跳。
 onLessonRequest(lesson){if(document.body.dataset.view==='game')return false;go('game');setTimeout(()=>tutorial?.openLesson(lesson),0);return true;},
 onUnitComplete(id){if(!journey.learned.includes(id)){journey.learned.push(id);saveJourney();}renderPath();}
});
go((location.hash||'#/home').slice(2)||'home',false);
// Back from Lantecho / 微信: drop the query string so a refresh does not replay the message.
const loginResult=new URLSearchParams(location.search).get('login');
const wechatResult=new URLSearchParams(location.search).get('wechat');
if(loginResult!==null||wechatResult!==null){
  history.replaceState(null,'',location.pathname+location.hash);
  if(wechatResult==='ok')setTimeout(()=>toast('微信已绑定'),700);
  else if(wechatResult==='taken')setTimeout(()=>toast('这个微信已经绑在别的账号上了'),700);
  else if(wechatResult==='unavailable')setTimeout(()=>toast('微信标识还没配置好，暂时不能绑定'),700);
  else if(wechatResult==='need_login')setTimeout(()=>toast('请先登录，再绑定微信'),700);
  else if(wechatResult)setTimeout(()=>toast('微信没有绑定成功，可以再试一次'),700);
  else if(loginResult==='ok')setTimeout(()=>toast('已登录，进度会跟着账号走'),900);
  else if(loginResult==='denied')setTimeout(()=>toast('这次没有登录，随时可以再试'),900);
  else if(loginResult!==null)setTimeout(()=>toast('登录没有完成，可以再试一次'),900);
}
// Cloud sync is a bonus, never a requirement: a broken bridge or a merge problem must not stop play.
initAccount().then(()=>{
  // 登录设备数只取一次，免得每次 renderMe 都多打一个请求。
  if(account?.signedIn)apiFetch('/sessions').then(data=>{sessionCount=data.sessions.length;if(document.body.dataset.view==='me')renderMe();}).catch(()=>{});
  if(bridge())return syncProgress();
  whenBridgeReady(()=>{syncProgress().catch(()=>{});});
}).catch(()=>{});

if(document.modelContext?.registerTool){const lifecycle=new AbortController();try{Promise.resolve(document.modelContext.registerTool({name:'read_cat_garden',title:'读取猫咪棋盘',description:'只读当前关卡、标记和规则冲突，不揭示答案。',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute(input){if(!input||Object.keys(input).length)throw Error('此工具不接受参数');return{level:currentLevel(),board:game().board.slice(),paused:game().paused,trial:T.clone(game().trial),trialNotes:T.copyNotes(game().trialNotes),...E.inspect(currentLevel(),game().board)};}},{signal:lifecycle.signal})).catch(()=>{});}catch(_){}window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});}
})();
