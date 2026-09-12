function readUsage() {
  const text = document.body?.innerText || '';
  const imageValues = [...document.images].map(i => i.alt || i.getAttribute('aria-label') || '').join(' ');
  const all = `${text}\n${imageValues}`;
  const used = all.match(/(\d{1,3})%\s*(?:已使用|used)/i)?.[1] || all.match(/(?:已使用|used)\s*(\d{1,3})%/i)?.[1] || imageValues.match(/\b(\d{1,3})%\b/)?.[1];
  if (used === undefined) return null;
  const reset = text.match(/重置\s*([^\n]+?)(?=\s*(?:Grok|聊天|Chat|Build|$))/i)?.[1]?.trim() || '';
  const breakdown = [];
  for (const [name, value] of text.matchAll(/(Grok Build|聊天|Chat|Imagine|Voice|API)\s*(\d{1,3})\s*%/gi)) breakdown.push({ name, used: Number(value) });
  return { used: Number(used), resetAt: reset, breakdown };
}

let last = '', pending;
function send() {
  const usage = readUsage();
  const key = JSON.stringify(usage);
  if (usage && key !== last) { last = key; chrome.runtime.sendMessage({ type: 'usage', usage }); }
}

send();
new MutationObserver(() => { clearTimeout(pending); pending = setTimeout(send, 800); }).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
