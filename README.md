# Client Photo Gallery

A private photo gallery for clients, built with Firebase Hosting, Cloudinary, and Google Drive.

## How It Works

```
Photographer's computer
        │
        ├─ Thumbnails (1200px JPEG) ──► Cloudinary (CDN, fast preview)
        │
        └─ Original files ────────────► Google Drive (full resolution download)
                                                │
                                         Firebase Hosting
                                         (index.html SPA)
                                                │
                                         Client opens link:
                                    https://your-site.web.app/?a=album-id
```

1. Photographer uploads photos to a **public Google Drive folder**
2. Runs `upload.py` — it generates 1200px thumbnails → Cloudinary, builds `photos.json`
3. Client receives a unique link like `https://your-site.web.app/?a=may-2026`
4. Client browses thumbnails, opens full-screen lightbox, downloads originals as ZIP

## Stack

| Layer | Service | Why |
|---|---|---|
| Hosting | Firebase Hosting | Free, fast CDN, custom domain support |
| Thumbnails | Cloudinary | Free 25 GB, global CDN |
| Originals | Google Drive | No storage limits, direct download links |
| Frontend | Vanilla JS + CSS | No frameworks, loads instantly |

## Setup

### 1. Prerequisites

```bash
pip3 install Pillow cloudinary
npm install -g firebase-tools
```

### 2. Configure credentials in `upload.py`

```python
# Cloudinary — console.cloudinary.com → Settings → API Keys
CLOUD_NAME    = "your-cloud-name"
API_KEY       = "your-api-key"
API_SECRET    = "your-api-secret"

# Google Drive API key — console.cloud.google.com
# APIs & Services → Credentials → Create credentials → API key
# Enable Google Drive API for the project
DRIVE_API_KEY = "your-drive-api-key"

# Your Firebase Hosting URL (after first deploy)
SITE_URL      = "https://your-project.web.app"
```

### 3. Configure `index.html`

Find this line and set your Cloudinary cloud name:
```javascript
const CLOUD_NAME = 'your-cloud-name';
```

### 4. Deploy to Firebase

```bash
firebase login
firebase init hosting   # choose current directory as public dir, SPA rewrite
firebase deploy --only hosting
```

### 5. Upload an album

```bash
# Put original photos in a public Google Drive folder
# Copy the folder ID from the Drive URL

python3 upload.py "/path/to/photos" "Album Name" album-id DRIVE_FOLDER_ID

# Example:
python3 upload.py "/Users/ira/Desktop/May-2026" "May 2026 Session" may-2026 1R9zouzNHKV4R1559FwyCr00vytQQatfy
```

The script will print a client link at the end:
```
  🔗  Client link:
      https://your-project.web.app/?a=may-2026
```

## Google Drive Setup

1. Upload original photos to a Google Drive folder
2. Right-click the folder → Share → Anyone with the link → Viewer
3. Copy the folder ID from the URL: `drive.google.com/drive/folders/`**`FOLDER_ID`**

## Limits (Free Tiers)

| Service | Free limit |
|---|---|
| Firebase Hosting | 10 GB storage, 360 MB/day transfer |
| Cloudinary | 25 GB storage, 25 GB/month bandwidth |
| Google Drive | 15 GB per Google account |

## File Structure

```
├── index.html      # Gallery SPA (masonry grid, lightbox, ZIP download)
├── upload.py       # Upload script (thumbnails → Cloudinary, JSON → Cloudinary)
├── firebase.json   # Firebase Hosting config (SPA rewrite rules)
└── .firebaserc     # Firebase project ID
```
