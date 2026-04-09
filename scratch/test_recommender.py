import os
import sys
# Add root to sys.path
sys.path.append(os.getcwd())

from model.recommender import GameRecommender

DATA_PATH = os.path.join('data', 'games_of_all_time.csv')
print(f"Loading recommender with {DATA_PATH}...")
recommender = GameRecommender(DATA_PATH)
print(f"Loaded {len(recommender.df)} games.")

query = "atmospheric dark story"
print(f"Searching for: {query}")
results = recommender.recommend(query, top_n=5)
print(f"Results found: {len(results)}")
for r in results:
    print(f"- {r['name']} ({r['final_score']})")
