const MAX_FAIL = 5;
const LOCK_MS = 5 * 60 * 1000;
// AES-GCM 包装后 Base64 会增加约 1/3 体积，对应原有约 700KB 明文上限。
const MAX_BYTES = 950 * 1024;

function headers() {
  return {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type'
  };
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: headers() });
}

async function hex(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function randSalt() {
  const a = new Uint8Array(16);
  crypto.getRandomValues(a);
  return Array.from(a).map(b => b.toString(16).padStart(2, '0')).join('');
}

function mergeList(a, b) {
  const m = new Map();
  for (const it of [...(a || []), ...(b || [])]) {
    if (!it || !it.id) continue;
    const prev = m.get(it.id);
    if (!prev || (it._u || 0) > (prev._u || 0)) m.set(it.id, it);
  }
  return Array.from(m.values());
}

function mergeAll(server, client) {
  const out = Object.assign({}, server || {});
  for (const [k, cv] of Object.entries(client || {})) {
    if (k.startsWith('_')) continue;
    const sv = out[k];
    if (Array.isArray(cv)) out[k] = mergeList(Array.isArray(sv) ? sv : [], cv);
    else if (sv === undefined || sv === null) out[k] = cv;
  }
  return out;
}

async function serveDashboard(request) {
  const incoming = new URL(request.url);
  const path = incoming.pathname === '/' ? '/index.html' : incoming.pathname;
  const source = new URL(path.replace(/^\//, ''), 'https://jie676908-svg.github.io/frank/');
  const upstream = await fetch(source.toString(), {
    cf: { cacheEverything: true, cacheTtl: 300 }
  });
  if (!upstream.ok) return new Response('页面资源暂时不可用', { status: upstream.status });
  const h = new Headers(upstream.headers);
  h.set('cache-control', path === '/index.html' ? 'no-cache' : 'public, max-age=300');
  h.set('access-control-allow-origin', '*');
  h.delete('content-security-policy');
  return new Response(upstream.body, { status: upstream.status, headers: h });
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: headers() });
    if (request.method === 'GET') return serveDashboard(request);
    if (request.method !== 'POST') return json({ error: 'METHOD_NOT_ALLOWED' }, 405);

    let body;
    try { body = await request.json(); }
    catch { return json({ error: '请求格式不对' }, 400); }

    const user = String(body.user || '').trim().toLowerCase();
    const pass = String(body.pass || '');
    const action = String(body.action || 'pull');
    if (user.length < 3 || user.length > 32) return json({ error: '用户名需要 3-32 个字符' }, 400);
    if (pass.length < 8) return json({ error: '密码至少 8 位' }, 400);

    const uid = await hex('u|' + user);
    const kAuth = `auth:${uid}`;
    const kData = `data:${uid}`;
    const kRate = `rate:${uid}`;
    const get = async key => {
      const raw = await env.DASHBOARD_KV.get(key);
      if (!raw) return null;
      try { return JSON.parse(raw); } catch { return null; }
    };
    const put = (key, value) => env.DASHBOARD_KV.put(key, JSON.stringify(value));

    const rate = (await get(kRate)) || { n: 0, until: 0 };
    const now = Date.now();
    if (rate.until && now < rate.until) {
      const mins = Math.ceil((rate.until - now) / 60000);
      return json({ error: `密码错误次数过多，请 ${mins} 分钟后再试` }, 429);
    }

    const auth = await get(kAuth);
    if (!auth) {
      if (action !== 'register' && action !== 'push') return json({ error: 'NO_ACCOUNT' }, 404);
      const salt = randSalt();
      await put(kAuth, { salt, hash: await hex(pass + '|' + salt), createdAt: now });
      await put(kData, body.data || {});
      return json({ ok: true, created: true, data: body.data || {} });
    }

    const h = await hex(pass + '|' + auth.salt);
    if (h !== auth.hash) {
      const n = (rate.n || 0) + 1;
      await put(kRate, { n, until: n >= MAX_FAIL ? now + LOCK_MS : 0 });
      const left = MAX_FAIL - n;
      return json({ error: left > 0 ? `密码不对，还能试 ${left} 次` : '密码错误次数过多，已锁定 5 分钟' }, 401);
    }
    if (rate.n) await put(kRate, { n: 0, until: 0 });

    // Chrome 扩展只上传 Grok「使用量」页的周用量摘要，不接触聊天内容或 API Key。
    if (action === 'grok_usage') {
      const usage = body.usage || {};
      const used = Number(usage.used);
      if (!Number.isFinite(used) || used < 0 || used > 100) return json({ error: '周用量数据无效' }, 400);
      const breakdown = Array.isArray(usage.breakdown) ? usage.breakdown
        .slice(0, 8)
        .map(x => ({ name: String(x.name || '').slice(0, 40), used: Math.max(0, Math.min(100, Number(x.used) || 0)) }))
        .filter(x => x.name) : [];
      const snapshot = { used, resetAt: String(usage.resetAt || '').slice(0, 80), breakdown, updatedAt: now };
      await put(`grok-usage:${uid}`, snapshot);
      return json({ ok: true, grokWeekly: snapshot });
    }

    if (action === 'quota') return json({ ok: true, grokWeekly: await get(`grok-usage:${uid}`) });

    if (action === 'chpass') {
      const np = String(body.newPass || '');
      if (np.length < 8) return json({ error: '新密码至少 8 位' }, 400);
      const salt = randSalt();
      await put(kAuth, { salt, hash: await hex(np + '|' + salt), createdAt: auth.createdAt, changedAt: now });
      return json({ ok: true, changed: true });
    }
    if (action === 'pull') return json({ ok: true, data: (await get(kData)) || {} });
    if (action === 'push') {
      const raw = JSON.stringify(body.data || {});
      if (raw.length > MAX_BYTES) return json({ error: '数据太大了（超过 700KB）。图片类内容不要参与同步' }, 413);
      // 加密数据由浏览器解密、合并后再整包加密，Worker 始终看不到内容。
      const merged = body.data && body.data._encrypted ? body.data : mergeAll((await get(kData)) || {}, body.data || {});
      await put(kData, merged);
      return json({ ok: true, data: merged });
    }
    return json({ error: '未知操作' }, 400);
  }
};
