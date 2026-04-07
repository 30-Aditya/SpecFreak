// Cursor glow tracker logic
const cursorGlow = document.getElementById('cursor-glow');
document.addEventListener('mousemove', (e) => {
    cursorGlow.style.left = e.clientX + 'px';
    cursorGlow.style.top = e.clientY + 'px';
});

// Typing placeholder logic
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
        typeDelay = 2000;
        isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        phIndex = (phIndex + 1) % placeholders.length;
        typeDelay = 500;
    }
    setTimeout(typePlaceholder, typeDelay);
}
setTimeout(typePlaceholder, 1000);

// Recommendation Logic
const searchBtn = document.getElementById('search-btn');
searchBtn.addEventListener('click', async () => {
    const query = textarea.value.trim();
    if (!query) return;

    // Loading State
    const btnText = document.getElementById('btn-text');
    const btnLoader = document.getElementById('btn-loader');
    const resultsContainer = document.getElementById('results-container');

    searchBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoader.style.display = 'block';
    resultsContainer.innerHTML = '';

    try {
        const response = await fetch('/recommend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });

        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
            data.results.forEach((game, index) => {
                const card = createGameCard(game, index);
                resultsContainer.appendChild(card);
            });
        } else {
            resultsContainer.innerHTML = `<p style="text-align:center; color: var(--text-secondary); width: 100%; grid-column: 1 / -1; font-size: 1.2rem;">Zero matches found. Try exploring another atmosphere.</p>`;
        }
    } catch (error) {
        console.error('Error:', error);
        resultsContainer.innerHTML = `<p style="text-align:center; color: #ef4444; width: 100%; grid-column: 1 / -1; font-size: 1.2rem;">System glitch. Re-initiating scanner...</p>`;
    } finally {
        searchBtn.disabled = false;
        btnText.style.display = 'block';
        btnLoader.style.display = 'none';
    }
});

function createGameCard(game, index) {
    const div = document.createElement('div');
    div.className = 'game-card';
    div.style.animationDelay = `${index * 0.1}s`;

    // 3D Tilt Hook
    div.addEventListener('mousemove', (e) => {
        const rect = div.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = ((y - centerY) / centerY) * -8;
        const rotateY = ((x - centerX) / centerX) * 8;
        
        div.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    });
    
    div.addEventListener('mouseleave', () => {
        div.style.transform = `perspective(1200px) rotateX(0) rotateY(0) scale3d(1, 1, 1)`;
    });

    const gameHash = game.name.replace(/\s+/g, '').toLowerCase();

    div.innerHTML = `
        <div class="card-img-container">
            <img src="https://picsum.photos/seed/${gameHash}/400/250" alt="${game.name}" class="game-image" loading="lazy">
            <div class="score-badge">${(game.final_score * 100).toFixed(0)}% Match</div>
        </div>
        <div class="card-body">
            <h3 class="game-title">${game.name}</h3>
            <div class="game-tags">
                <span class="tag">${game.genre}</span>
                <span class="tag">${game.type}</span>
            </div>
            <p class="game-description">${game.description}</p>
            <div class="card-footer">
                <span class="platform-tag">${game.platform}</span>
                <div class="rating-indicator" style="color: #fbbf24; font-size: 0.8rem; font-weight: 700;">★ Meta: ${game.meta_score}</div>
            </div>
        </div>
    `;
    return div;
}

window.runDemo = function(text) {
    textarea.value = text;
    searchBtn.click();
};

textarea.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        searchBtn.click();
    }
});
