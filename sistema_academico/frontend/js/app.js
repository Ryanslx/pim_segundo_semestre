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

// Carregar dashboard inicial - VERSÃO CORRIGIDA
async function loadInitialDashboard() {
    const sectionTitle = document.getElementById('section-title');
    const contentArea = document.getElementById('content-area');

    sectionTitle.textContent = 'Dashboard Principal';
    contentArea.innerHTML = '<div class="section"><p>Carregando...</p></div>';

    try {
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
            default:
                dashboardContent = '<div class="section"><p>Tipo de usuário não reconhecido</p></div>';
        }

        contentArea.innerHTML = dashboardContent;
    } catch (error) {
        console.error('Erro no dashboard inicial:', error);
        contentArea.innerHTML = `
            <div class="section">
                <h3>Erro ao carregar dashboard</h3>
                <p>${error.message}</p>
                <button class="btn btn-primary" onclick="showSection('dashboard')">
                    <i class="fas fa-redo"></i> Tentar Novamente
                </button>
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

// Navegação entre seções - VERSÃO CORRIGIDA
// Navegação entre seções - VERSÃO ATUALIZADA COM CALENDÁRIO
async function showSection(section) {
    // Atualizar menu ativo
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Encontrar o item de menu correto
    const menuItems = document.querySelectorAll('.menu-item');
    for (let item of menuItems) {
        if (item.textContent.includes(getSectionDisplayName(section))) {
            item.classList.add('active');
            break;
        }
    }

    const sectionTitle = document.getElementById('section-title');
    const contentArea = document.getElementById('content-area');

    // Mostrar loading
    contentArea.innerHTML = '<div class="section"><p>Carregando...</p></div>';

    try {
        let content = '';

        switch (section) {
            case 'dashboard':
                sectionTitle.textContent = 'Dashboard Principal';
                content = await loadInitialDashboardContent();
                break;

            case 'minhas-notas':
                sectionTitle.textContent = 'Minhas Notas e Desempenho';
                content = await loadMinhasNotas();
                break;

            case 'atividades-aluno':
                sectionTitle.textContent = 'Atividades Pendentes';
                content = await loadAtividadesAluno();
                break;

            case 'calendario':
            case 'calendario-aluno':
                sectionTitle.textContent = 'Calendário Acadêmico';
                content = await loadCalendario();
                break;

            case 'turmas':
                sectionTitle.textContent = 'Gerenciar Turmas';
                content = await loadTurmasSection();
                break;

            // Casos para Professor
            case 'minhas-turmas':
                sectionTitle.textContent = 'Minhas Turmas';
                content = await loadMinhasTurmas();
                break;

            case 'atividades':
                sectionTitle.textContent = 'Gerenciar Atividades';
                content = await loadAtividadesProfessor();
                break;

            case 'avaliacoes':
                sectionTitle.textContent = 'Avaliações e Correções';
                content = await loadAvaliacoes();
                break;

            // Casos para Admin
            case 'alunos':
                sectionTitle.textContent = 'Gerenciar Alunos';
                content = await loadAlunosSection();
                break;

            case 'professores':
                sectionTitle.textContent = 'Gerenciar Professores';
                content = await loadProfessoresSection();
                break;

            case 'relatorios':
                sectionTitle.textContent = 'Relatórios e Estatísticas';
                content = await loadRelatorios();
                break;

            case 'configuracoes':
                sectionTitle.textContent = 'Configurações do Sistema';
                content = await loadConfiguracoes();
                break;

            default:
                sectionTitle.textContent = getSectionDisplayName(section);
                content = `
                    <div class="section">
                        <h3>Funcionalidade em Desenvolvimento</h3>
                        <p>A seção "${getSectionDisplayName(section)}" está sendo desenvolvida e estará disponível em breve.</p>
                    </div>
                `;
        }

        contentArea.innerHTML = content;
    } catch (error) {
        console.error(`Erro na seção ${section}:`, error);
        contentArea.innerHTML = `
            <div class="section">
                <h3>Erro ao carregar seção</h3>
                <p>${error.message}</p>
                <button class="btn btn-primary" onclick="showSection('${section}')">
                    <i class="fas fa-redo"></i> Tentar Novamente
                </button>
            </div>
        `;
    }
}

// Função auxiliar para carregar conteúdo do dashboard
async function loadInitialDashboardContent() {
    switch (currentUser.tipo) {
        case 'admin':
            return await loadAdminDashboard();
        case 'professor':
            return await loadProfessorDashboard();
        case 'aluno':
            return await loadAlunoDashboard();
        default:
            return '<div class="section"><p>Tipo de usuário não reconhecido</p></div>';
    }
}

// Função auxiliar para nomes das seções - VERSÃO ATUALIZADA
function getSectionDisplayName(section) {
    const names = {
        'dashboard': 'Dashboard Principal',
        'minhas-notas': 'Minhas Notas',
        'atividades-aluno': 'Atividades',
        'calendario': 'Calendário',
        'calendario-aluno': 'Calendário',
        'turmas': 'Gerenciar Turmas',
        'minhas-turmas': 'Minhas Turmas',
        'atividades': 'Atividades',
        'avaliacoes': 'Avaliações',
        'calendario': 'Calendário',
        'alunos': 'Gerenciar Alunos',
        'professores': 'Gerenciar Professores',
        'relatorios': 'Relatórios',
        'configuracoes': 'Configurações',
        'feedback-aluno': 'Feedback'
    };
    return names[section] || section;
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
// Adicionar estas funções no app.js (antes do final do arquivo)
// Função temporária para testes
async function loadAtividadesAluno() {
    // Dados mock para teste
    const atividadesMock = [
        {
            id: 1,
            titulo: 'Trabalho de Matemática',
            materia_nome: 'Matemática',
            data_entrega: '2024-01-15',
            valor: 10.0,
            entregue: false
        },
        {
            id: 2,
            titulo: 'Redação sobre Sustentabilidade',
            materia_nome: 'Português',
            data_entrega: '2024-01-20',
            valor: 8.0,
            entregue: true
        }
    ];

    return `
        <div class="section">
            <div class="section-header">
                <h2>Atividades Pendentes</h2>
            </div>
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Atividade</th>
                            <th>Matéria</th>
                            <th>Data de Entrega</th>
                            <th>Valor</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${atividadesMock.map(atividade => `
                            <tr>
                                <td>${atividade.titulo}</td>
                                <td>${atividade.materia_nome}</td>
                                <td>${new Date(atividade.data_entrega).toLocaleDateString('pt-BR')}</td>
                                <td>${atividade.valor}</td>
                                <td>
                                    <span class="badge ${atividade.entregue ? 'badge-success' : 'badge-warning'}">
                                        ${atividade.entregue ? 'Entregue' : 'Pendente'}
                                    </span>
                                </td>
                                <td>
                                    <button class="btn btn-sm btn-primary" onclick="viewAtividadeDetails(${atividade.id})">
                                        <i class="fas fa-info-circle"></i> Detalhes
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}
// Dashboard do Aluno - VERSÃO CORRIGIDA
async function loadAlunoDashboard() {
    try {
        const [notasRes, atividadesRes] = await Promise.all([
            fetch(`${API_BASE}/aluno/minhas-notas`, { headers: getAuthHeaders() }),
            fetch(`${API_BASE}/aluno/atividades-pendentes`, { headers: getAuthHeaders() })
        ]);

        if (!notasRes.ok) throw new Error('Erro ao carregar notas');
        if (!atividadesRes.ok) throw new Error('Erro ao carregar atividades');

        const notasData = await notasRes.json();
        const atividadesData = await atividadesRes.json();

        // Calcular métricas
        const totalAtividades = atividadesData.atividades ? atividadesData.atividades.length : 0;
        const atividadesPendentes = atividadesData.atividades ? 
            atividadesData.atividades.filter(a => !a.entregue).length : 0;
        const desempenho = calculateOverallPerformance(notasData.notas);

        return `
            <div class="welcome-section">
                <h2>Bem-vindo, ${currentUser.nome}!</h2>
                <p>Seu desempenho acadêmico em tempo real</p>
            </div>
            
            <div class="dashboard">
                <div class="card">
                    <div class="card-header">
                        <div>
                            <h3>${notasData.media_geral ? notasData.media_geral.toFixed(1) : '0.0'}</h3>
                            <p>Média Geral</p>
                        </div>
                        <div class="card-icon blue">
                            <i class="fas fa-chart-line"></i>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <div>
                            <h3>${notasData.notas ? notasData.notas.length : 0}</h3>
                            <p>Avaliações Realizadas</p>
                        </div>
                        <div class="card-icon green">
                            <i class="fas fa-clipboard-check"></i>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <div>
                            <h3>${atividadesPendentes}</h3>
                            <p>Atividades Pendentes</p>
                        </div>
                        <div class="card-icon orange">
                            <i class="fas fa-tasks"></i>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <div>
                            <h3>${desempenho}%</h3>
                            <p>Desempenho</p>
                        </div>
                        <div class="card-icon purple">
                            <i class="fas fa-percentage"></i>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <div class="section-header">
                    <h2>Próximas Atividades</h2>
                    <button class="btn btn-primary" onclick="showSection('atividades-aluno')">
                        <i class="fas fa-list"></i> Ver Todas
                    </button>
                </div>
                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>Atividade</th>
                                <th>Matéria</th>
                                <th>Data de Entrega</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${atividadesData.atividades && atividadesData.atividades.length > 0 ? 
                                atividadesData.atividades.slice(0, 5).map(atividade => `
                                    <tr>
                                        <td>${atividade.titulo}</td>
                                        <td>${atividade.materia_nome}</td>
                                        <td>${new Date(atividade.data_entrega).toLocaleDateString('pt-BR')}</td>
                                        <td>
                                            <span class="badge ${atividade.entregue ? 'badge-success' : 'badge-warning'}">
                                                ${atividade.entregue ? 'Entregue' : 'Pendente'}
                                            </span>
                                        </td>
                                    </tr>
                                `).join('') : `
                                <tr>
                                    <td colspan="4" class="text-center">Nenhuma atividade pendente</td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div class="section">
                <div class="section-header">
                    <h2>Últimas Avaliações</h2>
                    <button class="btn btn-primary" onclick="showSection('minhas-notas')">
                        <i class="fas fa-chart-bar"></i> Ver Todas
                    </button>
                </div>
                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>Atividade</th>
                                <th>Matéria</th>
                                <th>Nota</th>
                                <th>Data</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${notasData.notas && notasData.notas.length > 0 ? 
                                notasData.notas.slice(0, 5).map(nota => `
                                    <tr>
                                        <td>${nota.atividade_titulo}</td>
                                        <td>${nota.materia_nome}</td>
                                        <td>
                                            <span class="badge ${getNotaBadgeClass(nota.nota)}">
                                                ${nota.nota}
                                            </span>
                                        </td>
                                        <td>${new Date(nota.data_avaliacao).toLocaleDateString('pt-BR')}</td>
                                    </tr>
                                `).join('') : `
                                <tr>
                                    <td colspan="4" class="text-center">Nenhuma avaliação encontrada</td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Erro no dashboard aluno:', error);
        return `
            <div class="section">
                <h3>Erro ao carregar dashboard</h3>
                <p>${error.message}</p>
                <button class="btn btn-primary" onclick="location.reload()">
                    <i class="fas fa-redo"></i> Recarregar Página
                </button>
            </div>
        `;
    }
}
// Calendário Acadêmico
async function loadCalendario() {
    try {
        let eventos = [];

        // Buscar eventos baseado no tipo de usuário
        if (currentUser.tipo === 'aluno') {
            const [atividadesRes, aulasRes] = await Promise.all([
                fetch(`${API_BASE}/aluno/atividades-pendentes`, { headers: getAuthHeaders() }),
                fetch(`${API_BASE}/aluno/calendario-aulas`, { headers: getAuthHeaders() })
            ]);

            if (atividadesRes.ok) {
                const atividadesData = await atividadesRes.json();
                eventos = eventos.concat(atividadesData.atividades.map(a => ({
                    ...a,
                    tipo: 'atividade',
                    titulo: `📝 ${a.titulo}`,
                    cor: '#e74c3c'
                })));
            }

            if (aulasRes.ok) {
                const aulasData = await aulasRes.json();
                eventos = eventos.concat(aulasData.dias_aula.map(a => ({
                    ...a,
                    tipo: 'aula',
                    titulo: `📚 ${a.materia}`,
                    cor: '#3498db'
                })));
            }
        }

        return `
            <div class="section">
                <div class="section-header">
                    <h2>Calendário Acadêmico</h2>
                    <div class="header-actions">
                        <button class="btn btn-primary" onclick="vistaMensal()">
                            <i class="fas fa-calendar-alt"></i> Mês
                        </button>
                        <button class="btn btn-outline" onclick="vistaSemanal()">
                            <i class="fas fa-calendar-week"></i> Semana
                        </button>
                        <button class="btn btn-outline" onclick="vistaDiaria()">
                            <i class="fas fa-calendar-day"></i> Dia
                        </button>
                    </div>
                </div>

                <div class="calendario-container">
                    <div class="calendario-header">
                        <button class="btn btn-sm" onclick="mesAnterior()">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <h3 id="calendario-mes-ano">${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h3>
                        <button class="btn btn-sm" onclick="proximoMes()">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>

                    <div class="calendario-vista" id="calendario-vista">
                        ${gerarCalendarioMensal(new Date().getFullYear(), new Date().getMonth())}
                    </div>
                </div>
            </div>

            <div class="section">
                <div class="section-header">
                    <h2>Próximos Eventos</h2>
                </div>
                <div class="eventos-lista" id="eventos-lista">
                    ${gerarListaEventos(eventos)}
                </div>
            </div>

            <div class="section">
                <div class="section-header">
                    <h2>Legenda</h2>
                </div>
                <div class="legenda-calendario">
                    <div class="legenda-item">
                        <span class="cor-indicador" style="background: #3498db"></span>
                        <span>Aulas</span>
                    </div>
                    <div class="legenda-item">
                        <span class="cor-indicador" style="background: #e74c3c"></span>
                        <span>Atividades</span>
                    </div>
                    <div class="legenda-item">
                        <span class="cor-indicador" style="background: #f39c12"></span>
                        <span>Provas</span>
                    </div>
                    <div class="legenda-item">
                        <span class="cor-indicador" style="background: #2ecc71"></span>
                        <span>Eventos</span>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Erro no calendário:', error);
        return `
            <div class="section">
                <h3>Erro ao carregar calendário</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}
// Dashboard do Professor
async function loadProfessorDashboard() {
    try {
        return `
            <div class="welcome-section">
                <h2>Bem-vindo, Professor ${currentUser.nome}!</h2>
                <p>Painel de controle para gestão acadêmica</p>
            </div>
            
            <div class="dashboard">
                <div class="card">
                    <div class="card-header">
                        <div>
                            <h3>0</h3>
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
                            <h3>0</h3>
                            <p>Atividades Pendentes</p>
                        </div>
                        <div class="card-icon green">
                            <i class="fas fa-tasks"></i>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <div>
                            <h3>0</h3>
                            <p>Avaliações para Corrigir</p>
                        </div>
                        <div class="card-icon orange">
                            <i class="fas fa-clipboard-check"></i>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <div>
                            <h3>0</h3>
                            <p>Alunos</p>
                        </div>
                        <div class="card-icon purple">
                            <i class="fas fa-user-graduate"></i>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <div class="section-header">
                    <h2>Funcionalidades do Professor</h2>
                </div>
                <div class="features-grid">
                    <div class="feature-card" onclick="showSection('minhas-turmas')">
                        <i class="fas fa-users"></i>
                        <h4>Minhas Turmas</h4>
                        <p>Gerencie suas turmas e alunos</p>
                    </div>
                    
                    <div class="feature-card" onclick="showSection('atividades')">
                        <i class="fas fa-tasks"></i>
                        <h4>Atividades</h4>
                        <p>Crie e gerencie atividades</p>
                    </div>
                    
                    <div class="feature-card" onclick="showSection('avaliacoes')">
                        <i class="fas fa-clipboard-check"></i>
                        <h4>Avaliações</h4>
                        <p>Corrija e avalie atividades</p>
                    </div>
                    
                    <div class="feature-card" onclick="showSection('calendario')">
                        <i class="fas fa-calendar-alt"></i>
                        <h4>Calendário</h4>
                        <p>Visualize o calendário acadêmico</p>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        return `
            <div class="section">
                <h3>Erro ao carregar dashboard</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}
// Variáveis globais do calendário
let calendarioDataAtual = new Date();
let vistaAtual = 'mensal';

// Funções de navegação do calendário
function mesAnterior() {
    calendarioDataAtual.setMonth(calendarioDataAtual.getMonth() - 1);
    atualizarCalendario();
}

function proximoMes() {
    calendarioDataAtual.setMonth(calendarioDataAtual.getMonth() + 1);
    atualizarCalendario();
}

function vistaMensal() {
    vistaAtual = 'mensal';
    atualizarCalendario();
}

function vistaSemanal() {
    vistaAtual = 'semanal';
    atualizarCalendario();
}

function vistaDiaria() {
    vistaAtual = 'diaria';
    atualizarCalendario();
}

function atualizarCalendario() {
    const calendarioVista = document.getElementById('calendario-vista');
    const mesAnoElement = document.getElementById('calendario-mes-ano');

    if (mesAnoElement) {
        mesAnoElement.textContent = calendarioDataAtual.toLocaleDateString('pt-BR', { 
            month: 'long', 
            year: 'numeric' 
        });
    }

    if (calendarioVista) {
        switch (vistaAtual) {
            case 'mensal':
                calendarioVista.innerHTML = gerarCalendarioMensal(
                    calendarioDataAtual.getFullYear(), 
                    calendarioDataAtual.getMonth()
                );
                break;
            case 'semanal':
                calendarioVista.innerHTML = gerarCalendarioSemanal(calendarioDataAtual);
                break;
            case 'diaria':
                calendarioVista.innerHTML = gerarCalendarioDiario(calendarioDataAtual);
                break;
        }
    }
}

// Gerar calendário mensal
function gerarCalendarioMensal(ano, mes) {
    const primeiroDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);
    const diasNoMes = ultimoDia.getDate();
    const diaInicio = primeiroDia.getDay();

    let calendarioHTML = `
        <div class="calendario-mensal">
            <div class="dias-semana">
                <div class="dia-semana">Dom</div>
                <div class="dia-semana">Seg</div>
                <div class="dia-semana">Ter</div>
                <div class="dia-semana">Qua</div>
                <div class="dia-semana">Qui</div>
                <div class="dia-semana">Sex</div>
                <div class="dia-semana">Sáb</div>
            </div>
            <div class="dias-mes">
    `;

    // Dias vazios no início
    for (let i = 0; i < diaInicio; i++) {
        calendarioHTML += `<div class="dia vazio"></div>`;
    }

    // Dias do mês
    const hoje = new Date();
    for (let dia = 1; dia <= diasNoMes; dia++) {
        const dataAtual = new Date(ano, mes, dia);
        const ehHoje = dataAtual.toDateString() === hoje.toDateString();
        const eventosDia = obterEventosDoDia(dataAtual);

        calendarioHTML += `
            <div class="dia ${ehHoje ? 'hoje' : ''} ${eventosDia.length > 0 ? 'com-evento' : ''}" 
                 onclick="abrirDetalhesDia('${dataAtual.toISOString()}')">
                <div class="numero-dia">${dia}</div>
                ${eventosDia.length > 0 ? `
                    <div class="eventos-dia">
                        ${eventosDia.slice(0, 2).map(evento => `
                            <div class="evento-marcador" style="background: ${evento.cor || '#3498db'}"></div>
                        `).join('')}
                        ${eventosDia.length > 2 ? `<div class="mais-eventos">+${eventosDia.length - 2}</div>` : ''}
                    </div>
                ` : ''}
            </div>
        `;
    }

    calendarioHTML += `</div></div>`;
    return calendarioHTML;
}

// Gerar lista de eventos
function gerarListaEventos(eventos) {
    if (!eventos || eventos.length === 0) {
        return '<p class="text-center">Nenhum evento próximo</p>';
    }

    // Ordenar eventos por data
    const eventosOrdenados = eventos.sort((a, b) => new Date(a.data_entrega || a.data) - new Date(b.data_entrega || b.data));

    return `
        <div class="lista-eventos">
            ${eventosOrdenados.slice(0, 10).map(evento => `
                <div class="evento-item">
                    <div class="evento-cor" style="background: ${evento.cor || '#3498db'}"></div>
                    <div class="evento-info">
                        <div class="evento-titulo">${evento.titulo}</div>
                        <div class="evento-detalhes">
                            <span class="evento-data">
                                ${new Date(evento.data_entrega || evento.data).toLocaleDateString('pt-BR')}
                            </span>
                            <span class="evento-materia">${evento.materia_nome || evento.materia || ''}</span>
                        </div>
                    </div>
                    <button class="btn btn-sm btn-outline" onclick="detalhesEvento(${evento.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            `).join('')}
        </div>
    `;
}

// Funções auxiliares (mock por enquanto)
function obterEventosDoDia(data) {
    // Mock de eventos - substituir por dados reais da API
    const eventosMock = [
        {
            id: 1,
            titulo: 'Prova de Matemática',
            tipo: 'prova',
            cor: '#f39c12',
            data: '2024-01-15'
        },
        {
            id: 2,
            titulo: 'Aula de Física',
            tipo: 'aula',
            cor: '#3498db',
            data: '2024-01-15'
        }
    ];

    const dataString = data.toISOString().split('T')[0];
    return eventosMock.filter(evento => evento.data === dataString);
}

function abrirDetalhesDia(dataISO) {
    const data = new Date(dataISO);
    const eventos = obterEventosDoDia(data);
    
    alert(`Eventos para ${data.toLocaleDateString('pt-BR')}:\n\n${
        eventos.length > 0 ? 
        eventos.map(e => `• ${e.titulo}`).join('\n') : 
        'Nenhum evento para este dia'
    }`);
}

function detalhesEvento(eventoId) {
    alert(`Detalhes do evento ID: ${eventoId}\n\nEsta funcionalidade será implementada em breve!`);
}
// Seção de Turmas (Admin)
async function loadTurmasSection() {
    try {
        const response = await fetch(`${API_BASE}/admin/turmas`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar turmas');
        }

        const data = await response.json();

        return `
            <div class="section-header">
                <h2>Gerenciar Turmas</h2>
                <button class="btn btn-primary" onclick="openCreateTurmaModal()">
                    <i class="fas fa-plus"></i> Nova Turma
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
                            <th>Capacidade</th>
                            <th>Alunos</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.turmas && data.turmas.length > 0 ? data.turmas.map(turma => `
                            <tr>
                                <td>${turma.nome}</td>
                                <td>${turma.codigo}</td>
                                <td>${turma.ano_letivo}</td>
                                <td>${turma.periodo}</td>
                                <td>${turma.alunos_matriculados || 0}/${turma.capacidade_max}</td>
                                <td>
                                    <div class="progress" style="height: 8px; background: #e9ecef; border-radius: 4px; margin: 5px 0;">
                                        <div class="progress-bar" style="width: ${((turma.alunos_matriculados || 0) / turma.capacidade_max * 100)}%; 
                                            background: ${((turma.alunos_matriculados || 0) / turma.capacidade_max * 100) > 80 ? '#e74c3c' : '#2ecc71'}; 
                                            height: 100%; border-radius: 4px;">
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <button class="btn btn-sm btn-info" onclick="viewTurma(${turma.id})">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn btn-sm btn-warning" onclick="editTurma(${turma.id})">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-sm btn-danger" onclick="deleteTurma(${turma.id})">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('') : `
                            <tr>
                                <td colspan="7" class="text-center">Nenhuma turma cadastrada</td>
                            </tr>
                        `}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        return `
            <div class="section">
                <h3>Erro ao carregar turmas</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Funções auxiliares
function calculateOverallPerformance(notas) {
    if (!notas || notas.length === 0) return 0;
    
    const total = notas.reduce((sum, nota) => sum + parseFloat(nota.nota || 0), 0);
    return (total / notas.length * 10).toFixed(1);
}

function getNotaBadgeClass(nota) {
    const valor = parseFloat(nota);
    if (valor >= 8) return 'badge-success';
    if (valor >= 6) return 'badge-warning';
    return 'badge-danger';
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