// State
let quotes = [];
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let currentTheme = localStorage.getItem('theme') || 'light';
let currentBackgroundImage = null;

// Unsplash API Configuration
const UNSPLASH_ACCESS_KEY = 'YOUR_UNSPLASH_ACCESS_KEY'; // 사용자가 설정해야 함
const UNSPLASH_API_URL = 'https://api.unsplash.com/photos/random';

// Initialize
document.addEventListener('DOMContentLoaded', init);

async function init() {
    // Load quotes
    await loadQuotes();

    // Set theme
    document.documentElement.setAttribute('data-theme', currentTheme);

    // Setup event listeners
    setupEventListeners();

    // Load initial content
    showTodayQuote();
    populateCategoryFilter();
    renderBrowseQuotes();
    renderFavorites();
}

// Load quotes from JSON
async function loadQuotes() {
    try {
        const response = await fetch('data/quotes.json');
        quotes = await response.json();
    } catch (error) {
        console.error('Failed to load quotes:', error);
        quotes = [];
    }
}

// Event Listeners
function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Dark mode toggle
    document.getElementById('dark-mode-toggle').addEventListener('click', toggleDarkMode);

    // Random quote
    document.getElementById('random-btn').addEventListener('click', showRandomQuote);

    // Today's favorite
    document.getElementById('today-favorite').addEventListener('click', function() {
        const quoteId = parseInt(this.dataset.quoteId);
        toggleFavorite(quoteId);
        updateFavoriteButton(this, quoteId);
    });

    // Today's share button
    document.getElementById('today-share').addEventListener('click', function() {
        const quoteId = parseInt(document.getElementById('today-favorite').dataset.quoteId);
        shareQuoteAsImage(quoteId);
    });

    // Category filter
    document.getElementById('category-filter').addEventListener('change', renderBrowseQuotes);

    // Search
    document.getElementById('search-box').addEventListener('input', renderBrowseQuotes);
}

// Fetch Random Background Image
async function fetchBackgroundImage() {
    // Picsum Photos API 사용 (무료, CORS 지원)
    // 매번 다른 이미지를 가져오기 위해 랜덤 ID 사용
    const randomId = Math.floor(Math.random() * 1000);
    const width = 1200;
    const height = 630;
    const imageUrl = `https://picsum.photos/id/${randomId}/${width}/${height}`;
    return imageUrl;
}

// Canvas - Generate Quote Image
async function generateQuoteImage(quote, backgroundUrl) {
    return new Promise(async (resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Set canvas size (1200x630 - optimal for social media)
        canvas.width = 1200;
        canvas.height = 630;

        try {
            // Load background image
            const bgImage = new Image();
            bgImage.crossOrigin = 'anonymous';

            bgImage.onload = function() {
                try {
                    // Draw background image
                    ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

                    // Add dark overlay for better text readability
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    // Configure text
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = '#ffffff';

                    // Add text shadow for better readability
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
                    ctx.shadowBlur = 10;
                    ctx.shadowOffsetX = 2;
                    ctx.shadowOffsetY = 2;

                    // Draw main quote
                    const maxWidth = canvas.width - 200;
                    const lineHeight = 60;
                    const x = canvas.width / 2;

                    // Modern interpretation (main text)
                    ctx.font = 'bold 36px sans-serif';
                    const lines = wrapText(ctx, quote.modernInterpretation, maxWidth);

                    let y = (canvas.height - (lines.length * lineHeight)) / 2;

                    lines.forEach(line => {
                        ctx.fillText(line, x, y);
                        y += lineHeight;
                    });

                    // Draw source (smaller text)
                    ctx.font = '20px sans-serif';
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                    ctx.fillText(`— ${quote.source}`, x, canvas.height - 100);

                    // Draw branding
                    ctx.font = '18px sans-serif';
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                    ctx.shadowBlur = 5;
                    ctx.fillText('마음 챙김 - 부처님 명언', x, canvas.height - 60);

                    resolve(canvas);
                } catch (error) {
                    console.error('Canvas drawing error:', error);
                    reject(error);
                }
            };

            bgImage.onerror = function(error) {
                console.error('Background image load error:', error);
                // Fallback: create gradient background
                createGradientBackground(canvas, ctx, quote).then(resolve).catch(reject);
            };

            bgImage.src = backgroundUrl;
        } catch (error) {
            console.error('Generate quote image error:', error);
            reject(error);
        }
    });
}

