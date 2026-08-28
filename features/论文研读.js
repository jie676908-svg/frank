/* ==== 功能：论文研读 START ==== */
const Papers = {
  items(){return Store.list('papers',(a,b)=>(b.date||'').localeCompare(a.date||''));},
  render(){const list=this.items(),box=document.getElementById('paperList');box.innerHTML=list.length?list.map(x=>`<div class="item"><div class="grow"><b>${Util.esc(x.title)}</b> <span class="pill">${Util.esc(x.status)}</span><div class="item-meta">${Util.esc(x.date)}</div>${x.note?`<div class="note">${Util.esc(x.note)}</div>`:''}</div><button class="del" onclick="Papers.cycle('${x.id}')">状态</button><button class="del" onclick="Papers.del('${x.id}')">✕</button></div>`).join(''):'<div class="empty">待读队列还是空的</div>';},
  add(){const title=document.getElementById('paperTitle').value.trim(),note=document.getElementById('paperNote').value.trim(),status=document.getElementById('paperStatus').value;if(!title)return UI.toast('先填写论文题目');Store.upsert('papers',{title,note,status,date:Util.today()});document.getElementById('paperTitle').value='';document.getElementById('paperNote').value='';this.render();},
  cycle(id){const x=this.items().find(v=>v.id===id);if(!x)return;const seq=['待读','在读','读完'];Store.upsert('papers',Object.assign({},x,{status:seq[(seq.indexOf(x.status)+1)%3]}));this.render();},
  del(id){if(confirm('从阅读队列删除？')){Store.softDelete('papers',id);this.render();}}
};
/* ==== 功能：论文研读 END ==== */
