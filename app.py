from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import pandas as pd
import numpy as np
import pickle
from datetime import datetime
import os

# --- DYNAMIC MODEL DOWNLOADER ---
# Ensure models are downloaded before backend starts
if not os.path.exists('models') or len([f for f in os.listdir('models') if f.endswith('.pkl')]) < 8:
    print("Initializing environment: Models missing, downloading from HF...")
    try:
        import download_models
        download_models.download_all_models()
    except Exception as e:
        print("Failed to download models automatically:", e)

# Singleton application instance
app = Flask(__name__)
CORS(app) # Allow CORS since frontend is running on different port or pure file:///

# Load models safely
models = {}
def load_models():
    try:
        model_vars = {
            'bed': 'models/bed_model.pkl',
            'icu': 'models/icu_model.pkl',
            'vent': 'models/vent_model.pkl',
            'admission': 'models/admission_model.pkl',
            'bed_alert': 'models/bed_alert_model.pkl',
            'icu_alert': 'models/icu_alert_model.pkl',
            'vent_alert': 'models/vent_alert_model.pkl',
            'features': 'models/feature_cols.pkl'
        }
        
        for name, path in model_vars.items():
            if os.path.exists(path):
                with open(path, 'rb') as f:
                    models[name] = pickle.load(f)
            else:
                print(f"Warning: Model file not found at {path}")
        return True if len(models) == 8 else False
    except Exception as e:
        print(f"Error loading models: {e}")
        return False

# Load them on startup
is_loaded = load_models()

@app.route('/', methods=['GET'])
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>', methods=['GET'])
def serve_static(path):
    if os.path.exists(path):
        return send_from_directory('.', path)
    return jsonify({"error": "File not found"}), 404

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "models_loaded": is_loaded})

