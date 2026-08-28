/* ==== 功能：首页计划 START ==== */
const Plan = {
  items(){ return Store.listDaily('plan', (a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99')); },
  render(){
    document.getElementById('planDate').textContent = new Date().toLocaleDateString('zh-CN',{month:'long',day:'numeric',weekday:'long'});
    const list=this.items(), box=document.getElementById('planList');
    box.innerHTML=list.length?list.map(x=>`<div class="item ${x.done?'done':''}"><button class="box" onclick="Plan.toggle('${x.id}')">${x.done?'✓':''}</button><span class="mono item-meta" style="width:44px">${Util.esc(x.time||'待定')}</span><span class="grow">${Util.esc(x.text)}</span><button class="del" onclick="Plan.edit('${x.id}')" aria-label="编辑">✎</button><button class="del" onclick="Plan.del('${x.id}')" aria-label="删除">✕</button></div>`).join(''):'<div class="empty">今天还没有计划，先写下第一幕吧</div>';
  },
  add(){ const text=document.getElementById('planText').value.trim(),time=document.getElementById('planTime').value;if(!text)return UI.toast('先写计划内容');Store.upsertDaily('plan',{text,time,done:false});document.getElementById('planText').value='';document.getElementById('planTime').value='';this.render(); },
  toggle(id){ const x=this.items().find(v=>v.id===id);if(!x)return;Store.upsertDaily('plan',Object.assign({},x,{done:!x.done}));if(!x.done)Store.incrDaily('recap_done');else Store.decrDaily('recap_done');this.render(); },
  edit(id){ const x=this.items().find(v=>v.id===id);if(!x)return;const text=prompt('编辑计划内容',x.text);if(text===null||!text.trim())return;const time=prompt('编辑时间（例如 09:30，可留空）',x.time||'');if(time===null)return;Store.upsertDaily('plan',Object.assign({},x,{text:text.trim(),time:time.trim()}));this.render(); },
  del(id){ if(confirm('删除这条计划？')){Store.softDelete('plan:'+Util.today(),id);this.render();} }
};
/* ==== 功能：首页计划 END ==== */
