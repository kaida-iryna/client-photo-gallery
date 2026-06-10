// CLOUD_NAME, UPLOAD_PRESET, DRIVE_API_KEY, SITE_URL — з admin-config.js

const THUMB_MAX_SIZE = 1200;
const THUMB_QUALITY  = 0.78;
const ALBUMS_PATH    = 'albums';  // папка в Cloudinary для albums.json

// Елементи сторінки
const btnUpload       = document.getElementById('btn-upload');
const progressSection = document.getElementById('progress-section');
const progressFill    = document.getElementById('progress-fill');
const progressText    = document.getElementById('progress-text');
const logList         = document.getElementById('log');
const resultSection   = document.getElementById('result-section');
const resultLink      = document.getElementById('result-link');
const btnCopy         = document.getElementById('btn-copy');

// ── Список альбомів ───────────────────────────────────────────

// Versioned URL зберігаємо після кожного запису — CDN кешує unversioned надовго
function getAlbumsUrl() {
  return localStorage.getItem('albums_url')
    || ('https://res.cloudinary.com/' + CLOUD_NAME + '/raw/upload/' + ALBUMS_PATH + '/index.json');
}

// Завантажує albums.json і малює список
async function loadAlbums() {
  const listEl = document.getElementById('albums-list');
  const emptyEl = document.getElementById('albums-empty');

  try {
    const url  = getAlbumsUrl();
    const resp = await fetch(url + '?t=' + Date.now()); // ?t= щоб уникнути кешу
    if (!resp.ok) throw new Error('не знайдено');
    const data = await resp.json();

    listEl.innerHTML = '';

    if (!data.albums || data.albums.length === 0) {
      listEl.innerHTML = '<p class="albums-empty">Альбомів ще немає</p>';
      return;
    }

    // малюємо кожен альбом
    data.albums.forEach(function(album) {
      listEl.appendChild(buildAlbumRow(album));
    });

  } catch (e) {
    emptyEl.textContent = 'Альбомів ще немає';
  }
}

// Будує рядок одного альбому
function buildAlbumRow(album) {
  const row = document.createElement('div');
  row.className = 'album-row';

  const thumb = document.createElement('img');
  thumb.className = 'album-thumb';
  thumb.src = album.thumb || '';
  thumb.alt = album.name;

  const info = document.createElement('div');
  info.className = 'album-info';
  info.innerHTML = '<div class="album-name">' + album.name + '</div>'
                 + '<div class="album-date">' + (album.date || '') + '</div>';

  // посилання на галерею
  const link = document.createElement('a');
  link.className = 'album-link';
  link.href      = SITE_URL + '/?a=' + album.id;
  link.target    = '_blank';
  link.textContent = '↗ відкрити';
  link.addEventListener('click', function(e) { e.stopPropagation(); });

  // перемикач публічний
  const toggleWrap = document.createElement('div');
  toggleWrap.className = 'toggle-wrap';

  const toggleLabel = document.createElement('span');
  toggleLabel.className = 'toggle-label';
  toggleLabel.textContent = album.public ? 'публічний' : 'приватний';

  const toggleEl = document.createElement('label');
  toggleEl.className = 'toggle';

  const checkbox = document.createElement('input');
  checkbox.type    = 'checkbox';
  checkbox.checked = !!album.public;
  checkbox.addEventListener('change', async function(e) {
    e.stopPropagation();
    album.public = checkbox.checked;
    toggleLabel.textContent = album.public ? 'публічний' : 'приватний';
    await updateAlbumPublic(album.id, album.public);
  });

  const track = document.createElement('span');
  track.className = 'toggle-track';

  toggleEl.appendChild(checkbox);
  toggleEl.appendChild(track);
  toggleWrap.appendChild(toggleLabel);
  toggleWrap.appendChild(toggleEl);

  row.appendChild(thumb);
  row.appendChild(info);
  row.appendChild(link);
  row.appendChild(toggleWrap);

  // клік по рядку відкриває галерею
  row.addEventListener('click', function() {
    window.open(SITE_URL + '/?a=' + album.id, '_blank');
  });

  return row;
}

// Оновлює поле public для одного альбому в albums.json
async function updateAlbumPublic(albumId, isPublic) {
  try {
    const url  = getAlbumsUrl();
    const resp = await fetch(url + '?t=' + Date.now());
    const data = await resp.json();

    data.albums = data.albums.map(function(a) {
      return a.id === albumId ? Object.assign({}, a, { public: isPublic }) : a;
    });

    await saveAlbums(data);
  } catch (e) {
    console.error('Помилка оновлення:', e);
  }
}

