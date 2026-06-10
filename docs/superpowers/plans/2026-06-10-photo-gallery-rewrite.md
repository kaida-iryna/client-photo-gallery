# Photo Gallery Rewrite — Implementation Plan
# План реалізації — Редизайн фотогалереї

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal / Мета:** Переписати галерею на окремі HTML/CSS/JS файли з люксовим дизайном (темно-зелений + білі рамки) та замінити Python-скрипт браузерною адмін-панеллю.

**Architecture / Архітектура:** Дві незалежні частини: `index.*` (галерея для клієнта, деплоїться на Firebase) та `admin.*` (локальний інструмент фотографа, не деплоїться). Обидві частини читають/пишуть `photos.json` через Cloudinary. Оригінали зберігаються на Google Drive.

**Tech Stack:** HTML5, CSS3 (Grid, custom properties), vanilla JavaScript (Fetch API, Canvas API, FileReader), Cloudinary unsigned upload, Google Drive API v3, JSZip, Firebase Hosting.

---

## ЧАСТИНА 1: ГАЛЕРЕЯ / PART 1: GALLERY

---

### Task 1: Розділення файлів / Split into separate files

**Files:**
- Modify: `index.html`
- Create: `index.css`
- Create: `index.js`

- [ ] **Крок 1: Створити `index.css` і перенести весь CSS**

Виріжи весь вміст між `<style>` та `</style>` з `index.html` і встав у новий файл `index.css`. Тег `<style>` після цього видали.

- [ ] **Крок 2: Створити `index.js` і перенести весь JS**

Виріжи весь вміст між `<script>` та `</script>` з `index.html` і встав у новий файл `index.js`. Тег `<script>` після цього видали.

- [ ] **Крок 3: Підключити файли в `index.html`**

В `<head>` замість `<style>` додай:
```html
<link rel="stylesheet" href="index.css" />
```

Перед `</body>` замість `<script>` додай:
```html
<script src="index.js"></script>
```

- [ ] **Крок 4: Перевірка в браузері**

Відкрий `index.html?a=твій-альбом-id` у браузері. Галерея має виглядати точно так само як до змін.

- [ ] **Крок 5: Коміт**

```bash
git add index.html index.css index.js
git commit -m "refactor: split index.html into separate html/css/js files"
```

---

### Task 2: Нова колірна схема / New color scheme

**Files:**
- Modify: `index.css`

- [ ] **Крок 1: Замінити CSS-змінні на початку файлу**

Знайди блок `:root { ... }` і заміни його повністю:

```css
:root {
  --green-dark: #1c2b1c;
  --green-mid: #2a3d2a;
  --white: #ffffff;
  --white-faded: rgba(255, 255, 255, 0.55);
  --white-border: rgba(255, 255, 255, 0.15);
  --text-on-green: #ffffff;
  --text-muted: rgba(255, 255, 255, 0.6);
}
```

- [ ] **Крок 2: Оновити фон і колір тексту `body`**

Знайди стиль `body` і заміни кольори:

```css
body {
  background: var(--green-dark);
  color: var(--text-on-green);
  font-family: 'Jost', sans-serif;
  font-weight: 300;
  min-height: 100vh;
}
```

- [ ] **Крок 3: Оновити loading-екран**

```css
#loading {
  position: fixed;
  inset: 0;
  background: var(--green-dark);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 999;
  transition: opacity 0.5s;
}

.loading-logo {
  font-family: 'Cormorant Garamond', serif;
  font-size: 28px;
  font-weight: 300;
  color: var(--text-on-green);
  letter-spacing: 0.08em;
  margin-bottom: 32px;
}

.loading-bar {
  width: 120px;
  height: 1px;
  background: var(--white-border);
  position: relative;
  overflow: hidden;
}

.loading-bar::after {
  content: '';
  position: absolute;
  left: -40%;
  top: 0;
  width: 40%;
  height: 100%;
  background: var(--white);
  animation: slide 1.2s ease-in-out infinite;
}
```

