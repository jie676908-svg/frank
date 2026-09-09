/* ==== 功能：日记 START ==== */
const Diary = {
  timer:null,editingId:null,items(){return Store.list('diary',(a,b)=>(b.date||'').localeCompare(a.date||''));},
  dateVal(){const el=document.getElementById('diaryDate');return (el&&el.value)||Util.today();},
  render(){
    const dateEl=document.getElementById('diaryDate');
    if(dateEl&&!dateEl.value)dateEl.value=Util.today();
    if(this.dateVal()===Util.today())document.getElementById('diaryText').value=Store.getDaily('diary_draft','');
    const list=this.items();
    document.getElementById('diaryList').innerHTML=list.length?list.map(x=>x.id===this.editingId?`<div class="item"><div class="grow"><div class="field-grid two"><input id="diaryInlineDate" type="date" value="${Util.esc(x.date||Util.today())}" aria-label="日记日期"><input id="diaryInlineMood" type="text" value="${Util.esc(x.mood||'')}" placeholder="心情（可选）" aria-label="日记心情"></div><textarea id="diaryInlineText" style="min-height:180px;margin-top:8px" aria-label="日记内容">${Util.esc(x.text||'')}</textarea><div class="row" style="margin-top:8px"><button class="btn" onclick="Diary.saveEdit()">保存修改</button><button class="btn ghost" onclick="Diary.cancelEdit()">取消</button></div></div></div>`:`<div class="item"><div class="grow"><b>${Util.esc(x.date)} ${x.mood?'· '+Util.esc(x.mood):''}</b><div class="note">${Util.esc(x.text)}</div></div><button class="btn ghost" onclick="Diary.edit('${x.id}')" aria-label="编辑 ${Util.esc(x.date)} 的日记">编辑</button><button class="del" onclick="Diary.del('${x.id}')" aria-label="删除 ${Util.esc(x.date)} 的日记">✕</button></div>`).join(''):'<div class="empty">还没有日记</div>';
  },
  /* 草稿只跟"今天"绑定；补记其他日期时不覆盖今日草稿 */
  draft(){
    const state=document.getElementById('diaryDraftState');
    if(this.dateVal()!==Util.today()){if(state)state.textContent='补记模式：内容不写入今日草稿，点"收进日记"保存';return;}
    clearTimeout(this.timer);
    this.timer=setTimeout(()=>{Store.setDaily('diary_draft',document.getElementById('diaryText').value);if(state)state.textContent='草稿已自动保存';},450);
  },
  save(){
    const text=document.getElementById('diaryText').value.trim(),
      mood=document.getElementById('diaryMood').value.trim(),
      date=this.dateVal();
    if(!text)return UI.toast('先写一点内容');
    if(date>Util.today())return UI.toast('不能写未来的日记');
    const exist=this.items().find(v=>v.date===date);
    if(exist){
      if(!confirm(`${date} 已经有一篇日记，要用当前内容覆盖它吗？\n（想保留原文请改用在列表里的"编辑"）`))return;
      Store.upsert('diary',Object.assign({},exist,{text,mood}));
    }else{
      Store.upsert('diary',{date,text,mood});
    }
    if(date===Util.today())Store.setDaily('diary_draft','');
    document.getElementById('diaryText').value='';
    document.getElementById('diaryMood').value='';
    document.getElementById('diaryDate').value=Util.today();
    document.getElementById('diaryDraftState').textContent='';
    this.render();
    UI.toast(date===Util.today()?'日记已收好':`已补记 ${date} 的日记`);
  },
  edit(id){if(!this.items().some(v=>v.id===id))return;this.editingId=id;this.render();setTimeout(()=>{const el=document.getElementById('diaryInlineText');if(el){el.focus();el.scrollIntoView({behavior:'smooth',block:'center'});}},80);},
  saveEdit(){const x=this.items().find(v=>v.id===this.editingId);if(!x)return UI.toast('没有找到这篇日记');const date=document.getElementById('diaryInlineDate').value||x.date||Util.today(),mood=document.getElementById('diaryInlineMood').value.trim(),text=document.getElementById('diaryInlineText').value.trim();if(!text)return UI.toast('日记内容不能留空');if(date>Util.today())return UI.toast('不能写未来的日记');Store.upsert('diary',Object.assign({},x,{date,mood,text}));this.editingId=null;this.render();UI.toast('日记已更新，并会参与双端同步');},
  cancelEdit(){this.editingId=null;this.render();},
  del(id){if(confirm('删除这篇日记？')){if(this.editingId===id)this.cancelEdit();Store.softDelete('diary',id);this.render();}}
};
/* ==== 功能：日记 END ==== */
