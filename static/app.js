/* ───────── app.js (formatted) ───────── */
document.addEventListener('DOMContentLoaded', () => {
  /* ---------- IndexedDB helpers ---------- */
  const openDB = () =>
    new Promise((res, rej) => {
      const req = indexedDB.open('cornercoach', 1);                       // 04
      req.onupgradeneeded = () =>                                         // 05
        req.result.createObjectStore('videos', { keyPath: 'id', autoIncrement: true });
      req.onsuccess = () => res(req.result);                              // 07
      req.onerror   = () => rej(req.error);                               // 08
    });

  const store = (db, m) => db.transaction('videos', m).objectStore('videos');  // 11
  const getAll = db => new Promise((res, rej) => {                        // 12
    const q = store(db, 'readonly').getAll();                             // 13
    q.onsuccess = () => res(q.result);                                    // 14
    q.onerror   = () => rej(q.error);                                     // 15
  });
  const add = (db, name, blob) => new Promise((res, rej) => {             // 17
    const q = store(db, 'readwrite').add({ name, blob });                 // 18
    q.onsuccess = () => res();                                            // 19
    q.onerror   = () => rej(q.error);                                     // 20
  });
  const del = (db, id) => new Promise((res, rej) => {                     // 22
    const q = store(db, 'readwrite').delete(id);                          // 23
    q.onsuccess = () => res();                                            // 24
    q.onerror   = () => rej(q.error);                                     // 25
  });

  /* ---------- DOM refs & nav ---------- */
  const nav       = document.querySelectorAll('.nav-item');               // 29
  const pages     = document.querySelectorAll('.page');                   // 30
  const theme     = document.getElementById('themeToggle');               // 31
  const analyze   = document.getElementById('analyzeBtn');                // 32
  const picker    = document.getElementById('videoInput');                // 33
  const homeList  = document.getElementById('homeList');                  // 34
  const vidsList  = document.getElementById('videosList');                // 35
  const placeholder = document.getElementById('placeholder');             // 36
  let db, clips = [];                                                     // 37

  /* page-switcher */                                                     // 39
  nav.forEach(n =>
  n.addEventListener('click', () => {
    nav.forEach(i => i.classList.toggle('active', i === n));
    pages.forEach(p => {
      const isActive = p.id === n.dataset.page;
      p.classList.toggle('active', isActive);
      if (isActive) {
        p.scrollTop = 0;                 // resets scroll of section
        window.scrollTo({ top: 0 });     // ensures whole page scrolls to top
      }
    });
  })
);


  /* theme toggle */                                                      // 46
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark');
    theme.checked = true;
  }
  theme.addEventListener('change', () => {
    document.body.classList.toggle('dark', theme.checked);
    localStorage.setItem('theme', theme.checked ? 'dark' : 'light');
  });

  /* init DB + paint UI */                                                // 53
  (async () => {
    db   = await openDB();
    clips = await loadClips();
    render();
  })();

  /* pick & validate videos */                                            // 60
  analyze.addEventListener('click', () => picker.click());
  picker.addEventListener('change', async () => {
    for (const file of [...picker.files]) {
      if (clips.length >= 3) { alert('Max 3 clips'); break; }
      if (!file.type.startsWith('video/')) { alert('Video only'); continue; }

      const probe = document.createElement('video');
      probe.preload = 'metadata';
      probe.src = URL.createObjectURL(file);
      await new Promise(r => probe.onloadedmetadata = r);
      if (probe.duration > 30) { alert(`${file.name} exceeds 30s`); continue; }

      await add(db, file.name, file);
    }
    picker.value = '';
    clips = await loadClips();
    render();
    document.querySelector('[data-page=\"videos\"]').click();
  });

  /* delete handler for both lists */                                     // 79
  [homeList, vidsList].forEach(list =>
    list.addEventListener('click', async e => {
      const btn = e.target.closest('.del-btn');
      if (!btn) return;
      await del(db, +btn.dataset.id);
      clips = await loadClips();
      render();
    })
  );

  /* helpers: load & render */                                            // 87
  async function loadClips() {
    clips.forEach(c => URL.revokeObjectURL(c.url));
    return (await getAll(db)).map(r => ({ id: r.id, name: r.name, url: URL.createObjectURL(r.blob) }));
  }
  function render() {
    placeholder.style.display = clips.length ? 'none' : 'block';
    [homeList, vidsList].forEach(list => {
      list.innerHTML = '';
      clips.forEach(c => list.insertAdjacentHTML('beforeend', `
        <div class="video-card">
          <div class="card-top">
            <p>${c.name}</p><button class="del-btn" data-id="${c.id}" title="Delete">✖</button>
          </div>
          <video src="${c.url}" controls></video>
        </div>`));
    });
  }

  /* user-prefs: accent + options */                                      // 99
  const accentInput          = document.getElementById('accentColor');
  const autoplayToggle       = document.getElementById('autoPlayToggle');
  const showTranscriptToggle = document.getElementById('showTranscriptToggle');

  accentInput.addEventListener('change', () => {                         // 103
    document.documentElement.style.setProperty('--accent', accentInput.value);
    localStorage.setItem('accentColor', accentInput.value);
  });
  if (localStorage.getItem('accentColor')) {                             // 107
    accentInput.value = localStorage.getItem('accentColor');
    document.documentElement.style.setProperty('--accent', accentInput.value);
  }

  autoplayToggle.checked       = localStorage.getItem('autoplay') === 'true';
  showTranscriptToggle.checked = localStorage.getItem('showTranscript') !== 'false';
  autoplayToggle.addEventListener('change', () =>
    localStorage.setItem('autoplay', autoplayToggle.checked)
  );
  showTranscriptToggle.addEventListener('change', () =>
    localStorage.setItem('showTranscript', showTranscriptToggle.checked)
  );

  fetch('stat1.md')
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.text();
  })
  .then(markdown => {
    document.getElementById('output').innerText = markdown;
  })
  .catch(error => {
    console.error('Error loading markdown:', error);
  });



  /* tidy object-URLs on unload */                                        // 119
  window.addEventListener('beforeunload', () =>
    clips.forEach(c => URL.revokeObjectURL(c.url))
  );
});
