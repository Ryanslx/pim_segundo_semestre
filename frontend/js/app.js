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
    document.getElementById('loginForm').addEventListener('submit', handleLogin);

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
async function handleLogin(event) {
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
    if (!currentUser) {
        console.error('currentUser não está definido');
        return;
    }

    document.getElementById('user-name').textContent = currentUser.nome || 'Usuário';
    document.getElementById('user-type').textContent = currentUser.tipo || 'Tipo não definido';
    document.getElementById('user-role').textContent = `Perfil: ${(currentUser.tipo || '').charAt(0).toUpperCase() + (currentUser.tipo || '').slice(1)}`;

    // Avatar com iniciais
    const initials = (currentUser.nome || 'U').split(' ').map(n => n[0]).join('').toUpperCase();
    document.getElementById('user-avatar').textContent = initials.substring(0, 2);
}

// Carregar menu baseado no tipo de usuário
function loadMenu() {
    const menuContainer = document.getElementById('sidebar-menu');

    if (!currentUser || !currentUser.tipo) {
        console.error('Tipo de usuário não definido');
        return;
    }

    let menuItems = [];

    switch (currentUser.tipo) {
        case 'admin':
            menuItems = [
                { icon: 'fas fa-home', text: 'Dashboard', section: 'dashboard' },
                { icon: 'fas fa-users', text: 'Gerenciar Turmas', section: 'turmas' },
                { icon: 'fas fa-user-graduate', text: 'Gerenciar Alunos', section: 'alunos' },
                { icon: 'fas fa-chalkboard-teacher', text: 'Gerenciar Professores', section: 'professores' },
                { icon: 'fas fa-chart-bar', text: 'Relatórios', section: 'relatorios' },
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
        const firstMenuItem = menuContainer.querySelector('.menu-item');
        if (firstMenuItem) {
            firstMenuItem.classList.add('active');
        }
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
                dashboardContent = await loadAdminDashboardContent();
                break;
            case 'professor':
                dashboardContent = await loadProfessorDashboardContent();
                break;
            case 'aluno':
                dashboardContent = await loadAlunoDashboardContent();
                break;
            default:
                dashboardContent = '<div class="section"><h3>Tipo de usuário não reconhecido</h3></div>';
        }

        contentArea.innerHTML = dashboardContent;
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        contentArea.innerHTML = `
            <div class="section">
                <h3>Erro ao carregar dashboard</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Dashboard do Admin (função renomeada para evitar conflito)
async function loadAdminDashboardContent() {
    try {
        const [turmasRes, alunosRes, professoresRes] = await Promise.all([
            fetch(`${API_BASE}/admin/turmas`, { headers: getAuthHeaders() }),
            fetch(`${API_BASE}/admin/alunos`, { headers: getAuthHeaders() }),
            fetch(`${API_BASE}/admin/professores`, { headers: getAuthHeaders() })
        ]);

        const turmasData = turmasRes.ok ? await turmasRes.json() : { turmas: [] };
        const alunosData = alunosRes.ok ? await alunosRes.json() : { alunos: [] };
        const professoresData = professoresRes.ok ? await professoresRes.json() : { professores: [] };

        return `
            <div class="dashboard">
                <div class="stats-grid">
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
                                ${turmasData.turmas && turmasData.turmas.length > 0 ?
                turmasData.turmas.slice(0, 5).map(turma => `
                                        <tr>
                                            <td>${turma.nome || 'N/A'}</td>
                                            <td>${turma.codigo || 'N/A'}</td>
                                            <td>${turma.ano_letivo || 'N/A'}</td>
                                            <td>${turma.periodo || 'N/A'}</td>
                                            <td>${turma.alunos_matriculados || 0}/${turma.capacidade_max || 0}</td>
                                        </tr>
                                    `).join('') :
                '<tr><td colspan="5">Nenhuma turma encontrada</td></tr>'
            }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Erro ao carregar dashboard admin:', error);
        return `
            <div class="section">
                <h3>Erro ao carregar dados</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Carregar métricas de sustentabilidade
async function loadSustainabilityMetrics() {
    try {
        const response = await fetch(`${API_BASE}/sustainability`);
        const metrics = await response.json();
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

    // Encontrar e ativar o item de menu correto
    const menuItems = document.querySelectorAll('.menu-item');
    for (let item of menuItems) {
        if (item.onclick && item.onclick.toString().includes(`'${section}'`)) {
            item.classList.add('active');
            break;
        }
    }

    const sectionTitle = document.getElementById('section-title');
    const contentArea = document.getElementById('content-area');

    try {
        let content = '';

        switch (section) {
            case 'dashboard':
                sectionTitle.textContent = 'Dashboard Principal';
                content = await loadDashboardContent();
                break;

            case 'turmas':
                if (currentUser.tipo === 'admin') {
                    sectionTitle.textContent = 'Gerenciar Turmas';
                    content = await loadTurmasSection();
                }
                break;

            case 'alunos':
                if (currentUser.tipo === 'admin') {
                    sectionTitle.textContent = 'Gerenciar Alunos';
                    content = await loadAlunosSection();
                }
                break;

            case 'minhas-notas':
                if (currentUser.tipo === 'aluno') {
                    sectionTitle.textContent = 'Minhas Notas e Desempenho';
                    content = await loadMinhasNotas();
                }
                break;

            case 'atividades-aluno':
                if (currentUser.tipo === 'aluno') {
                    sectionTitle.textContent = 'Atividades Pendentes';
                    content = await loadAtividadesAluno();
                }
                break;
            case 'calendario-aluno':
                if (currentUser.tipo === 'aluno') {
                    sectionTitle.textContent = 'Meu Calendário';
                    content = await loadCalendarioAluno();
                }
                break;
            case 'minhas-turmas':
                if (currentUser.tipo === 'professor') {
                    sectionTitle.textContent = 'Minhas Turmas';
                    content = await loadTurmasSection();
                }
                break;

            case 'professores':
                if (currentUser.tipo === 'admin') {
                    sectionTitle.textContent = 'Gerenciar Professores';
                    content = await loadProfessoresSection();
                }
                break;

            // Adicionar estes cases na função showSection() no app.js
            case 'materias':
                if (currentUser.tipo === 'admin') {
                    sectionTitle.textContent = 'Gerenciar Matérias';
                    content = await loadMateriasSection();
                }
                break;

            case 'relatorios':
                if (currentUser.tipo === 'admin') {
                    sectionTitle.textContent = 'Relatórios do Sistema';
                    content = await loadRelatoriosSection();
                }
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
        console.error('Erro ao carregar seção:', error);
        contentArea.innerHTML = `
            <div class="section">
                <h3>Erro ao carregar seção</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Função corrigida para carregar o dashboard
async function loadDashboardContent() {
    try {
        // Carregar dados específicos baseado no tipo de usuário
        let dashboardContent = '';

        switch (currentUser.tipo) {
            case 'admin':
                dashboardContent = await loadAdminDashboardContent();
                break;
            case 'professor':
                dashboardContent = await loadProfessorDashboardContent();
                break;
            case 'aluno':
                dashboardContent = await loadAlunoDashboardContent();
                break;
            default:
                dashboardContent = '<div class="section"><p>Tipo de usuário não reconhecido</p></div>';
        }

        return dashboardContent;
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        return `
            <div class="section">
                <h3>Erro ao carregar dashboard</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Dashboard do Professor (função renomeada)
async function loadProfessorDashboardContent() {
    return `
        <div class="dashboard">
            <div class="card">
                <div class="card-header">
                    <div>
                        <h3>5</h3>
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
                        <h3>12</h3>
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
                        <h3>45</h3>
                        <p>Alunos</p>
                    </div>
                    <div class="card-icon green">
                        <i class="fas fa-user-graduate"></i>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h3>Bem-vindo, Professor!</h3>
            <p>Use o menu lateral para acessar as funcionalidades do sistema.</p>
        </div>
    `;
}

// Dashboard do Aluno (função renomeada)
// Dashboard do Aluno (versão atualizada e completa)
async function loadAlunoDashboardContent() {
    try {
        // Buscar dados reais do aluno
        const [notasRes, atividadesRes, calendarioRes] = await Promise.all([
            fetch(`${API_BASE}/aluno/minhas-notas`, { headers: getAuthHeaders() }),
            fetch(`${API_BASE}/aluno/atividades-pendentes`, { headers: getAuthHeaders() }),
            fetch(`${API_BASE}/aluno/calendario`, { headers: getAuthHeaders() })
        ]);

        const notasData = notasRes.ok ? await notasRes.json() : { notas: [], media_geral: 0 };
        const atividadesData = atividadesRes.ok ? await atividadesRes.json() : { atividades: [] };
        const calendarioData = calendarioRes.ok ? await calendarioRes.json() : { eventos: [] };

        const atividades = atividadesData.atividades || [];
        const notas = notasData.notas || [];
        const eventos = calendarioData.eventos || [];

        // Calcular estatísticas
        const atividadesPendentes = atividades.filter(a => !a.entregue);
        const atividadesEntregues = atividades.filter(a => a.entregue);
        const atividadesAtrasadas = atividades.filter(a => !a.entregue && new Date(a.data_entrega) < new Date());
        const proximasAtividades = atividadesPendentes.slice(0, 3);
        const eventosProximos = eventos
            .filter(e => e.data_especifica ? new Date(e.data_especifica) >= new Date() : true)
            .slice(0, 5);

        return `
            <div class="dashboard">
                <!-- Cards de Estatísticas -->
                <div class="stats-grid">
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
                        <div class="card-footer">
                            <small>Baseado em ${notas.length} avaliações</small>
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="card-header">
                            <div>
                                <h3>${atividadesPendentes.length}</h3>
                                <p>Pendentes</p>
                            </div>
                            <div class="card-icon orange">
                                <i class="fas fa-tasks"></i>
                            </div>
                        </div>
                        <div class="card-footer">
                            <small>${atividadesAtrasadas.length} atrasadas</small>
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="card-header">
                            <div>
                                <h3>${atividadesEntregues.length}</h3>
                                <p>Entregues</p>
                            </div>
                            <div class="card-icon green">
                                <i class="fas fa-check-circle"></i>
                            </div>
                        </div>
                        <div class="card-footer">
                            <small>${atividades.length} no total</small>
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="card-header">
                            <div>
                                <h3>${calcularFrequencia(notas)}%</h3>
                                <p>Frequência</p>
                            </div>
                            <div class="card-icon purple">
                                <i class="fas fa-calendar-check"></i>
                            </div>
                        </div>
                        <div class="card-footer">
                            <small>Taxa de participação</small>
                        </div>
                    </div>
                </div>
                
                <!-- Linha com Gráficos e Atividades -->
                <div class="dashboard-row">
                    <!-- Atividades Recentes -->
                    <div class="dashboard-col">
                        <div class="section">
                            <div class="section-header">
                                <h2>Atividades Recentes</h2>
                                <button class="btn btn-sm btn-primary" onclick="showSection('atividades-aluno')">
                                    Ver Todas
                                </button>
                            </div>
                            <div class="atividades-recentes">
                                ${atividades.length > 0 ? atividades.slice(0, 5).map(atividade => `
                                    <div class="atividade-dash-item ${atividade.entregue ? 'entregue' : 'pendente'} ${isAtrasada(atividade.data_entrega, atividade.entregue) ? 'atrasada' : ''}">
                                        <div class="atividade-icon">
                                            <i class="fas ${getAtividadeIcon(atividade.titulo)}"></i>
                                        </div>
                                        <div class="atividade-info">
                                            <div class="atividade-titulo">${atividade.titulo}</div>
                                            <div class="atividade-detalhes">
                                                <span class="materia">${atividade.materia_nome}</span>
                                                <span class="data">${new Date(atividade.data_entrega).toLocaleDateString('pt-BR')}</span>
                                            </div>
                                        </div>
                                        <div class="atividade-status">
                                            <span class="badge ${atividade.entregue ? 'badge-success' : getStatusBadgeDash(atividade.data_entrega)}">
                                                ${atividade.entregue ? 'Entregue' : getStatusTextoDash(atividade.data_entrega)}
                                            </span>
                                        </div>
                                    </div>
                                `).join('') : `
                                    <div class="empty-state-small">
                                        <i class="fas fa-tasks"></i>
                                        <p>Nenhuma atividade recente</p>
                                    </div>
                                `}
                            </div>
                        </div>
                    </div>
                    
                    <!-- Próximos Eventos -->
                    <div class="dashboard-col">
                        <div class="section">
                            <div class="section-header">
                                <h2>Próximos Eventos</h2>
                                <button class="btn btn-sm btn-primary" onclick="showSection('calendario-aluno')">
                                    Ver Calendário
                                </button>
                            </div>
                            <div class="eventos-proximos">
                                ${eventosProximos.length > 0 ? eventosProximos.map(evento => `
                                    <div class="evento-dash-item ${evento.tipo}">
                                        <div class="evento-icon ${evento.tipo}">
                                            <i class="fas ${getEventoIcon(evento.tipo)}"></i>
                                        </div>
                                        <div class="evento-info">
                                            <div class="evento-titulo">${evento.materia}</div>
                                            <div class="evento-detalhes">
                                                ${evento.data_especifica ? 
                                                    new Date(evento.data_especifica).toLocaleDateString('pt-BR') : 
                                                    `${evento.dia_semana} ${evento.horario}`
                                                }
                                            </div>
                                        </div>
                                        <div class="evento-tipo ${evento.tipo}">
                                            ${evento.tipo}
                                        </div>
                                    </div>
                                `).join('') : `
                                    <div class="empty-state-small">
                                        <i class="fas fa-calendar"></i>
                                        <p>Nenhum evento próximo</p>
                                    </div>
                                `}
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Segunda Linha com Desempenho e Ações Rápidas -->
                <div class="dashboard-row">
                    <!-- Desempenho por Matéria -->
                    <div class="dashboard-col">
                        <div class="section">
                            <div class="section-header">
                                <h2>Desempenho por Matéria</h2>
                                <button class="btn btn-sm btn-primary" onclick="showSection('minhas-notas')">
                                    Ver Detalhes
                                </button>
                            </div>
                            <div class="desempenho-materias">
                                ${gerarGraficoDesempenho(notas)}
                            </div>
                        </div>
                    </div>
                    
                    <!-- Ações Rápidas -->
                    <div class="dashboard-col">
                        <div class="section">
                            <div class="section-header">
                                <h2>Ações Rápidas</h2>
                            </div>
                            <div class="acoes-rapidas">
                                <div class="acao-item" onclick="showSection('atividades-aluno')">
                                    <div class="acao-icon">
                                        <i class="fas fa-tasks"></i>
                                    </div>
                                    <div class="acao-info">
                                        <h4>Ver Atividades</h4>
                                        <p>${atividadesPendentes.length} pendentes</p>
                                    </div>
                                    <div class="acao-arrow">
                                        <i class="fas fa-chevron-right"></i>
                                    </div>
                                </div>
                                
                                <div class="acao-item" onclick="showSection('minhas-notas')">
                                    <div class="acao-icon">
                                        <i class="fas fa-chart-line"></i>
                                    </div>
                                    <div class="acao-info">
                                        <h4>Ver Notas</h4>
                                        <p>${notas.length} avaliações</p>
                                    </div>
                                    <div class="acao-arrow">
                                        <i class="fas fa-chevron-right"></i>
                                    </div>
                                </div>
                                
                                <div class="acao-item" onclick="showSection('calendario-aluno')">
                                    <div class="acao-icon">
                                        <i class="fas fa-calendar-alt"></i>
                                    </div>
                                    <div class="acao-info">
                                        <h4>Ver Calendário</h4>
                                        <p>${eventosProximos.length} eventos</p>
                                    </div>
                                    <div class="acao-arrow">
                                        <i class="fas fa-chevron-right"></i>
                                    </div>
                                </div>
                                
                                <div class="acao-item" onclick="openFeedbackModal()">
                                    <div class="acao-icon">
                                        <i class="fas fa-comment"></i>
                                    </div>
                                    <div class="acao-info">
                                        <h4>Enviar Feedback</h4>
                                        <p>Ajude a melhorar o sistema</p>
                                    </div>
                                    <div class="acao-arrow">
                                        <i class="fas fa-chevron-right"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Alertas e Notificações -->
                ${gerarAlertas(atividadesAtrasadas, proximasAtividades)}
            </div>
        `;
    } catch (error) {
        console.error('Erro no dashboard:', error);
        return `
            <div class="dashboard">
                <div class="stats-grid">
                    <div class="card">
                        <div class="card-header">
                            <div>
                                <h3>0.0</h3>
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
                                <h3>0</h3>
                                <p>Pendentes</p>
                            </div>
                            <div class="card-icon orange">
                                <i class="fas fa-tasks"></i>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="card-header">
                            <div>
                                <h3>0</h3>
                                <p>Entregues</p>
                            </div>
                            <div class="card-icon green">
                                <i class="fas fa-check-circle"></i>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="card-header">
                            <div>
                                <h3>85%</h3>
                                <p>Frequência</p>
                            </div>
                            <div class="card-icon purple">
                                <i class="fas fa-calendar-check"></i>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="section">
                    <h3>Bem-vindo, Aluno!</h3>
                    <p>Use o menu lateral para acessar as funcionalidades do sistema.</p>
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span>Erro ao carregar dados completos do dashboard.</span>
                    </div>
                </div>
            </div>
        `;
    }
}

// Atualizar a função loadMenu para incluir onclick corretamente
function loadMenu() {
    const menuContainer = document.getElementById('sidebar-menu');
    let menuItems = [];

    switch (currentUser.tipo) {
        // No caso 'admin' do loadMenu(), adicionar:
        case 'admin':
            menuItems = [
                { icon: 'fas fa-home', text: 'Dashboard', section: 'dashboard' },
                { icon: 'fas fa-users', text: 'Gerenciar Turmas', section: 'turmas' },
                { icon: 'fas fa-user-graduate', text: 'Gerenciar Alunos', section: 'alunos' },
                { icon: 'fas fa-chalkboard-teacher', text: 'Gerenciar Professores', section: 'professores' },
                { icon: 'fas fa-book', text: 'Gerenciar Matérias', section: 'materias' }, // NOVO
                { icon: 'fas fa-chart-bar', text: 'Relatórios', section: 'relatorios' }, // NOVO
            ];
            break;

        case 'professor':
            menuItems = [
                { icon: 'fas fa-home', text: 'Dashboard', section: 'dashboard' },
                { icon: 'fas fa-users', text: 'Minhas Turmas', section: 'minhas-turmas' },
                { icon: 'fas fa-tasks', text: 'Atividades', section: 'atividades' },
                { icon: 'fas fa-clipboard-check', text: 'Avaliações', section: 'avaliacoes' }
            ];
            break;

        case 'aluno':
            menuItems = [
                { icon: 'fas fa-home', text: 'Dashboard', section: 'dashboard' },
                { icon: 'fas fa-chart-line', text: 'Minhas Notas', section: 'minhas-notas' },
                { icon: 'fas fa-tasks', text: 'Atividades', section: 'atividades-aluno' },
                { icon: 'fas fa-calendar-alt', text: 'Calendário', section: 'calendario-aluno' }
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
        const firstItem = menuContainer.querySelector('.menu-item');
        if (firstItem) {
            firstItem.classList.add('active');
        }
    }
}

// Headers de autenticação melhorados
function getAuthHeaders() {
    const headers = {
        'Content-Type': 'application/json'
    };

    if (currentToken) {
        headers['Authorization'] = `Bearer ${currentToken}`;
    }

    return headers;
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
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
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

// Funções placeholder para seções não implementadas
async function loadTurmasSection() {
    return `
        <div class="section">
            <h3>Gerenciar Turmas</h3>
            <p>Funcionalidade em desenvolvimento...</p>
        </div>
    `;
}

async function loadMinhasNotas() {
    return `
        <div class="section">
            <h3>Minhas Notas</h3>
            <p>Funcionalidade em desenvolvimento...</p>
        </div>
    `;
}

async function loadAtividadesAluno() {
    return `
        <div class="section">
            <h3>Atividades Pendentes</h3>
            <p>Funcionalidade em desenvolvimento...</p>
        </div>
    `;
}

// Tratamento de erro global
window.addEventListener('error', function (e) {
    console.error('Erro global:', e.error);
});

// Verificar se todas as funções necessárias existem
function checkFunctions() {
    const requiredFunctions = ['showSection', 'loadDashboardContent', 'loadAdminDashboardContent'];
    requiredFunctions.forEach(func => {
        if (typeof window[func] === 'undefined') {
            console.error(`Função ${func} não está definida!`);
        }
    });
}

// Executar verificação após carregamento
document.addEventListener('DOMContentLoaded', function () {
    checkFunctions();
});