// Fallback: Create gradient background if image fails to load
async function createGradientBackground(canvas, ctx, quote) {
    return new Promise((resolve) => {
        // Create gradient background
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#8b7355');
        gradient.addColorStop(1, '#5a4a3a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Configure text
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';

        // Add text shadow for better readability
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        // Draw main quote
        const maxWidth = canvas.width - 200;
        const lineHeight = 60;
        const x = canvas.width / 2;

        // Modern interpretation (main text)
        ctx.font = 'bold 36px sans-serif';
        const lines = wrapText(ctx, quote.modernInterpretation, maxWidth);

        let y = (canvas.height - (lines.length * lineHeight)) / 2;

        lines.forEach(line => {
            ctx.fillText(line, x, y);
            y += lineHeight;
        });

        // Draw source (smaller text)
        ctx.font = '20px sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillText(`— ${quote.source}`, x, canvas.height - 100);

        // Draw branding
        ctx.font = '18px sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.shadowBlur = 5;
        ctx.fillText('마음 챙김 - 부처님 명언', x, canvas.height - 60);

        resolve(canvas);
    });
}

// Wrap text for canvas (improved for Korean text)
function wrapText(ctx, text, maxWidth) {
    const lines = [];
    let currentLine = '';

    // 한글과 영어 모두 지원하기 위해 문자별로 처리
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const testLine = currentLine + char;
        const metrics = ctx.measureText(testLine);

        if (metrics.width > maxWidth && currentLine.length > 0) {
            lines.push(currentLine);
            currentLine = char;
        } else {
            currentLine = testLine;
        }
    }

    if (currentLine) {
        lines.push(currentLine);
    }

    return lines;
}

// Download canvas as image
function downloadCanvasAsImage(canvas, filename = 'buddha-quote.png') {
    canvas.toBlob(function(blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
}

// Share Quote as Image
async function shareQuoteAsImage(quoteId) {
    const quote = quotes.find(q => q.id === quoteId);
    if (!quote) {
        console.error('Quote not found:', quoteId);
        return;
    }

    // Show loading state
    showLoadingModal('이미지를 생성하는 중...');

    try {
        // Fetch background image
        const backgroundUrl = await fetchBackgroundImage();
        console.log('Background URL:', backgroundUrl);

        // Generate image
        const canvas = await generateQuoteImage(quote, backgroundUrl);
        console.log('Canvas created:', canvas);

        // Hide loading
        hideLoadingModal();

        // Show preview modal
        showShareModal(canvas, quote);
    } catch (error) {
        console.error('Failed to generate image:', error);
        hideLoadingModal();
        alert('이미지 생성에 실패했습니다:\n' + error.message + '\n\n다시 시도해주세요.');
    }
}

// Show Loading Modal
function showLoadingModal(message) {
    const modal = document.getElementById('loading-modal');
    const messageEl = document.getElementById('loading-message');
    messageEl.textContent = message;
    modal.style.display = 'flex';
}

function hideLoadingModal() {
    const modal = document.getElementById('loading-modal');
    modal.style.display = 'none';
}

// Show Share Modal
function showShareModal(canvas, quote) {
    const modal = document.getElementById('share-modal');
    const preview = document.getElementById('share-preview');

    // Clear previous preview
    preview.innerHTML = '';

    // Add canvas to preview
    const img = document.createElement('img');
    img.src = canvas.toDataURL();
    img.style.maxWidth = '100%';
    img.style.borderRadius = '8px';
    preview.appendChild(img);

    // Setup download button
    const downloadBtn = document.getElementById('download-btn');
    downloadBtn.onclick = () => {
        downloadCanvasAsImage(canvas, `buddha-quote-${quote.id}.png`);
    };

    // Setup change background button
    const changeBgBtn = document.getElementById('change-bg-btn');
    changeBgBtn.onclick = async () => {
        hideShareModal();
        await shareQuoteAsImage(quote.id);
    };

    modal.style.display = 'flex';
}

function hideShareModal() {
    const modal = document.getElementById('share-modal');
    modal.style.display = 'none';
}

// Tab Switching
function switchTab(tabName) {
    // Update buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tabName}-tab`);
    });

    // Refresh content if needed
    if (tabName === 'favorites') {
        renderFavorites();
    }
}

// Dark Mode
function toggleDarkMode() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
}

// Today's Quote (based on day of year)
function showTodayQuote() {
    const dayOfYear = getDayOfYear();
    const quoteIndex = dayOfYear % quotes.length;
    const quote = quotes[quoteIndex];

    displayQuote(quote, 'today');
}

// Random Quote
function showRandomQuote() {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    const quote = quotes[randomIndex];
    displayQuote(quote, 'today');
}

// Display Quote
function displayQuote(quote, prefix) {
    document.getElementById(`${prefix}-number`).textContent = quote.id;
    document.getElementById(`${prefix}-original`).textContent = quote.original;
    document.getElementById(`${prefix}-modern`).textContent = quote.modernInterpretation;
    document.getElementById(`${prefix}-source`).textContent = `출처: ${quote.source}`;

    const favBtn = document.getElementById(`${prefix}-favorite`);
    favBtn.dataset.quoteId = quote.id;
    updateFavoriteButton(favBtn, quote.id);
}

