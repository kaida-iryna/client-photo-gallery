#!/usr/bin/env python3
"""
upload.py — Будує галерею: превью у Cloudinary, оригінали з Google Drive

Використання:
    python3 upload.py /локальна/папка "Назва Альбому" album-id DRIVE_FOLDER_ID

Приклад:
    python3 upload.py "/Users/ira/Desktop/Х-2" "Зйомка Травень 2026" may-2026 1R9zouzNHKV4R1559FwyCr00vytQQatfy

Де DRIVE_FOLDER_ID — ID папки в Google Drive (з посилання на папку).
Файли в Drive і локальній папці мають мати ОДНАКОВІ імена.
"""

from __future__ import annotations
import sys, json, time, io, urllib.request, urllib.parse
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("❌ pip3 install Pillow"); sys.exit(1)

try:
    import cloudinary, cloudinary.uploader
except ImportError:
    print("❌ pip3 install cloudinary"); sys.exit(1)

# ── Конфіг ────────────────────────────────────────────────────
# Cloudinary: console.cloudinary.com → Settings → API Keys
CLOUD_NAME    = "YOUR_CLOUD_NAME"      # наприклад: "dthjx6acg"
API_KEY       = "YOUR_CLOUDINARY_API_KEY"
API_SECRET    = "YOUR_CLOUDINARY_API_SECRET"

# Google Drive API key: console.cloud.google.com → APIs & Services
# → Credentials → Create credentials → API key
# Потрібно увімкнути Google Drive API для проекту
DRIVE_API_KEY = "YOUR_GOOGLE_DRIVE_API_KEY"

# URL сайту після деплою на Firebase Hosting
# firebase deploy --only hosting
SITE_URL      = "https://YOUR-PROJECT.web.app"
# ─────────────────────────────────────────────────────────────

THUMB_SIZE    = 1200
THUMB_QUALITY = 78
PHOTO_EXTS    = {'.jpg', '.jpeg', '.png', '.webp'}


def to_jpeg_bytes(path: Path, max_px: int, quality: int) -> bytes:
    img = Image.open(str(path)).convert('RGB')
    if max(img.size) > max_px:
        img.thumbnail((max_px, max_px), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=quality, optimize=True)
    buf.seek(0)
    return buf.read()


def drive_list_files(folder_id: str) -> dict[str, str]:
    """Повертає {ім'я_файлу: file_id} для всіх файлів у папці Drive."""
    files = {}
    page_token = None
    while True:
        params = {
            'q': f"'{folder_id}' in parents and trashed=false",
            'key': DRIVE_API_KEY,
            'fields': 'nextPageToken,files(id,name)',
            'pageSize': '1000',
        }
        if page_token:
            params['pageToken'] = page_token
        url = 'https://www.googleapis.com/drive/v3/files?' + urllib.parse.urlencode(params)
        with urllib.request.urlopen(url) as resp:
            data = json.loads(resp.read())
        for f in data.get('files', []):
            files[f['name']] = f['id']
        page_token = data.get('nextPageToken')
        if not page_token:
            break
    return files


def drive_download_url(file_id: str) -> str:
    return f"https://drive.google.com/uc?export=download&id={file_id}"


def process(photos_dir: str, album_name: str, album_id: str, drive_folder_id: str):
    folder = Path(photos_dir)
    if not folder.is_dir():
        print(f"❌ Папка не знайдена: {photos_dir}"); sys.exit(1)

    cloudinary.config(cloud_name=CLOUD_NAME, api_key=API_KEY,
                      api_secret=API_SECRET, secure=True)

    photos = sorted(p for p in folder.iterdir()
                    if p.suffix.lower() in PHOTO_EXTS)
    if not photos:
        print(f"❌ Фото не знайдено в: {photos_dir}"); sys.exit(1)

    print(f"\n{'='*58}")
    print(f"  Альбом : {album_name}")
    print(f"  ID     : {album_id}")
    print(f"  Фото   : {len(photos)}")
    print(f"  Drive  : {drive_folder_id}")
    print(f"{'='*58}")
    print(f"\n  Отримую список файлів з Google Drive...", end='', flush=True)

    drive_files = drive_list_files(drive_folder_id)
    print(f" знайдено {len(drive_files)} файлів\n")

    results = []
    t0 = time.time()

    for i, photo in enumerate(photos):
        print(f"  [{i+1:3d}/{len(photos)}] {photo.name}", end='  ', flush=True)

        # превью → Cloudinary
        thumb = to_jpeg_bytes(photo, THUMB_SIZE, THUMB_QUALITY)
        result = cloudinary.uploader.upload(
            thumb,
            folder=f"albums/{album_id}/thumbs",
            public_id=photo.stem,
            resource_type="image",
            overwrite=True,
            format="jpg",
        )
        thumb_url = result['secure_url']
        print("🖼", end='  ', flush=True)

        # оригінал → Google Drive
        file_id = drive_files.get(photo.name)
        if file_id:
            full_url = drive_download_url(file_id)
            print("☁ ✓")
        else:
            full_url = thumb_url  # fallback: якщо файл не знайдено в Drive
            print("⚠ (файл не знайдено в Drive, використано превью)")

        results.append({'name': photo.name, 'thumb': thumb_url, 'full': full_url})

    # photos.json → Cloudinary raw
    data = {'name': album_name, 'id': album_id, 'photos': results}
    payload = json.dumps(data, ensure_ascii=False, indent=2).encode()
    cloudinary.uploader.upload(
        payload,
        folder=f"albums/{album_id}",
        public_id="photos",
        resource_type="raw",
        overwrite=True,
        format="json",
    )

    mins, secs = divmod(int(time.time() - t0), 60)
    link = f"{SITE_URL}/?a={album_id}"
    print(f"\n{'='*58}")
    print(f"  ✅  Готово за {mins} хв {secs} сек")
    print(f"{'='*58}")
    print(f"\n  🔗  Посилання для клієнта:")
    print(f"      {link}\n")


if __name__ == '__main__':
    if len(sys.argv) < 5:
        print(__doc__); sys.exit(0)
    process(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4])
