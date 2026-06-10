# Редизайн фотогалереї / Photo Gallery Rewrite
Дата / Date: 2026-06-10

---

## Мета / Goal

**UA:** Переписати застосунок на HTML/CSS/JavaScript з розділенням файлів. Замінити Python-скрипт браузерною панеллю завантаження. Повністю оновити дизайн галереї.

**EN:** Rewrite the application in HTML/CSS/JavaScript with separate files. Replace the Python upload script with a browser-based admin panel. Fully redesign the gallery.

---

## Структура файлів / File Structure

```
client-photo-gallery/
├── index.html        ← галерея (клієнт) / gallery (client)
├── index.css         ← стилі галереї / gallery styles
├── index.js          ← логіка галереї / gallery logic
├── admin.html        ← панель завантаження (локально) / upload panel (local only)
├── admin.css         ← стилі панелі / admin styles
└── admin.js          ← логіка завантаження / upload logic
```

---

## Архітектура / Architecture

**UA:** Потік даних не змінюється — лише замінюємо Python на браузерний JS.

**EN:** Data flow stays the same — we only replace Python with browser JS.

```
admin.js
  → стискає фото через Canvas API (до 1200px, JPEG)
  → завантажує превью на Cloudinary (unsigned upload preset)
  → читає Google Drive API → отримує file ID кожного оригіналу
  → створює photos.json → завантажує на Cloudinary (raw)

index.js
  → читає ?a=album-id з URL
  → завантажує photos.json з Cloudinary
  → будує галерею: превью з Cloudinary, завантаження з Google Drive
```

**UA:** Усі сервіси безкоштовні: Firebase Hosting (Spark), Cloudinary (free tier), Google Drive API.

**EN:** All services are free: Firebase Hosting (Spark), Cloudinary (free tier), Google Drive API.

---

## Дизайн галереї / Gallery Design

### Кольори / Colors

| Елемент / Element | Значення / Value |
|---|---|
| Фон / Background | `#1c2b1c` (темно-зелений / dark green) |
| Рамка фото / Photo border | `#ffffff` 8px, без тіні / no shadow |
| Текст / Text | `#ffffff` |
| Кнопки / Buttons | білий контур + білий текст / white outline + white text |
| При наведенні / Hover | заливка білим, текст темний / white fill, dark text |

### Сітка / Grid

- 3 колонки на десктопі / 3 columns on desktop
- 2 колонки на планшеті (≤900px) / 2 columns on tablet
- 1 колонка на телефоні (≤480px) / 1 column on mobile
- Рівні квадратні комірки (`object-fit: cover`) / Equal square cells
- Відступ між фото: 16px / Gap: 16px

### Взаємодія / Interactions

- Наведення на фото → кнопка "Завантажити" поверх фото
- Клік на фото → лайтбокс (темний фон, стрілки, лічильник)
- В лайтбоксі: кнопка завантажити одне фото
- Кнопка "Завантажити всі" → ZIP-архів (JSZip)

### Стани / States

- Завантаження: екран з іменем фотографа
- Помилка (альбом не знайдено): повідомлення
- Успіх: галерея з фото

---

## Панель завантаження / Admin Panel

**UA:** Локальний файл. Відкривається в браузері з комп'ютера фотографа. На Firebase не деплоїться.

**EN:** Local file only. Opens in the browser on the photographer's computer. Not deployed to Firebase.

### Поля форми / Form Fields

- Назва альбому — наприклад: "Зйомка Травень 2026"
- ID альбому (латиниця) — наприклад: "may-2026" (використовується в посиланні)
- ID папки Google Drive — папка з оригіналами

### Процес / Process

1. Вибір фото (`<input type="file" multiple>`)
2. Список вибраних файлів з розмірами
3. Кнопка "Завантажити альбом"
4. Прогрес: "3 з 47 фото завантажено"
5. Готове посилання для клієнта + кнопка "Скопіювати"

### Конфіг / Config (вверху admin.js)

```js
const CLOUD_NAME    = 'ваш_cloud_name';
const UPLOAD_PRESET = 'ваш_unsigned_preset';
const DRIVE_API_KEY = 'ваш_api_key';
const SITE_URL      = 'https://ваш-проект.web.app';
```

---

## Стиль коду / Code Style

**UA:** Код пишеться так, щоб його розуміла учениця:
- Зрозумілі імена змінних (`photo`, `albumData`, `index` — не `e`, `d`, `x`)
- Короткі функції, кожна робить одну дію
- Коментарі пояснюють "чому", а не "що"
- Без хитрощів — тільки те, що зрозуміло

**EN:** Code is written to be understandable by a student:
- Clear variable names
- Short functions, one action each
- Comments explain "why", not "what"
- No clever tricks — only readable code

---

## Що залишається без змін / What Stays the Same

**UA/EN:**
- Firebase Hosting config (`firebase.json`, `storage.rules`, `cors.json`)
- Формат `photos.json`: `{ name, id, photos: [{name, thumb, full}] }`
- Cloudinary як CDN для превью і `photos.json`
- Google Drive як сховище оригіналів
