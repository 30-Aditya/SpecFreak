// --- Neural Console (Logging Engine) ---
function addLog(message, type = '') {
    const logContainer = document.getElementById('telemetry-log');
    if (!logContainer) return;

    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    const timestamp = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    entry.innerText = `[${timestamp}] > ${message}`;
    
    logContainer.appendChild(entry);
    logContainer.scrollTop = logContainer.scrollHeight;
}

// --- Tab Management Engine ---
window.switchTab = function(tabId) {
    // 1. Update Sidebar UI
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        const label = item.innerText.toLowerCase();
        if (label.includes(tabId) || (tabId === 'stats' && label.includes('telemetry'))) {
            item.classList.add('active');
        }
    });

    // 2. Switch Panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    const targetPanel = document.getElementById(`panel-${tabId}`);
    if (targetPanel) targetPanel.classList.add('active');

    addLog(`Navigated to system node: ${tabId.toUpperCase()}`);

    // Special behavior for archive
    if (tabId === 'archive') loadArchive();
};

// --- Neural Cursor Engine (LERP Easing) ---
const cursorHalo = document.getElementById('cursor-halo');
const cursorDot = document.getElementById('cursor-dot');
let mouseX = 0, mouseY = 0;
let haloX = 0, haloY = 0;
const lerpFactor = 0.1;

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    cursorDot.style.left = mouseX + 'px';
    cursorDot.style.top = mouseY + 'px';
});

function animateCursor() {
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
let particleDensity = 80;

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

class Particle {
    constructor() { this.reset(); }
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
        if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) this.reset();
    }
}

function initParticles() {
    particles = [];
    for (let i = 0; i < particleDensity; i++) particles.push(new Particle());
}
initParticles();

function animateParticles() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animateParticles);
}
animateParticles();

// --- Sidebar & Mobile Navigation ---
const sidebar = document.querySelector('.sidebar');
const menuToggle = document.getElementById('menu-toggle');
const overlay = document.getElementById('sidebar-overlay');

function toggleSidebar() {
    if (sidebar) sidebar.classList.toggle('open');
    if (menuToggle) menuToggle.classList.toggle('open');
    if (overlay) overlay.classList.toggle('active');
}
if (menuToggle) menuToggle.addEventListener('click', toggleSidebar);
if (overlay) overlay.addEventListener('click', toggleSidebar);

// --- Recommendation Logic & Archive ---
const searchBtn = document.getElementById('search-btn');
const textarea = document.getElementById('query');

if (searchBtn && textarea) {
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

        addLog(`Initiating neural scan for query: "${query}"`);
        addLog("Establishing connection to Render cluster...", "info");

        try {
            const startTime = Date.now();
            const response = await fetch('/recommend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
            });

            const latency = Date.now() - startTime;
            const data = await response.json();
            
            addLog(`Neural sync successful. Latency: ${latency}ms`, "success");
            addLog(`System identified ${data.results ? data.results.length : 0} atmospheric matches.`);

            if (data.results && data.results.length > 0) {
                data.results.forEach((game, index) => {
                    const card = createGameCard(game, index);
                    resultsContainer.appendChild(card);
                });
                saveToArchive(query, data.results);
            } else {
                resultsContainer.innerHTML = `<p style="text-align:center; color: var(--text-secondary); width: 100%; grid-column: 1 / -1; font-size: 1.2rem;">Zero system matches found. Re-calibrate atmospheric query.</p>`;
            }
        } catch (error) {
            addLog(`CRITICAL SYSTEM FAILURE: ${error.message}`, "error");
            resultsContainer.innerHTML = `<p style="text-align:center; color: var(--accent-neon); width: 100%; grid-column: 1 / -1; font-size: 1.2rem;">CRITICAL ERROR: Neural Scanner Failure.</p>`;
        } finally {
            searchBtn.disabled = false;
            btnText.style.display = 'block';
            btnLoader.style.display = 'none';
        }
    });
}

