from flask import Flask, request, jsonify, render_template
import os
import gc

app = Flask(__name__)

# --- Serverless-Optimized Path Handling ---
# Ensures files are found regardless of whether running locally or via Vercel's api/ folder
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, 'data', 'games_of_all_time.csv')

# --- Global Recommender Instance (Persists across warm starts on Vercel) ---
_recommender = None

def get_recommender():
    """Lazily initializes the recommender model synchronously."""
    global _recommender
    if _recommender is None:
        from model.recommender import GameRecommender
        print("[SpecFreak] Initializing AI model (v2.0 Serverless)...")
        _recommender = GameRecommender(DATA_PATH)
        gc.collect()
        print(f"[SpecFreak] Model successfully initialized with {len(_recommender.df)} games.")
    return _recommender

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/health')
def health_check():
    """Simple status check for Vercel/Monitoring."""
    status = "ready" if _recommender is not None else "initializing"
    return jsonify({"status": "live", "deployment": "vercel", "model": status}), 200

@app.route('/recommend', methods=['POST'])
def recommend():
    try:
        # On Vercel, this might take 5-8s on the first run (Cold Start)
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
        print(f"[SpecFreak] CRITICAL ERROR: {str(e)}")
        return jsonify({'error': 'Nebula Link failed to stabilize. System recalibrating.', 'detail': str(e)}), 500

if __name__ == '__main__':
    # Used for local development only
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
