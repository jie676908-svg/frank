/* ==== 功能：主题皮肤 START ==== */
const Theme = {
  allowed:['fontaine','pearl','dawn','theatre'],
  current(){const v=Store.get('theme','fontaine');return this.allowed.includes(v)?v:'fontaine';},
  init(){
    if(!Store.get('_referenceExactV15')){const p=Store.get('_pomodoro',{});if(!p.running)Store.set('_pomodoro',{mode:'focus',duration:1500,remaining:1500,endAt:0,running:false});Store.set('stageDesign','archive');Store.set('_referenceExactV15',Date.now());}
    if(!Store.get('_referenceLayoutV4')){
      Store.set('theme','pearl');Store.set('scene','opera');Store.set('furinaImage',0);Store.set('_lastPage','home');Store.set('sidebarStyle','glass');Store.set('_referenceLayoutV4',Date.now());
      const p=Store.get('_pomodoro',{});if(!p.running)Store.set('_pomodoro',{mode:'focus',duration:1500,remaining:1500,endAt:0,running:false});
    }
    if(!Store.get('_fontaineExactV3')){
      Store.set('theme','pearl');Store.set('scene','opera');Store.set('furinaImage',0);Store.set('_lastPage','home');Store.set('_fontaineExactV3',Date.now());
    }
    if(!Store.get('_fontaineStyleV2')){
      Store.set('theme','pearl');
      Store.set('sidebarStyle','glass');
      Store.set('scene','opera');
      Store.set('_fontaineStyleV2',Date.now());
    }
    this.apply(this.current());Scene.init();FurinaGallery.init();SidebarStyle.init();StageDesign.init();
  },
  apply(name){document.body.dataset.theme=name;document.querySelectorAll('.theme-choice').forEach(x=>x.classList.toggle('on',x.dataset.theme===name));},
  set(name){if(!this.allowed.includes(name))return;Store.set('theme',name);this.apply(name);UI.toast('已切换主题');}
};

const Scene = {
  scenes:{none:'none',opera:"url('fontaine-opera.webp')",stage:"url('furina-stage.webp')",night:"url('furina-theatre.webp')"},
  current(){const v=Store.get('scene','opera');return this.scenes[v]?v:'opera';},
  init(){this.apply(this.current());},
  apply(name){document.documentElement.style.setProperty('--scene-image',this.scenes[name]||this.scenes.opera);document.documentElement.style.setProperty('--scene-opacity',name==='none'?'0':'.46');document.querySelectorAll('.scene-choice').forEach(x=>x.classList.toggle('on',x.dataset.scene===name));},
  set(name){if(!this.scenes[name])return;Store.set('scene',name);this.apply(name);UI.toast(name==='none'?'已关闭场景背景':'已切换背景场景');}
};

const FurinaGallery = {
  images:[
    {src:'furina-morning.webp',name:'晨光舞台'},
    {src:'furina-theatre.webp',name:'剧院之夜'},
    {src:'furina-detective.webp',name:'特别调查'},
    {src:'furina-birthday.webp',name:'生日纪念'},
    {src:'furina-morning.webp',name:'晨光舞台'},
    {src:'furina-stage.webp',name:'聚光时刻'}
  ],
  index(){return Math.max(0,Math.min(this.images.length-1,Number(Store.get('furinaImage',0))||0));},
  init(){this.apply(this.index());},
  apply(i){
    const panel=document.querySelector('.desk-quote'),image=this.images[i]||this.images[0];
    if(panel){panel.classList.remove('image-enter');void panel.offsetWidth;document.body.style.setProperty('--rail-image',`url('${image.src}')`);panel.classList.add('image-enter');}
    const count=document.getElementById('furinaImageCount'),name=document.getElementById('furinaImageName');
    if(count)count.textContent=`${i+1}/${this.images.length}`;
    if(name)name.textContent=image.name;
  },
  shift(n){const i=(this.index()+n+this.images.length)%this.images.length;Store.set('furinaImage',i);this.apply(i);},
  random(){let i=this.index();if(this.images.length>1)while(i===this.index())i=Math.floor(Math.random()*this.images.length);Store.set('furinaImage',i);this.apply(i);UI.toast('已更换芙宁娜图片');}
};

const SidebarStyle = {
  allowed:['glass','compact','theatre'],
  current(){const v=Store.get('sidebarStyle','glass');return this.allowed.includes(v)?v:'glass';},
  init(){this.apply(this.current());this.applyTitle();},
  apply(name){document.body.dataset.sidebar=name;document.querySelectorAll('.sidebar-choice').forEach(x=>x.classList.toggle('on',x.dataset.sidebar===name));},
  set(name){if(!this.allowed.includes(name))return;Store.set('sidebarStyle',name);this.apply(name);UI.toast('已切换左侧栏风格');},
  applyTitle(){const title=Store.get('sidebarTitle','水神剧场')||'水神剧场';const brand=document.getElementById('brandName'),input=document.getElementById('sidebarTitle');if(brand)brand.textContent=title;if(input)input.value=title;},
  saveTitle(){const input=document.getElementById('sidebarTitle'),title=(input?.value||'').trim().slice(0,8);if(!title)return UI.toast('请输入侧栏名称');Store.set('sidebarTitle',title);this.applyTitle();UI.toast('侧栏名称已保存');}
};

const StageDesign = {
  allowed:['crystal','archive','observatory'],
  current(){const v=Store.get('stageDesign','archive');return this.allowed.includes(v)?v:'archive';},
  init(){this.apply(this.current());},
  apply(name){
    document.body.dataset.stageDesign=name;
    document.querySelectorAll('.stage-design-choice').forEach(x=>x.classList.toggle('on',x.dataset.stageDesign===name));
    const title=document.querySelector('#page-home .home-console-head h1');
    if(title)title.textContent=name==='crystal'?'水神剧场':name==='archive'?'今日主舞台':'今日主舞台';
    if(typeof Home!=='undefined')Home.render();
  },
  set(name){if(!this.allowed.includes(name))return;Store.set('stageDesign',name);this.apply(name);UI.toast(`已切换舞台方案：${name==='crystal'?'清透工作台':name==='archive'?'枫丹典藏':'水文剧目册'}`);}
};
/* ==== 功能：主题皮肤 END ==== */
