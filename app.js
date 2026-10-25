const API="";
// Add character cut-out images (transparent PNG links) for each genre card, like Prime Video:
// const GENRE_ART={ "Action":"https://your-site.com/action-heroes.png", "Comedy":"https://..." };
const GENRE_ART={};
const D=864e5,T0=Date.now();
const hue=s=>{let h=0;for(const c of s)h=(h*31+c.charCodeAt(0))%360;return h};
const norm=m=>({id:String(m.id),type:m.type||"movie",title:m.title,year:m.year||"",genre:m.genre||"Other",rating:m.rating||"",overview:m.overview||"",poster:m.poster||"",backdrop:m.backdrop||"",tmdb:m.tmdb||"",added:m.added||"",views:m.views||0,episodes:m.episodes||[],h:m.h||[hue(m.title),(hue(m.title)+330)%360]});
let M=[],err="",loaded=false;
let live=false,view="home",genre="",term="",fav=new Set(),sig="",ht=0,hi=0,cur=null,watching=false;
try{fav=new Set(JSON.parse(localStorage.getItem("vx-fav")||"[]"))}catch(e){}
const saveFav=()=>{try{localStorage.setItem("vx-fav",JSON.stringify([...fav]))}catch(e){}};
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const grad=m=>`linear-gradient(155deg,hsl(${m.h[0]} 85% 38%),hsl(${m.h[1]} 80% 9%) 75%)`;
const img=(u,m)=>u?`url("${esc(u)}"),${grad(m)}`:grad(m);
const fmt=n=>n>=1e6?(n/1e6).toFixed(1)+"M":n>=1e3?(n/1e3).toFixed(1)+"K":String(n);
const ago=d=>{const n=Math.floor((Date.now()-new Date(d))/D);return isNaN(n)?"":n<=0?"Added today":n===1?"Added yesterday":`Added ${n} days ago`};
const NAV=[["home","Home"],["tv","TV Shows"],["cats","Categories"],["list","My List"]];
const gens=a=>[...new Set((a||M).map(m=>m.genre))].sort((x,y)=>{const o=["Comedy","Family","Action","Drama","Sci-Fi","Thriller","Romance"],i=o.indexOf(x),j=o.indexOf(y);return (i<0?99:i)-(j<0?99:j)||x.localeCompare(y)});
const byNew=(a,b)=>String(b.added).localeCompare(String(a.added));

