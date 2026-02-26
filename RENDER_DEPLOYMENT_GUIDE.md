# NeuralCare Render Deployment Guide

## 📋 CHECKLIST: What You Need

### From Hugging Face 🤗
You need **ONLY 2 things**:

1. **Hugging Face Username**: `harishmotamarri` (for your repo path)
2. **HF_TOKEN** (Hugging Face API Token):
   - Go to: https://huggingface.co/settings/tokens
   - Create a new token with **read** permission
   - Copy the token (keep it secret!)

### Your HF Model Repository
- **Repo URL**: https://huggingface.co/harishmotamarri/neuralcare-models
- **Repo ID**: `harishmotamarri/neuralcare-models`
- Models stored: All 8 `.pkl` files

---

## 🚀 RENDER DEPLOYMENT STEPS

### **STEP 1: Prepare Your GitHub Repository**
✅ Already done - you've pushed code without models

Verify these files are in your GitHub repo:
- `app.py` ✓
- `download_models.py` ✓
- `requirements.txt` ✓
- All HTML, CSS, JS files ✓
- `.gitignore` (should ignore `models/` folder)

---

### **STEP 2: Add Required Render Configuration Files**

Your repository needs these files (add to root):

#### **File 1: `render.yaml`** (Optional but recommended)
This file tells Render how to build and run your app.

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
```

#### **File 2: `.python-version`** (if not already present)
Specifies Python version:
```
3.11.0
```

#### **File 3: `Procfile`** (Alternative to render.yaml)
If you prefer using Procfile instead:
```
web: python app.py
```

---

### **STEP 3: Update requirements.txt**

Make sure your `requirements.txt` has these (exact versions):
```
Flask==3.1.2
flask-cors==6.0.2
pandas==2.3.3
numpy==2.4.0
scikit-learn==1.8.0
huggingface_hub==0.28.1
```

**DO NOT include**: uvicorn, a2wsgi (these are for other servers)

---

### **STEP 4: Set Environment Variables in Render**

1. Go to https://dashboard.render.com
2. Create a new **Web Service**
3. Connect your GitHub repo: `harishmotamarri/NeuralCare-deploy`
4. In **Settings → Environment Variables**, add:

| Variable | Value | Notes |
|----------|-------|-------|
| `HF_TOKEN` | Your Hugging Face token | Get from https://huggingface.co/settings/tokens |
| `PORT` | `10000` | Default for Render (optional, Flask uses this) |

---

### **STEP 5: Configure Deploy Settings in Render**

When creating the service:
- **Name**: `neuralcare` (or any name you prefer)
- **Region**: Choose closest to your users
- **Plan**: Free or Premium (depending on needs)
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `python app.py`
- **Auto-deploy**: Enable if you want auto-deploy on GitHub push

---

### **STEP 6: How Model Download Works at Startup**

Your `app.py` automatically:
1. Checks if `models/` folder exists
2. If missing or incomplete (less than 8 models), calls `download_models.py`
3. `download_models.py` uses `HF_TOKEN` to download from your private HF repo
4. All 8 models load into memory
5. Flask server starts

**Timeline**: First deploy takes ~2-3 minutes while downloading models.

---

## 🔧 IMPORTANT CODE REVIEW

### Your `download_models.py` looks correct:
✓ Uses `hf_hub_download()` function
✓ Reads `HF_TOKEN` from environment
✓ Creates `models/` directory if missing
✓ Skips already downloaded files

### Your `app.py` startup logic:
✓ Checks for models before loading
✓ Auto-downloads if missing
✓ Has error handling
✓ Health check endpoint at `/health`

---

## ⚠️ POTENTIAL ISSUES & FIXES

### **Issue 1: Models Not Downloading**
**Symptom**: Error in logs mentioning models not found

**Fix**:
1. Verify `HF_TOKEN` is set in Render dashboard
2. Make sure token has **read** scope (not just write)
3. Check HF repo is **public** or token has access
4. Verify repo path: `harishmotamarri/neuralcare-models`

### **Issue 2: Timeout During Download**
**Symptom**: Deploy fails after 30 minutes

**Fix**:
1. Upgrade from free to premium plan on Render
2. Free plan has lower resource limits
3. Models (~400MB total?) may take time

### **Issue 3: Port Binding Error**
**Symptom**: "Port already in use" error

**Fix**: Ensure `app.py` uses:
```python
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 10000)))
```

---

## 📝 EXACT CHANGES NEEDED

### Changes to make in your GitHub repo:

1. **Add `render.yaml`** to root directory
2. **Add/Verify `.python-version`** has `3.11.0`
3. **Keep `requirements.txt`** as shown above
4. **No code changes needed** to `app.py` or `download_models.py`

---

## 🎯 FINAL DEPLOYMENT STEPS

1. Make the above file changes locally
2. Push to GitHub:
   ```bash
   git add render.yaml .python-version
   git commit -m "Add Render deployment config"
   git push
   ```

3. Go to https://dashboard.render.com
4. Click **"New +"** → **"Web Service"**
5. Choose GitHub and select your repo
6. Use these settings:
   - Name: `neuralcare`
   - Build: `pip install -r requirements.txt`
   - Start: `python app.py`
   - Environment: Add `HF_TOKEN`
7. Click **"Create Web Service"**
8. Wait for deployment (5-10 minutes first time)

---

## ✅ VERIFICATION

Once deployed, test these endpoints:

1. **Health Check**:
   ```
   GET https://your-service-name.onrender.com/health
   ```
   Should return: `{"status": "healthy", "models_loaded": true}`

2. **Main Page**:
   ```
   GET https://your-service-name.onrender.com/
   ```
   Should load `index.html`

3. **Prediction** (test with sample data):
   ```
   POST https://your-service-name.onrender.com/predict
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

---

## 📚 HUGGING FACE INFO YOU HAVE

- **HF Repo URL**: https://huggingface.co/harishmotamarri/neuralcare-models
- **Repo ID**: `harishmotamarri/neuralcare-models`
- **Required files** (8 models):
  - `bed_model.pkl`
  - `icu_model.pkl`
  - `vent_model.pkl`
  - `admission_model.pkl`
  - `bed_alert_model.pkl`
  - `icu_alert_model.pkl`
  - `vent_alert_model.pkl`
  - `feature_cols.pkl`

---

## 🔐 SECURITY NOTES

1. **HF_TOKEN**: Keep it secret, set it in Render dashboard (not in code)
2. **GitHub**: Repo contains no secrets or models ✓
3. **CORS**: Enabled in `app.py` for frontend ✓

---

**Questions?** Check logs in Render dashboard → Your Service → Logs
