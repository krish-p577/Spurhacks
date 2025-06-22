document.addEventListener('DOMContentLoaded', () => {

  /* DB helpers */
  const openDB = () => new Promise((res,rej)=>{const r=indexedDB.open('cornercoach',1);r.onupgradeneeded=()=>r.result.createObjectStore('videos',{keyPath:'id',autoIncrement:true});r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});
  const tx = (db,mode)=>db.transaction('videos',mode).objectStore('videos');
  const getAll = db => new Promise((res,rej)=>{const q=tx(db,'readonly').getAll();q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error);});
  const add = (db,name,blob)=> new Promise((res,rej)=>{const q=tx(db,'readwrite').add({name,blob});q.onsuccess=()=>res();q.onerror=()=>rej(q.error);});
  const del = (db,id)=> new Promise((res,rej)=>{const q=tx(db,'readwrite').delete(id);q.onsuccess=()=>res();q.onerror=()=>rej(q.error);});

  /* DOM */
  const nav=document.querySelectorAll('.nav-item'), pages=document.querySelectorAll('.page');
  nav.forEach(n=>n.addEventListener('click',()=>{nav.forEach(i=>i.classList.toggle('active',i===n));pages.forEach(p=>p.classList.toggle('active',p.id===n.dataset.page));}));
  const theme=document.getElementById('themeToggle');
  if(localStorage.getItem('theme')==='dark'){document.body.classList.add('dark');theme.checked=true;}
  theme.addEventListener('change',()=>{document.body.classList.toggle('dark',theme.checked);localStorage.setItem('theme',theme.checked?'dark':'light');});

  const analyze=document.getElementById('analyzeBtn'), picker=document.getElementById('videoInput');
  const homeList=document.getElementById('homeList'), vidsList=document.getElementById('videosList'), placeholder=document.getElementById('placeholder');

  let db, clips=[];

  (async ()=>{
    db = await openDB();
    clips = await loadClips();
    render();
  })();

  analyze.addEventListener('click',()=>picker.click());

  picker.addEventListener('change',async ()=>{
    for(const file of Array.from(picker.files)){
      if(clips.length>=3){alert('Max 3 clips');break;}
      if(!file.type.startsWith('video/')){alert('Video only');continue;}
      const probe=document.createElement('video');probe.preload='metadata';probe.src=URL.createObjectURL(file);
      await new Promise(r=>probe.onloadedmetadata=r);
      if(probe.duration>30){alert(file.name+' exceeds 30s');continue;}
      await add(db,file.name,file);
    }
    picker.value='';
    clips = await loadClips();
    render();
    document.querySelector('[data-page="videos"]').click();
  });

  [homeList,vidsList].forEach(list=>list.addEventListener('click',async e=>{
    const btn=e.target.closest('.del-btn');if(!btn)return;
    await del(db,Number(btn.dataset.id));
    clips = await loadClips();
    render();
  }));

  async function loadClips(){
    clips.forEach(c=>URL.revokeObjectURL(c.url));
    return (await getAll(db)).map(r=>({id:r.id,name:r.name,url:URL.createObjectURL(r.blob)}));
  }

  function render(){
    if(placeholder)placeholder.style.display=clips.length?'none':'block';
    [homeList,vidsList].forEach(list=>{
      list.innerHTML='';
      clips.forEach(c=>{list.insertAdjacentHTML('beforeend',`
        <div class="video-card">
          <div class="card-top">
            <p>${c.name}</p>
            <button class="del-btn" data-id="${c.id}" title="Delete">✖</button>
          </div>
          <video src="${c.url}" controls></video>
        </div>`);});
    });
  }

  window.addEventListener('beforeunload',()=>clips.forEach(c=>URL.revokeObjectURL(c.url)));
});