// CLOUD_NAME, UPLOAD_PRESET, DRIVE_API_KEY, SITE_URL — з admin-config.js

const THUMB_MAX_SIZE = 1200;
const THUMB_QUALITY  = 0.78;

// Елементи сторінки
const photosInput     = document.getElementById('photos-input');
const fileList        = document.getElementById('file-list');
const btnUpload       = document.getElementById('btn-upload');
const progressSection = document.getElementById('progress-section');
const progressFill    = document.getElementById('progress-fill');
const progressText    = document.getElementById('progress-text');
const logList         = document.getElementById('log');
const resultSection   = document.getElementById('result-section');
const resultLink      = document.getElementById('result-link');
const btnCopy         = document.getElementById('btn-copy');

// Показуємо список вибраних файлів
photosInput.addEventListener('change', function() {
  const files     = Array.from(photosInput.files);
  const fileCount = document.getElementById('file-count');
  fileList.innerHTML = '';

  fileCount.textContent = files.length + ' ' + declension(files.length, 'фото', 'фото', 'фото') + ' вибрано';

  files.forEach(function(file) {
    const sizeInMb = (file.size / 1024 / 1024).toFixed(1);
    const item     = document.createElement('li');
    item.innerHTML = '<span>' + file.name + '</span><span>' + sizeInMb + ' MB</span>';
    fileList.appendChild(item);
  });
});

// Відмінювання для числівників
function declension(n, one, few, many) {
  if (n % 10 === 1 && n % 100 !== 11) return one;
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return few;
  return many;
}

// Генерує ID альбому з назви (транслітерація)
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

// Витягує ID папки з посилання Google Drive
function extractDriveId(input) {
  input = input.trim();
  // якщо це вже просто ID без слешів — повертаємо як є
  if (!input.includes('/')) return input;
  // шукаємо ID в посиланні: /folders/XXXXX
  const match = input.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : input;
}

// Кнопка "Скопіювати посилання"
btnCopy.addEventListener('click', function() {
  navigator.clipboard.writeText(resultLink.textContent);
  btnCopy.textContent = 'Скопійовано!';
  setTimeout(function() {
    btnCopy.textContent = 'Скопіювати посилання';
  }, 2000);
});

// ── Стиснення фото через Canvas ───────────────────────────────
function resizePhoto(file, maxSize, quality) {
  return new Promise(function(resolve) {
    const reader = new FileReader();

    reader.onload = function(event) {
      const img = new Image();

      img.onload = function() {
        let width  = img.width;
        let height = img.height;

        // зменшуємо якщо фото більше за maxSize
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

        canvas.toBlob(function(blob) {
          resolve(blob);
        }, 'image/jpeg', quality);
      };

      img.src = event.target.result;
    };

    reader.readAsDataURL(file);
  });
}

// ── Завантаження на Cloudinary ────────────────────────────────
async function uploadToCloudinary(blob, folder, publicId, resourceType) {
  const formData = new FormData();
  formData.append('file', blob);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', folder);
  formData.append('public_id', publicId);

  const url = 'https://api.cloudinary.com/v1_1/' + CLOUD_NAME + '/' + resourceType + '/upload';

  const response = await fetch(url, { method: 'POST', body: formData });
  const data     = await response.json();

  if (!response.ok) {
    throw new Error('Cloudinary: ' + data.error.message);
  }

  return data.secure_url;
}

// ── Google Drive API ──────────────────────────────────────────
async function getDriveFiles(folderId) {
  const params = new URLSearchParams({
    q:        "'" + folderId + "' in parents and trashed=false",
    key:      DRIVE_API_KEY,
    fields:   'files(id,name)',
    pageSize: '1000'
  });

  const response = await fetch('https://www.googleapis.com/drive/v3/files?' + params);
  const data     = await response.json();

  if (!response.ok) {
    throw new Error('Google Drive: ' + (data.error?.message || 'Помилка'));
  }

  // перетворюємо масив на об'єкт { ім'я: id }
  const fileMap = {};
  data.files.forEach(function(file) {
    fileMap[file.name] = file.id;
  });
  return fileMap;
}

function getDriveDownloadUrl(fileId) {
  return 'https://drive.google.com/uc?export=download&id=' + fileId;
}

// ── Лог і прогрес ────────────────────────────────────────────
function addLog(message, isError) {
  const item      = document.createElement('li');
  item.textContent = message;
  item.className  = isError ? 'error' : 'done';
  logList.appendChild(item);
  item.scrollIntoView({ block: 'nearest' });
}

function setProgress(percent, message) {
  progressFill.style.width  = percent + '%';
  progressText.textContent  = message;
}

// ── Головна функція завантаження ──────────────────────────────
async function uploadAlbum() {
  const albumName     = document.getElementById('album-name').value.trim();
  const albumId       = generateAlbumId(albumName);
  const driveInput    = document.getElementById('drive-link').value.trim();
  const driveFolderId = extractDriveId(driveInput);
  const files         = Array.from(photosInput.files);

  if (!albumName || !driveInput || files.length === 0) {
    alert('Заповни всі поля і вибери фото');
    return;
  }

  btnUpload.disabled            = true;
  progressSection.style.display = 'block';
  resultSection.style.display   = 'none';
  logList.innerHTML             = '';

  try {
    // 1. Читаємо файли з Google Drive
    setProgress(0, 'Читаю Google Drive...');
    const driveFiles = await getDriveFiles(driveFolderId);
    addLog('Google Drive: знайдено ' + Object.keys(driveFiles).length + ' файлів');

    // 2. Завантажуємо кожне фото
    const photos = [];

    for (let i = 0; i < files.length; i++) {
      const file    = files[i];
      const percent = Math.round(((i + 1) / files.length) * 90);
      setProgress(percent, (i + 1) + ' з ' + files.length + ' фото');

      // стискаємо превью
      const thumbBlob = await resizePhoto(file, THUMB_MAX_SIZE, THUMB_QUALITY);

      // завантажуємо превью на Cloudinary
      const thumbUrl = await uploadToCloudinary(
        thumbBlob,
        'albums/' + albumId + '/thumbs',
        file.name.replace(/\.[^.]+$/, ''),
        'image'
      );

      // шукаємо оригінал в Google Drive
      const fileId  = driveFiles[file.name];
      const fullUrl = fileId ? getDriveDownloadUrl(fileId) : thumbUrl;

      if (!fileId) {
        addLog('⚠ ' + file.name + ' — не знайдено в Drive', true);
      }

      photos.push({ name: file.name, thumb: thumbUrl, full: fullUrl });
      addLog('✓ ' + file.name);
    }

    // 3. Зберігаємо photos.json на Cloudinary
    setProgress(95, 'Зберігаю photos.json...');

    const albumData = { name: albumName, id: albumId, photos: photos };
    const jsonBlob  = new Blob([JSON.stringify(albumData, null, 2)], { type: 'application/json' });

    await uploadToCloudinary(jsonBlob, 'albums/' + albumId, 'photos', 'raw');

    // 4. Готово
    setProgress(100, 'Готово!');
    addLog('✓ Альбом опубліковано');

    const clientUrl           = SITE_URL + '/?a=' + albumId;
    resultLink.textContent    = clientUrl;
    resultSection.style.display = 'block';

  } catch (error) {
    addLog('Помилка: ' + error.message, true);
    setProgress(0, 'Щось пішло не так');
  }

  btnUpload.disabled = false;
}

btnUpload.addEventListener('click', uploadAlbum);
