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
    // FUNÇÕES DE ATIVIDADES - CORRIGIDAS
    // =============================================

    async criarAtividade() {
        try {
            const turmaId = document.getElementById('atividade-turma-hidden') ?
                document.getElementById('atividade-turma-hidden').value :
                document.getElementById('atividade-turma').value;

            const materiaId = document.getElementById('atividade-materia').value;

            if (!materiaId) {
                showNotification('Por favor, selecione uma matéria', 'error');
                return;
            }

            const formData = {
                titulo: document.getElementById('atividade-titulo').value,
                descricao: document.getElementById('atividade-descricao').value,
                materia_id: parseInt(materiaId),
                valor: parseFloat(document.getElementById('atividade-valor').value),
                data_entrega: document.getElementById('atividade-data-entrega').value
            };

            console.log('Enviando dados da atividade:', formData);

            const response = await fetch(`${API_BASE}/professor/atividades`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Erro detalhado:', errorText);
                throw new Error(`Erro ${response.status}: ${errorText}`);
            }

            const result = await response.json();

            showNotification('Atividade criada com sucesso!', 'success');
            closeModal('criar-atividade-modal');

            // Recarregar a seção de atividades
            showSection('atividades');

        } catch (error) {
            console.error('Erro ao criar atividade:', error);
            showNotification('Erro ao criar atividade: ' + error.message, 'error');
        }
    }

    async editarAtividade(atividadeId) {
        try {
            // Primeiro, carregar dados da atividade
            const atividadesResponse = await fetch(`${API_BASE}/professor/atividades`, {
                headers: getAuthHeaders()
            });

            if (!atividadesResponse.ok) {
                throw new Error('Erro ao carregar atividades');
            }

            const atividadesData = await atividadesResponse.json();
            const atividade = atividadesData.atividades.find(a => a.id === atividadeId);

            if (!atividade) {
                throw new Error('Atividade não encontrada');
            }

            const modalContent = `
                <div class="modal-header">
                    <h3>Editar Atividade</h3>
                    <button class="modal-close" onclick="closeModal('editar-atividade-modal')">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="form-editar-atividade" class="atividade-form">
                        <div class="form-group">
                            <label for="editar-titulo">Título da Atividade *</label>
                            <input type="text" id="editar-titulo" value="${atividade.titulo}" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="editar-descricao">Descrição</label>
                            <textarea id="editar-descricao" rows="4">${atividade.descricao || ''}</textarea>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="editar-turma">Turma</label>
                                <input type="text" id="editar-turma" value="${atividade.turma_nome}" disabled>
                                <small>A turma não pode ser alterada</small>
                            </div>
                            
                            <div class="form-group">
                                <label for="editar-valor">Valor (pontos) *</label>
                                <input type="number" id="editar-valor" value="${atividade.valor}" min="1" max="100" step="0.5" required>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="editar-data-entrega">Data de Entrega *</label>
                            <input type="date" id="editar-data-entrega" value="${atividade.data_entrega.split('T')[0]}" required>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" onclick="closeModal('editar-atividade-modal')">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Salvar Alterações</button>
                        </div>
                    </form>
                </div>
            `;

            this.showCustomModal('editar-atividade-modal', modalContent);

            // Configurar submit do formulário
            document.getElementById('form-editar-atividade').addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.salvarEdicaoAtividade(atividadeId);
            });

        } catch (error) {
            console.error('Erro ao abrir edição:', error);
            showNotification('Erro ao carregar dados da atividade: ' + error.message, 'error');
        }
    }

    async salvarEdicaoAtividade(atividadeId) {
        try {
            const formData = {
                titulo: document.getElementById('editar-titulo').value,
                descricao: document.getElementById('editar-descricao').value,
                valor: parseFloat(document.getElementById('editar-valor').value),
                data_entrega: document.getElementById('editar-data-entrega').value
            };

            const response = await fetch(`${API_BASE}/professor/atividades/${atividadeId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erro ${response.status}: ${errorText}`);
            }

            const result = await response.json();

            showNotification('Atividade atualizada com sucesso!', 'success');
            closeModal('editar-atividade-modal');

            // Recarregar a seção de atividades
            showSection('atividades');

        } catch (error) {
            console.error('Erro ao editar atividade:', error);
            showNotification('Erro ao editar atividade: ' + error.message, 'error');
        }
    }

    async excluirAtividade(atividadeId) {
        if (!confirm('Tem certeza que deseja excluir esta atividade?\n\nEsta ação não pode ser desfeita.')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/professor/atividades/${atividadeId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erro ${response.status}: ${errorText}`);
            }

            const result = await response.json();

            showNotification('Atividade excluída com sucesso!', 'success');

            // Recarregar a seção de atividades
            showSection('atividades');

        } catch (error) {
            console.error('Erro ao excluir atividade:', error);
            showNotification('Erro ao excluir atividade: ' + error.message, 'error');
        }
    }

    // =============================================
    // SISTEMA DE AVALIAÇÕES
    // =============================================

    async avaliarAtividade(atividadeId) {
        try {
            console.log('Abrindo avaliação para atividade:', atividadeId);

            // Carregar alunos para avaliação
            const response = await fetch(`${API_BASE}/professor/atividades/${atividadeId}/alunos`, {
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Erro ao carregar alunos para avaliação');
            }

            const data = await response.json();
            const { atividade, alunos } = data;

            console.log('Dados carregados:', { atividade, alunos });

            let alunosHTML = '';

            if (alunos && alunos.length > 0) {
                alunosHTML = alunos.map(aluno => `
                    <div class="aluno-avaliacao-item">
                        <div class="aluno-info">
                            <strong>${aluno.nome}</strong>
                            <br>
                            <small>Matrícula: ${aluno.matricula}</small>
                            ${aluno.nota ? `<br><small>Nota atual: ${aluno.nota}</small>` : ''}
                        </div>
                        <div class="avaliacao-inputs">
                            <div class="form-group">
                                <label for="nota-${aluno.id}">Nota (0-${atividade.valor})</label>
                                <input type="number" id="nota-${aluno.id}" 
                                       value="${aluno.nota || ''}" 
                                       min="0" max="${atividade.valor}" step="0.1"
                                       placeholder="0.0">
                            </div>
                            <div class="form-group">
                                <label for="feedback-${aluno.id}">Feedback</label>
                                <textarea id="feedback-${aluno.id}" rows="2" 
                                          placeholder="Feedback para o aluno">${aluno.feedback || ''}</textarea>
                            </div>
                        </div>
                    </div>
                `).join('');
            } else {
                alunosHTML = '<p>Nenhum aluno encontrado para esta turma.</p>';
            }

            const modalContent = `
                <div class="modal-header">
                    <h3>Avaliar Atividade: ${atividade.titulo}</h3>
                    <button class="modal-close" onclick="closeModal('avaliar-atividade-modal')">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="atividade-info">
                        <p><strong>Turma:</strong> ${atividade.turma_nome}</p>
                        <p><strong>Valor:</strong> ${atividade.valor} pontos</p>
                        <p><strong>Data de Entrega:</strong> ${new Date(atividade.data_entrega).toLocaleDateString('pt-BR')}</p>
                    </div>
                    
                    <form id="form-avaliacao">
                        <div class="avaliacao-alunos-list">
                            ${alunosHTML}
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" onclick="closeModal('avaliar-atividade-modal')">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Salvar Avaliações</button>
                        </div>
                    </form>
                </div>
            `;

            this.showCustomModal('avaliar-atividade-modal', modalContent);

            // Configurar submit do formulário
            document.getElementById('form-avaliacao').addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.salvarAvaliacoes(atividadeId, alunos);
            });

        } catch (error) {
            console.error('Erro ao abrir avaliação:', error);
            showNotification('Erro ao carregar dados para avaliação: ' + error.message, 'error');
        }
    }

    async salvarAvaliacoes(atividadeId, alunos) {
        try {
            const avaliacoes = [];

            // Coletar avaliações de todos os alunos
            for (const aluno of alunos) {
                const notaInput = document.getElementById(`nota-${aluno.id}`);
                const feedbackInput = document.getElementById(`feedback-${aluno.id}`);

                const nota = notaInput.value.trim();

                // Só incluir se a nota foi preenchida
                if (nota) {
                    avaliacoes.push({
                        aluno_id: aluno.id,
                        nota: parseFloat(nota),
                        feedback: feedbackInput.value.trim() || ''
                    });
                }
            }

            if (avaliacoes.length === 0) {
                showNotification('Preencha pelo menos uma nota para salvar', 'warning');
                return;
            }

            console.log('Enviando avaliações:', avaliacoes);

            const response = await fetch(`${API_BASE}/professor/atividades/${atividadeId}/avaliar`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ avaliacoes })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erro ${response.status}: ${errorText}`);
            }

            const result = await response.json();

            showNotification('Avaliações salvas com sucesso!', 'success');
            closeModal('avaliar-atividade-modal');

        } catch (error) {
            console.error('Erro ao salvar avaliações:', error);
            showNotification('Erro ao salvar avaliações: ' + error.message, 'error');
        }
    }

    async verAvaliacoes(atividadeId) {
        try {
            console.log('Carregando avaliações da atividade:', atividadeId);

            const response = await fetch(`${API_BASE}/professor/atividades/${atividadeId}/avaliacoes`, {
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Erro ao carregar avaliações');
            }

            const data = await response.json();
            const { atividade, avaliacoes, estatisticas } = data;

            console.log('Avaliações carregadas:', { atividade, avaliacoes, estatisticas });

            let avaliacoesHTML = '';

            if (avaliacoes && avaliacoes.length > 0) {
                avaliacoesHTML = avaliacoes.map(avaliacao => `
                    <div class="avaliacao-item">
                        <div class="avaliacao-header">
                            <strong>${avaliacao.aluno_nome}</strong>
                            <span class="nota-badge ${this.getClassNota(avaliacao.nota, atividade.valor)}">
                                ${avaliacao.nota}/${atividade.valor}
                            </span>
                        </div>
                        <div class="avaliacao-details">
                            <small>Matrícula: ${avaliacao.matricula}</small>
                            <br>
                            <small>Avaliado em: ${new Date(avaliacao.data_avaliacao).toLocaleDateString('pt-BR')}</small>
                            ${avaliacao.avaliador_nome ? `<br><small>Por: ${avaliacao.avaliador_nome}</small>` : ''}
                        </div>
                        ${avaliacao.feedback ? `
                            <div class="avaliacao-feedback">
                                <strong>Feedback:</strong> ${avaliacao.feedback}
                            </div>
                        ` : ''}
                    </div>
                `).join('');
            } else {
                avaliacoesHTML = '<p>Nenhuma avaliação registrada para esta atividade.</p>';
            }

            const estatisticasHTML = estatisticas && estatisticas.total_avaliacoes > 0 ? `
                <div class="estatisticas-avaliacao">
                    <h4>Estatísticas da Atividade</h4>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <span class="stat-value">${estatisticas.total_avaliacoes}</span>
                            <span class="stat-label">Avaliações</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${estatisticas.media_geral ? estatisticas.media_geral.toFixed(1) : '0'}</span>
                            <span class="stat-label">Média</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${estatisticas.nota_minima || '0'}</span>
                            <span class="stat-label">Mínima</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${estatisticas.nota_maxima || '0'}</span>
                            <span class="stat-label">Máxima</span>
                        </div>
                    </div>
                </div>
            ` : '';

            const modalContent = `
                <div class="modal-header">
                    <h3>Avaliações: ${atividade.titulo}</h3>
                    <button class="modal-close" onclick="closeModal('ver-avaliacoes-modal')">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="atividade-info">
                        <p><strong>Turma:</strong> ${atividade.turma_nome}</p>
                        <p><strong>Matéria:</strong> ${atividade.materia_nome}</p>
                        <p><strong>Valor:</strong> ${atividade.valor} pontos</p>
                    </div>
                    
                    ${estatisticasHTML}
                    
                    <div class="avaliacoes-list">
                        <h4>Avaliações dos Alunos</h4>
                        ${avaliacoesHTML}
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn btn-primary" onclick="closeModal('ver-avaliacoes-modal'); professorManager.avaliarAtividade(${atividadeId})">
                            <i class="fas fa-edit"></i> Editar Avaliações
                        </button>
                        <button type="button" class="btn btn-secondary" onclick="closeModal('ver-avaliacoes-modal')">
                            Fechar
                        </button>
                    </div>
                </div>
            `;

            this.showCustomModal('ver-avaliacoes-modal', modalContent);

        } catch (error) {
            console.error('Erro ao carregar avaliações:', error);
            showNotification('Erro ao carregar avaliações: ' + error.message, 'error');
        }
    }

    // =============================================
    // DESEMPENHO DO ALUNO
    // =============================================

    async viewAlunoPerformance(alunoId) {
        try {
            console.log('Carregando desempenho do aluno:', alunoId);

            const response = await fetch(`${API_BASE}/professor/alunos/${alunoId}/desempenho`, {
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Erro ao carregar desempenho do aluno');
            }

            const data = await response.json();
            const { aluno, desempenho, estatisticas } = data;

            console.log('Desempenho carregado:', { aluno, desempenho, estatisticas });

            let desempenhoHTML = '';

            if (desempenho && desempenho.length > 0) {
                desempenhoHTML = desempenho.map(item => `
                    <div class="desempenho-item">
                        <div class="desempenho-header">
                            <strong>${item.atividade_titulo}</strong>
                            <span class="nota-badge ${this.getClassNota(item.nota, item.valor_atividade)}">
                                ${item.nota}/${item.valor_atividade}
                            </span>
                        </div>
                        <div class="desempenho-details">
                            <small>Matéria: ${item.materia_nome}</small>
                            <br>
                            <small>Avaliado em: ${new Date(item.data_avaliacao).toLocaleDateString('pt-BR')}</small>
                        </div>
                        ${item.feedback ? `
                            <div class="desempenho-feedback">
                                <strong>Feedback:</strong> ${item.feedback}
                            </div>
                        ` : ''}
                    </div>
                `).join('');
            } else {
                desempenhoHTML = '<p>Nenhuma atividade avaliada para este aluno.</p>';
            }

            const estatisticasHTML = estatisticas && estatisticas.total_atividades > 0 ? `
                <div class="estatisticas-desempenho">
                    <h4>Estatísticas do Aluno</h4>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <span class="stat-value">${estatisticas.total_atividades}</span>
                            <span class="stat-label">Atividades</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${estatisticas.media_geral ? estatisticas.media_geral.toFixed(1) : '0'}</span>
                            <span class="stat-label">Média Geral</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${estatisticas.aprovados || 0}</span>
                            <span class="stat-label">Aprovados</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${estatisticas.reprovados || 0}</span>
                            <span class="stat-label">Reprovados</span>
                        </div>
                    </div>
                </div>
            ` : '<p>Nenhuma estatística disponível.</p>';

            const modalContent = `
                <div class="modal-header">
                    <h3>Desempenho do Aluno</h3>
                    <button class="modal-close" onclick="closeModal('desempenho-aluno-modal')">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="aluno-info">
                        <h4>${aluno.nome}</h4>
                        <p><strong>Matrícula:</strong> ${aluno.matricula}</p>
                        <p><strong>Turma:</strong> ${aluno.turma_nome || 'Não atribuída'}</p>
                    </div>
                    
                    ${estatisticasHTML}
                    
                    <div class="desempenho-list">
                        <h4>Histórico de Atividades</h4>
                        ${desempenhoHTML}
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="closeModal('desempenho-aluno-modal')">
                            Fechar
                        </button>
                    </div>
                </div>
            `;

            this.showCustomModal('desempenho-aluno-modal', modalContent);

        } catch (error) {
            console.error('Erro ao carregar desempenho:', error);
            showNotification('Erro ao carregar desempenho do aluno: ' + error.message, 'error');
        }
    }

    // =============================================
    // FUNÇÕES AUXILIARES
    // =============================================

    getClassNota(nota, valorMaximo) {
        const percentual = (nota / valorMaximo) * 100;

        if (percentual >= 80) return 'nota-excelente';
        if (percentual >= 60) return 'nota-boa';
        if (percentual >= 40) return 'nota-regular';
        return 'nota-insuficiente';
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

            // Buscar alunos da turma através da API de admin
            const response = await fetch(`${API_BASE}/admin/turmas/${turmaId}/alunos`, {
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
                                        ${aluno.media_geral ? `<span>Média: ${aluno.media_geral.toFixed(1)}</span>` : ''}
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

    // Método atualizado para mostrar o modal de criação de atividade
    async showCriarAtividadeModal(turmaId = null) {
        try {
            console.log('Abrindo modal de criar atividade para turma:', turmaId);

            // Carregar turmas do professor
            const response = await fetch(`${API_BASE}/professor/minhas-turmas`, {
                headers: getAuthHeaders()
            });

            const turmasData = response.ok ? await response.json() : { turmas: [] };

            // Se uma turma específica foi passada, carregar suas matérias
            let materiasHTML = '';
            if (turmaId) {
                try {
                    const materiasResponse = await fetch(`${API_BASE}/professor/turmas/${turmaId}/materias`, {
                        headers: getAuthHeaders()
                    });

                    if (materiasResponse.ok) {
                        const materiasData = await materiasResponse.json();
                        if (materiasData.materias && materiasData.materias.length > 0) {
                            materiasHTML = `
                            <div class="form-group">
                                <label for="atividade-materia">Matéria *</label>
                                <select id="atividade-materia" required>
                                    <option value="">Selecione a matéria</option>
                                    ${materiasData.materias.map(materia => `
                                        <option value="${materia.id}">${materia.nome}</option>
                                    `).join('')}
                                </select>
                            </div>
                        `;
                        } else {
                            materiasHTML = `
                            <div class="alert alert-warning">
                                <i class="fas fa-exclamation-triangle"></i>
                                Nenhuma matéria encontrada para esta turma.
                            </div>
                        `;
                        }
                    }
                } catch (materiaError) {
                    console.warn('Erro ao carregar matérias:', materiaError);
                    materiasHTML = `
                        <div class="alert alert-danger">
                            <i class="fas fa-exclamation-circle"></i>
                            Erro ao carregar matérias.
                        </div>
                    `;
                }
            } else {
                // Se não há turma específica, mostrar campo de turma
                materiasHTML = `
                    <div class="form-group">
                        <label for="atividade-turma">Turma *</label>
                        <select id="atividade-turma" required onchange="professorManager.carregarMateriasPorTurma(this.value)">
                            <option value="">Selecione uma turma</option>
                            ${turmasData.turmas.map(turma => `
                                <option value="${turma.id}">
                                    ${turma.nome || turma.turma_nome} - ${turma.materia_nome}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div id="materias-container"></div>
                `;
            }

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
                    
                    ${turmaId ? `
                        <div class="form-group">
                            <label for="atividade-turma-display">Turma</label>
                            <input type="text" id="atividade-turma-display" value="${turmasData.turmas.find(t => t.id == turmaId)?.nome || turmasData.turmas.find(t => t.id == turmaId)?.turma_nome}" disabled>
                            <input type="hidden" id="atividade-turma-hidden" value="${turmaId}">
                        </div>
                    ` : ''}
                    
                    <div class="form-row">
                        ${turmaId ? materiasHTML : `
                            <div class="form-group full-width">
                                ${materiasHTML}
                            </div>
                        `}
                        
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

    async carregarMateriasPorTurma(turmaId) {
        try {
            const materiasContainer = document.getElementById('materias-container');
            if (!materiasContainer) return;

            if (!turmaId) {
                materiasContainer.innerHTML = '';
                return;
            }

            const response = await fetch(`${API_BASE}/professor/turmas/${turmaId}/materias`, {
                headers: getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                if (data.materias && data.materias.length > 0) {
                    materiasContainer.innerHTML = `
                        <div class="form-group">
                            <label for="atividade-materia">Matéria *</label>
                            <select id="atividade-materia" required>
                                <option value="">Selecione a matéria</option>
                                ${data.materias.map(materia => `
                                    <option value="${materia.id}">${materia.nome}</option>
                                `).join('')}
                            </select>
                        </div>
                    `;
                } else {
                    materiasContainer.innerHTML = `
                        <div class="alert alert-warning">
                            <i class="fas fa-exclamation-triangle"></i>
                            Nenhuma matéria encontrada para esta turma.
                        </div>
                    `;
                }
            } else {
                materiasContainer.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle"></i>
                        Erro ao carregar matérias.
                    </div>
                `;
            }
        } catch (error) {
            console.error('Erro ao carregar matérias:', error);
            const materiasContainer = document.getElementById('materias-container');
            if (materiasContainer) {
                materiasContainer.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle"></i>
                        Erro ao carregar matérias: ${error.message}
                    </div>
                `;
            }
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

// Funções globais para os botões
async function criarAtividade() {
    return await professorManager.criarAtividade();
}

async function avaliarAtividade(atividadeId) {
    return await professorManager.avaliarAtividade(atividadeId);
}

async function editarAtividade(atividadeId) {
    return await professorManager.editarAtividade(atividadeId);
}

async function excluirAtividade(atividadeId) {
    return await professorManager.excluirAtividade(atividadeId);
}

async function verAvaliacoes(atividadeId) {
    return await professorManager.verAvaliacoes(atividadeId);
}

async function viewAlunoPerformance(alunoId) {
    return await professorManager.viewAlunoPerformance(alunoId);
}