// Завантажує оновлений albums.json на Cloudinary
async function saveAlbums(data) {
  const jsonBlob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = await uploadToCloudinary(jsonBlob, ALBUMS_PATH, 'index.json', 'raw');
  localStorage.setItem('albums_url', url);
}

// Додає новий альбом до albums.json (або створює файл якщо його немає)
async function addAlbumToList(albumData) {
  let existing = { albums: [] };

  try {
    const url  = getAlbumsUrl();
    const resp = await fetch(url + '?t=' + Date.now());
    if (resp.ok) existing = await resp.json();
  } catch (e) {
    // файл ще не існує — починаємо з порожнього списку
  }

  if (!existing.albums) existing.albums = [];

  // якщо альбом вже є — оновлюємо, якщо ні — додаємо
  const index = existing.albums.findIndex(function(a) { return a.id === albumData.id; });
  if (index >= 0) {
    existing.albums[index] = albumData;
  } else {
    existing.albums.unshift(albumData); // додаємо на початок (новіші зверху)
  }

  await saveAlbums(existing);
}

// Кнопка "Скопіювати посилання"
btnCopy.addEventListener('click', function() {
  navigator.clipboard.writeText(resultLink.textContent);
  btnCopy.textContent = 'Скопійовано!';
  setTimeout(function() {
    btnCopy.textContent = 'Скопіювати посилання';
  }, 2000);
});

// ── Стиснення фото ────────────────────────────────────────────

