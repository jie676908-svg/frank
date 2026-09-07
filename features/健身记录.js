/* ==== 功能：健身记录 START ==== */
const Fitness = {
  items(){return Store.list('fitness',(a,b)=>(b.date||'').localeCompare(a.date||''));},
  render(){
    const dateEl=document.getElementById('fitnessDate');
    if(dateEl&&!dateEl.value)dateEl.value=Util.today();
    const list=this.items(),mins=list.reduce((s,x)=>s+(Number(x.minutes)||0),0);
    document.getElementById('fitnessSummary').innerHTML=`<div class="field-grid two"><div class="metric"><b>${list.length}</b><span>训练次数</span></div><div class="metric"><b>${mins}</b><span>累计分钟</span></div></div>`;
    document.getElementById('fitnessList').innerHTML=list.length?list.slice(0,20).map(x=>`<div class="item"><div class="grow"><b>${Util.esc(x.type)}</b> · ${Number(x.minutes)||0} 分钟<div class="item-meta">${Util.esc(x.date)}</div>${x.note?`<div class="note">${Util.esc(x.note)}</div>`:''}</div><button class="del" onclick="Fitness.del('${x.id}')">✕</button></div>`).join(''):'<div class="empty">还没有训练记录</div>';
  },
  /* 快捷设置记录日期：0=今天，-1=昨天 */
  setDate(offset){
    const d=new Date();d.setDate(d.getDate()+offset);
    const dateEl=document.getElementById('fitnessDate');
    if(dateEl)dateEl.value=Util.dateOf(d);
  },
  add(){
    const type=document.getElementById('fitnessType').value.trim(),
      minutes=Number(document.getElementById('fitnessMinutes').value||0),
      note=document.getElementById('fitnessNote').value.trim(),
      // 当前表单默认记录当天；日期字段只在带“补记”入口的界面中存在。
      date=document.getElementById('fitnessDate')?.value||Util.today();
    if(!type||minutes<1)return UI.toast('填写训练项目和时长');
    if(date>Util.today())return UI.toast('不能记录未来的训练');
    Store.upsert('fitness',{type,minutes,note,date});
    if(date===Util.today())Store.incrDaily('recap_done');
    ['fitnessType','fitnessMinutes','fitnessNote'].forEach(id=>document.getElementById(id).value='');
    this.render();
    UI.toast(date===Util.today()?'训练已记录':`已补记 ${date} 的训练`);
  },
  del(id){if(confirm('删除这条训练记录？')){Store.softDelete('fitness',id);this.render();}}
};
/* ==== 功能：健身记录 END ==== */
