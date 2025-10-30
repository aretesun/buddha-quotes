// State
let quotes = [];
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let currentTheme = localStorage.getItem('theme') || 'light';

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

    // Category filter
    document.getElementById('category-filter').addEventListener('change', renderBrowseQuotes);

    // Search
    document.getElementById('search-box').addEventListener('input', renderBrowseQuotes);
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