function resizePhoto(file, maxSize, quality) {
  return new Promise(function(resolve) {
    const reader = new FileReader();
    reader.onload = function(event) {
      const img = new Image();
      img.onload = function() {
        let width  = img.width;
        let height = img.height;

        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round(height * maxSize / width);
            width  = maxSize;
          } else {
            width  = Math.round(width * maxSize / height);
            height = maxSize;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width  = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);

        canvas.toBlob(function(blob) { resolve(blob); }, 'image/jpeg', quality);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ── Cloudinary ────────────────────────────────────────────────

async function uploadToCloudinary(blob, folder, publicId, resourceType, format) {
  const formData = new FormData();
  formData.append('file', blob);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', folder);
  formData.append('public_id', format ? publicId + '.' + format : publicId);

  const url      = 'https://api.cloudinary.com/v1_1/' + CLOUD_NAME + '/' + resourceType + '/upload';
  const response = await fetch(url, { method: 'POST', body: formData });
  const data     = await response.json();

  if (!response.ok) {
    console.error('Cloudinary error:', JSON.stringify(data));
    throw new Error('Cloudinary: ' + (data.error?.message || JSON.stringify(data)));
  }
  return data.secure_url;
}

// ── Google Drive ──────────────────────────────────────────────

async function getDriveFiles(folderId) {
  const params = new URLSearchParams({
    q:        "'" + folderId + "' in parents and trashed=false and mimeType contains 'image/'",
    key:      DRIVE_API_KEY,
    fields:   'files(id,name)',
    orderBy:  'name',
    pageSize: '1000'
  });

  const response = await fetch('https://www.googleapis.com/drive/v3/files?' + params);
  const data     = await response.json();

  if (!response.ok) throw new Error('Google Drive: ' + (data.error?.message || 'Помилка'));

  const fileMap = {};
  data.files.forEach(function(file) { fileMap[file.name] = file.id; });
  return fileMap;
}

function getDriveDownloadUrl(fileId) {
  return 'https://drive.google.com/uc?export=download&id=' + fileId;
}

// ── Допоміжні функції ─────────────────────────────────────────

function addLog(message, isError) {
  const item      = document.createElement('li');
  item.textContent = message;
  item.className  = isError ? 'error' : 'done';
  logList.appendChild(item);
  item.scrollIntoView({ block: 'nearest' });
}

function setProgress(percent, message) {
  progressFill.style.width = percent + '%';
  progressText.textContent = message;
}

function generateAlbumId(name) {
  const map = {
    'а':'a','б':'b','в':'v','г':'h','д':'d','е':'e','є':'ye','ж':'zh','з':'z',
    'и':'y','і':'i','ї':'yi','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o',
    'п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch',
    'ш':'sh','щ':'shch','ь':'','ю':'yu','я':'ya'
  };
  return name.toLowerCase()
    .split('')
    .map(function(ch) { return map[ch] || (ch.match(/[a-z0-9]/) ? ch : '-'); })
    .join('')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 40) || ('album-' + Date.now());
}

function extractDriveId(input) {
  input = input.trim();
  if (!input.includes('/')) return input;
  const match = input.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : input;
}

function todayDate() {
  const d = new Date();
  return d.getDate() + '.' + (d.getMonth() + 1) + '.' + d.getFullYear();
}

// ── Головна функція завантаження ──────────────────────────────

async function uploadAlbum() {
  const albumName     = document.getElementById('album-name').value.trim();
  const albumId       = generateAlbumId(albumName);
  const driveInput    = document.getElementById('drive-link').value.trim();
  const driveFolderId = extractDriveId(driveInput);

  if (!albumName || !driveInput) {
    alert('Заповни всі поля');
    return;
  }

  btnUpload.disabled            = true;
  progressSection.style.display = 'block';
  resultSection.style.display   = 'none';
  logList.innerHTML             = '';

  let firstThumbUrl = '';

  try {
    setProgress(0, 'Читаю Google Drive...');
    const driveFiles  = await getDriveFiles(driveFolderId);
    const fileNames   = Object.keys(driveFiles);

    if (fileNames.length === 0) {
      throw new Error('У папці Drive не знайдено фото. Перевір посилання і доступ.');
    }

    addLog('Google Drive: знайдено ' + fileNames.length + ' фото');

    const photos = [];

    for (let i = 0; i < fileNames.length; i++) {
      const fileName = fileNames[i];
      const fileId   = driveFiles[fileName];
      const percent  = Math.round(((i + 1) / fileNames.length) * 88);
      setProgress(percent, (i + 1) + ' з ' + fileNames.length + ' фото');

      // завантажуємо оригінал з Drive
      const driveUrl  = getDriveDownloadUrl(fileId);
      const resp      = await fetch(driveUrl);
      if (!resp.ok) throw new Error('Не вдалось завантажити ' + fileName + ' з Drive');
      const origBlob  = await resp.blob();

      // стискаємо в браузері
      const thumbBlob = await resizePhoto(origBlob, THUMB_MAX_SIZE, THUMB_QUALITY);

      const thumbUrl = await uploadToCloudinary(
        thumbBlob,
        'albums/' + albumId + '/thumbs',
        fileName.replace(/\.[^.]+$/, ''),
        'image'
      );

      if (i === 0) firstThumbUrl = thumbUrl;

      photos.push({ name: fileName, thumb: thumbUrl, full: driveUrl });
      addLog('✓ ' + fileName);
    }

    setProgress(93, 'Зберігаю photos.json...');
    const albumData = { name: albumName, id: albumId, photos: photos };
    const jsonBlob  = new Blob([JSON.stringify(albumData, null, 2)], { type: 'application/json' });
    await uploadToCloudinary(jsonBlob, 'albums/' + albumId, 'photos', 'raw', 'json');

    setProgress(97, 'Оновлюю список альбомів...');
    await addAlbumToList({
      id:     albumId,
      name:   albumName,
      public: false,
      thumb:  firstThumbUrl,
      date:   todayDate()
    });

    setProgress(100, 'Готово!');
    addLog('✓ Альбом опубліковано');

    const clientUrl             = SITE_URL + '/?a=' + albumId;
    resultLink.textContent      = clientUrl;
    resultSection.style.display = 'block';

    loadAlbums();

  } catch (error) {
    addLog('Помилка: ' + error.message, true);
    setProgress(0, 'Щось пішло не так');
  }

  btnUpload.disabled = false;
}

btnUpload.addEventListener('click', uploadAlbum);

// ── Імпорт існуючого альбому ─────────────────────────────────

async function importAlbum() {
  const input    = document.getElementById('import-id');
  const statusEl = document.getElementById('import-status');
  const albumId  = input.value.trim();

  if (!albumId) {
    statusEl.textContent = 'Введи ID альбому';
    return;
  }

  const btn = document.getElementById('btn-import');
  btn.textContent = '...';
  btn.disabled    = true;
  statusEl.textContent = 'Шукаю альбом...';

  try {
    const url  = 'https://res.cloudinary.com/' + CLOUD_NAME + '/raw/upload/albums/' + albumId + '/photos.json';
    statusEl.textContent = 'Завантажую ' + url;
    const resp = await fetch(url + '?t=' + Date.now());
    if (!resp.ok) throw new Error('Альбом не знайдено: ' + albumId + ' (HTTP ' + resp.status + ')');
    const data = await resp.json();

    statusEl.textContent = 'Зберігаю в список...';
    const firstThumb = data.photos && data.photos[0] ? data.photos[0].thumb : '';

    await addAlbumToList({
      id:     albumId,
      name:   data.name || albumId,
      public: false,
      thumb:  firstThumb,
      date:   todayDate()
    });

    input.value = '';
    statusEl.textContent = '✓ Додано';
    loadAlbums();

  } catch (e) {
    statusEl.textContent = '✗ ' + e.message;
  }

  btn.textContent = 'Додати';
  btn.disabled    = false;
}

document.getElementById('btn-import').addEventListener('click', importAlbum);

// Завантажуємо список альбомів при відкритті сторінки
loadAlbums();
