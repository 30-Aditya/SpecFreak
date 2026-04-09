import sys
import os

# Ensure the root directory is in the path so we can import app.py and model/
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app

# Vercel needs the 'app' variable to be exposed
# This shim allows app.py to stay at the root while Vercel routes to api/index.py
if __name__ == "__main__":
    app.run()
