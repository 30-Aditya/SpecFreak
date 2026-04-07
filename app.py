from flask import Flask, request, jsonify, render_template
import os
from model.recommender import GameRecommender

app = Flask(__name__)

# Initialize the recommender
DATA_PATH = os.path.join(os.path.dirname(__file__), 'data', 'games_dataset.csv')
recommender = GameRecommender(DATA_PATH)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/recommend', methods=['POST'])
def recommend():
    data = request.json
    query = data.get('query', '')
    if not query:
        return jsonify({'error': 'No query provided', 'results': []}), 400
        
    results = recommender.recommend(query, top_n=5)
    return jsonify({'results': results})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
