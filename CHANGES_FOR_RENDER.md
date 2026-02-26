# 🎯 RENDER DEPLOYMENT - EXACT CHANGES MADE

## ✅ Files Created/Modified for Render Deployment

### 1. **render.yaml** ✅ CREATED
**Location**: Root directory (`render.yaml`)

**Purpose**: Tells Render how to build and deploy your app

**Content**: 
```yaml
services:
  - type: web
    name: neuralcare
    env: python
    region: oregon
    plan: free
    buildCommand: "pip install -r requirements.txt"
    startCommand: "python app.py"
    envVars:
      - key: HF_TOKEN
        scope: run
        sync: false
      - key: PYTHONUNBUFFERED
        value: true
```

---

### 2. **Procfile** ✅ CREATED  
**Location**: Root directory (`Procfile`)

**Purpose**: Alternative/backup method to tell Render how to start the app

**Content**:
```
web: python app.py
```

---

### 3. **requirements.txt** ✅ UPDATED
**Location**: Root directory (`requirements.txt`)

**Changes Made**:
- ❌ REMOVED: `uvicorn==0.38.0` 
- ❌ REMOVED: `a2wsgi==1.10.10`
- ✅ KEPT: All other packages

**New Content**:
```
Flask==3.1.2
flask-cors==6.0.2
pandas==2.3.3
numpy==2.4.0
scikit-learn==1.8.0
huggingface_hub==0.28.1
```

**Reason**: These were for Railway.dev deployment. Render uses Flask's built-in server.

---

### 4. **app.py** ✅ UPDATED
**Location**: Root directory (`app.py`)

**Changes Made**: At the bottom of the file (lines 239-247)

**OLD CODE**:
```python
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)

# Wrap Flask WSGI to ASGI so `uvicorn app:app` works properly seamlessly in Railway
try:
    from a2wsgi import ASGIMiddleware
    app = ASGIMiddleware(app)
except ImportError:
    pass
```

**NEW CODE**:
```python
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    debug_mode = os.environ.get('FLASK_ENV') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug_mode)
```