async function pull(){
  const d=await getMovies();
  M=d.movies.map(norm);live=true;loaded=true;err="";render();return d.pending;
}
async function load(){
  try{for(let i=0;i<15;i++){if(!await pull())break;await new Promise(r=>setTimeout(r,900))}
    setInterval(()=>pull().catch(()=>{}),60000);}catch(e){err=(e&&e.message)||"Could not load your library.";loaded=true;sig="";render()}
}
const lab=m=>m.type==="tv"?"TV Show":"Movie";
const card=(m,o={})=>`<button class="card ${m.poster||o.wide&&m.backdrop?"pic":""} ${o.wide?"wide":""}" data-id="${esc(m.id)}" style="background-image:${img(o.wide?(m.backdrop||m.poster):m.poster,m)}" aria-label="${esc(m.title)}">${m.rating&&!o.wide?`<span class="rt">★ ${esc(m.rating)}</span>`:""}<span class="t">${esc(m.title)}${o.sub?`<small>${esc(o.sub)}</small>`:""}</span></button>`;
const rowOf=(t,a)=>a.length?`<section class="row"><div class="rh"><h2>${t}</h2><div class="arr"><button data-s="-1" aria-label="Scroll left">‹</button><button data-s="1" aria-label="Scroll right">›</button></div></div><div class="rail">${a.map(m=>card(m)).join("")}</div></section>`:"";
const tile=g=>{const a=M.filter(m=>m.genre===g),art=GENRE_ART[g],h=(340+hue(g)%50)%360;return `<button class="gt" data-g="${esc(g)}" style="--h:${h}"><div class="bgc">${art?"":`<div class="col">${a.slice(0,3).map(m=>`<i style="background-image:${img(m.poster,m)}"></i>`).join("")}</div>`}</div><div class="gl"><span>${esc(g)}</span><small>${a.length} title${a.length>1?"s":""}</small></div>${art?`<img class="ga" src="${esc(art)}" alt="">`:""}</button>`};
const grid=a=>`<div class="grid">${a.map(m=>card(m)).join("")}</div>`;
function heroHTML(l){
  return `<section class="hero" id="hero">${l.map((f,i)=>`<div class="slide ${i?"":"on"}"><div class="bg" style="background-image:${img(f.backdrop||f.poster,f)}"></div><div class="in"><div class="badge"><b>NEW</b>${esc(ago(f.added)||"Just added")}</div><h1>${esc(f.title)}</h1><div class="meta"><span class="tag">${esc(f.genre)}</span><span>${esc(lab(f))}</span><span>${esc(f.year)}</span>${f.rating?`<span>★ ${esc(f.rating)}</span>`:""}</div><p>${esc(f.overview)}</p><div class="btns"><button class="btn play" data-id="${esc(f.id)}" data-play="1">▶ Play</button><button class="btn ghost" data-id="${esc(f.id)}">More Info</button></div></div></div>`).join("")}</section>`;
}
function goHero(i){
  const n=document.querySelectorAll(".slide").length;if(!n)return;hi=i%n;
  document.querySelectorAll(".slide").forEach((s,j)=>s.classList.toggle("on",j===hi));
  document.querySelectorAll(".th").forEach((s,j)=>s.classList.toggle("on",j===hi));
  clearInterval(ht);ht=setInterval(()=>goHero(hi+1),7000);
}
function render(){
  const s=M.map(m=>m.id+":"+m.views).join()+view+genre+term+[...fav].join()+err+loaded;if(s===sig)return;sig=s;
  $("#nav").innerHTML=NAV.map(([k,l])=>`<button data-v="${k}" class="${view===k&&!term?"on":""}">${l}</button>`).join("");
  $("#sync").className="sync"+(live?" live":"");
  $("#sync").innerHTML=live?`<i></i>Synced from Drive · ${M.length} titles`:`<i></i>${err?"Not connected":"Connecting…"}`;
  clearInterval(ht);const mn=$("#main");
  if(term){const a=M.filter(m=>m.title.toLowerCase().includes(term));mn.innerHTML=`<div class="page"><div class="ph">Results for “${esc(term)}”</div>${a.length?grid(a):`<div class="empty">No titles match your search.</div>`}</div>`;return}
  if(!M.length){mn.innerHTML=`<div class="page"><div class="ph">${err?"Couldn’t load your library":loaded?"Your library is empty":"Loading your library…"}</div><div class="empty">${err?esc(err)+"<br><br>Check config.js (both keys inside quotes), that the Google Drive API is enabled, and that the Google key allows your website address.":loaded?"No videos found in your Drive folder yet. Upload an MP4 named like “Inception 2010.mp4”, then refresh.":"Fetching titles from Google Drive and TMDB."}</div></div>`;return}
  const news=M.slice().sort(byNew),top=M.slice().sort((a,b)=>b.views-a.views||b.rating-a.rating),movies=M.filter(m=>m.type==="movie"),tv=M.filter(m=>m.type==="tv");
  if(view==="home"){
    const t10=top.slice(0,10);
    let h=heroHTML(news.slice(0,5));
    h+=`<section class="row"><div class="rh"><h2><span class="vx">Trending on Voxel</span> · Top 10 in India</h2><div class="arr"><button data-s="-1" aria-label="Scroll left">‹</button><button data-s="1" aria-label="Scroll right">›</button></div></div><div class="t10 rail">${t10.map((m,i)=>`<div class="it"><span class="num">${i+1}</span>${card(m,{wide:1,sub:`#${i+1} on Voxel`})}</div>`).join("")}</div></section>`;
    h+=rowOf("New on Voxel",news.slice(5,19));
    h+=`<section class="row"><div class="rh"><h2>Popular Genres</h2></div><div class="gr">${gens().map(tile).join("")}</div></section>`;
    h+=rowOf("Top Rated",M.slice().sort((a,b)=>b.rating-a.rating).slice(0,14));
    h+=rowOf("TV Shows",tv);
    gens().forEach(g=>{h+=rowOf(g+" Movies",movies.filter(m=>m.genre===g))+rowOf(g+" Shows",tv.filter(m=>m.genre===g))});
    mn.innerHTML=h;goHero(0);
  }else if(view==="tv"){
    mn.innerHTML=`<div class="page"><div class="ph">TV Shows</div>${tv.length?rowOf("All Shows",tv)+gens(tv).map(g=>rowOf(g+" Shows",tv.filter(m=>m.genre===g))).join(""):`<div class="empty">No TV shows yet. Name episodes like “Show Name S01E01.mp4” and upload them to your Drive folder.</div>`}</div>`;
  }else if(view==="cats"){
    mn.innerHTML=genre?`<div class="page"><div class="ph">${esc(genre)}<button data-g="">All categories</button></div>${grid(M.filter(m=>m.genre===genre))}</div>`:`<div class="page"><div class="ph">Categories</div><div class="gr" style="flex-wrap:wrap">${gens().map(tile).join("")}</div></div>`;
  }else{
    const a=M.filter(m=>fav.has(m.id));
    mn.innerHTML=`<div class="page"><div class="ph">My List</div>${a.length?grid(a):`<div class="empty">Nothing here yet. Open a title and choose “Add to My List”.</div>`}</div>`;
  }
}
function openCard(id,play){
  const m=M.find(x=>x.id===id);if(!m)return;cur=m;watching=false;
  const eps=m.type==="tv"&&m.episodes.length?`<div class="eps">${m.episodes.map(e=>`<button data-ep="${esc(e.id)}">S${e.s} · E${e.e}</button>`).join("")}</div>`:"";
  $("#mc").innerHTML=`<button class="x" id="x" aria-label="Close">✕</button><div class="media" id="media" style="background-image:${img(m.backdrop||m.poster,m)}"><div class="note" id="note">Loading trailer…</div></div><div class="mb"><div class="mh"><div><h3>${esc(m.title)}</h3><div class="meta" style="margin:0"><span class="tag">${esc(m.genre)}</span><span>${esc(lab(m))}</span><span>${esc(m.year)}</span>${m.rating?`<span>★ ${esc(m.rating)}</span>`:""}</div></div><div class="btns"><button class="btn play" id="wn">▶ Watch Now</button><button class="btn ghost" id="fv">${fav.has(m.id)?"✓ In My List":"+ My List"}</button></div></div><p>${esc(m.overview)||"No description found for this title."}</p><div class="det"><div><span>Rating</span><b>${m.rating?"★ "+esc(m.rating)+" / 10":"Not rated"}</b></div><div><span>Year</span><b>${esc(m.year)||"—"}</b></div><div><span>Genre</span><b>${esc(m.genre)}</b></div><div><span>Type</span><b>${lab(m)}</b></div><div><span>Runtime</span><b id="rt">—</b></div><div><span>Watched</span><b>${fmt(m.views)} times</b></div><div style="grid-column:1/-1"><span>Cast</span><b id="cast">—</b></div></div>${eps}</div>`;
  $("#modal").classList.add("open");
  $("#wn").onclick=()=>watch();
  $("#fv").onclick=()=>{fav.has(m.id)?fav.delete(m.id):fav.add(m.id);saveFav();$("#fv").textContent=fav.has(m.id)?"✓ In My List":"+ My List";sig="";if(view==="list")render()};
  if(live&&m.tmdb){
    getDetails(m.type,m.tmdb).then(d=>{
      if(cur!==m)return;
      $("#rt").textContent=d.runtime?d.runtime+" min":"—";$("#cast").textContent=(d.cast||[]).join(", ")||"—";
      if(!watching){if(d.trailer){$("#media").innerHTML=`<iframe src="https://www.youtube.com/embed/${encodeURIComponent(d.trailer)}?autoplay=1&mute=1&rel=0&modestbranding=1" allow="autoplay; encrypted-media; fullscreen" allowfullscreen title="Trailer"></iframe>`}else $("#note").textContent="No trailer found for this title."}
    }).catch(()=>{$("#note")&&($("#note").textContent="Trailer unavailable.")});
  }else $("#note").textContent=live?"No trailer found for this title.":"Preview mode: the trailer plays here once TMDB is connected.";
  if(play)watch();
}
function shut(){$("#modal").classList.remove("open");cur=null;setTimeout(()=>{if(!cur)$("#mc").innerHTML=""},300)}
document.addEventListener("keydown",e=>{if(e.key==="Escape")shut()});
document.addEventListener("click",e=>{
  let b;const t=e.target;
  if(t.id==="modal"||t.closest("#x"))return shut();
  if(b=t.closest("[data-ep]"))return watch(b.dataset.ep);
  if(b=t.closest("[data-id]")){if(b.dataset.play){cur=M.find(x=>x.id===b.dataset.id);return watch()}return openCard(b.dataset.id)}
  if(b=t.closest("[data-h]"))return goHero(+b.dataset.h);
  if(b=t.closest("[data-v]")){view=b.dataset.v;genre="";term="";$("#q").value="";scrollTo(0,0);sig="";return render()}
  if(b=t.closest("[data-g]")){genre=b.dataset.g;view="cats";scrollTo(0,0);sig="";return render()}
  if(b=t.closest("[data-s]")){const r=b.closest("section").querySelector(".rail");r.scrollBy({left:+b.dataset.s*r.clientWidth*.8})}
});
$("#q").oninput=e=>{term=e.target.value.trim().toLowerCase();sig="";render()};
addEventListener("scroll",()=>$("#hd").classList.toggle("sc",scrollY>24),{passive:true});
let hot=null;const calm=matchMedia("(prefers-reduced-motion:reduce)").matches;
document.addEventListener("pointermove",e=>{
  if(calm)return;
  const c=e.target.closest?e.target.closest(".card"):null;
  if(hot&&hot!==c){hot.style.setProperty("--rx","0deg");hot.style.setProperty("--ry","0deg");hot=null}
  if(!c)return;hot=c;
  const r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;
  c.style.setProperty("--ry",((x-.5)*18).toFixed(1)+"deg");c.style.setProperty("--rx",((.5-y)*18).toFixed(1)+"deg");
  c.style.setProperty("--mx",(x*100).toFixed(0)+"%");c.style.setProperty("--my",(y*100).toFixed(0)+"%");
});
render();load();

(window.__f=window.__f||[]).push("app.js");
/*END*/
