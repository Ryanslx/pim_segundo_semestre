// Sistema de Gerenciamento para Alunos
class AlunoManager {
    constructor() {
        this.currentAtividade = null;
        this.atividadesPendentes = [];
    }

    // =============================================
    // DASHBOARD DO ALUNO - MELHORADO
    // =============================================
    async loadAlunoDashboard() {
        try {
            console.log('🎯 Carregando dashboard do aluno...', currentUser);

            if (!currentUser || currentUser.tipo !== 'aluno') {
                return this.getErrorState('Acesso negado', 'Esta área é restrita a alunos.');
            }

            // Buscar dados do aluno
            const [notasData, atividadesData, calendarioData] = await Promise.all([
                this.fetchMinhasNotas(),
                this.fetchAtividadesPendentes(),
                this.fetchCalendarioAulas()
            ]);

            const mediaGeral = notasData.media_geral || 0;
            const totalAtividades = notasData.notas ? notasData.notas.length : 0;

            // Classificar atividades por status
            const atividadesClassificadas = this.classificarAtividades(atividadesData.atividades || []);
            const atividadesPendentes = atividadesClassificadas.pendentes.length;
            const atividadesProximas = atividadesClassificadas.proximas.length;
            const atividadesConcluidas = atividadesClassificadas.concluidas.length;
            const atividadesAtrasadas = atividadesClassificadas.atrasadas.length;

            const proximasAulas = calendarioData.dias_aula ? calendarioData.dias_aula.length : 0;

            return `
            <div class="aluno-dashboard">
                <!-- SEÇÃO DE BOAS-VINDAS -->
                <div class="welcome-section">
                    <div class="welcome-content">
                        <div class="welcome-text">
                            <h3>Olá, ${currentUser.nome}!</h3>
                            <p>Bem-vindo ao seu portal acadêmico</p>
                        </div>
                        <div class="welcome-stats">
                            <div class="stat-mini">
                                <i class="fas fa-chart-line"></i>
                                <span>Média: ${mediaGeral.toFixed(1)}</span>
                            </div>
                            <div class="stat-mini">
                                <i class="fas fa-tasks"></i>
                                <span>${atividadesPendentes} pendentes</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ESTATÍSTICAS PRINCIPAIS -->
                <div class="aluno-stats">
                    <div class="stat-card-aluno">
                        <div class="stat-icon notas">
                            <i class="fas fa-chart-line"></i>
                        </div>
                        <div class="stat-value">${mediaGeral.toFixed(1)}</div>
                        <div class="stat-label">Média Geral</div>
                        <div class="stat-trend ${mediaGeral >= 6 ? 'positive' : 'negative'}">
                            ${mediaGeral >= 6 ? '✓' : '⚠'}
                        </div>
                    </div>
                    
                    <div class="stat-card-aluno">
                        <div class="stat-icon avaliadas">
                            <i class="fas fa-clipboard-check"></i>
                        </div>
                        <div class="stat-value">${totalAtividades}</div>
                        <div class="stat-label">Avaliadas</div>
                        <div class="stat-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${totalAtividades > 0 ? '100' : '0'}%"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="stat-card-aluno">
                        <div class="stat-icon pendentes">
                            <i class="fas fa-clock"></i>
                        </div>
                        <div class="stat-value">${atividadesPendentes}</div>
                        <div class="stat-label">Pendentes</div>
                        <div class="stat-trend ${atividadesPendentes === 0 ? 'positive' : 'warning'}">
                            ${atividadesPendentes === 0 ? '✓' : '!'}
                        </div>
                    </div>
                    
                    <div class="stat-card-aluno">
                        <div class="stat-icon aulas">
                            <i class="fas fa-calendar"></i>
                        </div>
                        <div class="stat-value">${proximasAulas}</div>
                        <div class="stat-label">Próximas Aulas</div>
                    </div>
                </div>

                <!-- VISÃO GERAL DAS ATIVIDADES -->
                <div class="atividades-overview">
                    <div class="overview-header">
                        <h2>Visão Geral das Atividades</h2>
                        <button class="btn btn-primary" onclick="showSection('atividades-aluno')">
                            <i class="fas fa-eye"></i> Ver Todas
                        </button>
                    </div>
                    
                    <div class="overview-grid">
                        <!-- Atividades Pendentes -->
                        <div class="overview-card pendentes">
                            <div class="overview-header">
                                <h3>
                                    <i class="fas fa-clock"></i>
                                    Pendentes
                                </h3>
                                <span class="overview-count">${atividadesPendentes}</span>
                            </div>
                            <div class="overview-content">
                                ${atividadesClassificadas.pendentes.length > 0 ? `
                                    <div class="atividades-mini-list">
                                        ${atividadesClassificadas.pendentes
                        .slice(0, 3)
                        .map(atividade => this.createAtividadeMiniCard(atividade))
                        .join('')}
                                    </div>
                                    ${atividadesPendentes > 3 ? `
                                        <div class="overview-more">
                                            <small>+${atividadesPendentes - 3} atividades pendentes</small>
                                        </div>
                                    ` : ''}
                                ` : `
                                    <div class="overview-empty">
                                        <i class="fas fa-check-circle"></i>
                                        <p>Nenhuma atividade pendente</p>
                                    </div>
                                `}
                            </div>
                        </div>

                        <!-- Atividades Próximas do Prazo -->
                        <div class="overview-card proximas">
                            <div class="overview-header">
                                <h3>
                                    <i class="fas fa-exclamation-triangle"></i>
                                    Próximas do Prazo
                                </h3>
                                <span class="overview-count warning">${atividadesProximas}</span>
                            </div>
                            <div class="overview-content">
                                ${atividadesClassificadas.proximas.length > 0 ? `
                                    <div class="atividades-mini-list">
                                        ${atividadesClassificadas.proximas
                        .slice(0, 3)
                        .map(atividade => this.createAtividadeMiniCard(atividade))
                        .join('')}
                                    </div>
                                    ${atividadesProximas > 3 ? `
                                        <div class="overview-more">
                                            <small>+${atividadesProximas - 3} atividades próximas</small>
                                        </div>
                                    ` : ''}
                                ` : `
                                    <div class="overview-empty">
                                        <i class="fas fa-calendar-check"></i>
                                        <p>Nenhuma atividade próxima</p>
                                    </div>
                                `}
                            </div>
                        </div>

                        <!-- Atividades Concluídas -->
                        <div class="overview-card concluidas">
                            <div class="overview-header">
                                <h3>
                                    <i class="fas fa-check-circle"></i>
                                    Concluídas
                                </h3>
                                <span class="overview-count success">${atividadesConcluidas}</span>
                            </div>
                            <div class="overview-content">
                                ${atividadesClassificadas.concluidas.length > 0 ? `
                                    <div class="atividades-mini-list">
                                        ${atividadesClassificadas.concluidas
                        .slice(0, 3)
                        .map(atividade => this.createAtividadeConcluidaCard(atividade))
                        .join('')}
                                    </div>
                                    ${atividadesConcluidas > 3 ? `
                                        <div class="overview-more">
                                            <small>+${atividadesConcluidas - 3} atividades concluídas</small>
                                        </div>
                                    ` : ''}
                                ` : `
                                    <div class="overview-empty">
                                        <i class="fas fa-tasks"></i>
                                        <p>Nenhuma atividade concluída</p>
                                    </div>
                                `}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ATIVIDADES RECENTES E CALENDÁRIO -->
                <div class="dashboard-bottom">
                    <!-- ÚLTIMAS AVALIAÇÕES -->
                    <div class="dashboard-column">
                        <div class="section">
                            <div class="section-header">
                                <h2>Últimas Avaliações</h2>
                                <button class="btn btn-info" onclick="showSection('minhas-notas')">
                                    <i class="fas fa-history"></i> Histórico
                                </button>
                            </div>
                            
                            ${totalAtividades > 0 ? `
                                <div class="avaliacoes-list">
                                    ${notasData.notas
                        .slice(0, 4)
                        .map(nota => this.createAvaliacaoCard(nota))
                        .join('')}
                                </div>
                            ` : `
                                <div class="empty-state-aluno">
                                    <i class="fas fa-clipboard-list fa-2x"></i>
                                    <h3>Nenhuma avaliação</h3>
                                    <p>Suas avaliações aparecerão aqui.</p>
                                </div>
                            `}
                        </div>
                    </div>

                    <!-- PRÓXIMOS PRAZOS -->
                    <div class="dashboard-column">
                        <div class="section">
                            <div class="section-header">
                                <h2>Próximos Prazos</h2>
                                <button class="btn btn-success" onclick="showSection('calendario-aluno')">
                                    <i class="fas fa-calendar-alt"></i> Calendário
                                </button>
                            </div>
                            
                            ${atividadesClassificadas.proximas.length > 0 || atividadesClassificadas.pendentes.length > 0 ? `
                                <div class="prazos-list">
                                    ${[...atividadesClassificadas.proximas, ...atividadesClassificadas.pendentes]
                        .slice(0, 5)
                        .map(atividade => this.createPrazoCard(atividade))
                        .join('')}
                                </div>
                            ` : `
                                <div class="empty-state-aluno">
                                    <i class="fas fa-calendar fa-2x"></i>
                                    <h3>Nenhum prazo próximo</h3>
                                    <p>Seus prazos aparecerão aqui.</p>
                                </div>
                            `}
                        </div>
                    </div>
                </div>

                <!-- RESUMO DE DESEMPENHO -->
                <div class="performance-summary">
                    <div class="section">
                        <div class="section-header">
                            <h2>Resumo de Desempenho</h2>
                        </div>
                        <div class="performance-grid">
                            <div class="performance-item">
                                <div class="performance-icon success">
                                    <i class="fas fa-check-circle"></i>
                                </div>
                                <div class="performance-content">
                                    <h4>${this.countAprovadas(notasData.notas || [])}</h4>
                                    <p>Atividades Aprovadas</p>
                                </div>
                            </div>
                            <div class="performance-item">
                                <div class="performance-icon warning">
                                    <i class="fas fa-exclamation-circle"></i>
                                </div>
                                <div class="performance-content">
                                    <h4>${this.countRecuperacao(notasData.notas || [])}</h4>
                                    <p>Em Recuperação</p>
                                </div>
                            </div>
                            <div class="performance-item">
                                <div class="performance-icon danger">
                                    <i class="fas fa-times-circle"></i>
                                </div>
                                <div class="performance-content">
                                    <h4>${this.countReprovadas(notasData.notas || [])}</h4>
                                    <p>Reprovações</p>
                                </div>
                            </div>
                            <div class="performance-item">
                                <div class="performance-icon info">
                                    <i class="fas fa-percentage"></i>
                                </div>
                                <div class="performance-content">
                                    <h4>${this.calculateAproveitamento(notasData.notas || [])}%</h4>
                                    <p>Aproveitamento</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        } catch (error) {
            console.error('❌ Erro no dashboard aluno:', error);
            return this.getErrorState('Erro ao carregar dashboard', error.message);
        }
    }

    // =============================================
    // FUNÇÕES AUXILIARES PARA O DASHBOARD MELHORADO
    // =============================================

    // Classificar atividades por status
    classificarAtividades(atividades) {
        const hoje = new Date();
        const classificadas = {
            pendentes: [],
            proximas: [],
            atrasadas: [],
            concluidas: []
        };

        atividades.forEach(atividade => {
            if (atividade.entregue) {
                classificadas.concluidas.push(atividade);
                return;
            }

            const dataEntrega = new Date(atividade.data_entrega);
            const diasRestantes = Math.ceil((dataEntrega - hoje) / (1000 * 60 * 60 * 24));

            if (diasRestantes < 0) {
                classificadas.atrasadas.push(atividade);
            } else if (diasRestantes <= 3) {
                classificadas.proximas.push(atividade);
            } else {
                classificadas.pendentes.push(atividade);
            }
        });

        // Ordenar por data de entrega
        ['pendentes', 'proximas', 'atrasadas'].forEach(categoria => {
            classificadas[categoria].sort((a, b) => new Date(a.data_entrega) - new Date(b.data_entrega));
        });

        // Ordenar concluídas por data mais recente
        classificadas.concluidas.sort((a, b) => new Date(b.data_entrega) - new Date(a.data_entrega));

        return classificadas;
    }

    // Card mini para atividades no overview
    createAtividadeMiniCard(atividade) {
        const dataEntrega = new Date(atividade.data_entrega);
        const hoje = new Date();
        const diasRestantes = Math.ceil((dataEntrega - hoje) / (1000 * 60 * 60 * 24));

        let statusClass = 'normal';
        let statusText = `${diasRestantes}d`;

        if (diasRestantes < 0) {
            statusClass = 'atrasada';
            statusText = 'Atrasada';
        } else if (diasRestantes === 0) {
            statusClass = 'urgente';
            statusText = 'Hoje';
        } else if (diasRestantes <= 3) {
            statusClass = 'proxima';
            statusText = `${diasRestantes}d`;
        }

        return `
        <div class="atividade-mini-card ${statusClass}" onclick="alunoManager.viewAtividadeDetails(${atividade.id})">
            <div class="mini-card-header">
                <h5>${atividade.titulo}</h5>
                <span class="mini-status ${statusClass}">${statusText}</span>
            </div>
            <div class="mini-card-content">
                <span class="mini-materia">${atividade.materia_nome}</span>
                <span class="mini-data">${dataEntrega.toLocaleDateString('pt-BR')}</span>
            </div>
            <div class="mini-card-value">
                <i class="fas fa-star"></i>
                <span>${atividade.valor} pts</span>
            </div>
        </div>
    `;
    }

    // Card para atividades concluídas
    createAtividadeConcluidaCard(atividade) {
        const dataEntrega = new Date(atividade.data_entrega);

        return `
        <div class="atividade-mini-card concluida" onclick="alunoManager.viewAtividadeDetails(${atividade.id})">
            <div class="mini-card-header">
                <h5>${atividade.titulo}</h5>
                <span class="mini-status concluida">
                    <i class="fas fa-check"></i>
                </span>
            </div>
            <div class="mini-card-content">
                <span class="mini-materia">${atividade.materia_nome}</span>
                <span class="mini-data">Entregue em ${dataEntrega.toLocaleDateString('pt-BR')}</span>
            </div>
        </div>
    `;
    }

    // Card para prazos
    createPrazoCard(atividade) {
        const dataEntrega = new Date(atividade.data_entrega);
        const hoje = new Date();
        const diasRestantes = Math.ceil((dataEntrega - hoje) / (1000 * 60 * 60 * 24));

        let statusClass = 'normal';
        let statusIcon = 'fa-clock';
        let statusText = `${diasRestantes} dias`;

        if (diasRestantes < 0) {
            statusClass = 'atrasada';
            statusIcon = 'fa-exclamation-circle';
            statusText = 'Atrasada';
        } else if (diasRestantes === 0) {
            statusClass = 'urgente';
            statusIcon = 'fa-exclamation-triangle';
            statusText = 'Hoje';
        } else if (diasRestantes <= 3) {
            statusClass = 'proxima';
            statusIcon = 'fa-hourglass-half';
            statusText = `${diasRestantes} dias`;
        }

        return `
        <div class="prazo-card ${statusClass}" onclick="alunoManager.viewAtividadeDetails(${atividade.id})">
            <div class="prazo-icon">
                <i class="fas ${statusIcon}"></i>
            </div>
            <div class="prazo-content">
                <h5>${atividade.titulo}</h5>
                <p>${atividade.materia_nome}</p>
                <small>${dataEntrega.toLocaleDateString('pt-BR')} • ${atividade.valor} pontos</small>
            </div>
            <div class="prazo-status ${statusClass}">
                ${statusText}
            </div>
        </div>
    `;
    }

    // =============================================
    // MINHAS NOTAS
    // =============================================
    async loadMinhasNotas() {
        try {
            const data = await this.fetchMinhasNotas();

            const aproveitamento = this.calculateAproveitamento(data.notas || []);
            const mediaGeral = data.media_geral || 0;

            return `
                <div class="section">
                    <div class="section-header">
                        <h2>Minhas Notas e Desempenho</h2>
                        <div class="header-stats">
                            <div class="stat-badge">
                                <span class="stat-value">${mediaGeral.toFixed(1)}</span>
                                <span class="stat-label">Média Geral</span>
                            </div>
                            <div class="stat-badge">
                                <span class="stat-value">${aproveitamento}%</span>
                                <span class="stat-label">Aproveitamento</span>
                            </div>
                        </div>
                    </div>

                    <!-- CARDS DE ESTATÍSTICAS -->
                    <div class="stats-cards">
                        <div class="stat-card">
                            <div class="stat-icon primary">
                                <i class="fas fa-clipboard-check"></i>
                            </div>
                            <div class="stat-content">
                                <h3>${data.notas ? data.notas.length : 0}</h3>
                                <p>Atividades Avaliadas</p>
                            </div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-icon success">
                                <i class="fas fa-check-circle"></i>
                            </div>
                            <div class="stat-content">
                                <h3>${this.countAprovadas(data.notas || [])}</h3>
                                <p>Aprovações</p>
                            </div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-icon warning">
                                <i class="fas fa-exclamation-circle"></i>
                            </div>
                            <div class="stat-content">
                                <h3>${this.countRecuperacao(data.notas || [])}</h3>
                                <p>Em Recuperação</p>
                            </div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-icon danger">
                                <i class="fas fa-times-circle"></i>
                            </div>
                            <div class="stat-content">
                                <h3>${this.countReprovadas(data.notas || [])}</h3>
                                <p>Reprovações</p>
                            </div>
                        </div>
                    </div>

                    <!-- DESEMPENHO POR MATÉRIA -->
                    <div class="section">
                        <h3>Desempenho por Matéria</h3>
                        <div class="materias-performance">
                            ${this.generateMateriasChart(data.notas || [])}
                        </div>
                    </div>

                    <!-- HISTÓRICO DE AVALIAÇÕES -->
                    <div class="section">
                        <div class="section-header">
                            <h3>Histórico de Avaliações</h3>
                            <div class="filters">
                                <select id="filter-materia" onchange="alunoManager.filtrarNotas()">
                                    <option value="">Todas as Matérias</option>
                                    ${this.getMateriasFromNotas(data.notas || [])
                    .map(materia => `<option value="${materia}">${materia}</option>`)
                    .join('')}
                                </select>
                                <select id="filter-periodo" onchange="alunoManager.filtrarNotas()">
                                    <option value="">Todos os Períodos</option>
                                    <option value="ultimo-mes">Último Mês</option>
                                    <option value="ultimo-bimestre">Último Bimestre</option>
                                    <option value="este-ano">Este Ano</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="table-responsive">
                            <table id="tabela-notas">
                                <thead>
                                    <tr>
                                        <th>Atividade</th>
                                        <th>Matéria</th>
                                        <th>Nota</th>
                                        <th>Valor</th>
                                        <th>Status</th>
                                        <th>Feedback</th>
                                        <th>Data</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${data.notas && data.notas.length > 0 ?
                    data.notas.map(nota => this.createNotaRow(nota)).join('')
                    : `
                                        <tr>
                                            <td colspan="7" class="text-center">
                                                <div class="empty-state-aluno">
                                                    <i class="fas fa-clipboard-list fa-2x"></i>
                                                    <p>Nenhuma avaliação encontrada</p>
                                                </div>
                                            </td>
                                        </tr>
                                    `}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Erro ao carregar notas:', error);
            return this.getErrorState('Erro ao carregar notas', error.message);
        }
    }

