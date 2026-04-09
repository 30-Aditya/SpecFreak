import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.decomposition import TruncatedSVD

class GameRecommender:
    def __init__(self, data_path):
        self.data_path = data_path
        self.df = None
        self.tfidf = TfidfVectorizer(
            stop_words='english',
            ngram_range=(1, 2),  # Match phrases like "Open World"
            max_features=5000   # Optimized for Render free tier (512MB RAM)
        )
        self.svd = TruncatedSVD(n_components=50, random_state=42)  # Semantic "Neural" Layer - memory optimized
        self.semantic_matrix = None
        self.tfidf_matrix = None
        
        self.load_and_preprocess()
        
    def load_and_preprocess(self):
        # 1. Load dataset
        self.df = pd.read_csv(self.data_path)
        self.df.fillna('', inplace=True)
        
        # 2. Clean columns
        for col in ['genre', 'platform']:
            self.df[col] = self.df[col].astype(str).str.replace(r"[\[\]']", "", regex=True)
            
        # 3. Feature Engineering: Weighted description and tags
        self.df['combined_features'] = (
            self.df['description'].astype(str) + " " + 
            (self.df['genre'].astype(str) + " ") * 2 + # Boost genre weight
            self.df['platform'].astype(str) + " " + 
            self.df['type'].astype(str)
        )
        
        # 4. Neural-style Encoding (LSA)
        self.tfidf_matrix = self.tfidf.fit_transform(self.df['combined_features'])
        self.semantic_matrix = self.svd.fit_transform(self.tfidf_matrix)
        
    def recommend(self, query, top_n=12):
        if not query or not query.strip():
            return []
            
        # 1. Transform query to TF-IDF then to Semantic Space
        query_tfidf = self.tfidf.transform([query])
        query_semantic = self.svd.transform(query_tfidf)
        
        # 2. Compute Semantic Similarity (The "Neural Link")
        semantic_sim = cosine_similarity(query_semantic, self.semantic_matrix).flatten()
        
        # 3. Compute Keyword Similarity (Traditional fallback)
        keyword_sim = cosine_similarity(query_tfidf, self.tfidf_matrix).flatten()
        
        # 4. Hybrid Similarity Scores
        combined_sim = (0.6 * semantic_sim) + (0.4 * keyword_sim)
        
        # 5. Sentiment & Quality Boosting
        meta_scores = pd.to_numeric(self.df['meta_score'], errors='coerce').fillna(60)
        user_scores = pd.to_numeric(self.df['user_score'], errors='coerce').fillna(60)
        quality_score = ((meta_scores / 100.0) + (user_scores / 100.0)) / 2.0
        
        # Ensure quality_score is clean for calculation
        quality_score = quality_score.fillna(0.6)
        
        # 6. Final Calculation: 70% Similarity, 30% Quality
        final_scores = (0.7 * combined_sim) + (0.3 * quality_score)
        
        self.df['final_score'] = final_scores
        
        # Sort and get top_n
        top_games = self.df.sort_values(by='final_score', ascending=False).head(top_n)
        
        results = []
        for _, row in top_games.iterrows():
            # Sanitize scores for JSON (replace NaNs with valid floats)
            m_score = float(row['meta_score']) if pd.notnull(row['meta_score']) else 0.0
            u_score = float(row['user_score']) if pd.notnull(row['user_score']) else 0.0
            f_score = float(row['final_score']) if pd.notnull(row['final_score']) else 0.0
            
            results.append({
                'name': row['game_name'],
                'genre': row['genre'],
                'platform': row['platform'],
                'description': row['description'],
                'meta_score': m_score,
                'user_score': u_score,
                'type': row['type'],
                'final_score': round(f_score, 3)
            })
            
        return results
