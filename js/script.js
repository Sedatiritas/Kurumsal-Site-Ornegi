document.addEventListener('DOMContentLoaded', () => {
  const main = document.querySelector('main');
  if (main && !main.id) main.id = 'main';
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  const revealItems = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(({ isIntersecting, target }) => {
      if (isIntersecting) {
        target.classList.add('is-visible');
        observer.unobserve(target);
      }
    });
  }, { threshold: 0.12 });

  revealItems.forEach((item) => observer.observe(item));

  document.querySelectorAll('#nav a').forEach((link) => {
    link.addEventListener('click', () => {
      const menu = document.getElementById('nav');
      if (menu.classList.contains('show')) bootstrap.Collapse.getOrCreateInstance(menu).hide();
    });
  });

  document.querySelectorAll('.filter-bar button').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.filter-bar button').forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      document.querySelectorAll('.project-item').forEach((project) => {
        project.hidden = button.dataset.filter !== 'all' && project.dataset.category !== button.dataset.filter;
      });
    });
  });

  const form = document.getElementById('contactForm');
  if (form) form.addEventListener('submit', (event) => {
    event.preventDefault();
    const status = document.getElementById('formStatus');
    status.textContent = form.checkValidity()
      ? 'Mesajınız hazır. Bu demo formda sunucu bağlantısı bulunmuyor.'
      : 'Lütfen zorunlu alanları kontrol edin.';
    if (!form.checkValidity()) form.reportValidity();
  });

  const header = document.querySelector('.site-header');
  const updateHeader = () => header?.classList.toggle('is-sticky', window.scrollY > 80);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  const carousel = document.getElementById('heroCarousel');
  if (carousel && window.bootstrap) {
    const instance = bootstrap.Carousel.getOrCreateInstance(carousel);
    let originX = 0;
    carousel.addEventListener('dragstart', (event) => event.preventDefault());
    carousel.addEventListener('pointerdown', (event) => {
      if (event.target.closest('button, a')) return;
      originX = event.clientX;
      carousel.setPointerCapture?.(event.pointerId);
    });
    carousel.addEventListener('pointerup', (event) => {
      const travel = event.clientX - originX;
      if (Math.abs(travel) > 45) travel < 0 ? instance.next() : instance.prev();
    });
  }

  const projectLinks = {
    'Yalıkavak Evi': 'proje.html?project=yalikavak',
    'Arşiv Evi': 'proje.html?project=arsiv',
    'Vadi Ofisleri': 'proje.html?project=vadi',
    'Orman Avlusu': 'proje.html?project=orman'
  };
  document.querySelectorAll('.work-tile, .portfolio-card').forEach((card) => {
    const title = card.querySelector('b, h2')?.textContent.trim();
    if (projectLinks[title]) card.href = projectLinks[title];
  });

  const stage = document.getElementById('houseStage');
  if (stage?.dataset.render === 'canvas') {
    stage.outerHTML = '<div class="house-canvas-wrap reveal is-visible"><canvas id="houseCanvas" aria-label="Fareyle döndürülebilen üç boyutlu mimari maket"></canvas><span>Maket görünümü — sürükleyin ↔</span></div>';
    const canvas = document.getElementById('houseCanvas');
    const context = canvas.getContext('2d');
    let yaw = -0.72, pitch = 0.5, drag = false, lastPoint = null;
    const colors = { wall: '#d9c6ad', wallDark: '#af9a80', roof: '#2e3d33', glass: '#7f9891', wood: '#ab6d4f', ground: '#8d987e' };
    const cube = (x, y, z, w, h, d, material) => {
      const v = [[x-w/2,y-h/2,z-d/2],[x+w/2,y-h/2,z-d/2],[x+w/2,y+h/2,z-d/2],[x-w/2,y+h/2,z-d/2],[x-w/2,y-h/2,z+d/2],[x+w/2,y-h/2,z+d/2],[x+w/2,y+h/2,z+d/2],[x-w/2,y+h/2,z+d/2]];
      return [[[0,1,2,3],material],[ [4,7,6,5],material],[ [0,4,5,1],material],[ [3,2,6,7],material],[ [1,5,6,2],material],[ [0,3,7,4],material]].map(([face, fill]) => ({ points: face.map((i) => v[i]), fill }));
    };
    const paint = () => {
      const rect = canvas.getBoundingClientRect(); const scale = devicePixelRatio || 1;
      canvas.width = rect.width * scale; canvas.height = rect.height * scale; context.setTransform(scale,0,0,scale,0,0);
      const W = rect.width, H = rect.height; context.clearRect(0,0,W,H);
      const project = ([x,y,z]) => { const a = Math.cos(yaw), b = Math.sin(yaw); const rx = x*a-z*b, rz = x*b+z*a; const c = Math.cos(pitch), s = Math.sin(pitch); const ry = y*c-rz*s, dz = y*s+rz*c+8.2; const k = Math.min(W,H)*1.65/dz; return [W*.5+rx*k,H*.58-ry*k,dz]; };
      const scene = [
        ...cube(0,-.18,0,5.8,.18,4.3,'ground'),
        ...cube(0,.82,0,3.6,1.8,2.45,'wall'),
        ...cube(-.95,1.87,.05,1.55,.13,2.72,'roof'),
        ...cube(1.25,1.15,-.4,1.25,1.15,1.55,'wallDark'),
        ...cube(.05,.95,-1.255,1.65,.95,.045,'glass'),
        ...cube(-1.4,.86,-1.275,.55,.95,.05,'wood'),
        ...cube(1.9,.28,1.25,.7,.7,.7,'moss'),
        ...cube(-2.1,.25,-1.25,.52,.52,.52,'moss')
      ];
      const shades = { wall: colors.wall, wallDark: colors.wallDark, roof: colors.roof, glass: colors.glass, wood: colors.wood, ground: colors.ground, moss: '#52644d' };
      const faces = scene.map((face) => ({ ...face, projected: face.points.map(project) })).sort((one,two) => two.projected.reduce((n,p)=>n+p[2],0)-one.projected.reduce((n,p)=>n+p[2],0));
      faces.forEach((face) => { context.beginPath(); face.projected.forEach(([x,y],index) => index ? context.lineTo(x,y) : context.moveTo(x,y)); context.closePath(); context.fillStyle = shades[face.fill]; context.fill(); context.strokeStyle = 'rgba(29,37,30,.35)'; context.lineWidth = .65; context.stroke(); });
      context.fillStyle = 'rgba(255,255,255,.18)'; context.beginPath(); context.ellipse(W*.5,H*.81,W*.28,H*.04,0,0,Math.PI*2); context.fill();
    };
    const move = (event) => { if (!drag) return; yaw += (event.clientX-lastPoint.x)*.012; pitch = Math.max(.14, Math.min(.9, pitch+(event.clientY-lastPoint.y)*.008)); lastPoint={x:event.clientX,y:event.clientY}; paint(); };
    canvas.addEventListener('pointerdown', (event) => { drag=true; lastPoint={x:event.clientX,y:event.clientY}; canvas.setPointerCapture(event.pointerId); });
    canvas.addEventListener('pointermove', move); ['pointerup','pointercancel'].forEach((event) => canvas.addEventListener(event, () => drag=false));
    new ResizeObserver(paint).observe(canvas); paint();
  }

  if (stage) {
    stage.outerHTML = '<figure class="maquette-turntable reveal is-visible" id="maquetteTurntable" aria-label="Dört açıdan görüntülenebilen mimari kesit maketi"><div class="turntable-frame"></div><figcaption>Maket görünümü — sağa sola sürükleyin</figcaption></figure>';
    const turntable = document.getElementById('maquetteTurntable');
    const frame = turntable.querySelector('.turntable-frame');
    let pressed = false, startX = 0, rotation = 0;
    const renderFrame = () => {
      const index = ((Math.round(rotation / 90) % 4) + 4) % 4;
      frame.style.backgroundPosition = `${index * 33.333}% 50%`;
    };
    turntable.addEventListener('pointerdown', (event) => { pressed = true; startX = event.clientX; turntable.setPointerCapture(event.pointerId); });
    turntable.addEventListener('pointermove', (event) => { if (!pressed) return; rotation += (event.clientX - startX) * .8; startX = event.clientX; renderFrame(); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((type) => turntable.addEventListener(type, () => { pressed = false; }));
    renderFrame();
  }

  if (location.pathname.endsWith('hakkimizda.html')) {
    document.querySelector('main')?.insertAdjacentHTML('beforeend', `
      <section class="studio-contact"><div class="container-fluid px-4 px-xl-5"><div class="row g-0"><div class="col-lg-6 pe-lg-5"><p class="kicker">Stüdyo ile iletişim</p><h2>Bir fikri<br><em>konuşalım.</em></h2><p>Hafta içi 09.00—18.00<br>İstanbul, Türkiye</p><a href="mailto:merhaba@ateliersiteniz.com">merhaba@ateliersiteniz.com ↗</a></div><div class="col-lg-6"><div class="map-wrap"><iframe title="NOMA stüdyo konum haritası" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=Istanbul,Turkey&output=embed"></iframe></div></div></div></div></section>`);
  }

  if (location.pathname.endsWith('notlar.html')) {
    const hero = document.querySelector('.page-hero');
    hero?.querySelector('.kicker')?.replaceChildren('Mimarlık Günlüğü / NOMA');
    hero?.querySelector('h1')?.replaceChildren('Tasarımın perde arkasındaki ', Object.assign(document.createElement('em'), { textContent: 'notlar.' }));
    const intro = hero?.querySelector('p:last-child');
    if (intro) intro.textContent = 'Mimarlık Günlüğü; malzeme, ışık, mekân kurgusu ve tasarım sürecine dair kısa, anlaşılır yazılar için editoryal alanımızdır.';
  }

  const blogLinks = {
    'Taşın zamanla kurduğu ilişki': 'blog.html?article=tas',
    'Günün ritmini içeri alan açıklıklar': 'blog.html?article=isik',
    'İyi bir brief, iyi bir başlangıçtır': 'blog.html?article=brief',
    'Eşikler: Odalar arasında değil, deneyimler arasında': 'blog.html?article=esik'
  };
  document.querySelectorAll('.note-card h3, .article-row h2').forEach((heading) => {
    const title = heading.textContent.trim();
    if (blogLinks[title]) heading.innerHTML = `<a href="${blogLinks[title]}">${title}</a>`;
  });
  document.querySelectorAll('.note-card').forEach((card) => {
    const title = card.querySelector('h3')?.textContent.trim();
    const readMore = card.querySelector('h3 + a');
    if (title && readMore && blogLinks[title]) readMore.href = blogLinks[title];
  });
  document.querySelectorAll('.article-row').forEach((row) => {
    const title = row.querySelector('h2')?.textContent.trim();
    const readMore = row.querySelector('h2 + a');
    if (title && readMore && blogLinks[title]) readMore.href = blogLinks[title];
  });
  document.querySelectorAll('.navbar a[href="notlar.html"]').forEach((link) => {
    link.textContent = 'Mimarlık Günlüğü';
  });

  document.querySelectorAll('.site-footer').forEach((footer) => {
    footer.innerHTML = `<div class="container-fluid px-4 px-xl-5"><div class="footer-main"><a class="brand" href="index.html">NOMA<sup>®</sup></a><div><p>İstanbul merkezli<br>mimarlık ve tasarım stüdyosu.</p><a class="footer-mail" href="mailto:merhaba@ateliersiteniz.com">merhaba@ateliersiteniz.com ↗</a></div><div class="footer-links"><a href="calismalarimiz.html">Çalışmalarımız</a><a href="hakkimizda.html">Hakkımızda</a><a href="hizmetler.html">Hizmetler</a><a href="notlar.html">Mimarlık Günlüğü</a><a href="iletisim.html">İletişim</a></div></div><div class="footer-bottom"><span>© ${new Date().getFullYear()} Noma Architecture</span><span>İstanbul / Türkiye</span><a href="#main">Yukarı dön ↑</a></div></div>`;
  });
});
