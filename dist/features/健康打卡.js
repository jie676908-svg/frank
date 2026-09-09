/* ==== 功能：健康打卡 START ==== */
const Health = {
  defaults:['喝水达标','早睡','饮食控制','拉伸'],
  date(){return document.getElementById('healthDate')?.value||Util.today();},
  habits(){return [...this.defaults.map((name,i)=>({id:'default'+i,name,_u:1})),...Store.list('health_habits')];},
  done(){return Store.listDailyAt('health_done',this.date());},
  render(){const dateEl=document.getElementById('healthDate');if(dateEl&&!dateEl.value)dateEl.value=Util.today();const date=this.date(),habits=this.habits(),done=new Set(this.done().map(x=>x.habitId));document.getElementById('healthGrid').innerHTML=habits.map(x=>`<button class="check-tile ${done.has(x.id)?'on':''}" onclick="Health.toggle('${x.id}')">${done.has(x.id)?'✓ ':''}${Util.esc(x.name)}</button>`).join('');document.getElementById('healthCount').textContent=done.size;document.getElementById('healthCountTitle').textContent=date===Util.today()?'今日完成':`${date} 完成`;},
  addHabit(){const el=document.getElementById('healthHabit'),name=el.value.trim();if(!name)return;Store.upsert('health_habits',{name});el.value='';this.render();},
  toggle(id){const date=this.date();if(date>Util.today())return UI.toast('不能记录未来的打卡');const x=this.done().find(v=>v.habitId===id);if(x){Store.softDeleteDailyAt('health_done',date,x.id);if(date===Util.today())Store.decrDaily('recap_done');}else{Store.upsertDailyAt('health_done',date,{habitId:id});if(date===Util.today())Store.incrDaily('recap_done');}this.render();}
};
/* ==== 功能：健康打卡 END ==== */
