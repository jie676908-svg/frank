/* ==== 功能：写作进度 START ==== */
const Writing = {
  items(){return Store.list('writing',(a,b)=>(b.date||'').localeCompare(a.date||''));},
  render(){const list=this.items(),weekAgo=Date.now()-6*864e5,total=list.filter(x=>new Date(x.date).getTime()>=weekAgo).reduce((s,x)=>s+(Number(x.words)||0),0);document.getElementById('writingSummary').innerHTML=`<div class="hero num">${total.toLocaleString()}<span class="unit">本周字数</span></div><div class="progress" style="margin:12px 0"><i style="width:${Math.min(100,total/70)}%"></i></div>`;document.getElementById('writingList').innerHTML=list.length?list.slice(0,20).map(x=>`<div class="item"><div class="grow"><b>${Util.esc(x.project||'未命名写作')}</b> · <span class="num">${Number(x.words)||0}</span> 字<div class="item-meta">${Util.esc(x.date)}</div>${x.note?`<div class="note">${Util.esc(x.note)}</div>`:''}</div><button class="del" onclick="Writing.del('${x.id}')">✕</button></div>`).join(''):'<div class="empty">还没有写作记录</div>';},
  add(){const project=document.getElementById('writingProject').value.trim(),words=Number(document.getElementById('writingWords').value||0),note=document.getElementById('writingNote').value.trim();if(!project&&!note&&!words)return UI.toast('至少记录一项进展');Store.upsert('writing',{project,words,note,date:Util.today()});['writingProject','writingWords','writingNote'].forEach(id=>document.getElementById(id).value='');this.render();},
  del(id){if(confirm('删除这条写作记录？')){Store.softDelete('writing',id);this.render();}}
};
/* ==== 功能：写作进度 END ==== */
