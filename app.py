from flask import Flask, request, jsonify, render_template
import os
import threading
import gc

app = Flask(__name__)

# --- Lazy Loader: Model loads in background after server binds to port ---
DATA_PATH = os.path.join(os.path.dirname(__file__), 'data', 'games_of_all_time.csv')
_recommender = None
_model_ready = False
_model_error = None
_model_lock = threading.Lock()

def _load_model():
    global _recommender, _model_ready, _model_error
    try:
        from model.recommender import GameRecommender
        print("[SpecFreak] Loading game dataset and building AI model...")
        _recommender = GameRecommender(DATA_PATH)
        _model_ready = True
        gc.collect()  # Free transient memory after model build
        print(f"[SpecFreak] Model ready! {len(_recommender.df)} games loaded.")
    except Exception as e:
        _model_error = str(e)
        print(f"[SpecFreak] CRITICAL: Model failed to load: {e}")

# Start loading immediately in a background thread
_loader_thread = threading.Thread(target=_load_model, daemon=True)
_loader_thread.start()

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/health')
def health_check():
    if _model_ready:
        return jsonify({"status": "live", "model": "ready", "games": len(_recommender.df)}), 200
    if _model_error:
        return jsonify({"status": "live", "model": "error", "detail": _model_error}), 200
    return jsonify({"status": "live", "model": "loading"}), 200

@app.route('/recommend', methods=['POST'])
def recommend():
    if _model_error:
        return jsonify({'error': f'Model failed to load: {_model_error}', 'results': [], 'loading': False}), 500

    if not _model_ready:
        return jsonify({'error': 'Model is still loading, please try again in a moment.', 'results': [], 'loading': True}), 503

    data = request.json
    if not data:
        return jsonify({'error': 'Invalid JSON body', 'results': []}), 400

    query = data.get('query', '')
    if not query or not query.strip():
        return jsonify({'error': 'No query provided', 'results': []}), 400

    results = _recommender.recommend(query, top_n=12)
    return jsonify({'results': results})

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