- [ ] **Крок 4: Перевірка**

Відкрий `index.html?a=твій-альбом-id`. Фон має стати темно-зеленим.

- [ ] **Крок 5: Коміт**

```bash
git add index.css
git commit -m "style: apply dark green color scheme"
```

---

### Task 3: Hero-секція / Hero section

**Files:**
- Modify: `index.css`

- [ ] **Крок 1: Оновити стилі hero**

Знайди блок `/* ── HERO ── */` і заміни повністю:

```css
/* ── HERO ── */
.hero {
  text-align: center;
  padding: 80px 24px 56px;
}

.hero-ornament {
  font-size: 11px;
  letter-spacing: 0.35em;
  color: var(--white-faded);
  text-transform: uppercase;
  margin-bottom: 20px;
  opacity: 0;
  animation: fadeUp 0.9s ease 0.1s forwards;
}

.hero-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(44px, 9vw, 84px);
  font-weight: 300;
  line-height: 1.05;
  color: var(--text-on-green);
  opacity: 0;
  animation: fadeUp 0.9s ease 0.25s forwards;
}

.hero-title em {
  font-style: italic;
  color: var(--white-faded);
}

.hero-sub {
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 17px;
  color: var(--text-muted);
  margin-top: 12px;
  opacity: 0;
  animation: fadeUp 0.9s ease 0.4s forwards;
}

.hero-line {
  display: flex;
  align-items: center;
  gap: 16px;
  max-width: 180px;
  margin: 28px auto 32px;
  opacity: 0;
  animation: fadeUp 0.9s ease 0.5s forwards;
}

.hero-line::before,
.hero-line::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--white-border);
}

.hero-line span {
  font-size: 14px;
  color: var(--white-border);
}
```

- [ ] **Крок 2: Оновити кнопку "Завантажити всі"**

```css
.dl-all-wrap {
  text-align: center;
  margin-bottom: 56px;
  opacity: 0;
  animation: fadeUp 0.9s ease 0.6s forwards;
}

.btn-dl-all {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: transparent;
  color: var(--white);
  border: 1px solid var(--white);
  cursor: pointer;
  font-family: 'Jost', sans-serif;
  font-size: 12px;
  font-weight: 400;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  padding: 16px 36px;
  border-radius: 0;
  transition: background 0.3s, color 0.3s;
}

.btn-dl-all:hover {
  background: var(--white);
  color: var(--green-dark);
}

.btn-dl-all:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-dl-all svg {
  width: 16px;
  height: 16px;
}

.btn-note {
  display: block;
  margin-top: 10px;
  font-size: 12px;
  color: var(--text-muted);
  letter-spacing: 0.05em;
}
```

- [ ] **Крок 3: Перевірка**

Перевір що hero-заголовок і кнопка виглядають на темно-зеленому фоні.

- [ ] **Крок 4: Коміт**

```bash
git add index.css
git commit -m "style: redesign hero section and download button"
```

---

### Task 4: Сітка з білими рамками / Photo grid with white frames

**Files:**
- Modify: `index.css`
- Modify: `index.html` (змінити клас галереї)
- Modify: `index.js` (оновити клас у buildGallery)

- [ ] **Крок 1: Замінити `.masonry` на `.gallery-grid` в `index.css`**

Знайди блок `/* ── GALLERY ── */` і заміни повністю:

