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
  if (message?.type !== 'usage') return;
  sync(message.usage).then(() => sendResponse({ ok: true })).catch(() => sendResponse({ ok: false }));
  return true;
});
chrome.runtime.onInstalled.addListener(() => chrome.storage.local.set({ last: { status: '请先打开 Grok 的使用量页面' } }));
