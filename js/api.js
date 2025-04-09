// Configurações da API
const API_BASE_URL = 'https://openlibrary.org';
const COVERS_BASE_URL = 'https://covers.openlibrary.org/b';

// Cache para evitar requisições repetidas
const cache = {
    books: {},
    covers: {},
    genres: new Set()
};

// Função para buscar livros populares
export async function fetchPopularBooks(page = 1, limit = 9) {
    const cacheKey = `popular_${page}_${limit}`;
    
    if (cache.books[cacheKey]) {
        return cache.books[cacheKey];
    }
    
    try {
        // Primeiro busca os works mais populares
        const response = await fetch(`${API_BASE_URL}/trending/daily.json?limit=${limit}&page=${page}`);
        const data = await response.json();
        
        if (!data.works) {
            throw new Error('Dados de livros não encontrados');
        }
        
        // Processa cada work para obter mais detalhes
        const books = await Promise.all(data.works.map(async (work) => {
            const bookDetails = await fetchBookDetails(work.key);
            
            // Extrai o primeiro autor
            let author = 'Autor desconhecido';
            if (work.author_name && work.author_name.length > 0) {
                author = work.author_name[0];
            } else if (bookDetails.authors && bookDetails.authors.length > 0) {
                const authorData = await fetchAuthor(bookDetails.authors[0].author.key);
                author = authorData.name || 'Autor desconhecido';
            }
            
            // Extrai gêneros
            const genres = work.subject ? work.subject.filter(s => 
                !s.includes('Accessible book') && 
                !s.includes('Protected DAISY') &&
                s.split(' ').length < 4
            ).slice(0, 3) : [];
            
            genres.forEach(genre => cache.genres.add(genre));
            
            return {
                id: work.key.replace('/works/', ''),
                title: work.title,
                author,
                genres,
                rating: Math.floor(Math.random() * 2) + 4, // Random 4-5 stars for popular
                cover: work.cover_edition_key ? 
                    `${COVERS_BASE_URL}/olid/${work.cover_edition_key}-M.jpg` : 
                    `${COVERS_BASE_URL}/id/${work.cover_id}-M.jpg`,
                olid: work.cover_edition_key || `work-${work.key.replace('/works/', '')}`,
                first_publish_year: work.first_publish_year,
                description: bookDetails.description || 'Descrição não disponível'
            };
        }));
        
        cache.books[cacheKey] = {
            books,
            total: data.works.length,
            page
        };
        
        return cache.books[cacheKey];
    } catch (error) {
        console.error('Erro ao buscar livros populares:', error);
        throw error;
    }
}

// Função para buscar detalhes de um livro específico
async function fetchBookDetails(workKey) {
    try {
        const response = await fetch(`${API_BASE_URL}${workKey}.json`);
        return await response.json();
    } catch (error) {
        console.error('Erro ao buscar detalhes do livro:', error);
        return {};
    }
}

// Função para buscar informações do autor
async function fetchAuthor(authorKey) {
    try {
        const response = await fetch(`${API_BASE_URL}${authorKey}.json`);
        return await response.json();
    } catch (error) {
        console.error('Erro ao buscar informações do autor:', error);
        return { name: 'Autor desconhecido' };
    }
}

// Função para buscar livros por termo de pesquisa
export async function searchBooks(query, page = 1, limit = 9) {
    const cacheKey = `search_${query}_${page}_${limit}`;
    
    if (cache.books[cacheKey]) {
        return cache.books[cacheKey];
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/search.json?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
        const data = await response.json();
        
        if (!data.docs) {
            throw new Error('Nenhum livro encontrado');
        }
        
        const books = data.docs.map(doc => {
            // Extrai gêneros
            const genres = doc.subject ? doc.subject.filter(s => 
                !s.includes('Accessible book') && 
                !s.includes('Protected DAISY') &&
                s.split(' ').length < 4
            ).slice(0, 3) : [];
            
            genres.forEach(genre => cache.genres.add(genre));
            
            return {
                id: doc.key.replace('/works/', ''),
                title: doc.title,
                author: doc.author_name ? doc.author_name[0] : 'Autor desconhecido',
                genres,
                rating: Math.floor(Math.random() * 3) + 3, // Random 3-5 stars
                cover: doc.cover_edition_key ? 
                    `${COVERS_BASE_URL}/olid/${doc.cover_edition_key}-M.jpg` : 
                    doc.cover_i ? 
                    `${COVERS_BASE_URL}/id/${doc.cover_i}-M.jpg` : 
                    'images/default-book-cover.jpg',
                olid: doc.cover_edition_key || `work-${doc.key.replace('/works/', '')}`,
                first_publish_year: doc.first_publish_year,
                description: 'Descrição não disponível' // A API de busca não retorna descrição
            };
        });
        
        cache.books[cacheKey] = {
            books,
            total: data.numFound,
            page
        };
        
        return cache.books[cacheKey];
    } catch (error) {
        console.error('Erro ao buscar livros:', error);
        throw error;
    }
}

// Função para buscar gêneros disponíveis
export function getAvailableGenres() {
    return Array.from(cache.genres).sort();
}

// Função para filtrar livros localmente
export function filterBooks(books, genre, minRating) {
    return books.filter(book => {
        const matchesGenre = !genre || book.genres.some(g => 
            g.toLowerCase().includes(genre.toLowerCase()));
        const matchesRating = !minRating || book.rating >= parseInt(minRating);
        return matchesGenre && matchesRating;
    });
}