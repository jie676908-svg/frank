/* ==== 功能：健康打卡 START ==== */
const Health = {
  defaults:['喝水达标','早睡','饮食控制','拉伸'],
  habits(){return [...this.defaults.map((name,i)=>({id:'default'+i,name,_u:1})),...Store.list('health_habits')];},
  done(){return Store.listDaily('health_done');},
  render(){const habits=this.habits(),done=new Set(this.done().map(x=>x.habitId));document.getElementById('healthGrid').innerHTML=habits.map(x=>`<button class="check-tile ${done.has(x.id)?'on':''}" onclick="Health.toggle('${x.id}')">${done.has(x.id)?'✓ ':''}${Util.esc(x.name)}</button>`).join('');document.getElementById('healthCount').textContent=done.size;},
  addHabit(){const el=document.getElementById('healthHabit'),name=el.value.trim();if(!name)return;Store.upsert('health_habits',{name});el.value='';this.render();},
  toggle(id){const x=this.done().find(v=>v.habitId===id);if(x){Store.softDelete('health_done:'+Util.today(),x.id);Store.decrDaily('recap_done');}else{Store.upsertDaily('health_done',{habitId:id});Store.incrDaily('recap_done');}this.render();}
};
/* ==== 功能：健康打卡 END ==== */
