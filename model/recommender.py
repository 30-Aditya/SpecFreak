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
        
        # 3. Combine features into one text field: description + genre + platform + type
        self.df['combined_features'] = (
            self.df['description'].astype(str) + " " + 
            self.df['genre'].astype(str) + " " + 
            self.df['platform'].astype(str) + " " + 
            self.df['type'].astype(str)
        )
        
        # 4. Apply TF-IDF vectorization on combined text and store vectorized matrix
        self.tfidf_matrix = self.tfidf.fit_transform(self.df['combined_features'])
        
    def recommend(self, query, top_n=5):
        if not query or not query.strip():
            return []
            
        # Convert user query into vector
        query_vec = self.tfidf.transform([query])
        
        # Compute cosine similarity
        sim_scores = cosine_similarity(query_vec, self.tfidf_matrix).flatten()
        
        results = []
        for idx in range(len(self.df)):
            sim = sim_scores[idx]
            
            # Extract scores securely
            try:
                meta = float(self.df.iloc[idx].get('meta_score', 50))
            except ValueError:
                meta = 50.0
                
            try:
                user_score = float(self.df.iloc[idx].get('user_score', 5.0))
            except ValueError:
                user_score = 5.0
                
            # Normalize scores to 0-1 range to align with Cosine Similarity (0-1)
            meta_norm = meta / 100.0
            user_norm = user_score / 10.0
            
            # Implement sentiment scoring
            sentiment_score = (meta_norm + user_norm) / 2.0
            
            # Hybrid Final Score formula
            final_score = (0.7 * sim) + (0.3 * sentiment_score)
            
            results.append({
                'name': self.df.iloc[idx]['name'],
                'genre': self.df.iloc[idx]['genre'],
                'platform': self.df.iloc[idx]['platform'],
                'description': self.df.iloc[idx]['description'],
                'meta_score': meta,
                'user_score': user_score,
                'type': self.df.iloc[idx]['type'],
                'similarity': round(sim, 3),
                'sentiment': round(sentiment_score, 3),
                'final_score': round(final_score, 3)
            })
            
        # Optional: Only consider games that have at least some relevance
        # If all similarities are 0, we fallback purely on sentiment, which might just recommend the highest rated game overall.
        
        results = sorted(results, key=lambda x: x['final_score'], reverse=True)
        return results[:top_n]
