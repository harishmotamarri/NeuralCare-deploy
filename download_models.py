import os
from huggingface_hub import hf_hub_download

# Hugging Face Repository details
REPO_ID = "harishmotamarri/neuralcare-models"
MODELS_DIR = "models"

# List of models exactly tracking the app.py required payload
MODELS = [
    "bed_model.pkl",
    "icu_model.pkl",
    "vent_model.pkl",
    "admission_model.pkl",
    "bed_alert_model.pkl",
    "icu_alert_model.pkl",
    "vent_alert_model.pkl",
    "feature_cols.pkl"
]

def download_all_models():
    """
    Downloads all required .pkl files from Hugging Face into the models/ directory.
    Avoids re-downloading if models already exist.
    """
    os.makedirs(MODELS_DIR, exist_ok=True)
    
    print(f"Checking for models in '{MODELS_DIR}/' from HF repository '{REPO_ID}'...")
    
    for model_file in MODELS:
        local_path = os.path.join(MODELS_DIR, model_file)
        
        # Check if file exists and skip if it does
        if os.path.exists(local_path):
            print(f"[✓] Model {model_file} already exists, skipping download.")
            continue
            
        print(f"[*] Downloading {model_file}...")
        try:
            hf_hub_download(
                repo_id=REPO_ID,
                filename=model_file,
                local_dir=MODELS_DIR,
            )
            print(f"[✓] Successfully downloaded {model_file}.")
        except Exception as e:
            print(f"[x] Error downloading {model_file}: {e}")
            
    print("All models verification completed.")

if __name__ == "__main__":
    download_all_models()
