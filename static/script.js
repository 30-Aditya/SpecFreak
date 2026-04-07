// Cursor glow tracker logic
const cursorGlow = document.getElementById('cursor-glow');
document.addEventListener('mousemove', (e) => {
    // Offset by scroll since it's position: fixed
    cursorGlow.style.left = e.clientX + 'px';
    cursorGlow.style.top = e.clientY + 'px';
});

// Interactive elements trigger enhanced cursor glow
const enhanceInteractiveCursor = () => {
    document.querySelectorAll('button, textarea, .game-card, a').forEach(el => {
        el.addEventListener('mouseenter', () => cursorGlow.classList.add('active'));
        el.addEventListener('mouseleave', () => cursorGlow.classList.remove('active'));
    });
};
enhanceInteractiveCursor(); // Initial call

// Typing placeholder Logic
const placeholders = [
    "dark emotional story game like Witcher...",
    "multiplayer shooting game like COD...",
    "relaxing open world game like Minecraft..."
];
let phIndex = 0;
let charIndex = 0;
let isDeleting = false;
let typeDelay = 100;
const textarea = document.getElementById('query');

function typePlaceholder() {
    const currentString = placeholders[phIndex];
    if (isDeleting) {
        textarea.setAttribute("placeholder", currentString.substring(0, charIndex - 1));
        charIndex--;
        typeDelay = 40;
    } else {
        textarea.setAttribute("placeholder", currentString.substring(0, charIndex + 1));
        charIndex++;
        typeDelay = 100;
    }

    if (!isDeleting && charIndex === currentString.length) {
        // Pause at the end
        typeDelay = 2000;
        isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        phIndex = (phIndex + 1) % placeholders.length;
        typeDelay = 500;
    }
    setTimeout(typePlaceholder, typeDelay);
}
// Start typing effect
setTimeout(typePlaceholder, 1000);

// Button Ripple Effect logic
const primaryBtn = document.getElementById('search-btn');
primaryBtn.addEventListener('click', function(e) {
    const circle = document.createElement('span');
    const diameter = Math.max(this.clientWidth, this.clientHeight);
    const radius = diameter / 2;
    circle.style.width = circle.style.height = `${diameter}px`;
    // We adjust for absolute position within the button
    const rect = this.getBoundingClientRect();
    circle.style.left = `${e.clientX - rect.left - radius}px`;
    circle.style.top = `${e.clientY - rect.top - radius}px`;
    circle.classList.add('ripple');
    
    // Remove existing ripples
    const ripple = this.getElementsByClassName('ripple')[0];
    if (ripple) { ripple.remove(); }
    
    this.appendChild(circle);
    
    submitQuery();
});

// Extracted search logic
async function submitQuery() {
    const query = document.getElementById('query').value.trim();
    if (!query) return;

    const btn = document.getElementById('search-btn');
    const loader = document.getElementById('btn-loader');
    const span = btn.querySelector('span');
    const resultsContainer = document.getElementById('results-container');

    // UI Loading state
    btn.disabled = true;
    span.style.display = 'none';
    loader.style.display = 'block';
    resultsContainer.innerHTML = '';

    try {
        const response = await fetch('/recommend', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query })
        });

        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
            data.results.forEach((game, index) => {
                const card = createGameCard(game, index);
                resultsContainer.appendChild(card);
            });
            enhanceInteractiveCursor(); // Bind new cards
        } else {
            resultsContainer.innerHTML = `<p style="text-align:center; color: var(--text-secondary); width: 100%; grid-column: 1 / -1; font-size: 1.2rem;">No exact matches found. Try exploring another atmosphere.</p>`;
        }
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        resultsContainer.innerHTML = `<p style="text-align:center; color: #ef4444; width: 100%; grid-column: 1 / -1; font-size: 1.2rem;">An unexpected server anomaly occurred.</p>`;
    } finally {
        // UI Reset state
        btn.disabled = false;
        span.style.display = 'block';
        loader.style.display = 'none';
    }
}

// Allow Enter key to submit
textarea.addEventListener('keypress', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        primaryBtn.click();
    }
});

function createGameCard(game, index) {
    const div = document.createElement('div');
    div.className = 'game-card';
    div.style.animationDelay = `${index * 0.1}s`;

    // 3D Tilt Hook
    div.addEventListener('mousemove', (e) => {
        const rect = div.getBoundingClientRect();
        const x = e.clientX - rect.left; // x position within the element.
        const y = e.clientY - rect.top;  // y position within the element.
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // Calculate rotation based on cursor pos
        const rotateX = ((y - centerY) / centerY) * -12; // Invert to follow cursor naturally
        const rotateY = ((x - centerX) / centerX) * 12;
        
        div.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    });
    
    div.addEventListener('mouseleave', () => {
        div.style.transform = `perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    });

    const gameHash = game.name.replace(/\s+/g, '').toLowerCase();

    div.innerHTML = `
        <img src="https://picsum.photos/seed/${gameHash}/400/250" alt="${game.name}" class="game-image" loading="lazy">
        <div class="game-card-content">
            <h3 class="game-title">${game.name}</h3>
            <div class="game-tags">
                <span class="tag">${game.genre}</span>
                <span class="tag">${game.type}</span>
                <span class="tag">${game.platform}</span>
            </div>
            <p class="game-desc">${game.description}</p>
            <div class="game-scores">
                <div class="score-box">
                    <span class="score-label">Similarity</span>
                    <span class="score-val" style="color: #60a5fa">${(game.similarity * 100).toFixed(0)}</span>
                </div>
                <div class="score-box">
                    <span class="score-label">Sentiment</span>
                    <span class="score-val" style="color: #c084fc">${(game.sentiment * 100).toFixed(0)}</span>
                </div>
                <div class="score-box">
                    <span class="score-label">Final Score</span>
                    <span class="score-val match">${(game.final_score * 100).toFixed(0)}</span>
                </div>
            </div>
        </div>
    `;
    return div;
}

// Global Demo Trigger
window.runDemo = function(text) {
    document.getElementById('query').value = text;
    document.getElementById('search-btn').click();
};