```css
/* ── GALLERY ── */
.gallery-wrap {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 24px 80px;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

@media (max-width: 900px) {
  .gallery-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 480px) {
  .gallery-grid { grid-template-columns: 1fr; }
}

.photo-item {
  background: var(--white);
  padding: 8px;
  opacity: 0;
  animation: fadeUp 0.6s ease forwards;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.photo-item img {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  transition: transform 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.photo-item:hover img {
  transform: scale(1.04);
}

.photo-overlay {
  position: absolute;
  inset: 8px;
  background: rgba(0, 0, 0, 0.35);
  opacity: 0;
  transition: opacity 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.photo-item:hover .photo-overlay {
  opacity: 1;
}

.dl-single {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: 1px solid var(--white);
  color: var(--white);
  text-decoration: none;
  font-family: 'Jost', sans-serif;
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  padding: 8px 18px;
  transition: background 0.25s, color 0.25s;
}

.dl-single:hover {
  background: var(--white);
  color: var(--green-dark);
}

.dl-single svg {
  width: 11px;
  height: 11px;
}
```

- [ ] **Крок 2: Оновити клас у `index.html`**

Знайди рядок:
```html
<div class="masonry" id="gallery"></div>
```
Заміни на:
```html
<div class="gallery-grid" id="gallery"></div>
```

- [ ] **Крок 3: Перевірка**

Відкрий галерею. Фото мають бути у рівній сітці з білими рамками, квадратні.

- [ ] **Крок 4: Коміт**

```bash
git add index.html index.css
git commit -m "style: replace masonry with equal grid and white frames"
```

---

### Task 5: Лайтбокс та футер / Lightbox and footer

**Files:**
- Modify: `index.css`

- [ ] **Крок 1: Оновити лайтбокс**

Знайди блок `/* ── LIGHTBOX ── */` і заміни:

```css
/* ── LIGHTBOX ── */
.lightbox {
  position: fixed;
  inset: 0;
  background: rgba(10, 18, 10, 0.97);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s;
}

.lightbox.open {
  opacity: 1;
  pointer-events: all;
}

.lightbox img {
  max-width: 88vw;
  max-height: 86vh;
  object-fit: contain;
}

.lb-close {
  position: absolute;
  top: 20px;
  right: 28px;
  background: none;
  border: none;
  color: var(--white-faded);
  font-size: 36px;
  cursor: pointer;
  font-weight: 200;
  line-height: 1;
  transition: color 0.2s;
  font-family: 'Jost', sans-serif;
}

.lb-close:hover { color: var(--white); }

.lb-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--white-faded);
  font-size: 48px;
  cursor: pointer;
  font-weight: 200;
  padding: 16px 20px;
  transition: color 0.2s;
  font-family: 'Jost', sans-serif;
  line-height: 1;
}

.lb-nav:hover { color: var(--white); }
.lb-prev { left: 8px; }
.lb-next { right: 8px; }

.lb-counter {
  position: absolute;
  bottom: 60px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 11px;
  letter-spacing: 0.2em;
  color: var(--text-muted);
}

.lb-dl-btn {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
}
```

- [ ] **Крок 2: Оновити футер**

```css
footer {
  text-align: center;
  padding: 28px 24px 48px;
  border-top: 1px solid var(--white-border);
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 15px;
  color: var(--text-muted);
}

footer strong {
  display: block;
  font-family: 'Jost', sans-serif;
  font-style: normal;
  font-size: 11px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--white-faded);
  margin-bottom: 5px;
}
```

- [ ] **Крок 3: Оновити progress-bar**

```css
.progress-wrap { max-width: 320px; margin: 16px auto 0; display: none; }
.progress-wrap.visible { display: block; }
.progress-bar-bg { height: 1px; background: var(--white-border); overflow: hidden; }
.progress-bar-fill { height: 100%; background: var(--white); width: 0%; transition: width 0.2s ease; }
.progress-text { font-size: 11px; color: var(--text-muted); letter-spacing: 0.1em; text-align: center; margin-top: 8px; }
```

- [ ] **Крок 4: Повна перевірка галереї**

Перевір всі функції: сітка, наведення, лайтбокс (стрілки, клавіатура), кнопка "завантажити всі", мобільна версія.

- [ ] **Крок 5: Коміт**

