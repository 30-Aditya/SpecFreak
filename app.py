from flask import Flask, request, jsonify, render_template
import os
import gc

app = Flask(__name__)

# Task 5: Disable cache during development
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

# --- Standardized Path Handling ---
# Ensures files are found regardless of the deployment environment
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, 'data', 'games_of_all_time.csv')

# --- Global Recommender (Persists across worker lifespan) ---
_recommender = None

def get_recommender():
    """Lazily initializes the recommender model synchronously."""
    global _recommender
    if _recommender is None:
        from model.recommender import GameRecommender
        print("[SpecFreak] Initializing AI model (v3.0 Render Optimized)...")
        _recommender = GameRecommender(DATA_PATH)
        gc.collect()
        print(f"[SpecFreak] Engine Ready: {len(_recommender.df)} games indexed.")
    return _recommender

@app.route('/')
def home():
    # Task 4: Ensure Flask uses render_template
    return render_template('index.html')

@app.route('/health')
def health_check():
    """Render/General health check endpoint."""
    status = "ready" if _recommender is not None else "initializing"
    return jsonify({"status": "live", "model": status}), 200

@app.route('/recommend', methods=['POST'])
def recommend():
    try:
        # Load engine lazily to allow fast port binding
        recommender = get_recommender()
        
        data = request.json
        if not data:
            return jsonify({'error': 'Invalid JSON body', 'results': []}), 400

        query = data.get('query', '')
        if not query or not query.strip():
            return jsonify({'error': 'No query provided', 'results': []}), 400

        results = recommender.recommend(query, top_n=12)
        return jsonify({'results': results})
        
    except Exception as e:
        print(f"[SpecFreak] ERROR: {str(e)}")
        return jsonify({'error': 'Search engine failed to respond.', 'detail': str(e), 'results': []}), 500

if __name__ == '__main__':
    # Task 1: Correct PORT binding using environment variable
    port = int(os.environ.get("PORT", 5000))
    # Task 1: Host must be 0.0.0.0 for production
    app.run(host='0.0.0.0', port=port, debug=False)
