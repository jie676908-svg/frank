/* ==== 功能：枫丹专注钟 START ==== */
const Pomodoro = {
  modes:{focus:{minutes:25,label:'专注',done:'专注时间到，该休息一下了。'},short:{minutes:5,label:'短休息',done:'休息结束，可以回到舞台了。'},long:{minutes:15,label:'长休息',done:'长休息结束，新的一幕即将开始。'}},
  timer:null,audio:null,
  data(){return Store.get('_pomodoro',{mode:'focus',duration:1500,remaining:1500,endAt:0,running:false});},
  save(v){Store.set('_pomodoro',v);return v;},
  init(){this.buildDial();this.tick();clearInterval(this.timer);this.timer=setInterval(()=>this.tick(),500);document.addEventListener('visibilitychange',()=>{if(!document.hidden)this.tick();});},
  /* mockup 刻度盘：60 条刻度（每 5 加粗）+ 分钟数字，只生成一次 */
  buildDial(){
    const g=document.getElementById('pomoTicks');if(!g||g.dataset.built)return;g.dataset.built='1';
    let s='';
    for(let i=0;i<60;i++){
      const a=(i*6-90)*Math.PI/180,major=i%5===0,r1=major?95:99,r2=104,c=Math.cos(a),sn=Math.sin(a);
      s+=`<line x1="${(110+r1*c).toFixed(1)}" y1="${(110+r1*sn).toFixed(1)}" x2="${(110+r2*c).toFixed(1)}" y2="${(110+r2*sn).toFixed(1)}" class="${major?'tk major':'tk'}"/>`;
      if(major){const tr=84;s+=`<text x="${(110+tr*c).toFixed(1)}" y="${(110+tr*sn).toFixed(1)}" class="tkn">${i}</text>`;}
    }
    g.innerHTML=s;
  },
  toggle(){this.data().running?this.pause():this.start();},
  cycle(){const seq=['focus','short','long'];this.choose(seq[(seq.indexOf(this.data().mode)+1)%seq.length]);},
  choose(mode){const m=this.modes[mode];if(!m)return;this.save({mode,duration:m.minutes*60,remaining:m.minutes*60,endAt:0,running:false});const input=document.getElementById('pomoMinutes');if(input)input.value=m.minutes;this.render();},
  async start(){
    let d=this.data(),mins=Math.max(1,Math.min(180,Number(document.getElementById('pomoMinutes')?.value)||Math.ceil(d.remaining/60)||25));
    if(!d.running&&(d.remaining===d.duration||d.remaining<=0)){d.duration=mins*60;d.remaining=d.duration;}
    Store.set('_pomodoroAlert',{});
    this.ensureAudio();
    if('Notification' in window&&Notification.permission==='default'){try{await Notification.requestPermission();}catch(e){}}
    d.running=true;d.endAt=Date.now()+d.remaining*1000;this.save(d);this.render();
  },
  pause(){const d=this.data();if(d.running)d.remaining=Math.max(0,Math.ceil((d.endAt-Date.now())/1000));d.running=false;d.endAt=0;this.save(d);this.render();},
  reset(){const d=this.data(),m=this.modes[d.mode]||this.modes.focus;this.save({mode:d.mode,duration:m.minutes*60,remaining:m.minutes*60,endAt:0,running:false});Store.set('_pomodoroAlert',{});const input=document.getElementById('pomoMinutes');if(input)input.value=m.minutes;document.title='水神剧场';this.render();},
  tick(){let d=this.data();if(d.running){d.remaining=Math.max(0,Math.ceil((d.endAt-Date.now())/1000));if(d.remaining<=0){d.running=false;d.endAt=0;this.save(d);this.finish(d);} }this.render(d);},
  render(d=this.data()){
    const time=document.getElementById('pomoTime');if(!time)return;
    const mm=String(Math.floor(d.remaining/60)).padStart(2,'0'),ss=String(d.remaining%60).padStart(2,'0'),mode=this.modes[d.mode]||this.modes.focus;
    time.textContent=`${mm}:${ss}`;document.querySelectorAll('.ref-pomo-time').forEach(x=>x.textContent=`${mm}:${ss}`);document.querySelectorAll('.ref-pomo-state').forEach(x=>x.textContent=d.running?`${mode.label}中`:d.remaining===0?'计时结束':'准备开始');document.getElementById('pomoState').textContent=d.running?`正在${mode.label}…`:d.remaining===0?'计时结束':'准备开始';document.getElementById('pomoBadge').textContent=mode.label;
    const clock=document.getElementById('pomoClock'),pct=d.duration?Math.max(0,Math.min(100,(1-d.remaining/d.duration)*100)):0;clock.style.setProperty('--pomo-progress',pct+'%');document.querySelectorAll('.ref-clock').forEach(x=>x.style.setProperty('--pomo-progress',pct+'%'));clock.classList.toggle('is-running',!!d.running);clock.classList.remove('tick');void clock.offsetWidth;if(d.running)clock.classList.add('tick');
    /* mockup 圆盘：进度弧 + 总时长 + 当前任务 + 今日统计 */
    const arc=document.getElementById('pomoArc');if(arc){arc.style.setProperty('--timer-progress',pct+'%');const C=2*Math.PI*88;arc.style.strokeDasharray=String(C);arc.style.strokeDashoffset=String(C*(1-pct/100));}
    const dur=document.getElementById('pomoDuration');if(dur)dur.textContent='/ '+String(Math.floor(d.duration/60)).padStart(2,'0')+':'+String(d.duration%60).padStart(2,'0');
    const task=document.getElementById('pomoTask');if(task&&typeof Home!=='undefined'){const nt=Home.nextTask();task.textContent=nt?nt.text:'—';task.title=nt?nt.text:'';}
    if(typeof Home!=='undefined'&&Home.pomoFooter)Home.pomoFooter();
    document.querySelectorAll('[data-pomo]').forEach(x=>x.classList.toggle('on',x.dataset.pomo===d.mode));
    const start=document.getElementById('pomoStart');if(start){start.innerHTML=d.running?'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>':'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';start.setAttribute('aria-label',d.running?'暂停':(d.remaining<d.duration?'继续':'开始'+mode.label));}
    if(d.running)document.title=`${mm}:${ss} · ${mode.label}`;else if(document.title.includes('·'))document.title='水神剧场';this.renderRail(d,`${mm}:${ss}`,mode);
  },
  renderRail(d,time,mode){const card=document.getElementById('deskPomo'),body=document.getElementById('deskPomoBody'),ack=document.getElementById('deskPomoAck');const sideTime=document.getElementById('sidePomoTime'),sideState=document.getElementById('sidePomoState');if(sideTime)sideTime.textContent=time;if(sideState)sideState.textContent=d.running?'正在'+mode.label:d.remaining===0?'计时结束':'准备开始';if(!card||!body)return;const alertState=Store.get('_pomodoroAlert',{});card.classList.toggle('active',!!d.running);card.classList.toggle('ringing',!!alertState.active);if(alertState.active){body.innerHTML=`<div class="desk-pomo-message">⏰ ${Util.esc(alertState.message||'本幕已结束')}</div><div class="desk-pomo-label">提醒会保留到你确认为止</div>`;if(ack)ack.style.display='block';}else{body.innerHTML=`<div class="desk-pomo-time">${time}</div><div class="desk-pomo-label">${d.running?'正在'+mode.label:'尚未开始'} · ${this.notificationState()}</div>`;if(ack)ack.style.display='none';}},
  notificationState(){if(!('Notification' in window))return '系统通知不可用';return Notification.permission==='granted'?'系统通知已开启':Notification.permission==='denied'?'系统通知已被拒绝':'等待通知授权';},
  acknowledge(){Store.set('_pomodoroAlert',{});this.render();UI.toast('已确认番茄钟提醒');},
  ensureAudio(){if(!this.audio&&window.AudioContext)this.audio=new AudioContext();if(this.audio?.state==='suspended')this.audio.resume();},
  ring(){this.ensureAudio();const ctx=this.audio;if(!ctx)return;const now=ctx.currentTime;[0,0.34,0.68].forEach((delay,i)=>{const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';osc.frequency.setValueAtTime(i===2?880:660,now+delay);gain.gain.setValueAtTime(.0001,now+delay);gain.gain.exponentialRampToValueAtTime(.2,now+delay+.025);gain.gain.exponentialRampToValueAtTime(.0001,now+delay+.28);osc.connect(gain).connect(ctx.destination);osc.start(now+delay);osc.stop(now+delay+.3);});},
  notify(text){if(!('Notification' in window)||Notification.permission!=='granted')return;const opts={body:text,icon:'icon.png',tag:'water-god-pomodoro',requireInteraction:true};if('serviceWorker' in navigator&&location.protocol!=='file:'){navigator.serviceWorker.ready.then(reg=>reg.showNotification('水神剧场 · 番茄钟',opts)).catch(()=>{try{new Notification('水神剧场 · 番茄钟',opts);}catch(e){}});}else{try{new Notification('水神剧场 · 番茄钟',opts);}catch(e){}}},
  finish(d){const msg=(this.modes[d.mode]||this.modes.focus).done;if(d.mode==='focus'){Store.incrDaily('pomo_sessions');Store.incrDaily('pomo_minutes',Math.max(1,Math.round(d.duration/60)));}Store.set('_pomodoroAlert',{active:true,message:msg,at:Date.now()});this.ring();this.notify(msg);UI.toast(msg);document.getElementById('pomoNotice').textContent='⏰ '+msg;this.render(d);setTimeout(()=>{if(document.hidden)return;alert('⏰ '+msg);},80);},
  async testAlert(){this.ensureAudio();if('Notification' in window&&Notification.permission==='default'){try{await Notification.requestPermission();}catch(e){}}const msg='铃声与消息通知测试成功。';Store.set('_pomodoroAlert',{active:true,message:msg,at:Date.now()});this.ring();this.notify(msg);this.render();UI.toast('已播放测试铃声');}
};
/* ==== 功能：枫丹专注钟 END ==== */