**Changes**:
- ✅ Changed default PORT from 5000 → 10000 (Render's standard internal port)
- ✅ Made debug mode conditional (auto-disables in production)
- ✅ Removed ASGI middleware (not needed for Render/Flask)

---

### 5. **.python-version** ✅ VERIFIED
**Location**: Root directory (`.python-version`)

**Current Content**:
```
3.11.9
```

**Status**: ✅ Already correct (Python 3.11.x recommended for Flask)

---

### 6. **.gitignore** ✅ UPDATED
**Location**: Root directory (`.gitignore`)

**Changes Made**: Added models folder tracking

**Added Lines**:
```
# Models folder (downloaded at runtime from HuggingFace)
models/
__pycache__/
```

**Reason**: 
- `models/` folder contains large ML model files
- Should NOT be in GitHub (Space constraint reason)
- Will be downloaded automatically when deployed to Render
- `__pycache__/` keeps compiled Python files out

---

## 🔑 What You Need from Hugging Face

### Absolutely Required:

1. **HF_TOKEN** (Hugging Face API Token)
   - Get from: https://huggingface.co/settings/tokens
   - Create new token → Select "Read" permission
   - Copy the full token string
   - **Keep it SECRET - only share via Render dashboard, never in code**

2. **Your Hugging Face Repo URL**
   - URL: `https://huggingface.co/harishmotamarri/neuralcare-models`
   - Repo ID: `harishmotamarri/neuralcare-models`
   - Confirm all 8 model files are uploaded:
     - `bed_model.pkl`
     - `icu_model.pkl`
     - `vent_model.pkl`
     - `admission_model.pkl`
     - `bed_alert_model.pkl`
     - `icu_alert_model.pkl`
     - `vent_alert_model.pkl`
     - `feature_cols.pkl`

### Not Recommended to Get:
- ❌ Don't download and commit models to GitHub (defeats purpose)
- ❌ Don't hardcode token in code
- ❌ Don't share token publicly

---

## 📤 Next Steps: Deploy to Render

### **STEP 1: Push Changes to GitHub**
```bash
cd c:\Users\motam\Desktop\FOLDERS\PROJECTS\IIC HACKATHON\NeuralCare
git add .
git commit -m "Add Render deployment config and optimize app for Render"
git push
```

Files that will be pushed:
- ✅ `render.yaml` (new)
- ✅ `Procfile` (new)
- ✅ `app.py` (modified)
- ✅ `requirements.txt` (modified)
- ✅ `.gitignore` (modified)
- ✅ All HTML/CSS/JS files (unchanged)
- ✅ `download_models.py` (unchanged)

**Models folder**: Will NOT be in the push ✓

---

### **STEP 2: Create Render Service**

1. Go to: https://dashboard.render.com/
2. Click **"New +"** button
3. Select **"Web Service"**
4. Choose **"Connect a GitHub account"** (if first time)
5. Select your repository: `harishmotamarri/NeuralCare-deploy`
6. Fill in these settings:

| Setting | Value |
|---------|-------|
| **Name** | `neuralcare` (or whatever you want) |
| **Region** | `Oregon` (or closest to you) |
| **Branch** | `main` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `python app.py` |
| **Plan** | Free (or upgrade if needed) |

7. Click **"Create Web Service"**

---

### **STEP 3: Add Environment Variable**

After service is created:

1. Go to your service dashboard
2. Click **"Settings"**
3. Scroll to **"Environment Variables"**
4. Click **"Add Environment Variable"**
5. Add these:

```
Key: HF_TOKEN
Value: [Your actual Hugging Face token from https://huggingface.co/settings/tokens]
```

6. Don't set PORT (Render auto-manages it)

7. Click **"Save"**

---

### **STEP 4: Wait for Deployment**

1. Go to the **"Logs"** tab
2. Watch the deployment process
3. First deployment takes **5-15 minutes** (includes model downloads)
4. Should see messages like:
   ```
   [*] Downloading bed_model.pkl...
   [✓] Successfully downloaded bed_model.pkl.
   [✓] All models verification completed.
   * Running on http://0.0.0.0:10000
   ```

---

## ✔️ Verify Deployment Works

Once Render shows "Live":

### Test 1: Health Check
```
GET https://yourdomain.onrender.com/health
```
**Expected Response**:
```json
{"status": "healthy", "models_loaded": true}
```

### Test 2: Main Page
```
GET https://yourdomain.onrender.com/
```
**Expected**: Loads `index.html` in browser

### Test 3: Make a Prediction
```
POST https://yourdomain.onrender.com/predict
Content-Type: application/json

{
  "total_beds": 100,
  "occupied_beds": 75,
  "total_icu": 20,
  "occupied_icu": 15,
  "total_vent": 10,
  "occupied_vent": 8,
  "current_admissions": 12,
  "last_year_admissions": 1200
}
```

**Expected**: JSON response with predictions

---

## 🚨 If Something Goes Wrong

### **Models not downloading?**
- Check logs for error messages
- Verify HF_TOKEN is set in Render dashboard
- Make sure token has "Read" permission
- Check HF repo is accessible

### **Port binding error?**
- Render should auto-handle ports
- System will use `PORT` env var automatically

### **App crashes?**
- Check logs in Render dashboard
- Look for Python errors
- Verify all dependencies in requirements.txt

### **Slow first deployment?**
- Normal - it's downloading ~300-400MB of models
- Free plan has slower internet
- Can upgrade plan if too slow

---

## 📊 Summary Table

| File | Status | Change | Reason |
|------|--------|--------|--------|
| `render.yaml` | ✅ NEW | Created | Render config |
| `Procfile` | ✅ NEW | Created | Backup startup |
| `app.py` | ✅ MODIFIED | Port + debug fix | Render compatible |
| `requirements.txt` | ✅ MODIFIED | Removed uvicorn/a2wsgi | Not needed for Render |
| `.gitignore` | ✅ MODIFIED | Added models/ | Prevent large files in repo |
| `.python-version` | ✅ OK | No change | Already 3.11.9 |
| `download_models.py` | ✅ OK | No change | Works as-is |
| Other files | ✅ OK | No change | No changes needed |

---

## 🎓 How It Works End-to-End

```
You push to GitHub
        ↓
Render webhook triggered
        ↓
Render pulls latest code (no models folder)
        ↓
Render installs requirements.txt
        ↓
Render runs: python app.py
        ↓
app.py starts → checks for models/
        ↓
Models missing → calls download_models.py
        ↓
download_models.py uses HF_TOKEN (from Render env var)
        ↓
Downloads all 8 .pkl files from your HF repo
        ↓
app.py loads models into memory
        ↓
Flask starts listening on port 10000
        ↓
Your app is LIVE! 🚀
```

---

**Questions? Check:**
1. Render logs (shows actual error if deployment fails)
2. This guide (sections above)
3. Official Render docs: https://render.com/docs

Good luck! 🎯