function createGameCard(game, index, isArchive = false) {
    const div = document.createElement('div');
    div.className = 'game-card';
    div.style.animation = `fadeInUp 0.6s forwards ease-out ${index * 0.1}s`;

    // High-Fidelity 3D Tilt
    div.addEventListener('mousemove', (e) => {
        const rect = div.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -10;
        const rotateY = ((x - centerX) / centerX) * 10;
        div.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    });
    div.addEventListener('mouseleave', () => {
        div.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)`;
    });

    const gameHash = game.name.replace(/\s+/g, '').toLowerCase();
    const confidence = (game.final_score * 100).toFixed(0);
    const steamUrl = `https://store.steampowered.com/search/?term=${encodeURIComponent(game.name)}`;

    div.innerHTML = `
        <div class="card-image-wrap">
            <img src="https://picsum.photos/seed/${gameHash}/400/250" alt="${game.name}" class="game-img" loading="lazy">
            <div class="match-probability">${confidence}% MATCH</div>
        </div>
        <div class="card-content">
            <h3 class="card-title">${game.name}</h3>
            <div class="confidence-bar-wrap"><div class="confidence-bar" style="width: ${confidence}%"></div></div>
            <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap;">
                <span class="pill" style="padding: 0.2rem 0.6rem; color: var(--primary-neon);">${game.genre}</span>
                <span style="color: var(--text-secondary); font-size: 0.75rem; margin-top: 0.2rem;">${game.platform}</span>
            </div>
            <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4; height: 3.6rem; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;">${game.description}</p>
            <div style="margin-top: 1.5rem; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 1rem;">
                <span style="color: var(--primary-neon); font-family: 'Orbitron'; font-size: 0.8rem;">★ Meta: ${game.meta_score}</span>
                <a href="${steamUrl}" target="_blank" class="pill" style="border-color: var(--primary-neon); color: white; text-decoration: none; font-size: 0.6rem;">DECODE DATA</a>
            </div>
        </div>
    `;
    return div;
}

// --- LocalStorage Archive Persistence ---
function saveToArchive(query, results) {
    const archive = JSON.parse(localStorage.getItem('specfreak_archive') || '[]');
    const entry = { query, results, timestamp: new Date().toISOString() };
    archive.unshift(entry); // Newest first
    localStorage.setItem('specfreak_archive', JSON.stringify(archive.slice(0, 10))); // Keep last 10
}

function loadArchive() {
    const container = document.getElementById('archive-container');
    if (!container) return;
    const archive = JSON.parse(localStorage.getItem('specfreak_archive') || '[]');
    
    if (archive.length === 0) {
        container.innerHTML = `<p style="color: var(--text-secondary); text-align: center; width: 100%; grid-column: 1/-1;">No archived scans found in local storage.</p>`;
        return;
    }

    container.innerHTML = '';
    archive.forEach((item, aIdx) => {
        const header = document.createElement('div');
        header.style = "grid-column: 1/-1; padding: 2rem 0 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); width: 100%;";
        header.innerHTML = `<span style="font-family: 'Orbitron'; color: var(--secondary-neon); font-size: 0.8rem;">ARCHIVE #${archive.length - aIdx}</span>
                            <h2 style="font-size: 1.2rem; margin-top: 0.5rem;">Query: "${item.query}"</h2>`;
        container.appendChild(header);
        
        item.results.forEach((game, gIdx) => {
            container.appendChild(createGameCard(game, gIdx, true));
        });
    });
}

// --- Telemetry Animation Engine (Sidebar) ---
function animateSidebarStats() {
    const totalElem = document.getElementById('stat-total');
    const latencyElem = document.getElementById('stat-latency');
    if (!totalElem || !latencyElem) return;
    totalElem.innerText = "15,063";
    latencyElem.innerText = "Calculated";
}

document.addEventListener('DOMContentLoaded', () => {
    animateSidebarStats();
    addLog("Neural Link Established.");
});

window.runDemo = function(text) {
    if (textarea && searchBtn) {
        textarea.value = text;
        searchBtn.click();
    }
};

// --- Neural Config Handlers ---
const cfgParticles = document.getElementById('cfg-particles');
if (cfgParticles) {
    cfgParticles.addEventListener('input', (e) => {
        particleDensity = parseInt(e.target.value);
        initParticles();
    });
}
