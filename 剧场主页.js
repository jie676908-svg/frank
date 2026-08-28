/* ==== 功能：剧场主页 START ==== */
const Home = {
  quotes:[
    '这说明你天生就适合站在聚光灯下。',
    '万事开头难。只要勤加练习，你也可以展露出许多不寻常的一面。',
    '很多名作就是这么诞生的，而且很有趣，不是吗？'
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
    const cut=Date.now()-6*864e5,fitness=Store.list('fitness').filter(x=>new Date(x.date).getTime()>=cut),mins=fitness.reduce((s,x)=>s+(Number(x.minutes)||0),0);
    document.getElementById('homeFitness').innerHTML=`<div class="field-grid two"><div class="metric"><b>${fitness.length}</b><span>本周训练</span></div><div class="metric"><b>${mins}</b><span>累计分钟</span></div></div>`;
  },
  showQuote(){document.getElementById('homeQuote').textContent='“'+this.quotes[this.qi]+'”';},
  nextQuote(){this.qi=(this.qi+1)%this.quotes.length;this.showQuote();}
};
/* ==== 功能：剧场主页 END ==== */
