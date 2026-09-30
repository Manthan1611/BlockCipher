/* Reusable visual effects, exposed on window.BCL */
window.BCL = window.BCL || {};
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
BCL.hex = n => Array.from({length:n},()=>Math.floor(Math.random()*256).toString(16).padStart(2,'0').toUpperCase()).join(' ');
BCL.initParticles = () => {
  const c = document.getElementById('particles'); if(!c || reduce) return;
  const x = c.getContext('2d'), P = []; let w,h;
  const size = () => { w = c.width = innerWidth; h = c.height = innerHeight; };
  size(); addEventListener('resize', size);
  for(let i=0;i<Math.min(70,innerWidth/18);i++) P.push({x:Math.random()*w,y:Math.random()*h,r:Math.random()*1.6+.4,vx:(Math.random()-.5)*.25,vy:(Math.random()-.5)*.25});
  (function tick(){
    x.clearRect(0,0,w,h);
    P.forEach((p,i)=>{
      p.x=(p.x+p.vx+w)%w; p.y=(p.y+p.vy+h)%h;
      x.fillStyle='rgba(34,211,238,.6)'; x.beginPath(); x.arc(p.x,p.y,p.r,0,7); x.fill();
      for(let j=i+1;j<P.length;j++){const d=Math.hypot(p.x-P[j].x,p.y-P[j].y); if(d<110){x.strokeStyle=`rgba(59,130,246,${.15*(1-d/110)})`;x.beginPath();x.moveTo(p.x,p.y);x.lineTo(P[j].x,P[j].y);x.stroke();}}
    });
    requestAnimationFrame(tick);
  })();
};
BCL.initBinary = () => {
  const el = document.getElementById('binary-bg'); if(!el || reduce) return;
  for(let i=0;i<Math.floor(innerWidth/70);i++){
    const s=document.createElement('span');
    s.textContent=Array.from({length:36},()=>Math.round(Math.random())).join('');
    s.style.left=(i*70+Math.random()*40)+'px'; s.style.animationDuration=(18+Math.random()*22)+'s'; s.style.animationDelay=(-Math.random()*30)+'s';
    el.appendChild(s);
  }
};
BCL.initReveal = () => {
  const io = new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target);} }),{threshold:.12});
  document.querySelectorAll('.reveal').forEach(el=>{ el.style.transitionDelay=(el.dataset.delay||0)+'ms'; io.observe(el); });
};
BCL.initHexStream = () => {
  const pt=document.getElementById('pt-hex'), ct=document.getElementById('ct-hex'); if(!pt || reduce) return;
  setInterval(()=>{ pt.textContent=BCL.hex(5); ct.textContent=BCL.hex(5); }, 1200);
};
BCL.initPageTransitions = () => {
  document.querySelectorAll('a[href$=".html"],a[href*=".html?"]').forEach(a=>a.addEventListener('click',e=>{
    if(e.metaKey||e.ctrlKey) return; e.preventDefault(); document.body.classList.add('leaving'); setTimeout(()=>location.href=a.href,220);
  }));
  addEventListener('pageshow',()=>document.body.classList.remove('leaving'));
};

/* ---- Lab animations ---- */
BCL.toast = (msg, type='ok') => {
  let box = document.getElementById('toasts');
  if(!box){ box = document.createElement('div'); box.id = 'toasts'; box.setAttribute('aria-live','polite'); document.body.appendChild(box); }
  const t = document.createElement('div'); t.className = 'toast ' + type; t.textContent = msg; box.appendChild(t);
  setTimeout(() => t.classList.add('out'), 3200); setTimeout(() => t.remove(), 3600);
};
BCL.runSteps = async (ul, texts, ms) => {           // animated progress list
  ul.hidden = false; ul.innerHTML = texts.map((t,i) => `<li><span class="dot"></span>STEP ${i+1} · ${t}</li>`).join('');
  for(const li of [...ul.children]){ li.classList.add('run'); await new Promise(r => setTimeout(r, reduce ? 0 : ms)); li.classList.replace('run','done'); }
};
BCL.play = root => root.querySelectorAll('.vrow').forEach(r => { r.classList.remove('play'); void r.offsetWidth; r.classList.add('play'); });
BCL.initTheme = () => {
  const root = document.documentElement, s = localStorage.getItem('bcl-theme'); if(s) root.dataset.theme = s;
  const b = document.getElementById('theme');
  if(b) b.addEventListener('click', () => { const n = root.dataset.theme === 'light' ? 'dark' : 'light'; root.dataset.theme = n; try{ localStorage.setItem('bcl-theme', n); }catch{} });
};