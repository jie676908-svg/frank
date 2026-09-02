/* ==== 功能：读书进度 START ==== */
const Books = {
  items(){return Store.list('books',(a,b)=>(b.date||'').localeCompare(a.date||''));},
  render(){const list=this.items();document.getElementById('bookList').innerHTML=list.length?list.map(x=>`<div class="item"><div class="grow"><b>${Util.esc(x.title)}</b><span class="pill" style="margin-left:6px">${Number(x.progress)||0}%</span><div class="progress" style="margin:8px 0"><i style="width:${Math.max(0,Math.min(100,Number(x.progress)||0))}%"></i></div>${x.note?`<div class="note">${Util.esc(x.note)}</div>`:''}<div class="item-meta">${Util.esc(x.date)}</div></div><button class="del" onclick="Books.del('${x.id}')">✕</button></div>`).join(''):'<div class="empty">还没有读书记录</div>';},
  add(){const title=document.getElementById('bookTitle').value.trim(),progress=Number(document.getElementById('bookProgress').value||0),note=document.getElementById('bookNote').value.trim();if(!title)return UI.toast('先填写书名');Store.upsert('books',{title,progress:Math.min(100,Math.max(0,progress)),note,date:Util.today()});['bookTitle','bookProgress','bookNote'].forEach(id=>document.getElementById(id).value='');this.render();},
  del(id){if(confirm('删除这条读书记录？')){Store.softDelete('books',id);this.render();}}
};
/* ==== 功能：读书进度 END ==== */
