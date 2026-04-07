# SpecFreak - NLP Game Recommender 🎮

An advanced, production-ready web application that harnesses Natural Language Processing to provide highly intelligent video game recommendations based on human-readable inputs.

## 📌 Project Overview
SpecFreak bridges the gap between how people think and how content is categorized. Rather than relying on rigid drop-down menus, users can simply type exactly what they're looking for (e.g., *"A relaxing open-world farming game with multiplayer"*). The system mathematically parses this language against a comprehensive dataset to return the most accurate and highest-rated titles available.

## ✨ Features
- **Natural Language Parsing**: Converts user descriptions utilizing **TF-IDF Vectorization** to map concepts against games.
- **Hybrid Recommendation Engine**: Balances exact text matches via **Cosine Similarity** (70%) with a normalized **Sentiment Engine** calculating Meta+User Acclaim (30%).
- **Score Breakdown Transparency**: Unlike locked algorithms, SpecFreak returns complete analytical transparency, showing you exactly how close of a match the game is versus its critical acclaim.
- **Premium User Experience**: Designed natively with custom CSS glassmorphism, 3D dynamic card tracking, custom cursor interactions, and responsive CSS Grid logic. No reload—entirely powered asynchronously.

## 💻 Tech Stack
- **Backend Engine**: Python, Flask
- **Data & ML**: Scikit-Learn (`TfidfVectorizer`, `cosine_similarity`), Pandas, NumPy
- **Frontend Architecture**: HTML5, custom CSS3, Vanilla JavaScript (Fetch API)

## 📸 Screenshots
*(Attach screenshots of your application here)*
- `SpecFreak_Homepage.png`
- `SpecFreak_Search_Results.png`
- `SpecFreak_Card_Tilt.png`

## 🚀 How to Run Locally

1. **Clone the Repository**
   Ensure `Python 3.8+` is installed on your machine.
   ```bash
   git clone <YOUR-REPO-URL>
   cd Mini_Project
   ```

2. **Install Dependencies**
   Install the robust data science and web routing libraries required:
   ```bash
   pip install -r requirements.txt
   ```

3. **Launch the Server**
   ```bash
   python app.py
   ```

4. **Access the Engine**
   Open your browser and navigate to `http://127.0.0.1:5000` to start exploring.

## ☁️ Deployment (Web Hosting)
SpecFreak is strictly production-ready. You can deploy it instantly and completely for free using [Render](https://render.com) or [Railway](https://railway.app).
Because the repository natively includes `gunicorn` inside `requirements.txt` and a root `Procfile`, it is a 1-click deployment.

### Deploying to Render
1. Create a free account on [Render.com](https://render.com).
2. Click **New +** and select **Web Service**.
3. Connect your GitHub account and select your `SpecFreak` repository.
4. Render will seamlessly detect your Python environment via the Procfile.
5. Hit **Deploy**! Wait approximately two minutes and your NLP Engine will be live on the web for anyone to use!