// Category Filter
function populateCategoryFilter() {
    const categories = [...new Set(quotes.map(q => q.category))].sort();
    const select = document.getElementById('category-filter');

    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = getCategoryDisplayName(cat);
        select.appendChild(option);
    });
}

// Browse Quotes
function renderBrowseQuotes() {
    const category = document.getElementById('category-filter').value;
    const searchTerm = document.getElementById('search-box').value.toLowerCase();

    let filtered = quotes;

    // Filter by category
    if (category !== 'all') {
        filtered = filtered.filter(q => q.category === category);
    }

    // Filter by search
    if (searchTerm) {
        filtered = filtered.filter(q =>
            q.modernInterpretation.toLowerCase().includes(searchTerm) ||
            q.original.toLowerCase().includes(searchTerm) ||
            q.theme.toLowerCase().includes(searchTerm)
        );
    }

    const container = document.getElementById('quotes-list');
    container.innerHTML = '';

    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>검색 결과가 없습니다.</p></div>';
        return;
    }

    filtered.forEach(quote => {
        const card = createQuoteCard(quote, true);
        container.appendChild(card);
    });
}

// Favorites
function renderFavorites() {
    const container = document.getElementById('favorites-list');
    const emptyState = document.getElementById('favorites-empty');

    container.innerHTML = '';

    if (favorites.length === 0) {
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    const favoriteQuotes = quotes.filter(q => favorites.includes(q.id));
    favoriteQuotes.forEach(quote => {
        const card = createQuoteCard(quote, false);
        container.appendChild(card);
    });
}

function toggleFavorite(quoteId) {
    const index = favorites.indexOf(quoteId);
    if (index === -1) {
        favorites.push(quoteId);
    } else {
        favorites.splice(index, 1);
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
}

function updateFavoriteButton(btn, quoteId) {
    const isFavorite = favorites.includes(quoteId);
    btn.classList.toggle('active', isFavorite);
    btn.querySelector('.heart').textContent = isFavorite ? '❤️' : '🤍';
}

// Create Quote Card
function createQuoteCard(quote, isCompact) {
    const card = document.createElement('div');
    card.className = `quote-card ${isCompact ? 'compact' : ''}`;

    card.innerHTML = `
        <div class="quote-number">명언 ${quote.id}/100</div>
        <div class="quote-original">${quote.original}</div>
        <div class="quote-modern">${quote.modernInterpretation}</div>
        <div class="quote-source">출처: ${quote.source}</div>
        <div class="quote-actions">
            <button class="btn-favorite" data-quote-id="${quote.id}" aria-label="즐겨찾기">
                <span class="heart">${favorites.includes(quote.id) ? '❤️' : '🤍'}</span>
            </button>
            <button class="btn-share-mini" data-quote-id="${quote.id}" aria-label="이미지로 공유">
                📤
            </button>
        </div>
    `;

    // Add favorite button listener
    const favBtn = card.querySelector('.btn-favorite');
    favBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(quote.id);
        updateFavoriteButton(favBtn, quote.id);
        if (favorites.indexOf(quote.id) === -1) {
            // If unfavorited and we're in favorites tab, remove card
            const currentTab = document.querySelector('.tab-btn.active').dataset.tab;
            if (currentTab === 'favorites') {
                renderFavorites();
            }
        }
    });

    // Add share button listener
    const shareBtn = card.querySelector('.btn-share-mini');
    if (shareBtn) {
        shareBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            shareQuoteAsImage(quote.id);
        });
    }

    return card;
}

// Utility Functions
function getDayOfYear() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
}

function getCategoryDisplayName(category) {
    const names = {
        'mind': '마음',
        'happiness': '행복',
        'relationships': '관계',
        'awareness': '깨어있음',
        'character': '품성',
        'wisdom': '지혜',
        'compassion': '자비',
        'peace': '평화',
        'virtue': '덕',
        'discipline': '절제',
        'growth': '성장',
        'ethics': '윤리',
        'values': '가치관',
        'purpose': '목적',
        'emotional-intelligence': '감정지능',
        'self-awareness': '자기인식',
        'strength': '강인함',
        'leadership': '리더십',
        'suffering': '고통',
        'freedom': '자유',
        'mindfulness': '마음챙김',
        'learning': '배움',
        'karma': '업보',
        'impermanence': '무상',
        'self-care': '자기관리',
        'wellness': '웰빙',
        'integrity': '진실성',
        'practice': '수행',
        'gratitude': '감사',
        'communication': '소통',
        'resilience': '회복탄력성',
        'social-responsibility': '사회적책임',
        'detachment': '무집착',
        'liberation': '해방'
    };
    return names[category] || category;
}
