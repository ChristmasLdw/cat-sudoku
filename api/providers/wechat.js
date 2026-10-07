'use strict';

// 微信通道：微信开放平台「网站应用」扫码授权（snsapi_login）。
//
//   WECHAT_PROVIDER=wechat 真接开放平台，需要 WECHAT_APP_ID / WECHAT_APP_SECRET
//   WECHAT_PROVIDER=mock   自测通道：走本服务自己的假授权页，不发一个真实请求
//   未设置                  视为未接入，configured=false，前端显示「微信绑定待配置」
//
// 拿到的 unionid 是「同一个人在你的开放平台账号下唯一」的标识，所以换手机、换微信号
// 只要还归在你这个账号主体下，绑定关系就还认；不同开放平台账号之间不通用。

const APP_ID = process.env.WECHAT_APP_ID || '';
const APP_SECRET = process.env.WECHAT_APP_SECRET || '';
const MODE = (process.env.WECHAT_PROVIDER || '').trim().toLowerCase();

const realReady = () => Boolean(APP_ID && APP_SECRET);

function provider() {
  if (MODE === 'mock') return 'mock';
  if (MODE === 'wechat') return realReady() ? 'wechat' : null;
  return null;
}

const configured = () => provider() !== null;

function missing() {
  if (MODE !== 'wechat') return [];
  return [
    ['WECHAT_APP_ID', APP_ID],
    ['WECHAT_APP_SECRET', APP_SECRET],
  ].filter(([, value]) => !value).map(([name]) => name);
}

// 扫码页地址。末尾的 #wechat_redirect 是微信要求的，不能省。
function authorizeUrl(redirectUri, state) {
  if (provider() !== 'wechat') return null;
  const url = new URL('https://open.weixin.qq.com/connect/qrconnect');
  url.searchParams.set('appid', APP_ID);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'snsapi_login');
  url.searchParams.set('state', state);
  return `${url.toString()}#wechat_redirect`;
}

async function getJson(url, params) {
  const target = new URL(url);
  for (const [key, value] of Object.entries(params)) target.searchParams.set(key, value);
  const response = await fetch(target, { signal: AbortSignal.timeout(15000), headers: { Accept: 'application/json' } });
  if (!response.ok) return null;
  return response.json().catch(() => null);
}

// 微信的接口即使参数错了也返回 200 + errcode，所以两个都得判。
function wechatError(data) {
  if (!data) return '没有返回内容';
  if (data.errcode) return `${data.errcode} ${data.errmsg || ''}`.trim();
  return null;
}

/**
 * 用授权码换用户身份。
 * @returns {Promise<{ok:boolean, openid?:string, unionid?:string, name?:string|null, avatar?:string|null, detail?:string, reason?:string}>}
 */
async function exchange(code) {
  const active = provider();
  if (active === 'mock') {
    // 自测：用 code 派生一个稳定身份，同一个 code 永远得到同一个 unionid。
    return {
      ok: true,
      openid: `mock-openid-${code}`,
      unionid: `mock-unionid-${code}`,
      name: '微信游客',
      avatar: null,
    };
  }
  if (active !== 'wechat') return { ok: false, reason: 'not_configured' };

  let token;
  try {
    token = await getJson('https://api.weixin.qq.com/sns/oauth2/access_token', {
      appid: APP_ID,
      secret: APP_SECRET,
      code,
      grant_type: 'authorization_code',
    });
  } catch (error) {
    return { ok: false, detail: `网络异常：${error.message}` };
  }
  const tokenError = wechatError(token);
  if (tokenError || !token?.openid) return { ok: false, detail: tokenError || '没有拿到 openid' };

  let info = null;
  try {
    info = await getJson('https://api.weixin.qq.com/sns/userinfo', {
      access_token: token.access_token,
      openid: token.openid,
      lang: 'zh_CN',
    });
  } catch {
    info = null;
  }
  // userinfo 失败不算致命：openid 已经能定位这个人，只是昵称头像缺一次。
  const infoError = wechatError(info);
  return {
    ok: true,
    openid: token.openid,
    unionid: token.unionid || info?.unionid || null,
    name: infoError ? null : (info?.nickname || null),
    avatar: infoError ? null : (info?.headimgurl || null),
  };
}

module.exports = { configured, provider, missing, authorizeUrl, exchange };
