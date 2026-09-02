/* ==== 功能：API 额度 START ==== */
const ApiQuota = {
  busy:false,timer:null,
  keys(){return {deepseek:Store.getSecret('deepseekQuotaKey')||'',minimax:Store.getSecret('minimaxQuotaKey')||''};},
  init(){this.render();const k=this.keys();if(k.deepseek||k.minimax)this.refresh(false);document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-(Store.get('_quotaCache',{}).at||0)>5*60e3)this.refresh(false);});},
  async request(url,key){const ctrl=new AbortController(),t=setTimeout(()=>ctrl.abort(),12000);try{const r=await fetch(url,{headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},signal:ctrl.signal});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error?.message||j.base_resp?.status_msg||j.message||('查询失败 '+r.status));return j;}finally{clearTimeout(t);}},
  async deepseek(key){const j=await this.request('https://api.deepseek.com/user/balance',key),info=(j.balance_infos||[]).find(x=>x.currency==='CNY')||(j.balance_infos||[])[0];if(!info)throw new Error('未返回余额信息');return {available:!!j.is_available,currency:info.currency||'CNY',balance:Number(info.total_balance||0),gift:Number(info.granted_balance||0)};},
  async minimax(key){const j=await this.request('https://www.minimaxi.com/v1/token_plan/remains',key),m=(j.model_remains||[]).find(x=>x.model_name==='general')||(j.model_remains||[])[0];if(!m)throw new Error('未返回 Coding Plan 额度');return {model:m.model_name||'general',interval:Number(m.current_interval_remaining_percent??0),weekly:Number(m.current_weekly_remaining_percent??0),reset:Number(m.remains_time||0),status:Number(m.current_interval_status||0)};},
  async refresh(loud=false){if(this.busy)return loud&&UI.toast('额度正在刷新');const keys=this.keys();if(!keys.deepseek&&!keys.minimax){this.render();return loud&&UI.toast('请先在设置中填写 API Key');}this.busy=true;this.state('正在向官方接口查询…');const old=Store.get('_quotaCache',{}),next={...old,at:Date.now(),errors:{}};await Promise.all([keys.deepseek?this.deepseek(keys.deepseek).then(x=>next.deepseek=x).catch(e=>next.errors.deepseek=e.message):null,keys.minimax?this.minimax(keys.minimax).then(x=>next.minimax=x).catch(e=>next.errors.minimax=e.message):null]);Store.set('_quotaCache',next);this.busy=false;this.render();if(loud)UI.toast(Object.keys(next.errors).length?'部分额度查询失败':'API 额度已更新');},
  saveKeys(){const d=document.getElementById('deepseekQuotaKey')?.value.trim(),m=document.getElementById('minimaxQuotaKey')?.value.trim();if(d)Store.setSecret('deepseekQuotaKey',d);if(m)Store.setSecret('minimaxQuotaKey',m);if(!d&&!m&&!this.keys().deepseek&&!this.keys().minimax)return UI.toast('请至少填写一个 API Key');document.getElementById('deepseekQuotaKey').value='';document.getElementById('minimaxQuotaKey').value='';this.refresh(true);},
  clearKeys(){if(!confirm('清除当前设备上保存的 DeepSeek 和 MiniMax 密钥？'))return;Store.setSecret('deepseekQuotaKey','');Store.setSecret('minimaxQuotaKey','');Store.set('_quotaCache',{});this.render();UI.toast('已清除 API Key');},
  fmtTime(ms){if(!ms)return '重置时间未知';const min=Math.max(0,Math.ceil(ms/60000));return min>=60?`${Math.floor(min/60)}小时${min%60}分后重置`:`${min}分钟后重置`;},
  bar(name,value,sub){value=Math.max(0,Math.min(100,Number(value)||0));return `<div><div class="quota-head"><span class="quota-name">${name}</span><span class="quota-value">${value.toFixed(0)}%</span></div><div class="quota-bar"><i style="width:${value}%"></i></div><div class="quota-sub">${sub}</div></div>`;},
  render(){
    const box=document.getElementById('apiQuotaRail');if(!box)return;
    const k=this.keys(),c=Store.get('_quotaCache',{}),d=c.deepseek,m=c.minimax;
    const deepPct=d?(d.available?100:0):0,miniPct=m?Math.max(0,Math.min(100,Number(m.interval)||0)):0;
    const deepValue=d?`${d.currency==='CNY'?'¥':'$'}${Number(d.balance||0).toFixed(2)}`:'—';
    const miniValue=m?`${miniPct.toFixed(0)}%`:'—';
    box.innerHTML=`
      <article class="api-card">
        <div class="api-card-head"><b>◒</b><span>DeepSeek</span><button onclick="App.go('settings')">API 额度 ›</button></div>
        <div class="api-card-body"><div class="quota-ring" style="--quota:${deepPct}%"><span>${deepPct.toFixed(0)}%</span></div><div class="api-card-data"><strong>${deepValue}</strong><small>${k.deepseek?(d?.available?'当前可用':'等待查询'):'尚未配置'}</small><small>${d?`赠送余额 ${Number(d.gift||0).toFixed(2)}`:'在设置中添加密钥'}</small></div></div>
      </article>
      <article class="api-card">
        <div class="api-card-head"><b>≋</b><span>MiniMax</span><button onclick="App.go('settings')">API 额度 ›</button></div>
        <div class="api-card-body"><div class="quota-ring" style="--quota:${miniPct}%"><span>${miniPct.toFixed(0)}%</span></div><div class="api-card-data"><strong>${miniValue}</strong><small>${k.minimax?'Coding Plan':'尚未配置'}</small><small>${m?this.fmtTime(m.reset):'在设置中添加密钥'}</small></div></div>
      </article>`;
    const at=c.at?new Date(c.at).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'}):'';this.state(at?`上次查询：${at}。${k.deepseek?'DeepSeek 已配置。':''}${k.minimax?' MiniMax 已配置。':''}`:'');
  },
  state(text){const el=document.getElementById('quotaSettingsState');if(el)el.textContent=text;}
};
/* ==== 功能：API 额度 END ==== */
