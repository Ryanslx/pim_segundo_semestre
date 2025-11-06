// Configuração da API
const API_BASE = 'http://localhost:8000/api';
let currentUser = null;
let currentToken = null;

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', function () {
    // Verificar se há token salvo
    const savedToken = localStorage.getItem('academic_token');
    const savedUser = localStorage.getItem('academic_user');

    if (savedToken && savedUser) {
        currentToken = savedToken;
        currentUser = JSON.parse(savedUser);
        showMainSystem();
    }

    // Configurar formulário de login
    document.getElementById('loginForm').addEventListener('submit', login);

    // Configurar formulário de feedback
    document.getElementById('feedback-form').addEventListener('submit', submitFeedback);

    // Configurar estrelas de rating
    setupRatingStars();
});

// Configurar estrelas de rating
function setupRatingStars() {
    const stars = document.querySelectorAll('.star');
    let currentRating = 0;

    stars.forEach(star => {
        star.addEventListener('click', function () {
            currentRating = parseInt(this.getAttribute('data-rating'));

            stars.forEach(s => {
                if (parseInt(s.getAttribute('data-rating')) <= currentRating) {
                    s.classList.add('active');
                } else {
                    s.classList.remove('active');
                }
            });
        });
    });
}

// Função de login
async function login(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            currentToken = data.access_token;

            // Salvar no localStorage
            localStorage.setItem('academic_token', currentToken);
            localStorage.setItem('academic_user', JSON.stringify(currentUser));

            showMainSystem();
        } else {
            const error = await response.json();
            showNotification(error.error || 'Credenciais inválidas', 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        showNotification('Erro ao conectar com o servidor', 'error');
    }
}

// Mostrar sistema principal
function showMainSystem() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('main-system').style.display = 'flex';

    // Atualizar informações do usuário
    updateUserInfo();

    // Carregar menu baseado no tipo de usuário
    loadMenu();

    // Carregar dashboard inicial
    loadInitialDashboard();

    // Carregar métricas de sustentabilidade
    loadSustainabilityMetrics();
}

// Atualizar informações do usuário
function updateUserInfo() {
    document.getElementById('user-name').textContent = currentUser.nome;
    document.getElementById('user-type').textContent = currentUser.tipo;
    document.getElementById('user-role').textContent = `Perfil: ${currentUser.tipo.charAt(0).toUpperCase() + currentUser.tipo.slice(1)}`;

    // Avatar com iniciais
    const initials = currentUser.nome.split(' ').map(n => n[0]).join('').toUpperCase();
    document.getElementById('user-avatar').textContent = initials;
}

// Carregar menu baseado no tipo de usuário
function loadMenu() {
    const menuContainer = document.getElementById('sidebar-menu');
    let menuItems = [];

    switch (currentUser.tipo) {
        case 'admin':
            menuItems = [
                { icon: 'fas fa-home', text: 'Dashboard', section: 'dashboard' },
                { icon: 'fas fa-users', text: 'Gerenciar Turmas', section: 'turmas' },
                { icon: 'fas fa-user-graduate', text: 'Gerenciar Alunos', section: 'alunos' },
                { icon: 'fas fa-chalkboard-teacher', text: 'Gerenciar Professores', section: 'professores' },
                { icon: 'fas fa-chart-bar', text: 'Relatórios', section: 'relatorios' },
                { icon: 'fas fa-cog', text: 'Configurações', section: 'configuracoes' }
            ];
            break;

        case 'professor':
            menuItems = [
                { icon: 'fas fa-home', text: 'Dashboard', section: 'dashboard' },
                { icon: 'fas fa-users', text: 'Minhas Turmas', section: 'minhas-turmas' },
                { icon: 'fas fa-tasks', text: 'Atividades', section: 'atividades' },
                { icon: 'fas fa-clipboard-check', text: 'Avaliações', section: 'avaliacoes' },
                { icon: 'fas fa-calendar-alt', text: 'Calendário', section: 'calendario' }
            ];
            break;

        case 'aluno':
            menuItems = [
                { icon: 'fas fa-home', text: 'Dashboard', section: 'dashboard' },
                { icon: 'fas fa-chart-line', text: 'Minhas Notas', section: 'minhas-notas' },
                { icon: 'fas fa-tasks', text: 'Atividades', section: 'atividades-aluno' },
                { icon: 'fas fa-calendar-alt', text: 'Calendário', section: 'calendario-aluno' },
                { icon: 'fas fa-comments', text: 'Feedback', section: 'feedback-aluno' }
            ];
            break;
    }

    menuContainer.innerHTML = menuItems.map(item => `
        <div class="menu-item" onclick="showSection('${item.section}')">
            <i class="${item.icon}"></i>
            <span>${item.text}</span>
        </div>
    `).join('');

    // Ativar primeiro item
    if (menuItems.length > 0) {
        menuContainer.querySelector('.menu-item').classList.add('active');
    }
}

