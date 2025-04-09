import { fetchPopularBooks, searchBooks, getAvailableGenres, filterBooks } from './api.js';
import { isLoggedIn, currentUser } from './auth.js';

// Elementos DOM
const booksContainer = document.getElementById('booksContainer');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const genreFilter = document.getElementById('genreFilter');
const ratingFilter = document.getElementById('ratingFilter');
const loadingIndicator = document.querySelector('.loading-indicator');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const pageInfo = document.getElementById('pageInfo');

// Estado da aplicação
let currentPage = 1;
let currentQuery = '';
let currentBooks = [];

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    await loadBooks();
    setupEventListeners();
    updateAuthUI();
});

async function loadBooks(query = '', page = 1) {
    try {
        showLoading(true);
        
        let data;
        if (query) {
            data = await searchBooks(query, page);
            currentQuery = query;
        } else {
            data = await fetchPopularBooks(page);
            currentQuery = '';
        }
        
        currentBooks = data.books;
        currentPage = page;
        
        renderBooks(currentBooks);
        updatePaginationUI(data.total, page);
        populateGenreFilter();
    } catch (error) {
        console.error('Erro ao carregar livros:', error);
        booksContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Ocorreu um erro ao carregar os livros. Por favor, tente novamente.</p>
            </div>
        `;
    } finally {
        showLoading(false);
    }
}

function renderBooks(books) {
    if (books.length === 0) {
        booksContainer.innerHTML = `
            <div class="no-results">
                <i class="fas fa-book-open"></i>
                <p>Nenhum livro encontrado. Tente alterar seus critérios de busca.</p>
            </div>
        `;
        return;
    }
    
    booksContainer.innerHTML = books.map(book => `
        <div class="book-card" data-id="${book.id}">
            <div class="book-cover-container">
                <img src="${book.cover}" alt="${book.title}" class="book-cover" 
                     onerror="this.src='images/default-book-cover.jpg'">
            </div>
            <div class="book-info">
                <h3 class="book-title">${book.title}</h3>
                <p class="book-author">${book.author}</p>
                <div class="book-rating">
                    ${renderStars(book.rating)}
                    <span>(${book.rating}/5)</span>
                </div>
            </div>
        </div>
    `).join('');
}

function renderStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= fullStars) {
            stars += '<i class="fas fa-star filled"></i>';
        } else if (i === fullStars + 1 && hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt filled"></i>';
        } else {
            stars += '<i class="far fa-star"></i>';
        }
    }
    
    return stars;
}

function populateGenreFilter() {
    const genres = getAvailableGenres();
    
    // Limpa opções existentes, mantendo a primeira
    while (genreFilter.options.length > 1) {
        genreFilter.remove(1);
    }
    
    // Adiciona os gêneros encontrados
    genres.forEach(genre => {
        const option = document.createElement('option');
        option.value = genre;
        option.textContent = genre;
        genreFilter.appendChild(option);
    });
}

function updatePaginationUI(totalItems, currentPage) {
    const itemsPerPage = 9;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
    prevPageBtn.disabled = currentPage <= 1;
    nextPageBtn.disabled = currentPage >= totalPages;
}

function showLoading(show) {
    if (show) {
        loadingIndicator.classList.remove('hidden');
        booksContainer.classList.add('hidden');
    } else {
        loadingIndicator.classList.add('hidden');
        booksContainer.classList.remove('hidden');
    }
}

function setupEventListeners() {
    // Busca
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    
    // Filtros
    genreFilter.addEventListener('change', applyFilters);
    ratingFilter.addEventListener('change', applyFilters);
    
    // Paginação
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            loadBooks(currentQuery, currentPage - 1);
        }
    });
    
    nextPageBtn.addEventListener('click', () => {
        loadBooks(currentQuery, currentPage + 1);
    });
}

function handleSearch() {
    const query = searchInput.value.trim();
    loadBooks(query);
}

function applyFilters() {
    const genre = genreFilter.value;
    const minRating = ratingFilter.value;
    
    const filtered = filterBooks(currentBooks, genre, minRating);
    renderBooks(filtered);
}

export function updateAuthUI() {
    const loginBtn = document.getElementById('loginBtn');
    const userDropdown = document.getElementById('userDropdown');
    
    if (isLoggedIn()) {
        loginBtn.innerHTML = `<i class="fas fa-user"></i> ${currentUser.username}`;
        loginBtn.classList.add('logged-in');
        userDropdown.classList.remove('hidden');
    } else {
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
        loginBtn.classList.remove('logged-in');
        userDropdown.classList.add('hidden');
    }
}