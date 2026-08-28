/* ==== 功能：日记 START ==== */
const Diary = {
  timer:null,items(){return Store.list('diary',(a,b)=>(b.date||'').localeCompare(a.date||''));},
  render(){document.getElementById('diaryText').value=Store.getDaily('diary_draft','');const list=this.items();document.getElementById('diaryList').innerHTML=list.length?list.map(x=>`<div class="item"><div class="grow"><b>${Util.esc(x.date)} ${x.mood?'· '+Util.esc(x.mood):''}</b><div class="note">${Util.esc(x.text)}</div></div><button class="del" onclick="Diary.edit('${x.id}')">✎</button><button class="del" onclick="Diary.del('${x.id}')">✕</button></div>`).join(''):'<div class="empty">还没有日记</div>';},
  draft(){clearTimeout(this.timer);this.timer=setTimeout(()=>{Store.setDaily('diary_draft',document.getElementById('diaryText').value);document.getElementById('diaryDraftState').textContent='草稿已自动保存';},450);},
  save(){const text=document.getElementById('diaryText').value.trim(),mood=document.getElementById('diaryMood').value.trim();if(!text)return UI.toast('先写一点内容');Store.upsert('diary',{date:Util.today(),text,mood});Store.setDaily('diary_draft','');document.getElementById('diaryText').value='';document.getElementById('diaryMood').value='';document.getElementById('diaryDraftState').textContent='';this.render();},
  edit(id){const x=this.items().find(v=>v.id===id);if(!x)return;const text=prompt('编辑日记',x.text);if(text===null||!text.trim())return;Store.upsert('diary',Object.assign({},x,{text:text.trim()}));this.render();},
  del(id){if(confirm('删除这篇日记？')){Store.softDelete('diary',id);this.render();}}
};
/* ==== 功能：日记 END ==== */
