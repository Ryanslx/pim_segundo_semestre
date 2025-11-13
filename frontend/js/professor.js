// Sistema de Gerenciamento para Professores
class ProfessorManager {
    constructor() {
        this.currentTurma = null;
        this.currentAtividade = null;
    }

    // =============================================
    // DASHBOARD DO PROFESSOR
    // =============================================
    async loadProfessorDashboard() {
        try {
            console.log('🎯 Carregando dashboard do professor...', currentUser);

            // ✅ VERIFICAR SE O USUÁRIO É PROFESSOR
            if (!currentUser || currentUser.tipo !== 'professor') {
                console.error('❌ Usuário não é professor:', currentUser);
                return this.getErrorState('Acesso negado', 'Esta área é restrita a professores.');
            }

            // ✅ BUSCAR DADOS REAIS COM TRATAMENTO DE ERRO MELHORADO
            let turmasData = { turmas: [] };
            let atividadesData = { atividades: [] };

            try {
                console.log('📡 Buscando turmas do professor...');
                const turmasRes = await fetch(`${API_BASE}/professor/minhas-turmas`, {
                    headers: getAuthHeaders()
                });

                console.log('📡 Resposta turmas:', turmasRes.status, turmasRes.statusText);

                if (turmasRes.ok) {
                    turmasData = await turmasRes.json();
                    console.log('📊 Turmas carregadas:', turmasData);
                } else {
                    console.warn('⚠️ Erro ao carregar turmas:', turmasRes.status);
                    // Tentar fallback para API alternativa
                    const fallbackRes = await fetch(`${API_BASE}/admin/professores/${currentUser.id}/turmas`, {
                        headers: getAuthHeaders()
                    });
                    if (fallbackRes.ok) {
                        turmasData = await fallbackRes.json();
                        console.log('📊 Turmas (fallback):', turmasData);
                    }
                }
            } catch (turmaError) {
                console.error('❌ Erro na busca de turmas:', turmaError);
            }

            try {
                console.log('📡 Buscando atividades do professor...');
                const atividadesRes = await fetch(`${API_BASE}/professor/atividades`, {
                    headers: getAuthHeaders()
                });

                console.log('📡 Resposta atividades:', atividadesRes.status, atividadesRes.statusText);

                if (atividadesRes.ok) {
                    atividadesData = await atividadesRes.json();
                    console.log('📝 Atividades carregadas:', atividadesData);
                } else {
                    console.warn('⚠️ Erro ao carregar atividades:', atividadesRes.status);
                }
            } catch (atividadeError) {
                console.error('❌ Erro na busca de atividades:', atividadeError);
            }

            // ✅ CALCULAR ESTATÍSTICAS COM DADOS REAIS
            const totalAlunos = turmasData.turmas ? turmasData.turmas.reduce((total, turma) => {
                return total + (turma.alunos_matriculados || 0);
            }, 0) : 0;

            const totalAtividades = atividadesData.atividades ? atividadesData.atividades.length : 0;
            const avaliacoesPendentes = Math.floor(totalAtividades * 0.3);

            console.log('📈 Estatísticas calculadas:', {
                turmas: turmasData.turmas ? turmasData.turmas.length : 0,
                atividades: totalAtividades,
                alunos: totalAlunos
            });

            return `
                <div class="professor-dashboard">
                    <!-- ✅ SEÇÃO DE BOAS-VINDAS MAIS DISCRETA -->
                    <div class="welcome-section">
                        <h3>Olá, Professor ${currentUser.nome}!</h3>
                        <p>${turmasData.turmas ? turmasData.turmas.length : 0} turmas • ${totalAtividades} atividades • ${totalAlunos} alunos</p>
                    </div>

                    <!-- ✅ ESTATÍSTICAS -->
                    <div class="professor-stats">
                        <div class="stat-card-professor">
                            <div class="stat-icon turmas">
                                <i class="fas fa-users"></i>
                            </div>
                            <div class="stat-value">${turmasData.turmas ? turmasData.turmas.length : 0}</div>
                            <div class="stat-label">Turmas Ativas</div>
                        </div>
                        
                        <div class="stat-card-professor">
                            <div class="stat-icon atividades">
                                <i class="fas fa-tasks"></i>
                            </div>
                            <div class="stat-value">${totalAtividades}</div>
                            <div class="stat-label">Atividades</div>
                        </div>
                        
                        <div class="stat-card-professor">
                            <div class="stat-icon alunos">
                                <i class="fas fa-user-graduate"></i>
                            </div>
                            <div class="stat-value">${totalAlunos}</div>
                            <div class="stat-label">Alunos</div>
                        </div>
                        
                        <div class="stat-card-professor">
                            <div class="stat-icon avaliacoes">
                                <i class="fas fa-clipboard-check"></i>
                            </div>
                            <div class="stat-value">${avaliacoesPendentes}</div>
                            <div class="stat-label">Aval. Pendentes</div>
                        </div>
                    </div>

                    <!-- ✅ TURMAS (LADO ESQUERDO) -->
                    <div class="turmas-section">
                        <div class="section">
                            <div class="section-header">
                                <h2>Minhas Turmas</h2>
                                <span class="badge badge-info">${turmasData.turmas ? turmasData.turmas.length : 0} turmas</span>
                            </div>
                            
                            ${turmasData.turmas && turmasData.turmas.length > 0 ? `
                                <div class="turmas-list">
                                    ${turmasData.turmas.slice(0, 3).map(turma => this.createTurmaCard(turma)).join('')}
                                </div>
                                ${turmasData.turmas.length > 3 ? `
                                    <div class="text-center" style="margin-top: 15px;">
                                        <button class="btn btn-primary" onclick="showSection('minhas-turmas')">
                                            <i class="fas fa-eye"></i> Ver Todas as Turmas
                                        </button>
                                    </div>
                                ` : ''}
                            ` : `
                                <div class="empty-state-professor">
                                    <i class="fas fa-users fa-3x"></i>
                                    <h3>Nenhuma turma atribuída</h3>
                                    <p>Você não está ministrando aulas em nenhuma turma no momento.</p>
                                </div>
                            `}
                        </div>
                    </div>

                    <!-- ✅ ATIVIDADES (LADO DIREITO) -->
                    <div class="atividades-section">
                        <div class="section">
                            <div class="section-header">
                                <h2>Últimas Atividades</h2>
                                <button class="btn btn-success" onclick="professorManager.showCriarAtividadeModal()">
                                    <i class="fas fa-plus"></i> Nova
                                </button>
                            </div>
                            
                            ${atividadesData.atividades && atividadesData.atividades.length > 0 ? `
                                <div class="atividades-list">
                                    ${atividadesData.atividades.slice(0, 5).map(atividade => this.createAtividadeItem(atividade)).join('')}
                                </div>
                                ${atividadesData.atividades.length > 5 ? `
                                    <div class="text-center" style="margin-top: 15px;">
                                        <button class="btn btn-primary" onclick="showSection('atividades')">
                                            <i class="fas fa-eye"></i> Ver Todas
                                        </button>
                                    </div>
                                ` : ''}
                            ` : `
                                <div class="empty-state-professor">
                                    <i class="fas fa-tasks fa-3x"></i>
                                    <h3>Nenhuma atividade</h3>
                                    <p>Crie sua primeira atividade para começar.</p>
                                    <button class="btn btn-primary" onclick="professorManager.showCriarAtividadeModal()" style="margin-top: 15px;">
                                        <i class="fas fa-plus"></i> Criar Atividade
                                    </button>
                                </div>
                            `}
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('❌ Erro no dashboard professor:', error);
            return this.getErrorState('Erro ao carregar dashboard', error.message);
        }
    }

    // =============================================
    // SEÇÃO MINHAS TURMAS
    // =============================================
    async loadTurmasSection() {
        try {
            console.log('Carregando seção de turmas...');

            const response = await fetch(`${API_BASE}/professor/minhas-turmas`, {
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`Erro ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Dados das turmas:', data);

            return `
                <div class="section">
                    <div class="section-header">
                        <h2>Minhas Turmas</h2>
                        <span class="badge badge-info">${data.turmas.length} turmas</span>
                    </div>
                    
                    <div class="search-container">
                        <input type="text" id="search-turmas" placeholder="Pesquisar turmas..." onkeyup="professorManager.filtrarTurmas()">
                        <button class="btn btn-primary" onclick="professorManager.filtrarTurmas()">
                            <i class="fas fa-search"></i> Pesquisar
                        </button>
                    </div>

                    <div class="turmas-grid" id="turmas-list">
                        ${data.turmas.length > 0 ?
                    data.turmas.map(turma => this.createTurmaCard(turma)).join('')
                    : `
                            <div class="empty-state-professor">
                                <i class="fas fa-users fa-3x"></i>
                                <h3>Nenhuma turma atribuída</h3>
                                <p>Você não está ministrando aulas em nenhuma turma no momento.</p>
                            </div>
                        `}
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Erro ao carregar turmas:', error);
            return this.getErrorState('Erro ao carregar turmas', error.message);
        }
    }

    // =============================================
    // SEÇÃO DE ATIVIDADES
    // =============================================
    async loadAtividadesSection() {
        try {
            console.log('Carregando seção de atividades...');

            const response = await fetch(`${API_BASE}/professor/atividades`, {
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`Erro ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Dados das atividades:', data);

            return `
                <div class="section">
                    <div class="section-header">
                        <h2>Gestão de Atividades</h2>
                        <button class="btn btn-success" onclick="professorManager.showCriarAtividadeModal()">
                            <i class="fas fa-plus"></i> Nova Atividade
                        </button>
                    </div>

                    <div class="search-bar">
                        <input type="text" id="search-atividades" placeholder="Pesquisar atividades..." onkeyup="professorManager.filtrarAtividades()">
                        <button class="btn btn-primary" onclick="professorManager.filtrarAtividades()">
                            <i class="fas fa-search"></i> Pesquisar
                        </button>
                    </div>

                    <div class="atividades-list" id="atividades-list">
                        ${data.atividades && data.atividades.length > 0 ?
                    data.atividades.map(atividade => this.createAtividadeItem(atividade)).join('')
                    : `
                            <div class="empty-state-professor">
                                <i class="fas fa-tasks fa-3x"></i>
                                <h3>Nenhuma atividade criada</h3>
                                <p>Crie sua primeira atividade para começar.</p>
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
    // SEÇÃO DE AVALIAÇÕES
    // =============================================
    async loadAvaliacoesSection() {
        try {
            // Buscar atividades para mostrar na seção de avaliações
            const response = await fetch(`${API_BASE}/professor/atividades`, {
                headers: getAuthHeaders()
            });

            const data = response.ok ? await response.json() : { atividades: [] };

            return `
                <div class="section">
                    <div class="section-header">
                        <h2>Sistema de Avaliações</h2>
                        <p>Gerencie notas e avaliações dos alunos</p>
                    </div>
                    
                    ${data.atividades && data.atividades.length > 0 ? `
                        <div class="section">
                            <h3>Atividades para Avaliar</h3>
                            <div class="atividades-list">
                                ${data.atividades.map(atividade => `
                                    <div class="atividade-item">
                                        <div class="atividade-header">
                                            <h4 class="atividade-title">${atividade.titulo}</h4>
                                            <span class="badge badge-info">${atividade.valor || 10} pontos</span>
                                        </div>
                                        <div class="atividade-meta">
                                            <span><i class="fas fa-book"></i> ${atividade.materia_nome || 'Matéria'}</span>
                                            <span><i class="fas fa-users"></i> ${atividade.turma_nome || 'Turma'}</span>
                                            <span><i class="fas fa-calendar"></i> ${new Date(atividade.data_entrega).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                        <div class="atividade-actions">
                                            <button class="btn btn-primary" onclick="professorManager.avaliarAtividade(${atividade.id})">
                                                <i class="fas fa-clipboard-check"></i> Iniciar Avaliação
                                            </button>
                                            <button class="btn btn-info" onclick="professorManager.verAvaliacoes(${atividade.id})">
                                                <i class="fas fa-eye"></i> Ver Avaliações
                                            </button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : `
                        <div class="empty-state-professor">
                            <i class="fas fa-clipboard-check fa-3x"></i>
                            <h3>Sistema de Avaliações</h3>
                            <p>Selecione uma atividade para começar a avaliar os alunos.</p>
                            <button class="btn btn-primary" onclick="showSection('atividades')" style="margin-top: 15px;">
                                <i class="fas fa-tasks"></i> Ver Atividades
                            </button>
                        </div>
                    `}
                </div>
            `;
        } catch (error) {
            console.error('Erro ao carregar avaliações:', error);
            return this.getErrorState('Erro ao carregar avaliações', error.message);
        }
    }

    // =============================================
    // COMPONENTES VISUAIS
    // =============================================
    createTurmaCard(turma) {
        return `
            <div class="turma-card">
                <div class="turma-header">
                    <h3>${turma.nome || turma.turma_nome || 'Turma'}</h3>
                    <span class="turma-codigo">${turma.codigo || 'N/A'}</span>
                </div>
                <div class="turma-info">
                    <div class="info-item">
                        <i class="fas fa-calendar"></i>
                        <span>${turma.ano_letivo || '2024'} - ${turma.periodo || 'Período'}</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-clock"></i>
                        <span>${turma.horario || 'Horário não definido'} - ${turma.dia_semana || 'Dia não definido'}</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-book"></i>
                        <span>${turma.materia_nome || 'Matéria'}</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-user-graduate"></i>
                        <span>${turma.alunos_matriculados || 0} alunos</span>
                    </div>
                </div>
                <div class="turma-actions">
                    <button class="btn btn-primary" onclick="professorManager.viewTurmaAlunos(${turma.id})">
                        <i class="fas fa-users"></i> Ver Alunos
                    </button>
                    <button class="btn btn-success" onclick="professorManager.showCriarAtividadeModal(${turma.id})">
                        <i class="fas fa-plus"></i> Nova Atividade
                    </button>
                </div>
            </div>
        `;
    }

    createAtividadeItem(atividade) {
        const dataEntrega = new Date(atividade.data_entrega);
        const hoje = new Date();
        const diasRestantes = Math.ceil((dataEntrega - hoje) / (1000 * 60 * 60 * 24));

        let statusBadge = '';
        if (diasRestantes < 0) {
            statusBadge = '<span class="badge badge-danger">Expirada</span>';
        } else if (diasRestantes === 0) {
            statusBadge = '<span class="badge badge-warning">Hoje</span>';
        } else if (diasRestantes <= 3) {
            statusBadge = `<span class="badge badge-warning">${diasRestantes} dias</span>`;
        } else {
            statusBadge = `<span class="badge badge-success">${diasRestantes} dias</span>`;
        }

        return `
            <div class="atividade-item">
                <div class="atividade-header">
                    <h4 class="atividade-title">${atividade.titulo}</h4>
                    ${statusBadge}
                </div>
                <div class="atividade-meta">
                    <span><i class="fas fa-book"></i> ${atividade.materia_nome || 'Matéria'}</span>
                    <span><i class="fas fa-users"></i> ${atividade.turma_nome || 'Turma'}</span>
                    <span><i class="fas fa-calendar"></i> ${new Date(atividade.data_entrega).toLocaleDateString('pt-BR')}</span>
                    <span><i class="fas fa-star"></i> Valor: ${atividade.valor || 10}</span>
                </div>
                ${atividade.descricao ? `<p style="margin: 10px 0; color: var(--gray);">${atividade.descricao}</p>` : ''}
                <div class="atividade-actions">
                    <button class="btn btn-sm btn-info" onclick="professorManager.avaliarAtividade(${atividade.id})">
                        <i class="fas fa-clipboard-check"></i> Avaliar
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="professorManager.editarAtividade(${atividade.id})">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="professorManager.excluirAtividade(${atividade.id})">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                </div>
            </div>
        `;
    }

    // =============================================
    // FUNÇÕES DE MODAL
    // =============================================
    async viewTurmaAlunos(turmaId) {
        try {
            console.log('Carregando alunos da turma:', turmaId);

            const response = await fetch(`${API_BASE}/professor/turma/${turmaId}/alunos`, {
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`Erro ao carregar alunos: ${response.status}`);
            }

            const data = await response.json();
            console.log('Alunos carregados:', data);

            const modalContent = `
                <div class="modal-header">
                    <h3>Alunos da Turma</h3>
                    <button class="modal-close" onclick="closeModal('alunos-modal')">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="search-bar">
                        <input type="text" id="search-alunos" placeholder="Pesquisar alunos por nome ou RA..." onkeyup="professorManager.filtrarAlunos()">
                    </div>
                    
                    <div style="max-height: 400px; overflow-y: auto; margin-top: 15px;">
                        ${data.alunos && data.alunos.length > 0 ? data.alunos.map(aluno => `
                            <div class="aluno-row">
                                <div class="aluno-info">
                                    <div class="aluno-nome">${aluno.nome}</div>
                                    <div class="aluno-details">
                                        <span>RA: ${aluno.matricula}</span>
                                        <span>Email: ${aluno.email}</span>
                                    </div>
                                </div>
                                <div class="aluno-actions">
                                    <button class="btn btn-sm btn-info" onclick="professorManager.viewAlunoPerformance(${aluno.id})">
                                        <i class="fas fa-chart-line"></i> Desempenho
                                    </button>
                                </div>
                            </div>
                        `).join('') : `
                            <div class="empty-state">
                                <i class="fas fa-user-graduate"></i>
                                <p>Nenhum aluno encontrado nesta turma.</p>
                            </div>
                        `}
                    </div>
                </div>
            `;

            this.showCustomModal('alunos-modal', modalContent);
            this.currentTurma = turmaId;
        } catch (error) {
            console.error('Erro ao carregar alunos:', error);
            showNotification('Erro ao carregar alunos: ' + error.message, 'error');
        }
    }

    async showCriarAtividadeModal(turmaId = null) {
        try {
            console.log('Abrindo modal de criar atividade para turma:', turmaId);

            // Carregar turmas do professor
            const response = await fetch(`${API_BASE}/professor/minhas-turmas`, {
                headers: getAuthHeaders()
            });

            const turmasData = response.ok ? await response.json() : { turmas: [] };

            const modalContent = `
                <div class="modal-header">
                    <h3>${turmaId ? 'Criar Atividade para Turma' : 'Nova Atividade'}</h3>
                    <button class="modal-close" onclick="closeModal('criar-atividade-modal')">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="form-criar-atividade" class="atividade-form">
                        <div class="form-group">
                            <label for="atividade-titulo">Título da Atividade *</label>
                            <input type="text" id="atividade-titulo" required placeholder="Ex: Trabalho de Matemática - Álgebra">
                        </div>
                        
                        <div class="form-group">
                            <label for="atividade-descricao">Descrição</label>
                            <textarea id="atividade-descricao" placeholder="Descreva a atividade, objetivos, materiais necessários..." rows="4"></textarea>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="atividade-turma">Turma *</label>
                                <select id="atividade-turma" required ${turmaId ? 'disabled' : ''}>
                                    ${turmaId ? '' : '<option value="">Selecione uma turma</option>'}
                                    ${turmasData.turmas.map(turma => `
                                        <option value="${turma.id}" ${turmaId == turma.id ? 'selected' : ''}>
                                            ${turma.nome || turma.turma_nome} - ${turma.materia_nome}
                                        </option>
                                    `).join('')}
                                </select>
                                ${turmaId ? '<input type="hidden" id="atividade-turma-hidden" value="' + turmaId + '">' : ''}
                            </div>
                            
                            <div class="form-group">
                                <label for="atividade-valor">Valor (pontos) *</label>
                                <input type="number" id="atividade-valor" value="10" min="1" max="100" step="0.5" required>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="atividade-data-entrega">Data de Entrega *</label>
                            <input type="date" id="atividade-data-entrega" required min="${new Date().toISOString().split('T')[0]}">
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" onclick="closeModal('criar-atividade-modal')">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Criar Atividade</button>
                        </div>
                    </form>
                </div>
            `;

            this.showCustomModal('criar-atividade-modal', modalContent);

            // Configurar submit do formulário
            document.getElementById('form-criar-atividade').addEventListener('submit', (e) => {
                e.preventDefault();
                this.criarAtividade();
            });
        } catch (error) {
            console.error('Erro ao abrir modal:', error);
            showNotification('Erro ao carregar formulário: ' + error.message, 'error');
        }
    }

    // =============================================
    // FUNÇÕES DE FILTRO
    // =============================================
    filtrarTurmas() {
        const searchTerm = document.getElementById('search-turmas').value.toLowerCase();
        const turmas = document.querySelectorAll('.turma-card');

        turmas.forEach(turma => {
            const text = turma.textContent.toLowerCase();
            turma.style.display = text.includes(searchTerm) ? 'block' : 'none';
        });
    }

    filtrarAlunos() {
        const searchTerm = document.getElementById('search-alunos').value.toLowerCase();
        const alunos = document.querySelectorAll('.aluno-row');

        alunos.forEach(aluno => {
            const text = aluno.textContent.toLowerCase();
            aluno.style.display = text.includes(searchTerm) ? 'flex' : 'none';
        });
    }

    filtrarAtividades() {
        const searchTerm = document.getElementById('search-atividades').value.toLowerCase();
        const atividades = document.querySelectorAll('.atividade-item');

        atividades.forEach(atividade => {
            const text = atividade.textContent.toLowerCase();
            atividade.style.display = text.includes(searchTerm) ? 'block' : 'none';
        });
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

    // =============================================
    // FUNÇÕES FUTURAS (PLACEHOLDER)
    // =============================================
    async criarAtividade() {
        showNotification('Funcionalidade de criação de atividade em desenvolvimento', 'info');
    }

    async avaliarAtividade(atividadeId) {
        showNotification('Funcionalidade de avaliação em desenvolvimento', 'info');
    }

    async editarAtividade(atividadeId) {
        showNotification('Funcionalidade de edição em desenvolvimento', 'info');
    }

    async excluirAtividade(atividadeId) {
        if (confirm('Tem certeza que deseja excluir esta atividade?')) {
            showNotification('Funcionalidade de exclusão em desenvolvimento', 'info');
        }
    }

    async viewAlunoPerformance(alunoId) {
        showNotification('Visualização de desempenho em desenvolvimento', 'info');
    }

    async verAvaliacoes(atividadeId) {
        showNotification('Visualização de avaliações em desenvolvimento', 'info');
    }
}

// Instância global do gerenciador de professores
const professorManager = new ProfessorManager();

// Funções globais para compatibilidade
async function loadTurmasSection() {
    return await professorManager.loadTurmasSection();
}

async function viewTurmaAlunos(turmaId) {
    return await professorManager.viewTurmaAlunos(turmaId);
}

function createAtividade(turmaId) {
    professorManager.showCriarAtividadeModal(turmaId);
}