    // =============================================
    // ATIVIDADES DO ALUNO
    // =============================================
    async loadAtividadesAluno() {
        try {
            const data = await this.fetchAtividadesPendentes();
            this.atividadesPendentes = data.atividades || [];

            const atividadesPendentes = this.atividadesPendentes.filter(a => !a.entregue);
            const atividadesEntregues = this.atividadesPendentes.filter(a => a.entregue);

            return `
                <div class="section">
                    <div class="section-header">
                        <h2>Gestão de Atividades</h2>
                        <div class="header-stats">
                            <div class="stat-badge warning">
                                <span class="stat-value">${atividadesPendentes.length}</span>
                                <span class="stat-label">Pendentes</span>
                            </div>
                            <div class="stat-badge success">
                                <span class="stat-value">${atividadesEntregues.length}</span>
                                <span class="stat-label">Entregues</span>
                            </div>
                        </div>
                    </div>

                    <!-- FILTROS E BUSCA -->
                    <div class="filters-bar">
                        <div class="search-container">
                            <input type="text" id="search-input" placeholder="Pesquisar atividades..." 
                                   onkeyup="alunoManager.filtrarAtividades()">
                            <i class="fas fa-search"></i>
                        </div>
                        <div class="filter-buttons">
                            <button class="btn btn-outline active" onclick="alunoManager.filtrarPorStatus('todas')">
                                Todas (${this.atividadesPendentes.length})
                            </button>
                            <button class="btn btn-outline" onclick="alunoManager.filtrarPorStatus('pendentes')">
                                Pendentes (${atividadesPendentes.length})
                            </button>
                            <button class="btn btn-outline" onclick="alunoManager.filtrarPorStatus('entregues')">
                                Entregues (${atividadesEntregues.length})
                            </button>
                        </div>
                    </div>

                    <!-- LISTA DE ATIVIDADES -->
                    <div class="atividades-container" id="atividades-list">
                        ${this.atividadesPendentes.length > 0 ?
                    this.atividadesPendentes.map(atividade => this.createAtividadeCard(atividade)).join('')
                    : `
                            <div class="empty-state-aluno">
                                <i class="fas fa-tasks fa-3x"></i>
                                <h3>Nenhuma atividade encontrada</h3>
                                <p>Suas atividades aparecerão aqui quando forem atribuídas.</p>
                            </div>
                        `}
                    </div>

                    
                </div>
            `;
        } catch (error) {
            console.error('Erro ao carregar atividades:', error);
            return this.getErrorState('Erro ao carregar atividades', error.message);
        }
    }

