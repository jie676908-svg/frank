/* ==== 功能：健身记录 START ==== */
const Fitness = {
  items(){return Store.list('fitness',(a,b)=>(b.date||'').localeCompare(a.date||''));},
  render(){const list=this.items(),mins=list.reduce((s,x)=>s+(Number(x.minutes)||0),0);document.getElementById('fitnessSummary').innerHTML=`<div class="field-grid two"><div class="metric"><b>${list.length}</b><span>训练次数</span></div><div class="metric"><b>${mins}</b><span>累计分钟</span></div></div>`;document.getElementById('fitnessList').innerHTML=list.length?list.slice(0,20).map(x=>`<div class="item"><div class="grow"><b>${Util.esc(x.type)}</b> · ${Number(x.minutes)||0} 分钟<div class="item-meta">${Util.esc(x.date)}</div>${x.note?`<div class="note">${Util.esc(x.note)}</div>`:''}</div><button class="del" onclick="Fitness.del('${x.id}')">✕</button></div>`).join(''):'<div class="empty">还没有训练记录</div>';},
  add(){const type=document.getElementById('fitnessType').value.trim(),minutes=Number(document.getElementById('fitnessMinutes').value||0),note=document.getElementById('fitnessNote').value.trim();if(!type||minutes<1)return UI.toast('填写训练项目和时长');Store.upsert('fitness',{type,minutes,note,date:Util.today()});Store.incrDaily('recap_done');['fitnessType','fitnessMinutes','fitnessNote'].forEach(id=>document.getElementById(id).value='');this.render();},
  del(id){if(confirm('删除这条训练记录？')){Store.softDelete('fitness',id);this.render();}}
};
/* ==== 功能：健身记录 END ==== */
