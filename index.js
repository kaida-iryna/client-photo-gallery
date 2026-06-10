// Cloudinary cloud name — звідси завантажуються превью і photos.json
const CLOUD_NAME = 'dthjx6acg';

// Читаємо ID альбому з URL: наприклад /?a=may-2026
const params  = new URLSearchParams(window.location.search);
const albumId = params.get('a');

// Будує URL для завантаження файлу з Cloudinary
function storageUrl(path) {
  return 'https://res.cloudinary.com/' + CLOUD_NAME + '/raw/upload/' + path;
}

// Запускається одразу при відкритті сторінки
async function init() {
  if (!albumId) {
    showError();
    return;
  }

  try {
    const resp = await fetch(storageUrl('albums/' + albumId + '/photos.json'));
    if (!resp.ok) throw new Error('not found');
    const data = await resp.json();
    buildGallery(data);
  } catch {
    showError();
  }
}

function showError() {
  document.getElementById('loading').classList.add('hidden');
  document.getElementById('error').classList.add('show');
}

// Масив усіх фото і назва альбому — потрібні для лайтбоксу і ZIP
let photos    = [];
let albumName = '';

// Будує галерею з даних photos.json
function buildGallery(data) {
  photos    = data.photos;
  albumName = data.name;

  // Назва вкладки і заголовок сторінки
  document.title = albumName;
  const titleEl = document.getElementById('album-title');
  const parts   = albumName.split(' ');
  if (parts.length >= 2) {
    titleEl.innerHTML = parts.slice(0, -1).join(' ') + '<br><em>' + parts[parts.length - 1] + '</em>';
  } else {
    titleEl.textContent = albumName;
  }
  document.getElementById('photo-count').textContent = photos.length + ' фотографій';

  // Додаємо кожне фото в галерею
  const gallery = document.getElementById('gallery');
  photos.forEach(function(photo, index) {
    const item = document.createElement('div');
    item.className = 'photo-item';
    item.style.animationDelay = (0.05 + (index % 12) * 0.04) + 's';

    const img    = document.createElement('img');
    img.src      = photo.thumb;
    img.alt      = albumName + ' — фото ' + (index + 1);
    img.loading  = 'lazy';

    const overlay = document.createElement('div');
    overlay.className = 'photo-overlay';

    const dlBtn      = document.createElement('a');
    dlBtn.className  = 'dl-single';
    dlBtn.href       = photo.full;
    dlBtn.download   = photo.name || ('photo_' + (index + 1) + '.jpg');
    dlBtn.innerHTML  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16"/></svg> Завантажити';
    dlBtn.addEventListener('click', function(e) { e.stopPropagation(); });

    overlay.appendChild(dlBtn);
    item.appendChild(img);
    item.appendChild(overlay);
    item.addEventListener('click', function() { openLightbox(index); });
    gallery.appendChild(item);
  });

  // Показуємо галерею, ховаємо екран завантаження
  document.getElementById('loading').classList.add('hidden');
  document.getElementById('main').classList.add('show');
}

// ── ЛАЙТБОКС ──────────────────────────────────────────────────
const lightbox  = document.getElementById('lightbox');
const lbImg     = document.getElementById('lb-img');
const lbDl      = document.getElementById('lb-dl');
const lbCounter = document.getElementById('lb-counter');
let currentIndex = 0;

function openLightbox(index) {
  currentIndex   = index;
  lbImg.src      = photos[index].full;
  lbDl.href      = photos[index].full;
  lbDl.download  = photos[index].name || ('photo_' + (index + 1) + '.jpg');
  lbCounter.textContent = (index + 1) + ' / ' + photos.length;
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
  lbImg.src = '';
}

document.getElementById('lb-close').addEventListener('click', closeLightbox);

// Клік поза фото закриває лайтбокс
lightbox.addEventListener('click', function(e) {
  if (e.target === lightbox) closeLightbox();
});

document.getElementById('lb-prev').addEventListener('click', function(e) {
  e.stopPropagation();
  openLightbox((currentIndex - 1 + photos.length) % photos.length);
});

document.getElementById('lb-next').addEventListener('click', function(e) {
  e.stopPropagation();
  openLightbox((currentIndex + 1) % photos.length);
});

// Навігація клавіатурою
document.addEventListener('keydown', function(e) {
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'Escape')      closeLightbox();
  if (e.key === 'ArrowLeft')   openLightbox((currentIndex - 1 + photos.length) % photos.length);
  if (e.key === 'ArrowRight')  openLightbox((currentIndex + 1) % photos.length);
});

// ── СКАЧАТИ ВСІ ────────────────────────────────────────────────
async function downloadAll() {
  const btn          = document.getElementById('btn-dl-all');
  const progressWrap = document.getElementById('progress-wrap');
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');

  btn.disabled = true;
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="animation:spin 1s linear infinite"><path d="M12 2a10 10 0 0 1 10 10"/></svg> Готую архів...';
  progressWrap.classList.add('visible');

  const zip    = new JSZip();
  const folder = zip.folder(albumName);

  for (let i = 0; i < photos.length; i++) {
    try {
      const resp = await fetch(photos[i].full);
      const blob = await resp.blob();
      folder.file(photos[i].name || ('photo_' + (i + 1) + '.jpg'), blob);
    } catch (e) {
      console.warn('Не вдалось завантажити:', photos[i].full);
    }
    const pct = Math.round(((i + 1) / photos.length) * 100);
    progressFill.style.width  = pct + '%';
    progressText.textContent  = (i + 1) + ' з ' + photos.length + ' фото (' + pct + '%)';
  }

  progressText.textContent = 'Створюю ZIP-архів...';
  const blob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = albumName + '.zip';
  a.click();
  URL.revokeObjectURL(url);

  btn.disabled = false;
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 13l4 4L19 7"/></svg> Готово! Завантажено';
  progressText.textContent = 'Архів збережено на ваш пристрій';
}

init();
