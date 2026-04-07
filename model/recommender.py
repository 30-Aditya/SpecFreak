import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class GameRecommender:
    def __init__(self, data_path):
        self.data_path = data_path
        self.df = None
        self.tfidf = TfidfVectorizer(stop_words='english')
        self.tfidf_matrix = None
        
        self.load_and_preprocess()
        
    def load_and_preprocess(self):
        # 1. Load dataset using pandas
        self.df = pd.read_csv(self.data_path)
        
        # 2. Clean missing values
        self.df.fillna('', inplace=True)
        
        # 3. Clean columns (they are string represented lists like "['Action', 'RPG']")
        for col in ['genre', 'platform']:
            self.df[col] = self.df[col].astype(str).str.replace(r"[\[\]']", "", regex=True)
            
        # 4. Combine features into one text field: description + genre + platform + type
        self.df['combined_features'] = (
            self.df['description'].astype(str) + " " + 
            self.df['genre'].astype(str) + " " + 
            self.df['platform'].astype(str) + " " + 
            self.df['type'].astype(str)
        )
        
        # 5. Apply TF-IDF vectorization on combined text and store vectorized matrix
        self.tfidf_matrix = self.tfidf.fit_transform(self.df['combined_features'])
        
    def recommend(self, query, top_n=5):
        if not query or not query.strip():
            return []
            
        # Convert user query into vector
        query_vec = self.tfidf.transform([query])
        
        # Compute cosine similarity
        sim_scores = cosine_similarity(query_vec, self.tfidf_matrix).flatten()
        
        # Vectorized scoring logic
        # 1. Similarity is already a vector (sim_scores)
        
        # 2. Extract scores (meta and user)
        # Handle cases where scores might be non-numeric (if any remain after cleaning)
        meta_scores = pd.to_numeric(self.df['meta_score'], errors='coerce').fillna(50)
        user_scores = pd.to_numeric(self.df['user_score'], errors='coerce').fillna(50)
        
        # 3. Normalize scores (Both are 0-100 in the new dataset)
        meta_norm = meta_scores / 100.0
        user_norm = user_scores / 100.0
        
        sentiment_scores = (meta_norm + user_norm) / 2.0
        
        # 4. Hybrid Final Score (0.7 sim + 0.3 sentiment)
        final_scores = (0.7 * sim_scores) + (0.3 * sentiment_scores)
        
        # 5. Add to DataFrame temporary results
        self.df['similarity'] = sim_scores
        self.df['sentiment'] = sentiment_scores
        self.df['final_score'] = final_scores
        
        # Sort and get top_n
        top_games = self.df.sort_values(by='final_score', ascending=False).head(top_n)
        
        results = []
        for _, row in top_games.iterrows():
            results.append({
                'name': row['game_name'],
                'genre': row['genre'],
                'platform': row['platform'],
                'description': row['description'],
                'meta_score': float(row['meta_score']),
                'user_score': float(row['user_score']),
                'type': row['type'],
                'similarity': round(float(row['similarity']), 3),
                'sentiment': round(float(row['sentiment']), 3),
                'final_score': round(float(row['final_score']), 3)
            })
            
        return results
