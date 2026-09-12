const user=document.querySelector('#user'),pass=document.querySelector('#pass'),state=document.querySelector('#state');
async function show(){const {config,last}=await chrome.storage.local.get(['config','last']);user.value=config?.user||'';state.textContent=last?.status||'请打开 grok.com 的设置 → 使用量';}
document.querySelector('#save').onclick=async()=>{await chrome.storage.local.set({config:{user:user.value.trim(),pass:pass.value}});pass.value='';state.textContent='已保存。切换到 Grok「使用量」页即可同步。';};show();