// Carregar dashboard inicial
async function loadInitialDashboard() {
    const sectionTitle = document.getElementById('section-title');
    const contentArea = document.getElementById('content-area');

    sectionTitle.textContent = 'Dashboard Principal';

    try {
        // Carregar dados específicos baseado no tipo de usuário
        let dashboardContent = '';

        switch (currentUser.tipo) {
            case 'admin':
                dashboardContent = await loadAdminDashboard();
                break;
            case 'professor':
                dashboardContent = await loadProfessorDashboard();
                break;
            case 'aluno':
                dashboardContent = await loadAlunoDashboard();
                break;
        }

        contentArea.innerHTML = dashboardContent;
    } catch (error) {
        contentArea.innerHTML = `
            <div class="section">
                <h3>Erro ao carregar dashboard</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Dashboard do Admin
async function loadAdminDashboard() {
    const [turmasRes, alunosRes, professoresRes] = await Promise.all([
        fetch(`${API_BASE}/admin/turmas`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE}/admin/alunos`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE}/admin/professores`, { headers: getAuthHeaders() })
    ]);

    const turmasData = await turmasRes.json();
    const alunosData = await alunosRes.json();
    const professoresData = await professoresRes.json();

    return `
        <div class="dashboard">
            <div class="card">
                <div class="card-header">
                    <div>
                        <h3>${turmasData.turmas ? turmasData.turmas.length : 0}</h3>
                        <p>Turmas Ativas</p>
                    </div>
                    <div class="card-icon blue">
                        <i class="fas fa-users"></i>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <div>
                        <h3>${alunosData.alunos ? alunosData.alunos.length : 0}</h3>
                        <p>Alunos Matriculados</p>
                    </div>
                    <div class="card-icon green">
                        <i class="fas fa-user-graduate"></i>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <div>
                        <h3>${professoresData.professores ? professoresData.professores.length : 0}</h3>
                        <p>Professores</p>
                    </div>
                    <div class="card-icon orange">
                        <i class="fas fa-chalkboard-teacher"></i>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <div>
                        <h3>95%</h3>
                        <p>Taxa de Digitalização</p>
                    </div>
                    <div class="card-icon purple">
                        <i class="fas fa-leaf"></i>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <div class="section-header">
                <h2>Turmas Recentes</h2>
                <button class="btn btn-primary" onclick="showSection('turmas')">
                    <i class="fas fa-eye"></i> Ver Todas
                </button>
            </div>
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Código</th>
                            <th>Ano Letivo</th>
                            <th>Período</th>
                            <th>Alunos</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${turmasData.turmas ? turmasData.turmas.slice(0, 5).map(turma => `
                            <tr>
                                <td>${turma.nome}</td>
                                <td>${turma.codigo}</td>
                                <td>${turma.ano_letivo}</td>
                                <td>${turma.periodo}</td>
                                <td>${turma.alunos_matriculados || 0}/${turma.capacidade_max}</td>
                            </tr>
                        `).join('') : '<tr><td colspan="5">Nenhuma turma encontrada</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// Carregar métricas de sustentabilidade
async function loadSustainabilityMetrics() {
    try {
        const response = await fetch(`${API_BASE}/sustainability`);
        const metrics = await response.json();

        // Mostrar métricas no console por enquanto
        console.log('Métricas de Sustentabilidade:', metrics);
    } catch (error) {
        console.error('Erro ao carregar métricas:', error);
    }
}

// Navegação entre seções
async function showSection(section) {
    // Atualizar menu ativo
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.closest('.menu-item').classList.add('active');

    const sectionTitle = document.getElementById('section-title');
    const contentArea = document.getElementById('content-area');

    try {
        let content = '';

        switch (section) {
            case 'dashboard':
                sectionTitle.textContent = 'Dashboard Principal';
                content = await loadInitialDashboard();
                break;

            case 'turmas':
                sectionTitle.textContent = 'Gerenciar Turmas';
                content = await loadTurmasSection();
                break;

            case 'minhas-notas':
                sectionTitle.textContent = 'Minhas Notas e Desempenho';
                content = await loadMinhasNotas();
                break;

            case 'atividades-aluno':
                sectionTitle.textContent = 'Atividades Pendentes';
                content = await loadAtividadesAluno();
                break;

            default:
                sectionTitle.textContent = 'Seção em Desenvolvimento';
                content = `
                    <div class="section">
                        <h3>Funcionalidade em Desenvolvimento</h3>
                        <p>Esta seção está sendo desenvolvida e estará disponível em breve.</p>
                    </div>
                `;
        }

        contentArea.innerHTML = content;
    } catch (error) {
        contentArea.innerHTML = `
            <div class="section">
                <h3>Erro ao carregar seção</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Headers de autenticação
function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
    };
}

// Logout
function logout() {
    currentUser = null;
    currentToken = null;
    localStorage.removeItem('academic_token');
    localStorage.removeItem('academic_user');

    document.getElementById('main-system').style.display = 'none';
    document.getElementById('login-screen').style.display = 'flex';

    // Limpar formulário de login
    document.getElementById('loginForm').reset();
}

// Funções do modal
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Assistente de IA
function openAIAssistant() {
    alert('🤖 Assistente de IA Educacional\n\nRecursos disponíveis:\n• Sugestão de atividades personalizadas\n• Análise de desempenho dos alunos\n• Recomendações pedagógicas baseadas em dados\n• Otimização de cronogramas\n\nEm breve: Integração completa com IA generativa!');
}

// Enviar feedback
async function submitFeedback(event) {
    event.preventDefault();

    const rating = document.querySelector('.star.active') ?
        parseInt(document.querySelector('.star.active').getAttribute('data-rating')) : 0;
    const feedback = document.getElementById('feedback-text').value;
    const suggestions = document.getElementById('suggestions').value;

    if (rating === 0) {
        showNotification('Por favor, selecione uma avaliação', 'warning');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/feedback`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                user_id: currentUser.id,
                user_type: currentUser.tipo,
                feedback: feedback,
                rating: rating,
                suggestions: suggestions
            })
        });

        if (response.ok) {
            showNotification('Feedback enviado com sucesso! Obrigado pela contribuição.', 'success');
            closeModal('feedback-modal');
            document.getElementById('feedback-form').reset();

            // Reset stars
            document.querySelectorAll('.star').forEach(star => {
                star.classList.remove('active');
            });
        } else {
            throw new Error('Erro ao enviar feedback');
        }
    } catch (error) {
        showNotification('Erro ao enviar feedback', 'error');
    }
}

// Sistema de notificações
function showNotification(message, type = 'info') {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `;

    // Adicionar ao body
    document.body.appendChild(notification);

    // Mostrar notificação
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    // Remover após 5 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 5000);
}

function getNotificationIcon(type) {
    switch (type) {
        case 'success': return 'check-circle';
        case 'error': return 'exclamation-circle';
        case 'warning': return 'exclamation-triangle';
        default: return 'info-circle';
    }
}

// Adicionar CSS para notificações
const notificationStyles = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        z-index: 3000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    
    .notification.show {
        transform: translateX(0);
    }
    
    .notification-success { background: #2ecc71; }
    .notification-error { background: #e74c3c; }
    .notification-warning { background: #f39c12; }
    .notification-info { background: #3498db; }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .notification-content i {
        font-size: 1.2rem;
    }
`;

// Adicionar estilos das notificações ao documento
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);