```bash
git add index.css
git commit -m "style: update lightbox, footer and progress bar for new design"
```

---

## ЧАСТИНА 2: АДМІН-ПАНЕЛЬ / PART 2: ADMIN PANEL

---

### Task 6: Налаштування Cloudinary / Cloudinary setup

**Files:** (конфігурація в браузері Cloudinary, не в коді)

- [ ] **Крок 1: Створити unsigned upload preset**

1. Відкрий [console.cloudinary.com](https://console.cloudinary.com)
2. Перейди: Settings → Upload → Upload presets → Add upload preset
3. Signing mode: **Unsigned**
4. Folder: залиш порожнім (папку передамо у коді)
5. Збережи та скопіюй назву preset (наприклад: `gallery_unsigned`)

- [ ] **Крок 2: Дозволити завантаження raw-файлів**

В тому ж preset:
- Resource type: **Auto** (дозволяє і images, і raw)
- Збережи зміни

- [ ] **Крок 3: Записати дані**

Тобі знадобляться:
- Cloud name: є в Settings → Account
- Upload preset name: щойно створений
- Google Drive API key: з Google Cloud Console (вже є в upload.py)
- Firebase site URL: `https://твій-проект.web.app`

---

### Task 7: Структура `admin.html` / Admin HTML structure

**Files:**
- Create: `admin.html`

- [ ] **Крок 1: Створити `admin.html`**

```html
<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Завантаження альбому</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Jost:wght@300;400&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="admin.css" />
</head>
<body>

  <div class="page">

    <header class="page-header">
      <h1 class="page-title">Ірина <em>Кайда</em></h1>
      <p class="page-sub">Завантаження альбому</p>
    </header>

    <main class="form-wrap">

      <!-- Крок 1: Дані альбому -->
      <section class="form-section">
        <h2 class="section-title">01 — Дані альбому</h2>

        <div class="field">
          <label for="album-name">Назва альбому</label>
          <input type="text" id="album-name" placeholder="наприклад: Зйомка Травень 2026" />
        </div>

        <div class="field">
          <label for="album-id">ID альбому <span class="hint">(латиниця, без пробілів)</span></label>
          <input type="text" id="album-id" placeholder="наприклад: may-2026" />
        </div>

        <div class="field">
          <label for="drive-folder-id">ID папки Google Drive</label>
          <input type="text" id="drive-folder-id" placeholder="наприклад: 1R9zouzNHKV4R1559FwyCr00vytQQatfy" />
        </div>
      </section>

      <!-- Крок 2: Вибір фото -->
      <section class="form-section">
        <h2 class="section-title">02 — Фотографії</h2>

        <div class="field">
          <label for="photos-input">Вибери фото з комп'ютера</label>
          <input type="file" id="photos-input" multiple accept="image/*" />
        </div>

        <ul class="file-list" id="file-list"></ul>
      </section>

      <!-- Кнопка -->
      <button class="btn-upload" id="btn-upload">
        Завантажити альбом
      </button>

      <!-- Прогрес -->
      <div class="progress-section" id="progress-section" style="display: none;">
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" id="progress-fill"></div>
        </div>
        <p class="progress-text" id="progress-text">Підготовка...</p>
        <ul class="log" id="log"></ul>
      </div>

      <!-- Результат -->
      <div class="result-section" id="result-section" style="display: none;">
        <p class="result-label">Посилання для клієнта:</p>
        <p class="result-link" id="result-link"></p>
        <button class="btn-copy" id="btn-copy">Скопіювати посилання</button>
      </div>

    </main>

  </div>

  <script src="admin.js"></script>
</body>
</html>
```

- [ ] **Крок 2: Перевірка структури**

Відкрий `admin.html` у браузері. Має бути видно форму (без стилів — це нормально на цьому кроці).

- [ ] **Крок 3: Коміт**

```bash
git add admin.html
git commit -m "feat: add admin panel HTML structure"
```

---

### Task 8: Стилі адмін-панелі / Admin styles

**Files:**
- Create: `admin.css`

- [ ] **Крок 1: Створити `admin.css`**

```css
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --green-dark: #1c2b1c;
  --green-mid: #2a3d2a;
  --white: #ffffff;
  --white-faded: rgba(255, 255, 255, 0.6);
  --white-border: rgba(255, 255, 255, 0.15);
  --text-muted: rgba(255, 255, 255, 0.5);
}

body {
  background: var(--green-dark);
  color: var(--white);
  font-family: 'Jost', sans-serif;
  font-weight: 300;
  min-height: 100vh;
}

.page {
  max-width: 640px;
  margin: 0 auto;
  padding: 64px 24px 80px;
}

/* Шапка */
.page-header {
  text-align: center;
  margin-bottom: 56px;
}

.page-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 36px;
  font-weight: 300;
  color: var(--white);
}

.page-title em {
  font-style: italic;
  color: var(--white-faded);
}

.page-sub {
  font-size: 11px;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-top: 8px;
}

/* Секції форми */
.form-section {
  margin-bottom: 48px;
  padding-bottom: 48px;
  border-bottom: 1px solid var(--white-border);
}

.section-title {
  font-family: 'Jost', sans-serif;
  font-size: 11px;
  font-weight: 400;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--white-faded);
  margin-bottom: 28px;
}

/* Поля вводу */
.field {
  margin-bottom: 20px;
}

.field label {
  display: block;
  font-size: 12px;
  letter-spacing: 0.1em;
  color: var(--white-faded);
  margin-bottom: 8px;
}

.field .hint {
  font-size: 11px;
  color: var(--text-muted);
}

.field input[type="text"] {
  width: 100%;
  background: var(--green-mid);
  border: 1px solid var(--white-border);
  color: var(--white);
  font-family: 'Jost', sans-serif;
  font-size: 14px;
  font-weight: 300;
  padding: 12px 16px;
  outline: none;
  transition: border-color 0.2s;
}

.field input[type="text"]:focus {
  border-color: var(--white-faded);
}

.field input[type="text"]::placeholder {
  color: var(--text-muted);
}

.field input[type="file"] {
  width: 100%;
  color: var(--white-faded);
  font-family: 'Jost', sans-serif;
  font-size: 13px;
  cursor: pointer;
}

/* Список файлів */
.file-list {
  list-style: none;
  margin-top: 16px;
}

.file-list li {
  font-size: 12px;
  color: var(--text-muted);
  padding: 4px 0;
  border-bottom: 1px solid var(--white-border);
  display: flex;
  justify-content: space-between;
}

/* Кнопка завантаження */
.btn-upload {
  width: 100%;
  background: transparent;
  color: var(--white);
  border: 1px solid var(--white);
  font-family: 'Jost', sans-serif;
  font-size: 12px;
  font-weight: 400;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  padding: 18px;
  cursor: pointer;
  transition: background 0.3s, color 0.3s;
  margin-bottom: 40px;
}

.btn-upload:hover {
  background: var(--white);
  color: var(--green-dark);
}

.btn-upload:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Прогрес */
.progress-section {
  margin-bottom: 40px;
}

.progress-bar-bg {
  height: 1px;
  background: var(--white-border);
  overflow: hidden;
  margin-bottom: 12px;
}

.progress-bar-fill {
  height: 100%;
  background: var(--white);
  width: 0%;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  color: var(--white-faded);
  letter-spacing: 0.05em;
  margin-bottom: 16px;
}

.log {
  list-style: none;
}

.log li {
  font-size: 11px;
  color: var(--text-muted);
  padding: 3px 0;
  letter-spacing: 0.05em;
}

.log li.done {
  color: var(--white-faded);
}

.log li.error {
  color: #e88;
}

/* Результат */
.result-section {
  padding: 32px;
  border: 1px solid var(--white-border);
  text-align: center;
}

.result-label {
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.result-link {
  font-family: 'Cormorant Garamond', serif;
  font-size: 18px;
  color: var(--white);
  word-break: break-all;
  margin-bottom: 20px;
}

.btn-copy {
  background: transparent;
  color: var(--white);
  border: 1px solid var(--white);
  font-family: 'Jost', sans-serif;
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  padding: 12px 28px;
  cursor: pointer;
  transition: background 0.3s, color 0.3s;
}

.btn-copy:hover {
  background: var(--white);
  color: var(--green-dark);
}
```

- [ ] **Крок 2: Перевірка**

Відкрий `admin.html`. Форма має виглядати стильно на темно-зеленому фоні.

- [ ] **Крок 3: Коміт**

```bash
git add admin.css
git commit -m "style: add admin panel styles"
```

---

### Task 9: Конфіг і вибір файлів / Config and file selection

**Files:**
- Create: `admin.js`

- [ ] **Крок 1: Створити `admin.js` з конфігом і відображенням файлів**

```js
// ── КОНФІГ ────────────────────────────────────────────────────
// Заповни свої дані тут
const CLOUD_NAME    = 'YOUR_CLOUD_NAME';
const UPLOAD_PRESET = 'YOUR_UNSIGNED_PRESET';
const DRIVE_API_KEY = 'YOUR_GOOGLE_DRIVE_API_KEY';
const SITE_URL      = 'https://YOUR-PROJECT.web.app';
// ─────────────────────────────────────────────────────────────

const THUMB_MAX_SIZE = 1200;
const THUMB_QUALITY  = 0.78;

// Отримуємо елементи зі сторінки
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

// Коли користувач вибирає файли — показуємо список
photosInput.addEventListener('change', function() {
  const files = Array.from(photosInput.files);
  fileList.innerHTML = '';

  files.forEach(function(file) {
    const sizeInMb = (file.size / 1024 / 1024).toFixed(1);
    const item = document.createElement('li');
    item.innerHTML = '<span>' + file.name + '</span><span>' + sizeInMb + ' MB</span>';
    fileList.appendChild(item);
  });
});

// Кнопка "Скопіювати посилання"
btnCopy.addEventListener('click', function() {
  navigator.clipboard.writeText(resultLink.textContent);
  btnCopy.textContent = 'Скопійовано!';
  setTimeout(function() {
    btnCopy.textContent = 'Скопіювати посилання';
  }, 2000);
});
```

- [ ] **Крок 2: Перевірка**

Відкрий `admin.html`, вибери кілька файлів — список має з'явитися під полем.

- [ ] **Крок 3: Коміт**

```bash
git add admin.js
git commit -m "feat: add admin config and file selection"
```

---

### Task 10: Стиснення фото / Photo compression

**Files:**
- Modify: `admin.js`

- [ ] **Крок 1: Додати функцію стиснення через Canvas**

Додай в кінець `admin.js`:

```js
// Стискає фото до потрібного розміру і повертає Blob (готовий для завантаження)
function resizePhoto(file, maxSize, quality) {
  return new Promise(function(resolve) {
    const reader = new FileReader();

    reader.onload = function(event) {
      const img = new Image();

      img.onload = function() {
        // Рахуємо нові розміри, зберігаючи пропорції
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

        // Малюємо зменшене фото на canvas
        const canvas = document.createElement('canvas');
        canvas.width  = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Конвертуємо в JPEG з потрібною якістю
        canvas.toBlob(function(blob) {
          resolve(blob);
        }, 'image/jpeg', quality);
      };

      img.src = event.target.result;
    };

    reader.readAsDataURL(file);
  });
}
```

- [ ] **Крок 2: Перевірка (в консолі браузера)**

Відкрий `admin.html`, відкрий DevTools (F12) → Console і запусти тест:

```js
const file = document.getElementById('photos-input').files[0];
resizePhoto(file, 1200, 0.78).then(blob => console.log('Розмір після стиснення:', blob.size));
```

Вибери фото і перевір що розмір blob-у менший за оригінал.

- [ ] **Крок 3: Коміт**

```bash
git add admin.js
git commit -m "feat: add photo resize via Canvas API"
```

---

### Task 11: Завантаження на Cloudinary / Upload to Cloudinary

**Files:**
- Modify: `admin.js`

- [ ] **Крок 1: Додати функцію завантаження на Cloudinary**

Додай в кінець `admin.js`:

```js
// Завантажує файл на Cloudinary і повертає URL
async function uploadToCloudinary(blob, folder, publicId, resourceType) {
  const formData = new FormData();
  formData.append('file', blob);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', folder);
  formData.append('public_id', publicId);

  const url = 'https://api.cloudinary.com/v1_1/' + CLOUD_NAME + '/' + resourceType + '/upload';

  const response = await fetch(url, {
    method: 'POST',
    body: formData
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error('Cloudinary: ' + data.error.message);
  }

  return data.secure_url;
}
```

- [ ] **Крок 2: Додати функції для Google Drive**

Додай в кінець `admin.js`:

```js
// Отримує список файлів з папки Google Drive
// Повертає об'єкт { 'ім'я_файлу': 'file_id', ... }
async function getDriveFiles(folderId) {
  const params = new URLSearchParams({
    q:        "'" + folderId + "' in parents and trashed=false",
    key:      DRIVE_API_KEY,
    fields:   'files(id,name)',
    pageSize: '1000'
  });

  const url = 'https://www.googleapis.com/drive/v3/files?' + params;
  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error('Google Drive: ' + (data.error?.message || 'Помилка'));
  }

  const fileMap = {};
  data.files.forEach(function(file) {
    fileMap[file.name] = file.id;
  });

  return fileMap;
}

// Повертає пряме посилання на скачування файлу з Drive
function getDriveDownloadUrl(fileId) {
  return 'https://drive.google.com/uc?export=download&id=' + fileId;
}
```

- [ ] **Крок 3: Коміт**

```bash
git add admin.js
git commit -m "feat: add Cloudinary upload and Drive API functions"
```

---

### Task 12: Головний процес завантаження / Main upload flow

**Files:**
- Modify: `admin.js`

- [ ] **Крок 1: Додати допоміжні функції логу і прогресу**

Додай в кінець `admin.js`:

```js
// Додає рядок в лог на сторінці
function addLog(message, isError) {
  const item = document.createElement('li');
  item.textContent = message;
  if (isError) {
    item.className = 'error';
  } else {
    item.className = 'done';
  }
  logList.appendChild(item);
  item.scrollIntoView();
}

// Оновлює прогрес-бар (від 0 до 100)
function setProgress(percent, message) {
  progressFill.style.width = percent + '%';
  progressText.textContent = message;
}
```

- [ ] **Крок 2: Додати головну функцію `uploadAlbum`**

Додай в кінець `admin.js`:

```js
// Головна функція — запускається при натисканні кнопки
async function uploadAlbum() {
  const albumName    = document.getElementById('album-name').value.trim();
  const albumId      = document.getElementById('album-id').value.trim();
  const driveFolderId = document.getElementById('drive-folder-id').value.trim();
  const files        = Array.from(photosInput.files);

  // Перевірка що всі поля заповнені
  if (!albumName || !albumId || !driveFolderId || files.length === 0) {
    alert('Заповни всі поля і вибери фото');
    return;
  }

  // Вмикаємо режим завантаження
  btnUpload.disabled = true;
  progressSection.style.display = 'block';
  resultSection.style.display   = 'none';
  logList.innerHTML = '';

  try {
    // Крок 1: отримуємо список файлів з Google Drive
    setProgress(0, 'Читаю Google Drive...');
    const driveFiles = await getDriveFiles(driveFolderId);
    addLog('Google Drive: знайдено ' + Object.keys(driveFiles).length + ' файлів');

    // Крок 2: завантажуємо кожне фото
    const photos = [];

    for (let i = 0; i < files.length; i++) {
      const file    = files[i];
      const percent = Math.round(((i + 1) / files.length) * 90);

      setProgress(percent, (i + 1) + ' з ' + files.length + ' фото');

      // Стискаємо
      const thumbBlob = await resizePhoto(file, THUMB_MAX_SIZE, THUMB_QUALITY);

      // Завантажуємо превью на Cloudinary
      const thumbUrl = await uploadToCloudinary(
        thumbBlob,
        'albums/' + albumId + '/thumbs',
        file.name.replace(/\.[^.]+$/, ''),
        'image'
      );

      // Шукаємо оригінал в Google Drive
      const fileId    = driveFiles[file.name];
      const fullUrl   = fileId ? getDriveDownloadUrl(fileId) : thumbUrl;

      if (!fileId) {
        addLog('⚠ ' + file.name + ' — не знайдено в Drive', true);
      }

      photos.push({
        name:  file.name,
        thumb: thumbUrl,
        full:  fullUrl
      });

      addLog('✓ ' + file.name);
    }

    // Крок 3: створюємо і завантажуємо photos.json
    setProgress(95, 'Зберігаю photos.json...');

    const albumData = {
      name:   albumName,
      id:     albumId,
      photos: photos
    };

    const jsonBlob = new Blob(
      [JSON.stringify(albumData, null, 2)],
      { type: 'application/json' }
    );

    await uploadToCloudinary(
      jsonBlob,
      'albums/' + albumId,
      'photos',
      'raw'
    );

    // Готово!
    setProgress(100, 'Готово!');
    addLog('✓ Альбом опубліковано');

    const clientUrl = SITE_URL + '/?a=' + albumId;
    resultLink.textContent    = clientUrl;
    resultSection.style.display = 'block';

  } catch (error) {
    addLog('Помилка: ' + error.message, true);
    setProgress(0, 'Щось пішло не так');
  }

  btnUpload.disabled = false;
}

// Прив'язуємо кнопку до функції
btnUpload.addEventListener('click', uploadAlbum);
```

- [ ] **Крок 2: Заповнити конфіг**

На початку `admin.js` заміни значення:
```js
const CLOUD_NAME    = 'dthjx6acg';       // твій cloud name
const UPLOAD_PRESET = 'gallery_unsigned'; // назва preset зі Task 6
const DRIVE_API_KEY = 'AIza...';          // ключ з Google Console
const SITE_URL      = 'https://iryna-kaida-gallery-elf.web.app';
```

- [ ] **Крок 3: Повна перевірка**

1. Відкрий `admin.html` у браузері
2. Заповни форму (назва, ID, Drive folder ID)
3. Вибери 2-3 тестових фото
4. Натисни "Завантажити альбом"
5. Перевір прогрес, лог, готове посилання
6. Відкрий посилання — галерея має показати нові фото

- [ ] **Крок 4: Коміт**

```bash
git add admin.js
git commit -m "feat: add main upload flow — completes admin panel"
```

---

## Фінал / Final

- [ ] **Перевірити що `admin.html` НЕ потрапить в `firebase.json` rewrites**

Перевір `firebase.json` — `admin.html` не повинен деплоїтись як публічна сторінка. Якщо є catch-all rewrite на `index.html` — це нормально, `admin.html` просто не буде в хостингу.

- [ ] **Merge в main і деплой**

```bash
git checkout main
git merge develop
firebase deploy --only hosting
```

- [ ] **Фінальна перевірка на live-сайті**

Відкрий `https://iryna-kaida-gallery-elf.web.app/?a=твій-альбом` — перевір дизайн, сітку, лайтбокс, завантаження.
