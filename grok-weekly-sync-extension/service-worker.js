const ENDPOINT = 'https://water-god-sync.jie676908.workers.dev';

async function sync(usage) {
  const { config } = await chrome.storage.local.get('config');
  if (!config?.user || !config?.pass) return chrome.storage.local.set({ last: { usage, status: '请在扩展中填写工作台同步账号和密码' } });
  try {
    const r = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'grok_usage', user: config.user, pass: config.pass, usage }) });
    const j = await r.json();
    await chrome.storage.local.set({ last: { usage, status: r.ok ? '已同步到工作台' : (j.error || '同步失败'), at: Date.now() } });
  } catch (e) { await chrome.storage.local.set({ last: { usage, status: '网络错误：' + e.message, at: Date.now() } }); }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'refresh_from_workbench') {
    chrome.tabs.query({ url: 'https://grok.com/*' }).then(async tabs => {
      const tab = tabs[0]; if (!tab?.id) return sendResponse({ ok:false, error:'请先打开 Grok 的使用量页面' });
      const [r] = await chrome.scripting.executeScript({ target:{tabId:tab.id}, func:() => { const t=document.body?.innerText||'', imgs=[...document.images].map(i=>i.alt||'').join(' '), u=Number(imgs.match(/(\d{1,3})%/)?.[1]); if(!Number.isFinite(u)) return null; const reset=t.match(/重置\s*([^\n]+?)(?=\s*(?:Grok|聊天|Chat|Build|$))/i)?.[1]?.trim()||''; const breakdown=[...t.matchAll(/(Grok Build|聊天|Chat|Imagine|Voice|API)\s*(\d{1,3})\s*%/gi)].map(([,name,used])=>({name,used:Number(used)})); return {used:u,resetAt:reset,breakdown}; } });
      if (!r?.result) return sendResponse({ ok:false, error:'未读取到 Grok 周额度' }); await sync(r.result); sendResponse({ ok:true, usage:r.result });
    }).catch(e=>sendResponse({ok:false,error:e.message})); return true;
  }
  if (message?.type !== 'usage') return;
  sync(message.usage).then(() => sendResponse({ ok: true })).catch(() => sendResponse({ ok: false }));
  return true;
});
chrome.runtime.onInstalled.addListener(() => chrome.storage.local.set({ last: { status: '请先打开 Grok 的使用量页面' } }));
