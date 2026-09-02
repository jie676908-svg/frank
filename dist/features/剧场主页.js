/* ==== 功能：剧场主页 START ==== */
const Home = {
  quotes:[
    '这说明你天生就适合站在聚光灯下。',
    '万事开头难。只要勤加练习，你也可以展露出许多不寻常的一面。',
    '很多名作就是这么诞生的，而且很有趣，不是吗？',
    '好吧，就让今天的舞台从这一刻开幕吧。',
    '别着急，最精彩的一幕总要留到最后。',
    '不管是怎样的角色，只要站上舞台，就要认真演到落幕。',
    '今天的你也很值得期待，不是吗？',
    '嗯，这才像是一场值得观众鼓掌的演出。',
    '舞台不会替你完成演出，但它会记住你每一次认真的登场。',
    '只要今天比昨天多向前一步，这一幕就没有白费。',
    '真正的主角，可不会因为幕间的安静就停止准备。',
    '把欢呼留给完成的那一刻，现在，先把眼前这一页写好。'
  ],
  qi:0,
  render(){
    this.qi=new Date().getDate()%this.quotes.length;this.showQuote();
    const papers=Store.list('papers'),reading=papers.filter(x=>x.status==='在读').length,read=papers.filter(x=>x.status==='读完').length;
    document.getElementById('homePapers').innerHTML=`<div class="field-grid two"><div class="metric"><b>${reading}</b><span>正在研读</span></div><div class="metric"><b>${read}</b><span>已经读完</span></div></div>`;
    const books=Store.list('books'),latestBook=books.sort((a,b)=>(b.date||'').localeCompare(a.date||''))[0];
    document.getElementById('homeBooks').innerHTML=latestBook?`<div class="hero num">${Number(latestBook.progress)||0}<span class="unit">%</span></div><p class="hint">最近：${Util.esc(latestBook.title)}</p><div class="progress"><i style="width:${Math.max(0,Math.min(100,Number(latestBook.progress)||0))}%"></i></div>`:'<div class="empty">还没有读书进度</div>';
    const plans=Store.listDaily('plan'),done=plans.filter(x=>x.done).length;
    document.getElementById('homePlan').innerHTML=`<div class="hero num">${done}<span class="unit">/ ${plans.length} 已完成</span></div><div class="progress" style="margin-top:12px"><i style="width:${plans.length?done/plans.length*100:0}%"></i></div>`;
    const taskList=document.getElementById('homeTaskList');
    if(taskList)taskList.innerHTML=plans.length?plans.slice().sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99')).slice(0,5).map(x=>`<button class="home-task ${x.done?'done':''}" onclick="Plan.toggle('${x.id}');Home.render();DesktopUI.render()"><span class="task-check">${x.done?'✓':''}</span><span class="task-name">${Util.esc(x.text)}</span><time>${Util.esc(x.time||'待定')}</time></button>`).join(''):Array.from({length:5},(_,i)=>`<button class="home-task empty-task" onclick="App.go('plan')"><span class="task-check">${i?'':'＋'}</span><span class="task-name">${i?'待安排任务':'添加今天的第一项计划'}</span><time>${i?'—':'现在'}</time></button>`).join('');
    const sample=['完成水神剧场第三幕大纲','角色台词润色与节奏调整','收集枫丹历史资料','与配音演员沟通走向','整理今日素材与灵感'];
    const refItems=(plans.length?plans.slice().sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99')).slice(0,5):sample.map((text,i)=>({id:'',text,time:['09:00','11:00','14:00','16:00','18:00'][i],done:i===0}))).map((x,i)=>`<div class="ref-task-row ${x.done?'done':''}"><span class="check">${x.done?'✓':document.body.dataset.stageDesign==='observatory'?['Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ'][i]:''}</span><span>${Util.esc(x.text)} <em>${['创作','创作','研究','沟通','整理'][i]||'任务'}</em></span><time>${Util.esc(x.time||'待定')}</time><span>⚑</span></div>`).join('');
    document.querySelectorAll('.ref-task-list').forEach(x=>x.innerHTML=refItems);document.querySelectorAll('.ref-task-count').forEach(x=>x.textContent=`已完成 ${done} / ${plans.length||5}`);
    const cut=Date.now()-6*864e5,fitness=Store.list('fitness').filter(x=>new Date(x.date).getTime()>=cut),mins=fitness.reduce((s,x)=>s+(Number(x.minutes)||0),0);
    document.getElementById('homeFitness').innerHTML=`<div class="field-grid two"><div class="metric"><b>${fitness.length}</b><span>本周训练</span></div><div class="metric"><b>${mins}</b><span>累计分钟</span></div></div>`;
    const next=plans.filter(x=>!x.done).sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99'))[0];
    // 这些节点只存在于新版首页；旧版首页没有时仍应正常渲染基础卡片。
    const nextAction=document.getElementById('homeNextAction');
    if(nextAction) nextAction.innerHTML=next
      ? `<div class="today-action-main">${Util.esc(next.text)}</div><div class="today-action-meta"><span class="pill">${Util.esc(next.time||'待定')}</span><span class="pill">还有 ${plans.length-done} 项待完成</span></div>`
      : `<div class="today-action-main">${plans.length?'今日剧目已全部完成。':'先定下今天最重要的一件事。'}</div>`;
    const newsDate=document.getElementById('morningNewsDate');
    if(newsDate) newsDate.textContent=new Date().toLocaleDateString('zh-CN',{year:'numeric',month:'long',day:'numeric',weekday:'long'});
  },
  showQuote(){document.getElementById('homeQuote').textContent='“'+this.quotes[this.qi]+'”';},
  nextQuote(){this.qi=(this.qi+1)%this.quotes.length;this.showQuote();}
};
/* ==== 功能：剧场主页 END ==== */
