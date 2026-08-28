/* ==== 功能：主题皮肤 START ==== */
const Theme = {
  allowed:['pearl','dawn','theatre'],
  current(){const v=Store.get('theme','pearl');return this.allowed.includes(v)?v:'pearl';},
  init(){this.apply(this.current());},
  apply(name){if(name==='pearl')document.body.removeAttribute('data-theme');else document.body.dataset.theme=name;document.querySelectorAll('.theme-choice').forEach(x=>x.classList.toggle('on',x.dataset.theme===name));},
  set(name){if(!this.allowed.includes(name))return;Store.set('theme',name);this.apply(name);UI.toast('已切换主题');}
};
/* ==== 功能：主题皮肤 END ==== */
