'use strict';

// 短信通道。把「发一条验证码」收敛成一个函数，换服务商只改这个文件，路由层不动。
//
//   SMS_PROVIDER=tencent  腾讯云短信（TC3-HMAC-SHA256 签名，只依赖 node 内建模块，不引 SDK）
//   SMS_PROVIDER=console  把验证码打进服务日志，并在响应里回带 devCode —— 仅用于自测
//   未设置                 视为未接入：configured=false，路由返回 not_configured，
//                          绝不假装发送成功，前端会明确显示「短信服务待配置」。
//
// 腾讯云需要的五个值：SecretId / SecretKey / SmsSdkAppId / 签名 / 模板 ID。
// 模板正文里必须有「验证码」和「有效分钟」两个变量，顺序对应 TemplateParamSet。

const crypto = require('node:crypto');

const hmac = (key, message, encoding) => crypto.createHmac('sha256', key).update(message).digest(encoding);
const sha256hex = (message) => crypto.createHash('sha256').update(message).digest('hex');

const TENCENT = {
  secretId: process.env.TENCENT_SMS_SECRET_ID || '',
  secretKey: process.env.TENCENT_SMS_SECRET_KEY || '',
  region: process.env.TENCENT_SMS_REGION || 'ap-guangzhou',
  sdkAppId: process.env.TENCENT_SMS_SDK_APP_ID || '',
  signName: process.env.TENCENT_SMS_SIGN_NAME || '',
  templateId: process.env.TENCENT_SMS_TEMPLATE_ID || '',
};

const HOST = 'sms.tencentcloudapi.com';
const SERVICE = 'sms';
const ACTION = 'SendSms';
const VERSION = '2021-01-11';

const MODE = (process.env.SMS_PROVIDER || '').trim().toLowerCase();

const tencentReady = () =>
  Boolean(TENCENT.secretId && TENCENT.secretKey && TENCENT.sdkAppId && TENCENT.signName && TENCENT.templateId);

function provider() {
  if (MODE === 'tencent') return tencentReady() ? 'tencent' : null;
  if (MODE === 'console') return 'console';
  return null;
}

const configured = () => provider() !== null;

// 缺少哪些变量要说清楚，运维照着补就行，不用翻代码。
function missing() {
  if (MODE !== 'tencent') return [];
  const need = [
    ['TENCENT_SMS_SECRET_ID', TENCENT.secretId],
    ['TENCENT_SMS_SECRET_KEY', TENCENT.secretKey],
    ['TENCENT_SMS_SDK_APP_ID', TENCENT.sdkAppId],
    ['TENCENT_SMS_SIGN_NAME', TENCENT.signName],
    ['TENCENT_SMS_TEMPLATE_ID', TENCENT.templateId],
  ];
  return need.filter(([, value]) => !value).map(([name]) => name);
}

// 腾讯云 TC3 签名。规范请求里的 host 必须与实际请求头一致，所以签名用字符串拼，不手动设 Host 头。
function authorization(payload, timestamp) {
  const date = new Date(timestamp * 1000).toISOString().slice(0, 10);
  const canonicalHeaders = `content-type:application/json; charset=utf-8\nhost:${HOST}\n`;
  const signedHeaders = 'content-type;host';
  const canonicalRequest = [
    'POST',
    '/',
    '',
    canonicalHeaders,
    signedHeaders,
    sha256hex(payload),
  ].join('\n');
  const scope = `${date}/${SERVICE}/tc3_request`;
  const stringToSign = ['TC3-HMAC-SHA256', String(timestamp), scope, sha256hex(canonicalRequest)].join('\n');
  const kDate = hmac(`TC3${TENCENT.secretKey}`, date);
  const kService = hmac(kDate, SERVICE);
  const kSigning = hmac(kService, 'tc3_request');
  const signature = hmac(kSigning, stringToSign, 'hex');
  return `TC3-HMAC-SHA256 Credential=${TENCENT.secretId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
}

async function tencentSend(phone, code, minutes) {
  const payload = JSON.stringify({
    PhoneNumberSet: [`+86${phone}`],
    SmsSdkAppId: TENCENT.sdkAppId,
    SignName: TENCENT.signName,
    TemplateId: TENCENT.templateId,
    TemplateParamSet: [code, String(minutes)],
  });
  const timestamp = Math.floor(Date.now() / 1000);
  let response;
  try {
    response = await fetch(`https://${HOST}`, {
      method: 'POST',
      headers: {
        Authorization: authorization(payload, timestamp),
        'Content-Type': 'application/json; charset=utf-8',
        'X-TC-Action': ACTION,
        'X-TC-Version': VERSION,
        'X-TC-Timestamp': String(timestamp),
        'X-TC-Region': TENCENT.region,
      },
      body: payload,
      signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    return { ok: false, detail: `网络异常：${error.message}` };
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) return { ok: false, detail: `HTTP ${response.status}` };
  const error = data?.Response?.Error;
  if (error) return { ok: false, detail: error.Code || error.Message || '未知错误' };
  const status = data?.Response?.SendStatusSet?.[0];
  if (!status || status.Code !== 'Ok') return { ok: false, detail: status?.Code || status?.Message || '未返回发送结果' };
  return { ok: true };
}

/**
 * 发送验证码。
 * @returns {Promise<{ok:boolean, detail?:string, reason?:string, devCode?:string}>}
 */
async function sendVerificationCode(phone, code, minutes) {
  const active = provider();
  if (active === 'tencent') return tencentSend(phone, code, minutes);
  if (active === 'console') {
    console.log(`[cat-sudoku][sms:console] ${phone} → ${code}（${minutes} 分钟内有效）`);
    return { ok: true, devCode: code };
  }
  return { ok: false, reason: 'not_configured' };
}

module.exports = { configured, provider, missing, sendVerificationCode };
