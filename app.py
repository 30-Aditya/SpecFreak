from flask import Flask, request, jsonify, render_template
import os
from model.recommender import GameRecommender

app = Flask(__name__)

# Initialize the recommender
DATA_PATH = os.path.join(os.path.dirname(__file__), 'data', 'games_of_all_time.csv')
recommender = GameRecommender(DATA_PATH)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/health')
def health_check():
    return "SpecFreak is Live 🚀"

@app.route('/recommend', methods=['POST'])
def recommend():
    data = request.json
    query = data.get('query', '')
    if not query:
        return jsonify({'error': 'No query provided', 'results': []}), 400
        
    results = recommender.recommend(query, top_n=12)
    return jsonify({'results': results})

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
