/* ==== 功能：API 额度 START ==== */
const ApiQuota = {
  busy:false,timer:null,
  keys(){return {};},
  init(){this.render();if(Sync.on())this.refresh(false);document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-(Store.get('_quotaCache',{}).at||0)>5*60e3)this.refresh(false);});},
  async request(url,key){const ctrl=new AbortController(),t=setTimeout(()=>ctrl.abort(),12000);try{const r=await fetch(url,{headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},signal:ctrl.signal});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error?.message||j.base_resp?.status_msg||j.message||('查询失败 '+r.status));return j;}finally{clearTimeout(t);}},
  async deepseek(key){const j=await this.request('https://api.deepseek.com/user/balance',key),info=(j.balance_infos||[]).find(x=>x.currency==='CNY')||(j.balance_infos||[])[0];if(!info)throw new Error('未返回余额信息');return {available:!!j.is_available,currency:info.currency||'CNY',balance:Number(info.total_balance||0),gift:Number(info.granted_balance||0)};},
  async minimax(key){const j=await this.request('https://www.minimaxi.com/v1/token_plan/remains',key),m=(j.model_remains||[]).find(x=>x.model_name==='general')||(j.model_remains||[])[0];if(!m)throw new Error('未返回 Coding Plan 额度');return {model:m.model_name||'general',interval:Number(m.current_interval_remaining_percent??0),weekly:Number(m.current_weekly_remaining_percent??0),reset:Number(m.remains_time||0),status:Number(m.current_interval_status||0)};},
  async ark(ak,sk){
    const host='open.volcengineapi.com',region='cn-beijing',service='ark',version='2024-01-01',action='GetCodingPlanUsage',enc=new TextEncoder(),hex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join(''),h=async s=>hex(await crypto.subtle.digest('SHA-256',enc.encode(s))),hm=async(k,s)=>crypto.subtle.sign('HMAC',k,enc.encode(s)),key=async raw=>crypto.subtle.importKey('raw',typeof raw==='string'?enc.encode(raw):raw,{name:'HMAC',hash:'SHA-256'},false,['sign']);
    const now=new Date(),date=now.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z'),day=date.slice(0,8),query=`Action=${action}&Region=${region}&Version=${version}`,body='',payload=await h(body),headers=`host:${host}\nx-date:${date}\nx-content-sha256:${payload}\ncontent-type:application/json; charset=utf-8\n`,signed='host;x-date;x-content-sha256;content-type',scope=`${day}/${region}/${service}/request`,canonical=`POST\n/\n${query}\n${headers}\n${signed}\n${payload}`,string=`HMAC-SHA256\n${date}\n${scope}\n${await h(canonical)}`;
    let k=await key(sk);for(const part of [day,region,service,'request'])k=await key(await hm(k,part));const signature=hex(await hm(k,string)),authorization=`HMAC-SHA256 Credential=${ak}/${scope}, SignedHeaders=${signed}, Signature=${signature}`;
    const r=await fetch(`https://${host}/?${query}`,{method:'POST',headers:{'Content-Type':'application/json; charset=utf-8','X-Date':date,'X-Content-Sha256':payload,Authorization:authorization},body});const j=await r.json().catch(()=>({}));if(!r.ok||j.ResponseMetadata?.Error)throw new Error(j.ResponseMetadata?.Error?.Message||j.message||`查询失败 ${r.status}`);
    const usage=j.Result?.QuotaUsage||j.Result?.Usages||j.Result?.Details||j.QuotaUsage||[];if(!usage.length)throw new Error('未找到有效的 Coding Plan 套餐');const order={session:0,weekly:1,monthly:2},windows=usage.map(x=>({name:String(x.Level||x.Type||x.Period||x.Label||x.Window||'套餐额度').toLowerCase(),used:Number(x.Percent??x.UsedPercent??x.UsagePercent??x.percent??0),reset:Number(x.ResetTimestamp??x.ResetTime??x.ResetAt??x.ExpiredAt??0)})).filter(x=>['session','weekly','monthly'].includes(x.name)).sort((a,b)=>(order[a.name]??9)-(order[b.name]??9));if(!windows.length)throw new Error('未返回可识别的套餐窗口');return {windows};
  },
  async refresh(loud=false){if(this.busy)return; if(!Sync.on()){this.state('开启双端同步后可安全查询 Grok 实时额度');return loud&&UI.toast('请先开启双端同步');}this.busy=true;this.state('正在查询 Grok…');try{const j=await Sync.call('quota');Store.set('_quotaCache',{grok:j.grok,at:Date.now(),errors:{}});if(loud)UI.toast('Grok 额度已更新');}catch(e){Store.set('_quotaCache',{at:Date.now(),errors:{grok:e.message}});if(loud)UI.toast(e.message);}finally{this.busy=false;this.render();}},
  saveKeys(){const a=document.getElementById('arkCodingPlanAccessKey')?.value.trim(),s=document.getElementById('arkCodingPlanSecretKey')?.value.trim(),d=document.getElementById('deepseekQuotaKey')?.value.trim(),m=document.getElementById('minimaxQuotaKey')?.value.trim();if(a)Store.setSecret('arkCodingPlanAccessKey',a);if(s)Store.setSecret('arkCodingPlanSecretKey',s);if(d)Store.setSecret('deepseekQuotaKey',d);if(m)Store.setSecret('minimaxQuotaKey',m);if(!a&&!s&&!d&&!m&&!this.keys().arkAk&&!this.keys().deepseek&&!this.keys().minimax)return UI.toast('请至少填写一组密钥');['arkCodingPlanAccessKey','arkCodingPlanSecretKey','deepseekQuotaKey','minimaxQuotaKey'].forEach(id=>document.getElementById(id).value='');this.refresh(true);},
  clearKeys(){if(!confirm('清除当前设备上保存的 API 密钥？'))return;['arkCodingPlanAccessKey','arkCodingPlanSecretKey','deepseekQuotaKey','minimaxQuotaKey'].forEach(k=>Store.setSecret(k,''));Store.set('_quotaCache',{});this.render();UI.toast('已清除 API Key');},
  fmtTime(ms){if(!ms)return '重置时间未知';const min=Math.max(0,Math.ceil(ms/60000));return min>=60?`${Math.floor(min/60)}小时${min%60}分后重置`:`${min}分钟后重置`;},
  bar(name,value,sub){value=Math.max(0,Math.min(100,Number(value)||0));return `<div><div class="quota-head"><span class="quota-name">${name}</span><span class="quota-value">${value.toFixed(0)}%</span></div><div class="quota-bar"><i style="width:${value}%"></i></div><div class="quota-sub">${sub}</div></div>`;},
  qrow(ic,name,val,pct,sub){pct=Math.max(0,Math.min(100,Number(pct)||0));return `<div class="dq-row">${ic}<div class="dq-main"><div class="dq-head"><b>${name}</b><span class="dq-val">${val}</span></div><div class="dq-bar"><i style="width:${pct}%"></i></div><div class="dq-sub">${sub}</div></div><span class="dq-pct">${pct.toFixed(0)}%</span></div>`;},
  rowsHtml(k,c,d,m){
    const icStar='<span class="dq-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L4.2 7.7l5.4-.8L12 2z"/></svg></span>';
    const icWave='<span class="dq-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M2 12c2.5-5 5 5 7.5 0s5 5 7.5 0 4 4 5 2"/></svg></span>';
    const deepPct=d?(d.available?100:0):0;
    const deepVal=d?`${d.currency==='CNY'?'¥':'$'}${Number(d.balance||0).toFixed(2)}`:'—';
    const deepSub=k.deepseek?(d?(d.available?`当前可用 · 赠送 ${Number(d.gift||0).toFixed(2)}`:'余额不足或已过期'):'等待查询'):'尚未配置 · 在设置中添加密钥';
    const miniPct=m?Math.max(0,Math.min(100,Number(m.interval)||0)):0;
    const miniVal=m?`${miniPct.toFixed(0)}%`:'—';
    const miniSub=k.minimax?(m?this.fmtTime(m.reset):'等待查询'):'尚未配置 · 在设置中添加密钥';
    const ark=c.ark,arkWindow=ark?.windows?.[0],arkPct=arkWindow?Math.max(0,100-Number(arkWindow.used||0)):0,arkVal=arkWindow?`${arkPct.toFixed(0)}%`:'—',arkLabels={session:'本次会话',weekly:'本周',monthly:'本月'},arkReset=arkWindow?.reset?(arkWindow.reset<1e12?arkWindow.reset*1000:arkWindow.reset):0,arkSub=k.arkAk&&k.arkSk?(arkWindow?`${arkLabels[arkWindow.name]||arkWindow.name}${arkReset?` · ${new Date(arkReset).toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})} 重置`:''}`:c.errors?.ark?`查询失败 · ${c.errors.ark}`:'等待查询'):'尚未配置 · 在设置中添加 AccessKey / SecretKey';
    const cents=Number(c.grok?.total?.val??c.grok?.total?.value??0),grokVal=c.grok?.total?`$${(cents/100).toFixed(2)}`:'—',grokSub=c.grok?.total?`实时余额 · ${new Date(c.grok.at||c.at).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}`:(c.errors?.grok||'等待查询');
    return this.qrow(icStar,'Codex 订阅限额','—',0,'订阅限额仅能由本机 Codex 读取')+this.qrow(icWave,'Grok API 余额',grokVal,0,grokSub);
  },
  render(){
    const k=this.keys(),c=Store.get('_quotaCache',{}),d=null,m=null;
    const rows=this.rowsHtml(k,c,d,m);
    const box=document.getElementById('apiQuotaRail');if(box)box.innerHTML=rows;
    const homeBox=document.getElementById('homeApiQuota');if(homeBox)homeBox.innerHTML=rows;
    const at=c.at?new Date(c.at).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'}):'';this.state(at?`上次查询：${at}。${k.arkAk&&k.arkSk?'火山方舟 Coding Plan 已配置。 ':''}${k.deepseek?'DeepSeek 已配置。 ':''}${k.minimax?'MiniMax 已配置。':''}`:'');
  },
  state(text){const el=document.getElementById('quotaSettingsState');if(el)el.textContent=text;}
};
/* ==== 功能：API 额度 END ==== */
