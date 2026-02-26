# Project Structure - Render Ready

## Your Project Should Look Like This:

```
NeuralCare-deploy/                    ← Your GitHub repo folder
│
├── app.py                            ✅ Main Flask app (UPDATED)
├── download_models.py                ✅ HF model downloader (no changes)
├── requirements.txt                  ✅ Python packages (UPDATED)
│
├── render.yaml                       ✅ Render config (NEW)
├── Procfile                          ✅ Process file (NEW)
├── .python-version                   ✅ Python version (3.11.9)
├── .gitignore                        ✅ Git ignore (UPDATED)
├── .env.example                      Optional (for local testing)
│
├── index.html                        ✅ Main page
├── dashboard.html                    ✅ Dashboard page
├── checkAvailability.html            ✅ Check page
├── hospitalLogin.html                ✅ Login page
├── hf_page.html                      ✅ HF page
│
├── assets/
│   ├── css/
│   │   └── landing.css
│   ├── img/
│   └── js/
│       ├── dashboard.js
│       ├── landing.js
│       └── supabase-client.js
│
├── models/                           ← NOT in Git (downloaded at deploy)
│   ├── bed_model.pkl
│   ├── icu_model.pkl
│   ├── vent_model.pkl
│   ├── admission_model.pkl
│   ├── bed_alert_model.pkl
│   ├── icu_alert_model.pkl
│   ├── vent_alert_model.pkl
│   └── feature_cols.pkl
│
├── __pycache__/                      ← NOT in Git (Python compiled files)
│
└── README.md (optional)              Can add later
```

## Green Flags ✅

- [x] `render.yaml` exists in root  
- [x] `Procfile` exists in root
- [x] `app.py` has port 10000 configuration
- [x] `requirements.txt` has no uvicorn/a2wsgi
- [x] `.gitignore` includes `models/` folder
- [x] All HTML files present
- [x] assets/ folder with CSS/JS present

## What Should NOT Be in GitHub

- ❌ `models/` folder (too large, will download from HF)
- ❌ `__pycache__/` (compiled Python files)
- ❌ `.env` file with secrets
- ❌ `.vscode/`, `__pycache__/` (in .gitignore)

## Deployment Flow

```
Git Push
   ↓
GitHub Webhook → Render
   ↓
Render Builds Environment
   ├─ Install Python 3.11.9
   ├─ Run: pip install -r requirements.txt
   └─ Ready to start
   ↓
Render Starts App
   ├─ Run: python app.py
   ├─ app.py checks for models/
   ├─ Models missing → download_models.py runs
   ├─ download_models.py uses HF_TOKEN from env
   ├─ Downloads 8 .pkl files from HF
   ├─ All models loaded into memory
   └─ Flask server starts
   ↓
Your App is LIVE 🚀
```

## Files You Modified

### 1. app.py
**What changed**: Lines 239-247 (bottom of file)
- Old default PORT was 5000 → Changed to 10000
- Removed ASGI middleware wrapper
- Made debug mode conditional

### 2. requirements.txt  
**What changed**: Removed 2 packages
- ❌ uvicorn==0.38.0 (was for Railway)
- ❌ a2wsgi==1.10.10 (was for Railway)

### 3. .gitignore
**What changed**: Added models folder
- Added: `models/` folder
- Added: `__pycache__/` directory

### 4. render.yaml
**What changed**: NEW FILE
- Tells Render exact build and start commands

### 5. Procfile  
**What changed**: NEW FILE
- Backup/alternative way to start app

---

All ready for deployment! ✨