@app.route('/predict', methods=['POST'])
def predict():
    if not is_loaded:
        return jsonify({"error": "Models not fully loaded on server"}), 500
        
    try:
        data = request.json
        
        # Get Current Date logic
        current_date_str = data.get('current_date')
        if current_date_str:
            current_date = datetime.fromisoformat(current_date_str.replace('Z', '+00:00')).replace(tzinfo=None)
        else:
            current_date = datetime.now()
            
        current_week = current_date.isocalendar().week
        current_month = current_date.month
        current_year = current_date.year
        current_quarter = (current_month - 1) // 3 + 1
        day_of_year = current_date.timetuple().tm_yday
        
        total_beds = int(data.get('total_beds', 0))
        occupied_beds = int(data.get('occupied_beds', 0))
        total_icu = int(data.get('total_icu', 0))
        occupied_icu = int(data.get('occupied_icu', 0))
        total_vent = int(data.get('total_vent', 0))
        occupied_vent = int(data.get('occupied_vent', 0))
        current_admissions = int(data.get('current_admissions', 0))
        last_year_admissions = int(data.get('last_year_admissions', 0))
        
        bed_occupancy = (occupied_beds / total_beds * 100) if total_beds > 0 else 0
        icu_occupancy = (occupied_icu / total_icu * 100) if total_icu > 0 else 0
        vent_occupancy = (occupied_vent / total_vent * 100) if total_vent > 0 else 0
        
        feature_cols = models['features']
        input_data = {}
        
        for col in feature_cols:
            if 'Inpatient Beds' in col and 'Number' in col:
                input_data[col] = total_beds
            elif 'Inpatient Beds Occupied' in col:
                input_data[col] = occupied_beds
            elif 'ICU Beds' in col and 'Number' in col and 'Occupied' not in col:
                input_data[col] = total_icu
            elif 'ICU Beds Occupied' in col:
                input_data[col] = occupied_icu
            elif 'Ventilators' in col and 'Number' in col and 'Occupied' not in col:
                input_data[col] = total_vent
            elif 'Ventilators Occupied' in col:
                input_data[col] = occupied_vent
            elif 'Percent Inpatient Beds Occupied' in col:
                input_data[col] = bed_occupancy
            elif 'Percent ICU Beds Occupied' in col:
                input_data[col] = icu_occupancy
            elif 'Percent Ventilators Occupied' in col:
                input_data[col] = vent_occupancy
            elif 'Total Admissions' in col:
                input_data[col] = current_admissions
            elif 'last_year_admissions' in col:
                input_data[col] = last_year_admissions
            elif 'week_number' in col:
                input_data[col] = current_week
            elif 'month' in col:
                input_data[col] = current_month
            elif 'year' in col:
                input_data[col] = current_year
            elif 'quarter' in col:
                input_data[col] = current_quarter
            elif 'day_of_year' in col:
                input_data[col] = day_of_year
            else:
                input_data[col] = 0
                
        input_df = pd.DataFrame([input_data])
        
        # Helper probability definitions
        def get_alert_prob(model, X):
            try:
                proba = model.predict_proba(X)
                if proba.shape[1] == 2:
                    return float(proba[0][1])
                return float(proba[0][0])
            except AttributeError:
                hard = float(model.predict(X)[0])
                return 0.95 if hard >= 0.5 else 0.05

        def occupancy_to_prob(predicted_occupied, total_cap):
            if total_cap <= 0: return 0.0
            pct = predicted_occupied / total_cap * 100
            return float(1 / (1 + np.exp(-0.18 * (pct - 82))))

        def blend_alert_prob(model_prob, occupancy_prob):
            return 0.40 * model_prob + 0.60 * occupancy_prob

        # Base predictions (these are the raw changes based on 4 weeks in Streamlit, roughly)
        raw_beds = float(models['bed'].predict(input_df)[0])
        raw_icu = float(models['icu'].predict(input_df)[0])
        raw_vent = float(models['vent'].predict(input_df)[0])
        raw_adm = float(models['admission'].predict(input_df)[0])
        
        # Scale based on selected time period in dashboard
        prediction_period = data.get('prediction_period', 'week')
        time_scaler = 1.0 if prediction_period == 'week' else (4.0 if prediction_period == 'month' else 1/7.0)
        
        # App.py Scale Factors (constant defaults from app (1).py)
        bed_scale, icu_scale, vent_scale, adm_scale, global_scale = 8.0, 2.5, 2.5, 1.0, 1.0

        beds_change = raw_beds / bed_scale * global_scale * time_scaler
        icu_change  = raw_icu  / icu_scale * global_scale * time_scaler
        vent_change = raw_vent / vent_scale * global_scale * time_scaler
        adm_change  = raw_adm  / adm_scale * global_scale * time_scaler

        # Clip to reasonable bounds
        max_beds_change = total_beds * 0.3 * time_scaler
        max_icu_change  = total_icu  * 0.3 * time_scaler
        max_vent_change = total_vent * 0.3 * time_scaler
        max_adm_change  = current_admissions * 0.5 * time_scaler

        beds_change = np.clip(beds_change, -max_beds_change, max_beds_change)
        icu_change  = np.clip(icu_change,  -max_icu_change,  max_icu_change)
        vent_change = np.clip(vent_change, -max_vent_change, max_vent_change)
        adm_change  = np.clip(adm_change,  -max_adm_change,  max_adm_change)

        # Calculate needed totals
        beds_needed = occupied_beds + beds_change
        icu_needed  = occupied_icu  + icu_change
        vent_needed = occupied_vent + vent_change
        adm_needed  = current_admissions + adm_change

        # Ensure non-negative and within capacity
        beds_needed = float(np.clip(beds_needed, 0, total_beds * 1.2))
        icu_needed  = float(np.clip(icu_needed,  0, total_icu  * 1.2))
        vent_needed = float(np.clip(vent_needed, 0, total_vent * 1.2))
        adm_needed  = float(max(0, adm_needed))

        # Get alert probabilities
        model_bed_prob  = get_alert_prob(models['bed_alert'], input_df)
        model_icu_prob  = get_alert_prob(models['icu_alert'], input_df)
        model_vent_prob = get_alert_prob(models['vent_alert'], input_df)

        occ_bed_prob  = occupancy_to_prob(beds_needed, total_beds)
        occ_icu_prob  = occupancy_to_prob(icu_needed, total_icu)
        occ_vent_prob = occupancy_to_prob(vent_needed, total_vent)

        bed_alert_prob  = blend_alert_prob(model_bed_prob, occ_bed_prob)
        icu_alert_prob  = blend_alert_prob(model_icu_prob, occ_icu_prob)
        vent_alert_prob = blend_alert_prob(model_vent_prob, occ_vent_prob)
            
        return jsonify({
            "success": True,
            "predictions": {
                "beds": {
                    "predicted": beds_needed,
                    "shortage_prob": bed_alert_prob
                },
                "icu": {
                    "predicted": icu_needed,
                    "shortage_prob": icu_alert_prob
                },
                "ventilators": {
                    "predicted": vent_needed,
                    "shortage_prob": vent_alert_prob
                },
                "admissions": {
                    "predicted": adm_needed
                }
            }
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    debug_mode = os.environ.get('FLASK_ENV') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug_mode)