    // =============================================
    // CALENDÁRIO DO ALUNO
    // =============================================
    async loadCalendarioAluno() {
        try {
            const [calendarioData, atividadesData] = await Promise.all([
                this.fetchCalendarioAulas(),
                this.fetchAtividadesPendentes()
            ]);

            return `
                <div class="section">
                    <div class="section-header">
                        <h2>Calendário Acadêmico</h2>
                        <div class="view-options">
                            <button class="btn btn-outline active" onclick="alunoManager.mudarVistaCalendario('semana')">
                                <i class="fas fa-calendar-week"></i> Semana
                            </button>
                            <button class="btn btn-outline" onclick="alunoManager.mudarVistaCalendario('mes')">
                                <i class="fas fa-calendar-alt"></i> Mês
                            </button>
                        </div>
                    </div>

                    <!-- LEGENDA -->
                    <div class="calendario-legend">
                        <div class="legend-item">
                            <span class="legend-color aula"></span>
                            <span>Aulas</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-color atividade"></span>
                            <span>Atividades</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-color avaliacao"></span>
                            <span>Avaliações</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-color hoje"></span>
                            <span>Hoje</span>
                        </div>
                    </div>

                    <!-- VISTA SEMANAL -->
                    <div class="calendario-semanal" id="calendario-semanal">
                        ${this.generateCalendarioSemanal(calendarioData.dias_aula || [], atividadesData.atividades || [])}
                    </div>

                    <!-- VISTA MENSAL (OCULTA INICIALMENTE) -->
                    <div class="calendario-mensal" id="calendario-mensal" style="display: none;">
                        ${this.generateCalendarioMensal(calendarioData.dias_aula || [], atividadesData.atividades || [])}
                    </div>

                    <!-- LISTA DE EVENTOS PRÓXIMOS -->
                    <div class="section">
                        <div class="section-header">
                            <h3>Próximos Eventos</h3>
                        </div>
                        <div class="proximos-eventos">
                            ${this.generateProximosEventos(calendarioData.dias_aula || [], atividadesData.atividades || [])}
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Erro ao carregar calendário:', error);
            return this.getErrorState('Erro ao carregar calendário', error.message);
        }
    }

    // =============================================
    // FUNÇÕES DE FETCH DE DADOS
    // =============================================
    async fetchMinhasNotas() {
        const response = await fetch(`${API_BASE}/aluno/minhas-notas`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar notas');
        }

        return await response.json();
    }

    async fetchAtividadesPendentes() {
        const response = await fetch(`${API_BASE}/aluno/atividades-pendentes`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar atividades');
        }

        return await response.json();
    }

    async fetchCalendarioAulas() {
        const response = await fetch(`${API_BASE}/aluno/calendario-aulas`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar calendário');
        }

        return await response.json();
    }

    // =============================================
    // FUNÇÕES AUXILIARES
    // =============================================
    calculateAproveitamento(notas) {
        if (notas.length === 0) return 0;

        const totalPossivel = notas.reduce((sum, nota) => sum + parseFloat(nota.valor_atividade || 10), 0);
        const totalObtido = notas.reduce((sum, nota) => sum + parseFloat(nota.nota || 0), 0);

        return totalPossivel > 0 ? ((totalObtido / totalPossivel) * 100).toFixed(1) : 0;
    }

    countAprovadas(notas) {
        return notas.filter(nota => parseFloat(nota.nota) >= 6).length;
    }

    countRecuperacao(notas) {
        return notas.filter(nota => parseFloat(nota.nota) >= 4 && parseFloat(nota.nota) < 6).length;
    }

    countReprovadas(notas) {
        return notas.filter(nota => parseFloat(nota.nota) < 4).length;
    }

    getMateriasFromNotas(notas) {
        const materias = [...new Set(notas.map(nota => nota.materia_nome))];
        return materias.filter(materia => materia);
    }

    getNotaBadgeClass(nota) {
        const notaNum = parseFloat(nota);
        if (notaNum >= 8) return 'badge-success';
        if (notaNum >= 6) return 'badge-warning';
        if (notaNum >= 4) return 'badge-info';
        return 'badge-danger';
    }

    getStatusNota(nota, valor) {
        const notaNum = parseFloat(nota);
        const percentual = (notaNum / parseFloat(valor)) * 100;

        if (percentual >= 80) return 'Excelente';
        if (percentual >= 60) return 'Bom';
        if (percentual >= 40) return 'Regular';
        return 'Insuficiente';
    }

    // =============================================
    // COMPONENTES VISUAIS
    // =============================================
    createAtividadePendenteCard(atividade) {
        const dataEntrega = new Date(atividade.data_entrega);
        const hoje = new Date();
        const diasRestantes = Math.ceil((dataEntrega - hoje) / (1000 * 60 * 60 * 24));

        let statusClass = 'warning';
        let statusText = `${diasRestantes} dias`;

        if (diasRestantes < 0) {
            statusClass = 'danger';
            statusText = 'Atrasada';
        } else if (diasRestantes === 0) {
            statusClass = 'danger';
            statusText = 'Hoje';
        } else if (diasRestantes <= 3) {
            statusClass = 'warning';
            statusText = `${diasRestantes} dias`;
        } else {
            statusClass = 'info';
            statusText = `${diasRestantes} dias`;
        }

        return `
            <div class="atividade-pendente-card">
                <div class="atividade-header">
                    <h4>${atividade.titulo}</h4>
                    <span class="badge badge-${statusClass}">${statusText}</span>
                </div>
                <div class="atividade-info">
                    <span><i class="fas fa-book"></i> ${atividade.materia_nome}</span>
                    <span><i class="fas fa-calendar"></i> ${dataEntrega.toLocaleDateString('pt-BR')}</span>
                    <span><i class="fas fa-star"></i> ${atividade.valor} pontos</span>
                </div>
                <div class="atividade-actions">
                    <button class="btn btn-primary btn-sm" onclick="alunoManager.viewAtividadeDetails(${atividade.id})">
                        <i class="fas fa-eye"></i> Detalhes
                    </button>
                    ${!atividade.entregue ? `
                        <button class="btn btn-success btn-sm" onclick="alunoManager.entregarAtividade(${atividade.id})">
                            <i class="fas fa-paper-plane"></i> Entregar
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    createAvaliacaoCard(nota) {
        return `
            <div class="avaliacao-card">
                <div class="avaliacao-header">
                    <h5>${nota.atividade_titulo}</h5>
                    <span class="nota-badge ${this.getNotaBadgeClass(nota.nota)}">
                        ${nota.nota}/${nota.valor_atividade}
                    </span>
                </div>
                <div class="avaliacao-info">
                    <span><i class="fas fa-book"></i> ${nota.materia_nome}</span>
                    <span><i class="fas fa-calendar"></i> ${new Date(nota.data_avaliacao).toLocaleDateString('pt-BR')}</span>
                </div>
                ${nota.feedback ? `
                    <div class="avaliacao-feedback">
                        <strong>Feedback:</strong> ${nota.feedback}
                    </div>
                ` : ''}
            </div>
        `;
    }

    createProximaAulaCard(aula) {
        const dataAula = new Date(aula.data);
        return `
            <div class="aula-card">
                <div class="aula-time">
                    <div class="aula-dia">${dataAula.toLocaleDateString('pt-BR', { weekday: 'short' })}</div>
                    <div class="aula-data">${dataAula.getDate()}</div>
                </div>
                <div class="aula-info">
                    <h5>${aula.materia}</h5>
                    <p>${aula.horario} • ${aula.sala}</p>
                    <small>Prof. ${aula.professor}</small>
                </div>
            </div>
        `;
    }

    createNotaRow(nota) {
        return `
            <tr>
                <td>
                    <strong>${nota.atividade_titulo}</strong>
                </td>
                <td>${nota.materia_nome}</td>
                <td>
                    <span class="nota-badge ${this.getNotaBadgeClass(nota.nota)}">
                        ${nota.nota}
                    </span>
                </td>
                <td>${nota.valor_atividade}</td>
                <td>
                    <span class="status-badge ${this.getNotaBadgeClass(nota.nota)}">
                        ${this.getStatusNota(nota.nota, nota.valor_atividade)}
                    </span>
                </td>
                <td>
                    ${nota.feedback ? `
                        <button class="btn btn-info btn-sm" onclick="alunoManager.showFeedback(${nota.id}, '${nota.feedback.replace(/'/g, "\\'")}')">
                            <i class="fas fa-comment"></i> Ver
                        </button>
                    ` : '<span class="text-muted">Sem feedback</span>'}
                </td>
                <td>${new Date(nota.data_avaliacao).toLocaleDateString('pt-BR')}</td>
            </tr>
        `;
    }

    createAtividadeCard(atividade) {
        const dataEntrega = new Date(atividade.data_entrega);
        const hoje = new Date();
        const diasRestantes = Math.ceil((dataEntrega - hoje) / (1000 * 60 * 60 * 24));

        let statusClass = 'secondary';
        let statusText = 'Entregue';
        let actions = '';

        if (!atividade.entregue) {
            if (diasRestantes < 0) {
                statusClass = 'danger';
                statusText = 'Atrasada';
            } else if (diasRestantes === 0) {
                statusClass = 'danger';
                statusText = 'Entrega Hoje';
            } else if (diasRestantes <= 3) {
                statusClass = 'warning';
                statusText = `${diasRestantes} dias`;
            } else {
                statusClass = 'info';
                statusText = `${diasRestantes} dias`;
            }

            actions = `
                <button class="btn btn-success btn-sm" onclick="alunoManager.entregarAtividade(${atividade.id})">
                    <i class="fas fa-paper-plane"></i> Entregar
                </button>
            `;
        }

        return `
            <div class="atividade-card ${atividade.entregue ? 'entregue' : ''}" data-status="${atividade.entregue ? 'entregue' : 'pendente'}">
                <div class="atividade-header">
                    <div class="atividade-title">
                        <h4>${atividade.titulo}</h4>
                        <span class="badge badge-${statusClass}">${statusText}</span>
                    </div>
                    <div class="atividade-value">
                        <span class="valor">${atividade.valor} pts</span>
                    </div>
                </div>
                
                <div class="atividade-body">
                    <div class="atividade-meta">
                        <div class="meta-item">
                            <i class="fas fa-book"></i>
                            <span>${atividade.materia_nome}</span>
                        </div>
                        <div class="meta-item">
                            <i class="fas fa-calendar"></i>
                            <span>${dataEntrega.toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div class="meta-item">
                            <i class="fas fa-clock"></i>
                            <span>${dataEntrega.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>
                    
                    ${atividade.descricao ? `
                        <div class="atividade-descricao">
                            <p>${atividade.descricao}</p>
                        </div>
                    ` : ''}
                </div>
                
                <div class="atividade-footer">
                    <button class="btn btn-primary btn-sm" onclick="alunoManager.viewAtividadeDetails(${atividade.id})">
                        <i class="fas fa-info-circle"></i> Detalhes
                    </button>
                    ${actions}
                </div>
            </div>
        `;
    }

    // =============================================
    // GERADORES DE GRÁFICOS E CALENDÁRIOS
    // =============================================
    generateMateriasChart(notas) {
        const materias = {};

        notas.forEach(nota => {
            if (!materias[nota.materia_nome]) {
                materias[nota.materia_nome] = {
                    notas: [],
                    soma: 0,
                    count: 0
                };
            }
            materias[nota.materia_nome].notas.push(parseFloat(nota.nota));
            materias[nota.materia_nome].soma += parseFloat(nota.nota);
            materias[nota.materia_nome].count++;
        });

        let chartHTML = '<div class="materias-chart">';

        Object.keys(materias).forEach(materia => {
            const media = materias[materia].soma / materias[materia].count;
            const progresso = (media / 10) * 100;
            const notaClass = this.getNotaBadgeClass(media);

            chartHTML += `
                <div class="materia-chart-item">
                    <div class="materia-header">
                        <span class="materia-name">${materia}</span>
                        <span class="materia-media ${notaClass}">${media.toFixed(1)}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill ${notaClass}" style="width: ${progresso}%"></div>
                    </div>
                    <div class="materia-stats">
                        <small>${materias[materia].count} avaliações</small>
                        <small>${progresso.toFixed(0)}%</small>
                    </div>
                </div>
            `;
        });

        chartHTML += '</div>';
        return chartHTML;
    }

    generateCalendarioEntregas(atividades) {
        const hoje = new Date();
        const proximosDias = [];

        // Gerar array com os próximos 7 dias
        for (let i = 0; i < 7; i++) {
            const data = new Date();
            data.setDate(hoje.getDate() + i);
            proximosDias.push(data.toISOString().split('T')[0]);
        }

        let calendarioHTML = '<div class="calendario-grid">';

        proximosDias.forEach(dia => {
            const atividadesDia = atividades.filter(a => a.data_entrega === dia && !a.entregue);
            const dataObj = new Date(dia);
            const isHoje = dia === hoje.toISOString().split('T')[0];

            calendarioHTML += `
                <div class="calendario-dia ${isHoje ? 'hoje' : ''} ${atividadesDia.length > 0 ? 'com-atividade' : ''}">
                    <div class="dia-header">
                        <strong>${dataObj.toLocaleDateString('pt-BR', { weekday: 'short' })}</strong>
                        <span class="dia-numero">${dataObj.getDate()}</span>
                    </div>
                    <div class="dia-atividades">
                        ${atividadesDia.map(atividade => `
                            <div class="atividade-calendario" onclick="alunoManager.viewAtividadeDetails(${atividade.id})">
                                <i class="fas fa-tasks"></i>
                                <span class="atividade-titulo">${atividade.titulo}</span>
                                <span class="atividade-materia">${atividade.materia_nome}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });

        calendarioHTML += '</div>';
        return calendarioHTML;
    }

    generateCalendarioSemanal(aulas, atividades) {
        const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const hoje = new Date();
        const inicioSemana = new Date(hoje);
        inicioSemana.setDate(hoje.getDate() - hoje.getDay());

        let calendarioHTML = '<div class="semana-header">';

        // Cabeçalho dos dias
        for (let i = 0; i < 7; i++) {
            const data = new Date(inicioSemana);
            data.setDate(inicioSemana.getDate() + i);
            const isHoje = data.toDateString() === hoje.toDateString();

            calendarioHTML += `
                <div class="dia-header ${isHoje ? 'hoje' : ''}">
                    <div class="dia-nome">${diasSemana[i]}</div>
                    <div class="dia-numero">${data.getDate()}</div>
                </div>
            `;
        }

        calendarioHTML += '</div><div class="semana-body">';

        // Corpo da semana (horários)
        const horarios = ['08:00', '10:00', '14:00', '16:00', '19:00'];

        horarios.forEach(horario => {
            calendarioHTML += `<div class="semana-linha">`;

            for (let i = 0; i < 7; i++) {
                const data = new Date(inicioSemana);
                data.setDate(inicioSemana.getDate() + i);
                const dataStr = data.toISOString().split('T')[0];

                const aulasDia = aulas.filter(a => a.data === dataStr && a.horario.includes(horario));
                const atividadesDia = atividades.filter(a => a.data_entrega === dataStr && !a.entregue);

                calendarioHTML += `
                    <div class="semana-celula">
                        ${aulasDia.map(aula => `
                            <div class="evento aula" title="${aula.materia} - ${aula.professor}">
                                <i class="fas fa-chalkboard-teacher"></i>
                                <span>${aula.materia}</span>
                            </div>
                        `).join('')}
                        ${atividadesDia.map(atividade => `
                            <div class="evento atividade" onclick="alunoManager.viewAtividadeDetails(${atividade.id})" 
                                 title="${atividade.titulo} - ${atividade.materia_nome}">
                                <i class="fas fa-tasks"></i>
                                <span>${atividade.titulo}</span>
                            </div>
                        `).join('')}
                    </div>
                `;
            }

            calendarioHTML += `</div>`;
        });

        calendarioHTML += '</div>';
        return calendarioHTML;
    }

    generateCalendarioMensal(aulas, atividades) {
        const hoje = new Date();
        const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

        let calendarioHTML = `
            <div class="mes-header">
                <h4>${hoje.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h4>
            </div>
            <div class="mes-dias">
        `;

        // Dias da semana
        const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        diasSemana.forEach(dia => {
            calendarioHTML += `<div class="dia-semana">${dia}</div>`;
        });

        // Espaços vazios antes do primeiro dia
        for (let i = 0; i < primeiroDia.getDay(); i++) {
            calendarioHTML += `<div class="dia-vazio"></div>`;
        }

        // Dias do mês
        for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
            const data = new Date(hoje.getFullYear(), hoje.getMonth(), dia);
            const dataStr = data.toISOString().split('T')[0];
            const isHoje = data.toDateString() === hoje.toDateString();

            const aulasDia = aulas.filter(a => a.data === dataStr);
            const atividadesDia = atividades.filter(a => a.data_entrega === dataStr && !a.entregue);

            calendarioHTML += `
                <div class="dia-mes ${isHoje ? 'hoje' : ''} ${aulasDia.length > 0 || atividadesDia.length > 0 ? 'com-eventos' : ''}">
                    <div class="dia-numero">${dia}</div>
                    <div class="dia-eventos">
                        ${aulasDia.slice(0, 2).map(aula => `
                            <div class="evento-mini aula" title="${aula.materia}"></div>
                        `).join('')}
                        ${atividadesDia.slice(0, 2).map(() => `
                            <div class="evento-mini atividade" title="Atividade"></div>
                        `).join('')}
                        ${(aulasDia.length + atividadesDia.length) > 4 ?
                    `<div class="evento-mini mais">+${(aulasDia.length + atividadesDia.length) - 4}</div>` : ''}
                    </div>
                </div>
            `;
        }

        calendarioHTML += '</div>';
        return calendarioHTML;
    }

    generateProximosEventos(aulas, atividades) {
        const hoje = new Date();
        const eventos = [];

        // Adicionar aulas
        aulas.forEach(aula => {
            const dataAula = new Date(aula.data);
            if (dataAula >= hoje) {
                eventos.push({
                    tipo: 'aula',
                    data: dataAula,
                    titulo: aula.materia,
                    descricao: `${aula.horario} • ${aula.sala}`,
                    cor: 'primary'
                });
            }
        });

        // Adicionar atividades pendentes
        atividades.filter(a => !a.entregue).forEach(atividade => {
            const dataEntrega = new Date(atividade.data_entrega);
            eventos.push({
                tipo: 'atividade',
                data: dataEntrega,
                titulo: atividade.titulo,
                descricao: atividade.materia_nome,
                cor: 'warning',
                atividadeId: atividade.id
            });
        });

        // Ordenar por data
        eventos.sort((a, b) => a.data - b.data);

        // Pegar próximos 10 eventos
        const proximosEventos = eventos.slice(0, 10);

        if (proximosEventos.length === 0) {
            return `
                <div class="empty-state-aluno">
                    <i class="fas fa-calendar fa-2x"></i>
                    <p>Nenhum evento próximo</p>
                </div>
            `;
        }

        return proximosEventos.map(evento => `
            <div class="evento-proximo ${evento.tipo}">
                <div class="evento-data">
                    <div class="evento-dia">${evento.data.toLocaleDateString('pt-BR', { weekday: 'short' })}</div>
                    <div class="evento-numero">${evento.data.getDate()}</div>
                </div>
                <div class="evento-info">
                    <h5>${evento.titulo}</h5>
                    <p>${evento.descricao}</p>
                    <small>${evento.data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</small>
                </div>
                <div class="evento-actions">
                    ${evento.atividadeId ? `
                        <button class="btn btn-sm btn-outline" onclick="alunoManager.viewAtividadeDetails(${evento.atividadeId})">
                            <i class="fas fa-eye"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    // =============================================
    // FUNÇÕES DE INTERAÇÃO
    // =============================================
    filtrarNotas() {
        const materiaFilter = document.getElementById('filter-materia').value;
        const periodoFilter = document.getElementById('filter-periodo').value;
        const linhas = document.querySelectorAll('#tabela-notas tbody tr');

        linhas.forEach(linha => {
            let show = true;

            // Filtro por matéria
            if (materiaFilter) {
                const materia = linha.cells[1].textContent;
                if (materia !== materiaFilter) {
                    show = false;
                }
            }

            // Filtro por período (implementação básica)
            if (periodoFilter && show) {
                const dataTexto = linha.cells[6].textContent;
                // Aqui você implementaria a lógica de filtro por período
            }

            linha.style.display = show ? '' : 'none';
        });
    }

    // =============================================
    // FUNÇÕES DE FILTRO CORRIGIDAS
    // =============================================
    filtrarAtividades() {
        try {
            const searchTerm = document.getElementById('search-input').value.toLowerCase().trim();
            const atividades = document.querySelectorAll('.atividade-card');
            let resultadosEncontrados = 0;

            atividades.forEach(atividade => {
                // Buscar em campos específicos para melhor precisão
                const titulo = atividade.querySelector('.atividade-title h4')?.textContent.toLowerCase() || '';
                const materia = atividade.querySelector('.meta-item:nth-child(1) span')?.textContent.toLowerCase() || '';
                const descricao = atividade.querySelector('.atividade-descricao p')?.textContent.toLowerCase() || '';

                const matches = titulo.includes(searchTerm) ||
                    materia.includes(searchTerm) ||
                    descricao.includes(searchTerm);

                if (matches) {
                    atividade.style.display = 'block';
                    resultadosEncontrados++;
                } else {
                    atividade.style.display = 'none';
                }
            });

            this.mostrarResultadosBusca(resultadosEncontrados, searchTerm);

        } catch (error) {
            console.error('Erro ao filtrar atividades:', error);
        }
    }

    filtrarPorStatus(status) {
        try {
            const atividades = document.querySelectorAll('.atividade-card');
            const botoes = document.querySelectorAll('.filter-buttons .btn');

            // Atualizar botões ativos
            botoes.forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');

            let resultadosEncontrados = 0;

            atividades.forEach(atividade => {
                const cardStatus = atividade.getAttribute('data-status');
                let show = false;

                switch (status) {
                    case 'todas':
                        show = true;
                        break;
                    case 'pendentes':
                        show = cardStatus === 'pendente';
                        break;
                    case 'entregues':
                        show = cardStatus === 'entregue';
                        break;
                }

                if (show) {
                    atividade.style.display = 'block';
                    resultadosEncontrados++;
                } else {
                    atividade.style.display = 'none';
                }
            });

            this.mostrarResultadosBusca(resultadosEncontrados, status);

        } catch (error) {
            console.error('Erro ao filtrar por status:', error);
        }
    }

    mostrarResultadosBusca(resultadosEncontrados, termo) {
        const container = document.getElementById('atividades-list');
        if (!container) return;

        // Remove mensagem anterior se existir
        const mensagemAnterior = container.querySelector('.no-results-message');
        if (mensagemAnterior) {
            mensagemAnterior.remove();
        }

        // Se não encontrou resultados E há termo de busca, mostra mensagem
        if (resultadosEncontrados === 0 && termo !== '') {
            const noResults = document.createElement('div');
            noResults.className = 'no-results-message';
            noResults.innerHTML = `
            <div class="empty-state-aluno">
                <i class="fas fa-search fa-2x"></i>
                <h3>Nenhuma atividade encontrada</h3>
                <p>Não encontramos resultados para "${termo}"</p>
                <button class="btn btn-outline" onclick="alunoManager.limparBusca()">
                    <i class="fas fa-times"></i> Limpar busca
                </button>
            </div>
        `;
            container.appendChild(noResults);
        }
    }

    limparBusca() {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.value = '';
        }

        // Reaplicar filtro atual (mostrar todas)
        const botaoAtual = document.querySelector('.filter-buttons .btn.active');
        if (botaoAtual) {
            const status = botaoAtual.textContent.includes('Pendentes') ? 'pendentes' :
                botaoAtual.textContent.includes('Entregues') ? 'entregues' : 'todas';
            this.filtrarPorStatus(status);
        }
    }

    mudarVistaCalendario(vista) {
        const semanal = document.getElementById('calendario-semanal');
        const mensal = document.getElementById('calendario-mensal');
        const botoes = document.querySelectorAll('.view-options .btn');

        // Atualizar botões ativos
        botoes.forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');

        if (vista === 'semana') {
            semanal.style.display = 'block';
            mensal.style.display = 'none';
        } else {
            semanal.style.display = 'none';
            mensal.style.display = 'block';
        }
    }

    // =============================================
    // MODAIS E DETALHES
    // =============================================
    async viewAtividadeDetails(atividadeId) {
        try {
            // Buscar detalhes da atividade
            const atividades = await this.fetchAtividadesPendentes();
            const atividade = atividades.atividades.find(a => a.id === atividadeId);

            if (!atividade) {
                throw new Error('Atividade não encontrada');
            }

            const dataEntrega = new Date(atividade.data_entrega);
            const hoje = new Date();
            const diasRestantes = Math.ceil((dataEntrega - hoje) / (1000 * 60 * 60 * 24));

            let statusClass = 'success';
            let statusText = 'Entregue';

            if (!atividade.entregue) {
                if (diasRestantes < 0) {
                    statusClass = 'danger';
                    statusText = 'Atrasada';
                } else if (diasRestantes === 0) {
                    statusClass = 'danger';
                    statusText = 'Entrega Hoje';
                } else if (diasRestantes <= 3) {
                    statusClass = 'warning';
                    statusText = `${diasRestantes} dias restantes`;
                } else {
                    statusClass = 'info';
                    statusText = `${diasRestantes} dias restantes`;
                }
            }

            const modalContent = `
                <div class="modal-header">
                    <h3>Detalhes da Atividade</h3>
                    <button class="modal-close" onclick="closeModal('detalhes-atividade-modal')">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="atividade-detalhes">
                        <div class="detalhes-header">
                            <h4>${atividade.titulo}</h4>
                            <span class="badge badge-${statusClass}">${statusText}</span>
                        </div>
                        
                        <div class="detalhes-grid">
                            <div class="detalhe-item">
                                <label>Matéria:</label>
                                <span>${atividade.materia_nome}</span>
                            </div>
                            <div class="detalhe-item">
                                <label>Data de Entrega:</label>
                                <span>${dataEntrega.toLocaleDateString('pt-BR')} às ${dataEntrega.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div class="detalhe-item">
                                <label>Valor:</label>
                                <span>${atividade.valor} pontos</span>
                            </div>
                            <div class="detalhe-item">
                                <label>Status:</label>
                                <span>${atividade.entregue ? 'Entregue' : 'Pendente'}</span>
                            </div>
                        </div>
                        
                        ${atividade.descricao ? `
                            <div class="detalhe-descricao">
                                <label>Descrição:</label>
                                <p>${atividade.descricao}</p>
                            </div>
                        ` : ''}
                        
                        ${!atividade.entregue ? `
                            <div class="detalhe-entrega">
                                <label>Enviar Trabalho:</label>
                                <div class="upload-area">
                                    <input type="file" id="arquivo-atividade" accept=".pdf,.doc,.docx,.txt">
                                    <label for="arquivo-atividade" class="upload-label">
                                        <i class="fas fa-cloud-upload-alt"></i>
                                        <span>Clique para selecionar o arquivo</span>
                                    </label>
                                </div>
                                <small>Formatos aceitos: PDF, DOC, DOCX, TXT (Máx. 10MB)</small>
                            </div>
                        ` : ''}
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closeModal('detalhes-atividade-modal')">
                        Fechar
                    </button>
                    ${!atividade.entregue ? `
                        <button type="button" class="btn btn-primary" onclick="alunoManager.entregarAtividade(${atividade.id})">
                            <i class="fas fa-paper-plane"></i> Entregar Atividade
                        </button>
                    ` : ''}
                </div>
            `;

            this.showCustomModal('detalhes-atividade-modal', modalContent);

        } catch (error) {
            console.error('Erro ao carregar detalhes:', error);
            showNotification('Erro ao carregar detalhes da atividade: ' + error.message, 'error');
        }
    }

    async entregarAtividade(atividadeId) {
        try {
            const arquivoInput = document.getElementById('arquivo-atividade');

            // Em um sistema real, aqui você faria o upload do arquivo
            // Por enquanto, apenas chamamos a API para marcar como entregue

            showNotification('Enviando atividade...', 'info');

            const response = await fetch(`${API_BASE}/aluno/entregar-atividade/${atividadeId}`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    // Dados do arquivo seriam enviados aqui
                    arquivo_nome: arquivoInput?.files[0]?.name || 'trabalho_entregue.pdf',
                    data_entrega: new Date().toISOString()
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao entregar atividade');
            }

            const result = await response.json();

            showNotification('Atividade entregue com sucesso! Aguarde a correção.', 'success');
            closeModal('detalhes-atividade-modal');

            // Recarregar a seção de atividades
            showSection('atividades-aluno');

        } catch (error) {
            console.error('Erro ao entregar atividade:', error);
            showNotification('Erro ao entregar atividade: ' + error.message, 'error');
        }
    }

    showFeedback(notaId, feedback) {
        const modalContent = `
            <div class="modal-header">
                <h3>Feedback do Professor</h3>
                <button class="modal-close" onclick="closeModal('feedback-modal')">&times;</button>
            </div>
            <div class="modal-body">
                <div class="feedback-content">
                    <div class="feedback-text">
                        <p>${feedback}</p>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-primary" onclick="closeModal('feedback-modal')">
                    Fechar
                </button>
            </div>
        `;

        this.showCustomModal('feedback-modal', modalContent);
    }

    // =============================================
    // FUNÇÕES AUXILIARES
    // =============================================
    showCustomModal(modalId, content) {
        let modal = document.getElementById(modalId);
        if (!modal) {
            modal = document.createElement('div');
            modal.id = modalId;
            modal.className = 'modal';
            document.body.appendChild(modal);
        }
        modal.innerHTML = `<div class="modal-content">${content}</div>`;
        modal.style.display = 'flex';
    }

    getErrorState(title, message) {
        return `
            <div class="section">
                <h3>${title}</h3>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="showSection('dashboard')">
                    <i class="fas fa-home"></i> Voltar ao Dashboard
                </button>
            </div>
        `;
    }
}

// Instância global do gerenciador de alunos
const alunoManager = new AlunoManager();

// Funções globais para compatibilidade
async function loadMinhasNotas() {
    return await alunoManager.loadMinhasNotas();
}

async function loadAtividadesAluno() {
    return await alunoManager.loadAtividadesAluno();
}

async function loadCalendarioAluno() {
    return await alunoManager.loadCalendarioAluno();
}

// Funções auxiliares globais
function showFeedback(notaId, feedback) {
    alunoManager.showFeedback(notaId, feedback);
}

function viewAtividadeDetails(atividadeId) {
    alunoManager.viewAtividadeDetails(atividadeId);
}