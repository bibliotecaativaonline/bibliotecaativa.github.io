// Estado de autenticação
let currentUser = null;

// Elementos DOM
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const showRegister = document.getElementById('showRegister');
const showLogin = document.getElementById('showLogin');
const logoutBtn = document.getElementById('logoutBtn');

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    // Verifica se há um usuário logado no localStorage
    const savedUser = localStorage.getItem('libraryUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateAuthUI();
    }
    
    setupEventListeners();
});

function setupEventListeners() {
    // Mostrar/ocultar modais
    document.getElementById('loginBtn').addEventListener('click', () => {
        loginModal.classList.add('active');
    });
    
    showRegister.addEventListener('click', (e) => {
        e.preventDefault();
        loginModal.classList.remove('active');
        registerModal.classList.add('active');
    });
    
    showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        registerModal.classList.remove('active');
        loginModal.classList.add('active');
    });
    
    // Fechar modais
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            loginModal.classList.remove('active');
            registerModal.classList.remove('active');
        });
    });
    
    // Mostrar/esconder senha
    document.querySelectorAll('.show-password').forEach(btn => {
        btn.addEventListener('click', function() {
            const input = this.previousElementSibling;
            const isPassword = input.type === 'password';
            
            input.type = isPassword ? 'text' : 'password';
            this.innerHTML = isPassword ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
            this.setAttribute('aria-label', isPassword ? 'Ocultar senha' : 'Mostrar senha');
        });
    });
    
    // Formulário de login
    loginForm.addEventListener('submit', handleLogin);
    
    // Formulário de registro
    registerForm.addEventListener('submit', handleRegister);
    
    // Logout
    logoutBtn.addEventListener('click', handleLogout);
}

async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    // Simulação de login - em uma aplicação real, seria uma chamada à API
    if (username && password) {
        // Verificação básica - em produção, usar autenticação segura
        currentUser = {
            username,
            books: []
        };
        
        if (rememberMe) {
            localStorage.setItem('libraryUser', JSON.stringify(currentUser));
        } else {
            sessionStorage.setItem('libraryUser', JSON.stringify(currentUser));
        }
        
        updateAuthUI();
        loginModal.classList.remove('active');
        loginForm.reset();
        
        // Mostra feedback visual
        showToast('Login realizado com sucesso!');
    } else {
        showToast('Por favor, preencha todos os campos', 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    
    // Validações básicas
    if (!name || !email || !username || !password || !confirmPassword) {
        showToast('Por favor, preencha todos os campos', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showToast('As senhas não coincidem', 'error');
        return;
    }
    
    if (password.length < 6) {
        showToast('A senha deve ter pelo menos 6 caracteres', 'error');
        return;
    }
    
    // Simulação de registro - em produção, seria uma chamada à API
    currentUser = {
        username,
        name,
        email,
        books: []
    };
    
    localStorage.setItem('libraryUser', JSON.stringify(currentUser));
    updateAuthUI();
    registerModal.classList.remove('active');
    registerForm.reset();
    
    showToast('Conta criada com sucesso! Bem-vindo(a)!');
}

function handleLogout() {
    currentUser = null;
    localStorage.removeItem('libraryUser');
    sessionStorage.removeItem('libraryUser');
    updateAuthUI();
    showToast('Você saiu da sua conta');
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

export function isLoggedIn() {
    return currentUser !== null;
}

export { currentUser };

// Função exportada para ser usada em ui.js
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