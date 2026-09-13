/* ==== 功能：剧场主页 START ==== */
/* mockup 仪表盘渲染：顶栏时钟 / 今日计划 / 项目概览 / 专注统计 / 提醒备忘 / 英雄卡名言。
   只读 Store 取数，不调用其他模块的 render（番茄钟、API 额度各自自渲染），保持调用链单向。 */
const Home = {
  quotes:[
    '今日的舞台，准备开幕。',
    '所有的歌声，终将汇入水的乐章。',
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
  qi:0, clockTimer:null,

  /* 英雄卡立绘轮播：记住用户选择；箭头/圆点/左右滑动都能切图，点击卡片仍切换台词 */
  heroImages:['assets/plates/portrait.png','furina-birthday.webp','furina-collage.webp','furina-detective.webp','furina-morning.webp','furina-stage.webp','fontaine-opera.webp','furina-theatre.webp'],
  imageKey(){return '_crystalPortrait';},
  imageIndex(){const fallback=typeof Theme!=='undefined'&&Theme.current()==='theatre'?7:0;return Number(Store.get(this.imageKey(),0))||0;},
  _touchBound:false,_swipeX:0,_swipeY:0,
  applyImage(){
    const n=this.heroImages.length;
    const defaultImage=typeof Theme!=='undefined'&&Theme.current()==='theatre'?7:0;
    const i=((Number(Store.get(this.imageKey(),0))||0)%n+n)%n;
    const hero=document.querySelector('.dash-hero');
    if(hero)hero.style.setProperty('--hero-image',`url('${this.heroImages[i]}')`);
    const portrait=document.getElementById('heroPortrait');if(portrait)portrait.src=this.heroImages[i];
    const dots=document.getElementById('heroDots');
    if(dots)dots.innerHTML=this.heroImages.map((_,k)=>`<button class="${k===i?'on':''}" aria-label="第 ${k+1} 张立绘" aria-pressed="${k===i}" onclick="event.stopPropagation();Home.goImage(${k})"></button>`).join('');
  },
  flashHero(){const hero=document.querySelector('.dash-hero');if(!hero)return;hero.classList.remove('flash');void hero.offsetWidth;hero.classList.add('flash');},
  stepImage(d){
    const n=this.heroImages.length;
    Store.set(this.imageKey(),(this.imageIndex()+d+n)%n);
    this.applyImage();this.flashHero();
  },
  goImage(k){
    const n=this.heroImages.length;
    Store.set(this.imageKey(),((Number(k)||0)%n+n)%n);
    this.applyImage();this.flashHero();
  },
  nextImage(){this.stepImage(1);},
  prevImage(){this.stepImage(-1);},
  /* 触屏左右滑动切图；滑动后抑制紧接着的 click（否则会变成切台词） */
  bindHeroTouch(){
    if(this._touchBound)return;
    const hero=document.querySelector('.dash-hero');if(!hero)return;
    this._touchBound=true;
    hero.addEventListener('touchstart',e=>{const t=e.changedTouches[0];this._swipeX=t.clientX;this._swipeY=t.clientY;},{passive:true});
    hero.addEventListener('touchend',e=>{
      const t=e.changedTouches[0],dx=t.clientX-this._swipeX,dy=t.clientY-this._swipeY;
      if(Math.abs(dx)>44&&Math.abs(dx)>Math.abs(dy)*1.4){
        this._suppressQuote=true;setTimeout(()=>{this._suppressQuote=false;},350);
        this.stepImage(dx<0?1:-1);
      }
    },{passive:true});
  },

  render(){
    this.showQuote();this.startClock();this.applyImage();this.bindHeroTouch();
    this.renderPlan();this.renderProjects();this.renderStats();this.renderReminders();this.pomoFooter();
  },
  showQuote(){const el=document.getElementById('homeQuote');if(el)el.textContent=this.quotes[this.qi%this.quotes.length];},
  nextQuote(){if(this._suppressQuote){this._suppressQuote=false;return;}this.qi=(this.qi+1)%this.quotes.length;this.showQuote();},

  /* 顶栏实时时钟：每秒走，只写文本节点 */
  startClock(){
    if(this.clockTimer)return;
    const tick=()=>{
      const d=new Date();
      const t=document.getElementById('dashClockTime'),s=document.getElementById('dashClockSec'),dt=document.getElementById('dashDate');
      if(t)t.textContent=String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
      if(s)s.textContent=':'+String(d.getSeconds()).padStart(2,'0');
      if(dt)dt.textContent=d.toLocaleDateString('zh-CN',{year:'numeric',month:'long',day:'numeric'});
    };
    tick();this.clockTimer=setInterval(tick,1000);
  },

  /* 番茄钟当前任务：今日第一个未完成计划 */
  nextTask(){
    const plans=Store.listDaily('plan');
    return plans.filter(x=>!x.done).sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99'))[0]||null;
  },
  pomoFooter(){
    const el=document.getElementById('pomoToday');
    if(el)el.textContent=`今日专注 ${Store.countDaily('pomo_sessions')} 次 · 累计 ${Store.countDaily('pomo_minutes')} 分钟`;
  },

  async syncNow(){
    if(!Sync.on()){App.go('settings');document.getElementById('syncCard')?.scrollIntoView({block:'center'});UI.toast('请先设置双端同步账户');return;}
    const b=document.querySelector('.sync-button');if(b)b.disabled=true;
    try{await Sync.syncNow(true);}finally{if(b)b.disabled=false;}
  },
  togglePlan(id){Plan.day=Util.today();Plan.toggle(id);this.render();},
  clearPlans(){
    const list=Store.listDaily('plan');if(!list.length)return;
    if(!confirm('清空今天的全部 '+list.length+' 项计划？'))return;
    list.forEach(x=>Store.softDelete('plan:'+Util.today(),x.id));Plan.today();this.render();
  },
  renderPlan(){
    const box=document.getElementById('dashPlanList'),foot=document.getElementById('dashPlanFoot');if(!box)return;
    const plans=Store.listDaily('plan').slice().sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99'));
    const done=plans.filter(x=>x.done).length;
    box.innerHTML=plans.length?plans.map(x=>{
      const icon=/写|论文|撰/.test(x.text)?NAV_SVG.pen:/健|练|运动/.test(x.text)?NAV_SVG.heart:NAV_SVG.book;
      const detail=x.note||x.description||(x.done?'今日已完成':'点击勾选，记录今日进展');
      return `<button class="dp-row ${x.done?'done':''}" onclick="Home.togglePlan('${x.id}')" aria-pressed="${!!x.done}"><span class="dp-check">${x.done?'✓':''}</span><span class="dp-task-icon">${icon}</span><span class="dp-copy"><span class="dp-name">${Util.esc(x.text)}</span><span class="dp-detail">${Util.esc(detail)}</span></span><time>${Util.esc(x.time||'待安排')}</time></button>`;
    }).join(''):'<button class="dp-row" onclick="Plan.today();App.go(\'plan\')"><span class="dp-check">＋</span><span class="dp-copy"><span class="dp-name">添加今天的第一项计划</span><span class="dp-detail">从阅读、写作或训练开始</span></span></button>';
    if(foot)foot.innerHTML=`<span>已完成 ${done} / ${plans.length}</span><button class="clear-plan" onclick="Home.clearPlans()" ${plans.length?'':'disabled'}>全部清空 ♧</button>`;
  },
  renderProjects(){
    const box=document.getElementById('dashProjects');if(!box)return;
    const writing=Store.list('writing'),words=writing.reduce((n,x)=>n+(Number(x.words)||0),0);
    const books=Store.list('books').sort((a,b)=>(b.date||'').localeCompare(a.date||'')),book=books[0];
    // Preserve the original 5,000-word dashboard scale and label it explicitly.
    const wp=Math.min(100,Math.round(words/50)),bp=book?Math.max(0,Math.min(100,Number(book.progress)||0)):0;
    const rows=[{label:'写作进度',icon:NAV_SVG.pen,pct:wp,meta:writing.length?`累计 ${words.toLocaleString()} 字 · 按 5,000 字刻度展示`:'还没有写作记录',route:'writing'},
      {label:'读书进度',icon:NAV_SVG.book,pct:bp,meta:book?`${book.title} · 已读 ${bp}%`:'还没有读书记录',route:'books'}];
    box.innerHTML=rows.map(r=>`<div class="dj-row"><button class="project-open" onclick="App.go('${r.route}')"><span class="dj-head">${r.icon}<span>${r.label}</span><span class="dj-val">${r.pct}%</span></span><span class="dj-bar"><i style="width:${r.pct}%"></i></span><span class="dj-meta">${Util.esc(r.meta)}</span></button></div>`).join('');
  },
  renderStats(){
    const tot=document.getElementById('dashStatsTotal'),bars=document.getElementById('dashStatsBars');if(!bars)return;
    const now=new Date(),todayIdx=(now.getDay()+6)%7,mon=new Date(now);mon.setDate(now.getDate()-todayIdx);
    const vals=Array.from({length:7},(_,i)=>{const d=new Date(mon);d.setDate(mon.getDate()+i);return Store.count('pomo_minutes:'+Util.dateOf(d));});
    const sum=vals.reduce((a,b)=>a+b,0),max=Math.max(60,Math.ceil(Math.max(...vals)/150)*150);
    const axis=document.getElementById('chartAxis');if(axis)axis.innerHTML=Array.from({length:5},(_,i)=>`<span>${Math.round(max*(1-i/4))}</span>`).join('');
    if(tot)tot.innerHTML=`<span>本周总计 <strong>${sum.toLocaleString()} 分钟</strong></span><span>日均 <strong>${Math.round(sum/(todayIdx+1))} 分钟</strong></span>`;
    bars.innerHTML=vals.map((v,i)=>`<div class="bar ${i===todayIdx?'today':''}" style="--bar-height:${v/max*100}%" title="${v} 分钟"><span class="bar-val">${v||''}</span><div class="bar-track"><i style="height:${v/max*100}%"></i></div></div>`).join('');
  },

  renderReminders(){
    const box=document.getElementById('dashRemindList'),foot=document.getElementById('dashRemindFoot');if(!box)return;
    const bell='<span class="dr-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg></span>';
    const rows=[];
    Store.listDaily('plan').filter(x=>!x.done).sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99'))
      .forEach(x=>rows.push({id:x.id,text:x.text,when:'今天 '+(x.time||'待定'),today:true}));
    const tm=new Date();tm.setDate(tm.getDate()+1);
    Store.list('plan:'+Util.dateOf(tm)).filter(x=>!x.done).slice(0,2)
      .forEach(x=>rows.push({id:x.id,text:x.text,when:'明天 '+(x.time||'待定'),today:false}));
    box.innerHTML=rows.length?rows.slice(0,4).map(r=>r.today
      ?`<button class="dr-row" onclick="Plan.today();App.go('plan')" aria-label="查看计划：${Util.esc(r.text)}">${bell}<span class="dr-copy"><span class="dr-name">${Util.esc(r.text)}</span><time>${r.when}</time></span></button>`
      :`<div class="dr-row" style="opacity:.72">${bell}<span class="dr-copy"><span class="dr-name">${Util.esc(r.text)}</span><time>${r.when}</time></span></div>`
    ).join(''):'<div class="empty">今天没有待提醒的事项</div>';
    if(foot)foot.innerHTML=`<span>全部提醒 ${rows.length}</span><button onclick="App.go('plan')">查看更多　›</button>`;
  }
};
/* ==== 功能：剧场主页 END ==== */
