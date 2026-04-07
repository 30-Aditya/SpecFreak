// --- Neural Cursor Engine (LERP Easing) ---
const cursorHalo = document.getElementById('cursor-halo');
const cursorDot = document.getElementById('cursor-dot');
let mouseX = 0, mouseY = 0;
let haloX = 0, haloY = 0;
const lerpFactor = 0.1;

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    // Dot is instantaneous
    cursorDot.style.left = mouseX + 'px';
    cursorDot.style.top = mouseY + 'px';
});

function animateCursor() {
    // Halo uses LERP for smooth lag
    haloX += (mouseX - haloX) * lerpFactor;
    haloY += (mouseY - haloY) * lerpFactor;
    
    cursorHalo.style.left = haloX + 'px';
    cursorHalo.style.top = haloY + 'px';
    
    requestAnimationFrame(animateCursor);
}
animateCursor();

// --- Interactive Particle Engine (Canvas) ---
const canvas = document.getElementById('ambient-canvas');
const ctx = canvas.getContext('2d');
let particles = [];
let width, height;

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

class Particle {
    constructor() {
        this.reset();
    }
    reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.radius = Math.random() * 1.5;
        this.alpha = Math.random() * 0.5 + 0.2;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 242, 254, ${this.alpha})`;
        ctx.fill();
    }
    update() {
        // Response to Mouse (Repulsion)
        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 150) {
            const angle = Math.atan2(dy, dx);
            const force = (150 - dist) / 150;
            this.x -= Math.cos(angle) * force * 1.5;
            this.y -= Math.sin(angle) * force * 1.5;
        }

        this.x += this.vx;
        this.y += this.vy;
        
        if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
            this.reset();
        }
    }
}

for (let i = 0; i < 80; i++) particles.push(new Particle());

function animateParticles() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => {
        p.update();
        p.draw();
    });
    requestAnimationFrame(animateParticles);
}
animateParticles();

// --- Sidebar & Mobile Navigation ---
const sidebar = document.querySelector('.sidebar');
const menuToggle = document.getElementById('menu-toggle');
const overlay = document.getElementById('sidebar-overlay');

function toggleSidebar() {
    sidebar.classList.toggle('open');
    menuToggle.classList.toggle('open');
    overlay.classList.toggle('active');
}

menuToggle.addEventListener('click', toggleSidebar);
overlay.addEventListener('click', toggleSidebar);

// Close sidebar on item click (mobile)
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
            toggleSidebar();
        }
    });
});

window.switchTab = function(tabId) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        const label = item.innerText.toLowerCase();
        // Fixed Telemetry/Stats logic
        if (label.includes(tabId) || (tabId === 'stats' && label.includes('telemetry'))) {
            item.classList.add('active');
        }
    });
};

// --- Telemetry Animation Engine ---
function animateStats() {
    const totalElem = document.getElementById('stat-total');
    const latencyElem = document.getElementById('stat-latency');
    
    if (!totalElem || !latencyElem) return;

    let total = 0;
    const targetTotal = 15063;
    const totalInterval = setInterval(() => {
        total += Math.floor(targetTotal / 40);
        if (total >= targetTotal) {
            totalElem.innerText = targetTotal.toLocaleString();
            clearInterval(totalInterval);
        } else {
            totalElem.innerText = total.toLocaleString();
        }
    }, 30);

    let latency = 0;
    const targetLatency = 120;
    const latInterval = setInterval(() => {
        latency += 10;
        if (latency >= targetLatency) {
            latencyElem.innerText = targetLatency + 'ms';
            clearInterval(latInterval);
        } else {
            latencyElem.innerText = latency + 'ms';
        }
    }, 50);
}

document.addEventListener('DOMContentLoaded', animateStats);
// Immediate check if DOM already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') animateStats();

// --- Recommendation Logic ---
const searchBtn = document.getElementById('search-btn');
const textarea = document.getElementById('query');

searchBtn.addEventListener('click', async () => {
    const query = textarea.value.trim();
    if (!query) return;

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
            resultsContainer.innerHTML = `<p style="text-align:center; color: var(--text-secondary); width: 100%; grid-column: 1 / -1; font-size: 1.2rem;">Zero system matches found. Re-calibrate atmospheric query.</p>`;
        }
    } catch (error) {
        console.error('System Failure:', error);
        resultsContainer.innerHTML = `<p style="text-align:center; color: var(--accent-neon); width: 100%; grid-column: 1 / -1; font-size: 1.2rem;">CRITICAL ERROR: Neural Scanner Failure.</p>`;
    } finally {
        searchBtn.disabled = false;
        btnText.style.display = 'block';
        btnLoader.style.display = 'none';
    }
});

function createGameCard(game, index) {
    const div = document.createElement('div');
    div.className = 'game-card';
    div.style.animation = `fadeInUp 0.6s forwards ease-out ${index * 0.15}s`;

    // High-Fidelity 3D Tilt Hook
    div.addEventListener('mousemove', (e) => {
        const rect = div.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = ((y - centerY) / centerY) * -15; // Increased tilt intensity
        const rotateY = ((x - centerX) / centerX) * 15;
        
        div.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
    });
    
    div.addEventListener('mouseleave', () => {
        div.style.transform = `perspective(1200px) rotateX(0) rotateY(0) scale3d(1, 1, 1)`;
    });

    const gameHash = game.name.replace(/\s+/g, '').toLowerCase();
    const confidence = (game.final_score * 100).toFixed(0);

    div.innerHTML = `
        <div class="card-image-wrap">
            <img src="https://picsum.photos/seed/${gameHash}/400/250" alt="${game.name}" class="game-img" loading="lazy">
            <div class="match-probability">${confidence}% MATCH</div>
        </div>
        <div class="card-content">
            <h3 class="card-title">${game.name}</h3>
            
            <div class="confidence-bar-wrap">
                <div class="confidence-bar" style="width: ${confidence}%"></div>
            </div>

            <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
                <span style="background: rgba(188, 19, 254, 0.2); color: var(--secondary-neon); font-size: 0.75rem; padding: 0.2rem 0.6rem; border-radius: 4px; border: 1px solid rgba(188, 19, 254, 0.4);">${game.genre}</span>
                <span style="color: var(--text-secondary); font-size: 0.75rem;">${game.platform}</span>
            </div>
            
            <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">${game.description}</p>
            
            <div style="margin-top: 1.5rem; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 1rem;">
                <span style="color: var(--primary-neon); font-family: 'Orbitron'; font-size: 0.8rem;">★ Meta: ${game.meta_score}</span>
                <span style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,0.3);">${game.type}</span>
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
