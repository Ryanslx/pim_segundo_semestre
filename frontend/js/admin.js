// Funções específicas para administradores

async function loadTurmasSection() {
    try {
        console.log('Carregando turmas...');
        const response = await fetch(`${API_BASE}/admin/turmas`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log('Dados recebidos:', data);

        return `
            <div class="section">
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
                                <th>Descrição</th>
                                <th>Ano Letivo</th>
                                <th>Período</th>
                                <th>Capacidade</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.turmas && data.turmas.length > 0 ? data.turmas.map(turma => `
                                <tr>
                                    <td>${turma.nome || 'N/A'}</td>
                                    <td>${turma.codigo || 'N/A'}</td>
                                    <td>${turma.descricao || '-'}</td>
                                    <td>${turma.ano_letivo || 'N/A'}</td>
                                    <td>${turma.periodo || 'N/A'}</td>
                                    <td>${turma.alunos_matriculados || 0}/${turma.capacidade_max || 90}</td>
                                    <td>
                                        <button class="btn btn-sm btn-info" onclick="editTurma(${turma.id})" title="Editar">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-sm btn-danger" onclick="deleteTurma(${turma.id})" 
                                                ${(turma.alunos_matriculados > 0) ? 'disabled title="Não é possível excluir turma com alunos"' : 'title="Excluir turma"'}>
                                            <i class="fas fa-trash"></i>
                                        </button>
                                        
                                        <button class="btn btn-sm btn-success" onclick="viewTurmaDetails(${turma.id})" title="Ver detalhes e integrantes">
                                            <i class="fas fa-users"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('') : `
                                <tr>
                                    <td colspan="7" class="text-center">Nenhuma turma encontrada</td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Erro detalhado ao carregar turmas:', error);
        return `
            <div class="section">
                <h3>Erro ao carregar turmas</h3>
                <p>${error.message}</p>
                <button class="btn btn-primary" onclick="loadTurmasSection()">
                    <i class="fas fa-redo"></i> Tentar Novamente
                </button>
            </div>
        `;
    }
}

// =============================================
// GERENCIAR PROFESSORES - ADMIN (CORRIGIDO)
// =============================================

async function loadProfessoresSection() {
    try {
        const response = await fetch(`${API_BASE}/admin/professores`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar professores');
        }

        const data = await response.json();
        const professores = data.professores || [];

        // CORREÇÃO: Usar critério consistente para contagem
        const totalProfessores = professores.length;
        const professoresAtivos = professores.filter(p => (p.total_turmas || 0) > 0).length;
        const professoresSemAlocacao = professores.filter(p => (p.total_turmas || 0) === 0).length;

        console.log('📊 Estatísticas professores:', {
            total: totalProfessores,
            ativos: professoresAtivos,
            semAlocacao: professoresSemAlocacao,
            professores: professores.map(p => ({
                nome: p.nome,
                total_turmas: p.total_turmas,
                materias_count: p.materias_count
            }))
        });

        return `
            <div class="section">
                <div class="section-header">
                    <h2>Gerenciar Professores</h2>
                    <button class="btn btn-primary" onclick="openCreateProfessorModal()">
                        <i class="fas fa-plus"></i> Novo Professor
                    </button>
                </div>
                
                <div class="dashboard">
                    <div class="card">
                        <div class="card-header">
                            <div>
                                <h3>${totalProfessores}</h3>
                                <p>Total de Professores</p>
                            </div>
                            <div class="card-icon blue">
                                <i class="fas fa-chalkboard-teacher"></i>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="card-header">
                            <div>
                                <h3>${professoresAtivos}</h3>
                                <p>Professores Ativos</p>
                            </div>
                            <div class="card-icon green">
                                <i class="fas fa-user-check"></i>
                            </div>
                        </div>
                        <div class="card-footer">
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="card-header">
                            <div>
                                <h3>${professoresSemAlocacao}</h3>
                                <p>Sem Alocação</p>
                            </div>
                            <div class="card-icon orange">
                                <i class="fas fa-exclamation-circle"></i>
                            </div>
                        </div>
                        <div class="card-footer">
                        </div>
                    </div>
                </div>
                
                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Email</th>
                                <th>Telefone</th>
                                <th>Matérias</th>
                                <th>Turmas</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${professores.length > 0 ? professores.map(professor => {
            const totalTurmas = professor.total_turmas || 0;
            const isAtivo = totalTurmas > 0;
            const materiasLeccionadas = professor.materias_lecionadas || 'Nenhuma';

            return `
                                <tr>
                                    <td>
                                        <div class="teacher-info">
                                            <strong>${professor.nome}</strong>
                                            ${professor.formacao ? `<br><small>${professor.formacao}</small>` : ''}
                                        </div>
                                    </td>
                                    <td>${professor.email}</td>
                                    <td>${professor.telefone || 'Não informado'}</td>
                                    <td>
                                        <span class="badge badge-info">
                                            ${materiasLeccionadas}
                                        </span>
                                    </td>
                                    <td>
                                        <span class="badge ${totalTurmas > 0 ? 'badge-success' : 'badge-secondary'}">
                                            ${totalTurmas} turma(s)
                                        </span>
                                    </td>
                                    <td>
                                        <span class="badge ${isAtivo ? 'badge-success' : 'badge-warning'}">
                                            ${isAtivo ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </td>
                                    <td>
                                        <button class="btn btn-sm btn-info" onclick="viewProfessorDetails(${professor.id})" title="Ver detalhes">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button class="btn btn-sm btn-warning" onclick="editProfessor(${professor.id})" title="Editar">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-sm btn-success" onclick="openAlocarProfessorModal(${professor.id})" title="Alocar em turma">
                                            <i class="fas fa-link"></i>
                                        </button>
                                        <button class="btn btn-sm btn-danger" onclick="deleteProfessor(${professor.id})" 
                                                ${totalTurmas > 0 ? 'disabled title="Não é possível excluir professor com turmas"' : 'title="Excluir professor"'}>
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                                `;
        }).join('') : `
                                <tr>
                                    <td colspan="7" class="text-center">Nenhum professor encontrado</td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Erro ao carregar professores:', error);
        return `
            <div class="section">
                <h3>Erro ao carregar professores</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Modal para criar professor
function openCreateProfessorModal() {
    const modalContent = `
        <div class="modal-header">
            <h3>Cadastrar Novo Professor</h3>
            <button class="modal-close" onclick="closeModal('create-professor-modal')">&times;</button>
        </div>
        <form id="create-professor-form" onsubmit="createProfessor(event)">
            <div class="form-row">
                <div class="form-group">
                    <label for="professor-nome">Nome Completo *</label>
                    <input type="text" id="professor-nome" required placeholder="Nome do professor">
                </div>
                <div class="form-group">
                    <label for="professor-email">Email *</label>
                    <input type="email" id="professor-email" required placeholder="professor@escola.com">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="professor-senha">Senha *</label>
                    <input type="password" id="professor-senha" required placeholder="Senha para acesso">
                </div>
                <div class="form-group">
                    <label for="professor-telefone">Telefone</label>
                    <input type="tel" id="professor-telefone" placeholder="(11) 99999-9999">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="professor-formacao">Formação Acadêmica</label>
                    <input type="text" id="professor-formacao" placeholder="Ex: Licenciatura em Matemática">
                </div>
                <div class="form-group">
                    <label for="professor-experiencia">Experiência (anos)</label>
                    <input type="number" id="professor-experiencia" placeholder="0" min="0" max="50">
                </div>
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal('create-professor-modal')">Cancelar</button>
                <button type="submit" class="btn btn-primary">Cadastrar Professor</button>
            </div>
        </form>
    `;

    showCustomModal('create-professor-modal', modalContent);
}

// Criar professor
async function createProfessor(event) {
    event.preventDefault();

    const formData = {
        nome: document.getElementById('professor-nome').value,
        email: document.getElementById('professor-email').value,
        senha: document.getElementById('professor-senha').value,
        telefone: document.getElementById('professor-telefone').value || null,
        formacao: document.getElementById('professor-formacao').value || null,
        experiencia: document.getElementById('professor-experiencia').value || null
    };

    try {
        const response = await fetch(`${API_BASE}/admin/professores`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok) {
            showNotification('Professor cadastrado com sucesso!', 'success');
            closeModal('create-professor-modal');
            showSection('professores');
        } else {
            throw new Error(result.error || 'Erro ao cadastrar professor');
        }
    } catch (error) {
        showNotification('Erro ao cadastrar professor: ' + error.message, 'error');
    }
}


// Visualizar detalhes do professor - CORRIGIDA
async function viewProfessorDetails(professorId) {
    try {
        console.log('Carregando detalhes do professor:', professorId);

        // Carregar dados básicos do professor
        const professorResponse = await fetch(`${API_BASE}/admin/professores/${professorId}`, {
            headers: getAuthHeaders()
        });

        if (!professorResponse.ok) {
            throw new Error('Erro ao carregar dados do professor');
        }

        const professorData = await professorResponse.json();
        const professor = professorData.professor;

        // Carregar turmas do professor - COM TRATAMENTO DE ERRO
        let turmasHTML = '<p>Nenhuma turma atribuída</p>';
        try {
            const turmasResponse = await fetch(`${API_BASE}/admin/professores/${professorId}/turmas`, {
                headers: getAuthHeaders()
            });

            if (turmasResponse.ok) {
                const turmasData = await turmasResponse.json();
                if (turmasData.turmas && turmasData.turmas.length > 0) {
                    turmasHTML = turmasData.turmas.map(turma => `
                        <div class="turma-alocada-item">
                            <div class="turma-info">
                                <strong>${turma.turma_nome}</strong> (${turma.codigo})
                                <br>
                                <small>Matéria: ${turma.materia_nome}</small>
                                <br>
                                <small>Horário: ${turma.dia_semana} - ${turma.horario}</small>
                                ${turma.carga_horaria_semanal ? `<br><small>Carga horária: ${turma.carga_horaria_semanal}h/semana</small>` : ''}
                            </div>
                            <button class="btn btn-sm btn-danger" onclick="desalocarProfessor(${professorId}, ${turma.id}, '${turma.materia_nome}')">
                                <i class="fas fa-unlink"></i> Remover
                            </button>
                        </div>
                    `).join('');
                }
            } else {
                console.warn('Erro ao carregar turmas do professor, usando fallback');
                turmasHTML = '<p>Erro ao carregar turmas. Tente novamente.</p>';
            }
        } catch (turmaError) {
            console.warn('Erro de conexão ao carregar turmas:', turmaError);
            turmasHTML = '<p>Não foi possível carregar as turmas do professor.</p>';
        }

        const modalContent = `
            <div class="modal-header">
                <h3>Detalhes do Professor</h3>
                <button class="modal-close" onclick="closeModal('view-professor-modal')">&times;</button>
            </div>
            <div class="modal-body">
                <div class="professor-details">
                    <div class="detail-section">
                        <h4>Informações Pessoais</h4>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <strong>Nome:</strong> ${professor.nome}
                            </div>
                            <div class="detail-item">
                                <strong>Email:</strong> ${professor.email}
                            </div>
                            <div class="detail-item">
                                <strong>Telefone:</strong> ${professor.telefone || 'Não informado'}
                            </div>
                            <div class="detail-item">
                                <strong>Formação:</strong> ${professor.formacao || 'Não informada'}
                            </div>
                            <div class="detail-item">
                                <strong>Experiência:</strong> ${professor.experiencia || '0'} anos
                            </div>
                            <div class="detail-item">
                                <strong>Status:</strong> 
                                <span class="badge ${professor.total_turmas > 0 ? 'badge-success' : 'badge-warning'}">
                                    ${professor.total_turmas > 0 ? 'Ativo' : 'Inativo'}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <div class="section-header">
                            <h4>Turmas Atribuídas</h4>
                            <button class="btn btn-primary btn-sm" onclick="closeModal('view-professor-modal'); openAlocarProfessorModal(${professorId})">
                                <i class="fas fa-plus"></i> Nova Alocação
                            </button>
                        </div>
                        <div class="turmas-list">
                            ${turmasHTML}
                        </div>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-primary" onclick="closeModal('view-professor-modal'); editProfessor(${professorId})">
                        <i class="fas fa-edit"></i> Editar Professor
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="closeModal('view-professor-modal')">
                        Fechar
                    </button>
                </div>
            </div>
        `;

        showCustomModal('view-professor-modal', modalContent);

    } catch (error) {
        console.error('Erro ao carregar detalhes do professor:', error);
        showNotification('Erro ao carregar detalhes do professor: ' + error.message, 'error');
    }
}

// Modal para alocar professor em turma
async function openAlocarProfessorModal(professorId) {
    try {
        // Carregar turmas disponíveis
        const turmasResponse = await fetch(`${API_BASE}/admin/todas-turmas`, {
            headers: getAuthHeaders()
        });

        if (!turmasResponse.ok) {
            throw new Error('Erro ao carregar turmas');
        }

        const turmasData = await turmasResponse.json();

        const turmasOptions = turmasData.turmas ? turmasData.turmas.map(turma => `
            <option value="${turma.id}">${turma.nome} (${turma.codigo})</option>
        `).join('') : '<option value="">Nenhuma turma disponível</option>';

        const modalContent = `
            <div class="modal-header">
                <h3>Alocar Professor em Turma</h3>
                <button class="modal-close" onclick="closeModal('alocar-professor-modal')">&times;</button>
            </div>
            <form onsubmit="alocarProfessor(${professorId}, event)">
                <div class="form-group">
                    <label for="alocar-turma">Selecionar Turma *</label>
                    <select id="alocar-turma" required>
                        <option value="">Selecione uma turma...</option>
                        ${turmasOptions}
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="alocar-materia">Matéria *</label>
                    <input type="text" id="alocar-materia" required placeholder="Ex: Matemática, Português, Ciências">
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="alocar-dia">Dia da Semana *</label>
                        <select id="alocar-dia" required>
                            <option value="">Selecione...</option>
                            <option value="segunda">Segunda-feira</option>
                            <option value="terca">Terça-feira</option>
                            <option value="quarta">Quarta-feira</option>
                            <option value="quinta">Quinta-feira</option>
                            <option value="sexta">Sexta-feira</option>
                            <option value="sabado">Sábado</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="alocar-horario">Horário *</label>
                        <input type="time" id="alocar-horario" required>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal('alocar-professor-modal')">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Alocar Professor</button>
                </div>
            </form>
        `;

        showCustomModal('alocar-professor-modal', modalContent);

    } catch (error) {
        console.error('Erro ao abrir modal de alocação:', error);
        showNotification('Erro ao carregar turmas: ' + error.message, 'error');
    }
}

// Alocar professor em turma - CORRIGIDA
async function alocarProfessor(professorId, event) {
    event.preventDefault();

    const formData = {
        professor_id: professorId, // Adicionar o professor_id explicitamente
        turma_id: document.getElementById('alocar-turma').value,
        materia_nome: document.getElementById('alocar-materia').value,
        dia_semana: document.getElementById('alocar-dia').value,
        horario: document.getElementById('alocar-horario').value
    };

    console.log('Enviando dados para alocação:', formData);

    try {
        // Usar a rota correta que já existe no backend
        const response = await fetch(`${API_BASE}/admin/turmas/${formData.turma_id}/professores`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro ${response.status}: ${errorText}`);
        }

        const result = await response.json();

        showNotification('Professor alocado com sucesso!', 'success');
        closeModal('alocar-professor-modal');
        // Recarregar a seção de professores
        showSection('professores');
    } catch (error) {
        console.error('Erro ao alocar professor:', error);
        showNotification('Erro ao alocar professor: ' + error.message, 'error');
    }
}

// Desalocar professor de turma 
async function desalocarProfessor(professorId, materiaId, materiaNome) {
    if (!confirm(`Tem certeza que deseja remover o professor da matéria "${materiaNome}"?`)) {
        return;
    }

    try {
        // NOTA: Esta rota pode precisar ser implementada no backend
        // Por enquanto, vamos usar a rota de remover professor da turma
        const response = await fetch(`${API_BASE}/admin/turmas/${materiaId}/professores/${professorId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            showNotification('Professor desalocado com sucesso!', 'success');
            // Recarregar detalhes do professor
            viewProfessorDetails(professorId);
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao desalocar professor');
        }
    } catch (error) {
        showNotification('Erro ao desalocar professor: ' + error.message, 'error');
    }
}

// Editar professor
async function editProfessor(professorId) {
    try {
        const response = await fetch(`${API_BASE}/admin/professores/${professorId}`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar dados do professor');
        }

        const data = await response.json();
        const professor = data.professor;

        const modalContent = `
            <div class="modal-header">
                <h3>Editar Professor</h3>
                <button class="modal-close" onclick="closeModal('edit-professor-modal')">&times;</button>
            </div>
            <form id="edit-professor-form" onsubmit="updateProfessor(${professorId}, event)">
                <div class="form-row">
                    <div class="form-group">
                        <label for="edit-professor-nome">Nome Completo *</label>
                        <input type="text" id="edit-professor-nome" value="${professor.nome}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-professor-email">Email *</label>
                        <input type="email" id="edit-professor-email" value="${professor.email}" required>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="edit-professor-telefone">Telefone</label>
                        <input type="tel" id="edit-professor-telefone" value="${professor.telefone || ''}" placeholder="(11) 99999-9999">
                    </div>
                    <div class="form-group">
                        <label for="edit-professor-formacao">Formação Acadêmica</label>
                        <input type="text" id="edit-professor-formacao" value="${professor.formacao || ''}" placeholder="Ex: Licenciatura em Matemática">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="edit-professor-experiencia">Experiência (anos)</label>
                    <input type="number" id="edit-professor-experiencia" value="${professor.experiencia || 0}" min="0" max="50">
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal('edit-professor-modal')">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Salvar Alterações</button>
                </div>
            </form>
        `;

        showCustomModal('edit-professor-modal', modalContent);

    } catch (error) {
        console.error('Erro ao carregar professor para edição:', error);
        showNotification('Erro ao carregar dados do professor: ' + error.message, 'error');
    }
}

// Atualizar professor
async function updateProfessor(professorId, event) {
    event.preventDefault();

    const formData = {
        nome: document.getElementById('edit-professor-nome').value,
        email: document.getElementById('edit-professor-email').value,
        telefone: document.getElementById('edit-professor-telefone').value || null,
        formacao: document.getElementById('edit-professor-formacao').value || null,
        experiencia: document.getElementById('edit-professor-experiencia').value || null
    };

    try {
        const response = await fetch(`${API_BASE}/admin/professores/${professorId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok) {
            showNotification('Professor atualizado com sucesso!', 'success');
            closeModal('edit-professor-modal');
            showSection('professores');
        } else {
            throw new Error(result.error || 'Erro ao atualizar professor');
        }
    } catch (error) {
        showNotification('Erro ao atualizar professor: ' + error.message, 'error');
    }
}

// Excluir professor
async function deleteProfessor(professorId) {
    if (!confirm('Tem certeza que deseja excluir este professor?\n\nEsta ação não pode ser desfeita.')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/admin/professores/${professorId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao excluir professor');
        }

        showNotification('Professor excluído com sucesso!', 'success');
        showSection('professores');
    } catch (error) {
        showNotification('Erro ao excluir professor: ' + error.message, 'error');
    }
}

// Atualizar a função showSection para incluir a seção de professores
// Adicione este case no switch statement da função showSection no app.js:

// Gerenciar Alunos
async function loadAlunosSection() {
    try {
        const response = await fetch(`${API_BASE}/admin/alunos-completo`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar alunos');
        }

        const data = await response.json();

        return `
            <div class="section">
                <div class="section-header">
                    <h2>Gerenciar Alunos</h2>
                    <button class="btn btn-primary" onclick="openCreateAlunoModal()">
                        <i class="fas fa-plus"></i> Novo Aluno
                    </button>
                </div>
                
                <div class="dashboard">
                    <div class="card">
                        <div class="card-header">
                            <div>
                                <h3>${data.alunos ? data.alunos.length : 0}</h3>
                                <p>Total de Alunos</p>
                            </div>
                            <div class="card-icon blue">
                                <i class="fas fa-user-graduate"></i>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="card-header">
                            <div>
                                <h3>${data.alunos ? data.alunos.filter(a => a.turma_id).length : 0}</h3>
                                <p>Alunos Matriculados</p>
                            </div>
                            <div class="card-icon green">
                                <i class="fas fa-users"></i>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="card-header">
                            <div>
                                <h3>${data.alunos ? data.alunos.filter(a => !a.turma_id).length : 0}</h3>
                                <p>Sem Matrícula</p>
                            </div>
                            <div class="card-icon orange">
                                <i class="fas fa-exclamation-circle"></i>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Email</th>
                                <th>Matrícula</th>
                                <th>Turma</th>
                                <th>Média Geral</th>
                                <th>Avaliações</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.alunos && data.alunos.length > 0 ? data.alunos.map(aluno => `
                                <tr>
                                    <td>
                                        <div class="student-info">
                                            <strong>${aluno.nome}</strong>
                                            ${aluno.telefone ? `<br><small>${aluno.telefone}</small>` : ''}
                                        </div>
                                    </td>
                                    <td>${aluno.email}</td>
                                    <td>${aluno.matricula}</td>
                                    <td>
                                        ${aluno.turma_nome ? `
                                            <span class="badge badge-success">${aluno.turma_nome}</span>
                                        ` : `
                                            <span class="badge badge-warning">Sem turma</span>
                                        `}
                                    </td>
                                    <td>
                                        <span class="badge ${getNotaBadgeClass(aluno.media_geral)}">
                                            ${aluno.media_geral ? aluno.media_geral.toFixed(1) : 'N/A'}
                                        </span>
                                    </td>
                                    <td>${aluno.total_avaliacoes || 0}</td>
                                    <td>
                                        <button class="btn btn-sm btn-info" onclick="editAluno(${aluno.id})" title="Editar">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-sm btn-danger" onclick="deleteAluno(${aluno.id})" 
                                                ${aluno.total_avaliacoes > 0 ? 'disabled title="Não é possível excluir aluno com avaliações"' : 'title="Excluir aluno"'}>
                                            <i class="fas fa-trash"></i>
                                        </button>
                                        <button class="btn btn-sm btn-success" onclick="viewAlunoDetails(${aluno.id})" title="Ver detalhes">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('') : `
                                <tr>
                                    <td colspan="7" class="text-center">Nenhum aluno encontrado</td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Erro ao carregar alunos:', error);
        return `
            <div class="section">
                <h3>Erro ao carregar alunos</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

function openCreateAlunoModal() {
    // Carregar TODAS as turmas (incluindo as lotadas)
    fetch(`${API_BASE}/admin/todas-turmas`, {
        headers: getAuthHeaders()
    })
        .then(response => response.json())
        .then(data => {
            const turmasOptions = data.turmas ? data.turmas.map(turma => `
            <option value="${turma.id}" ${turma.alunos_matriculados >= turma.capacidade_max ? 'disabled' : ''}>
                ${turma.nome} (${turma.alunos_matriculados}/${turma.capacidade_max})
                ${turma.alunos_matriculados >= turma.capacidade_max ? ' - LOTADA' : ''}
            </option>
        `).join('') : '<option value="">Nenhuma turma disponível</option>';

            const modalContent = `
            <div class="modal-header">
                <h3>Cadastrar Novo Aluno</h3>
                <button class="modal-close" onclick="closeModal('create-aluno-modal')">&times;</button>
            </div>
            <form id="create-aluno-form" onsubmit="createAluno(event)">
                <div class="form-row">
                    <div class="form-group">
                        <label for="aluno-nome">Nome Completo *</label>
                        <input type="text" id="aluno-nome" required placeholder="Nome do aluno">
                    </div>
                    <div class="form-group">
                        <label for="aluno-email">Email *</label>
                        <input type="email" id="aluno-email" required placeholder="aluno@escola.com">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="aluno-matricula">Matrícula *</label>
                        <input type="text" id="aluno-matricula" required placeholder="20240001">
                    </div>
                    <div class="form-group">
                        <label for="aluno-senha">Senha *</label>
                        <input type="password" id="aluno-senha" required placeholder="Senha para acesso">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="aluno-turma">Turma</label>
                        <select id="aluno-turma">
                            <option value="">Selecione uma turma</option>
                            ${turmasOptions}
                        </select>
                        <small>Turmas lotadas aparecem desabilitadas</small>
                    </div>
                    <div class="form-group">
                        <label for="aluno-nascimento">Data de Nascimento</label>
                        <input type="date" id="aluno-nascimento">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="aluno-endereco">Endereço</label>
                    <textarea id="aluno-endereco" placeholder="Endereço completo"></textarea>
                </div>
                
                <div class="form-group">
                    <label for="aluno-telefone">Telefone</label>
                    <input type="tel" id="aluno-telefone" placeholder="(11) 99999-9999">
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal('create-aluno-modal')">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Cadastrar Aluno</button>
                </div>
            </form>
        `;

            showCustomModal('create-aluno-modal', modalContent);
        })
        .catch(error => {
            console.error('Erro ao carregar turmas:', error);
            showNotification('Erro ao carregar turmas: ' + error.message, 'error');

            // Fallback: mostrar modal mesmo sem as turmas
            const fallbackModalContent = `
            <div class="modal-header">
                <h3>Cadastrar Novo Aluno</h3>
                <button class="modal-close" onclick="closeModal('create-aluno-modal')">&times;</button>
            </div>
            <form id="create-aluno-form" onsubmit="createAluno(event)">
                <div class="form-row">
                    <div class="form-group">
                        <label for="aluno-nome">Nome Completo *</label>
                        <input type="text" id="aluno-nome" required placeholder="Nome do aluno">
                    </div>
                    <div class="form-group">
                        <label for="aluno-email">Email *</label>
                        <input type="email" id="aluno-email" required placeholder="aluno@escola.com">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="aluno-matricula">Matrícula *</label>
                        <input type="text" id="aluno-matricula" required placeholder="20240001">
                    </div>
                    <div class="form-group">
                        <label for="aluno-senha">Senha *</label>
                        <input type="password" id="aluno-senha" required placeholder="Senha para acesso">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="aluno-turma">Turma</label>
                        <select id="aluno-turma">
                            <option value="">Erro ao carregar turmas</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="aluno-nascimento">Data de Nascimento</label>
                        <input type="date" id="aluno-nascimento">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="aluno-endereco">Endereço</label>
                    <textarea id="aluno-endereco" placeholder="Endereço completo"></textarea>
                </div>
                
                <div class="form-group">
                    <label for="aluno-telefone">Telefone</label>
                    <input type="tel" id="aluno-telefone" placeholder="(11) 99999-9999">
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal('create-aluno-modal')">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Cadastrar Aluno</button>
                </div>
            </form>
        `;
            showCustomModal('create-aluno-modal', fallbackModalContent);
        });
}

async function createAluno(event) {
    event.preventDefault();

    const formData = {
        nome: document.getElementById('aluno-nome').value,
        email: document.getElementById('aluno-email').value,
        matricula: document.getElementById('aluno-matricula').value,
        senha: document.getElementById('aluno-senha').value,
        turma_id: document.getElementById('aluno-turma').value || null,
        data_nascimento: document.getElementById('aluno-nascimento').value || null,
        endereco: document.getElementById('aluno-endereco').value || null,
        telefone: document.getElementById('aluno-telefone').value || null
    };

    try {
        const response = await fetch(`${API_BASE}/admin/alunos`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok) {
            showNotification('Aluno cadastrado com sucesso!', 'success');
            closeModal('create-aluno-modal');
            showSection('alunos');
        } else {
            throw new Error(result.error || 'Erro ao cadastrar aluno');
        }
    } catch (error) {
        showNotification('Erro ao cadastrar aluno: ' + error.message, 'error');
    }
}

async function deleteAluno(alunoId) {
    if (!confirm('Tem certeza que deseja excluir este aluno?\n\nEsta ação não pode ser desfeita.')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/admin/alunos/${alunoId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao excluir aluno');
        }

        showNotification('Aluno excluído com sucesso!', 'success');
        showSection('alunos');
    } catch (error) {
        showNotification('Erro ao excluir aluno: ' + error.message, 'error');
    }
}

// Função para abrir modal de edição de aluno
async function editAluno(alunoId) {
    try {
        console.log('Carregando dados do aluno:', alunoId);

        // Carregar dados do aluno
        const alunoResponse = await fetch(`${API_BASE}/admin/alunos/${alunoId}`, {
            headers: getAuthHeaders()
        });

        if (!alunoResponse.ok) {
            throw new Error('Erro ao carregar dados do aluno');
        }

        const alunoData = await alunoResponse.json();
        const aluno = alunoData.aluno;

        // Carregar todas as turmas
        const turmasResponse = await fetch(`${API_BASE}/admin/todas-turmas`, {
            headers: getAuthHeaders()
        });

        if (!turmasResponse.ok) {
            throw new Error('Erro ao carregar turmas');
        }

        const turmasData = await turmasResponse.json();

        const turmasOptions = turmasData.turmas ? turmasData.turmas.map(turma => `
            <option value="${turma.id}" ${aluno.turma_id == turma.id ? 'selected' : ''}>
                ${turma.nome} (${turma.alunos_matriculados}/${turma.capacidade_max})
                ${turma.alunos_matriculados >= turma.capacidade_max ? ' - LOTADA' : ''}
            </option>
        `).join('') : '<option value="">Nenhuma turma disponível</option>';

        const modalContent = `
            <div class="modal-header">
                <h3>Editar Aluno</h3>
                <button class="modal-close" onclick="closeModal('edit-aluno-modal')">&times;</button>
            </div>
            <form id="edit-aluno-form" onsubmit="updateAluno(${alunoId}, event)">
                <div class="form-row">
                    <div class="form-group">
                        <label for="edit-aluno-nome">Nome Completo *</label>
                        <input type="text" id="edit-aluno-nome" value="${aluno.nome}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-aluno-email">Email *</label>
                        <input type="email" id="edit-aluno-email" value="${aluno.email}" required>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="edit-aluno-matricula">Matrícula *</label>
                        <input type="text" id="edit-aluno-matricula" value="${aluno.matricula}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-aluno-turma">Turma</label>
                        <select id="edit-aluno-turma">
                            <option value="">Sem turma</option>
                            ${turmasOptions}
                        </select>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="edit-aluno-nascimento">Data de Nascimento</label>
                        <input type="date" id="edit-aluno-nascimento" value="${aluno.data_nascimento || ''}">
                    </div>
                    <div class="form-group">
                        <label for="edit-aluno-telefone">Telefone</label>
                        <input type="tel" id="edit-aluno-telefone" value="${aluno.telefone || ''}" placeholder="(11) 99999-9999">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="edit-aluno-endereco">Endereço</label>
                    <textarea id="edit-aluno-endereco" placeholder="Endereço completo">${aluno.endereco || ''}</textarea>
                </div>
                
                <div class="form-group">
                    <label>Informações do Aluno</label>
                    <div class="info-box">
                        <p><strong>ID:</strong> ${aluno.id}</p>
                        <p><strong>Usuário ID:</strong> ${aluno.usuario_id}</p>
                        <p><strong>Turma atual:</strong> ${aluno.turma_nome || 'Sem turma'}</p>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal('edit-aluno-modal')">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Salvar Alterações</button>
                </div>
            </form>
        `;

        showCustomModal('edit-aluno-modal', modalContent);

    } catch (error) {
        console.error('Erro ao carregar aluno para edição:', error);
        showNotification('Erro ao carregar dados do aluno: ' + error.message, 'error');
    }
}

// Função para atualizar aluno
async function updateAluno(alunoId, event) {
    event.preventDefault();

    const formData = {
        nome: document.getElementById('edit-aluno-nome').value,
        email: document.getElementById('edit-aluno-email').value,
        matricula: document.getElementById('edit-aluno-matricula').value,
        turma_id: document.getElementById('edit-aluno-turma').value || null,
        data_nascimento: document.getElementById('edit-aluno-nascimento').value || null,
        endereco: document.getElementById('edit-aluno-endereco').value || null,
        telefone: document.getElementById('edit-aluno-telefone').value || null
    };

    console.log('Enviando dados para atualização do aluno:', formData);

    try {
        const response = await fetch(`${API_BASE}/admin/alunos/${alunoId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok) {
            showNotification('Aluno atualizado com sucesso!', 'success');
            closeModal('edit-aluno-modal');
            // Recarregar a seção de alunos
            showSection('alunos');
        } else {
            throw new Error(result.error || 'Erro ao atualizar aluno');
        }
    } catch (error) {
        console.error('Erro ao atualizar aluno:', error);
        showNotification('Erro ao atualizar aluno: ' + error.message, 'error');
    }
}

// Função para visualizar detalhes completos do aluno
async function viewAlunoDetails(alunoId) {
    try {
        // Carregar dados completos do aluno
        const alunoResponse = await fetch(`${API_BASE}/admin/alunos/${alunoId}`, {
            headers: getAuthHeaders()
        });

        if (!alunoResponse.ok) {
            throw new Error('Erro ao carregar dados do aluno');
        }

        const alunoData = await alunoResponse.json();
        const aluno = alunoData.aluno;

        // Carregar notas do aluno
        const notasResponse = await fetch(`${API_BASE}/aluno/minhas-notas`, {
            headers: getAuthHeaders()
        });

        let notasHTML = '<p>Nenhuma nota registrada</p>';
        if (notasResponse.ok) {
            const notasData = await notasResponse.json();
            if (notasData.notas && notasData.notas.length > 0) {
                notasHTML = notasData.notas.map(nota => `
                    <div class="nota-item">
                        <strong>${nota.atividade_titulo}</strong> - 
                        <span class="badge ${getNotaBadgeClass(nota.nota)}">${nota.nota}</span>
                        <br><small>${nota.materia_nome} - ${new Date(nota.data_avaliacao).toLocaleDateString('pt-BR')}</small>
                    </div>
                `).join('');
            }
        }

        const modalContent = `
            <div class="modal-header">
                <h3>Detalhes do Aluno</h3>
                <button class="modal-close" onclick="closeModal('view-aluno-modal')">&times;</button>
            </div>
            <div class="modal-body" width="50%">
                <div class="student-details">
                    <div class="detail-section">
                        <h4>Informações Pessoais</h4>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <strong>Nome:</strong> ${aluno.nome}
                            </div>
                            <div class="detail-item">
                                <strong>Email:</strong> ${aluno.email}
                            </div>
                            <div class="detail-item">
                                <strong>Matrícula:</strong> ${aluno.matricula}
                            </div>
                            <div class="detail-item">
                                <strong>Data Nasc.:</strong> ${aluno.data_nascimento ? new Date(aluno.data_nascimento).toLocaleDateString('pt-BR') : 'Não informada'}
                            </div>
                            <div class="detail-item">
                                <strong>Telefone:</strong> ${aluno.telefone || 'Não informado'}
                            </div>
                            <div class="detail-item">
                                <strong>Turma:</strong> ${aluno.turma_nome ? `<span class="badge badge-success">${aluno.turma_nome}</span>` : '<span class="badge badge-warning">Sem turma</span>'}
                            </div>
                        </div>
                    </div>
                    
                    ${aluno.endereco ? `
                    <div class="detail-section">
                        <h4>Endereço</h4>
                        <p>${aluno.endereco}</p>
                    </div>
                    ` : ''}
                    
                    <div class="detail-section">
                        <h4>Notas e Avaliações</h4>
                        <div class="notas-list">
                            ${notasHTML}
                        </div>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-primary" onclick="closeModal('view-aluno-modal'); editAluno(${alunoId})">
                        <i class="fas fa-edit"></i> Editar Aluno
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="closeModal('view-aluno-modal')">
                        Fechar
                    </button>
                </div>
            </div>
        `;

        showCustomModal('view-aluno-modal', modalContent);

    } catch (error) {
        console.error('Erro ao carregar detalhes do aluno:', error);
        showNotification('Erro ao carregar detalhes do aluno: ' + error.message, 'error');
    }
}

// Função para abrir modal de edição de turma
async function editTurma(turmaId) {
    try {
        console.log('Carregando dados da turma:', turmaId);

        const response = await fetch(`${API_BASE}/admin/turmas/${turmaId}`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar dados da turma');
        }

        const data = await response.json();
        const turma = data.turma;

        const modalContent = `
            <div class="modal-header">
                <h3>Editar Turma</h3>
                <button class="modal-close" onclick="closeModal('edit-turma-modal')">&times;</button>
            </div>
            <form id="edit-turma-form" onsubmit="updateTurma(${turmaId}, event)">
                <div class="form-group">
                    <label for="edit-turma-nome">Nome da Turma *</label>
                    <input type="text" id="edit-turma-nome" value="${turma.nome}" required>
                </div>
                <div class="form-group">
                    <label for="edit-turma-codigo">Código *</label>
                    <input type="text" id="edit-turma-codigo" value="${turma.codigo}" required>
                </div>
                <div class="form-group">
                    <label for="edit-turma-descricao">Descrição</label>
                    <textarea id="edit-turma-descricao">${turma.descricao || ''}</textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="edit-turma-ano">Ano Letivo *</label>
                        <input type="text" id="edit-turma-ano" value="${turma.ano_letivo}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-turma-periodo">Período *</label>
                        <select id="edit-turma-periodo" required>
                            <option value="manhã" ${turma.periodo === 'manhã' ? 'selected' : ''}>Manhã</option>
                            <option value="tarde" ${turma.periodo === 'tarde' ? 'selected' : ''}>Tarde</option>
                            <option value="noite" ${turma.periodo === 'noite' ? 'selected' : ''}>Noite</option>
                            <option value="integral" ${turma.periodo === 'integral' ? 'selected' : ''}>Integral</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label for="edit-turma-capacidade">Capacidade Máxima</label>
                    <input type="number" id="edit-turma-capacidade" 
                           value="${turma.capacidade_max || 90}" 
                           min="30" max="90" required>
                    <small>
                        Alunos matriculados: ${turma.alunos_matriculados || 0}<br>
                        Mínimo: 30, Máximo: 90 alunos
                    </small>
                </div>
                <div class="form-group">
                    <label>Informações da Turma</label>
                    <div class="info-box">
                        <p><strong>Criada por:</strong> ${turma.criado_por_nome || 'Admin'}</p>
                        <p><strong>Data de criação:</strong> ${new Date(turma.criado_em).toLocaleDateString('pt-BR')}</p>
                        <p><strong>Alunos matriculados:</strong> ${turma.alunos_matriculados || 0}</p>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal('edit-turma-modal')">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Salvar Alterações</button>
                </div>
            </form>
        `;

        showCustomModal('edit-turma-modal', modalContent);

    } catch (error) {
        console.error('Erro ao carregar turma para edição:', error);
        showNotification('Erro ao carregar dados da turma: ' + error.message, 'error');
    }
}

// Função para atualizar turma
async function updateTurma(turmaId, event) {
    event.preventDefault();

    const formData = {
        nome: document.getElementById('edit-turma-nome').value,
        codigo: document.getElementById('edit-turma-codigo').value,
        descricao: document.getElementById('edit-turma-descricao').value,
        ano_letivo: document.getElementById('edit-turma-ano').value,
        periodo: document.getElementById('edit-turma-periodo').value,
        capacidade_max: parseInt(document.getElementById('edit-turma-capacidade').value)
    };

    console.log('Enviando dados para atualização:', formData);

    try {
        const response = await fetch(`${API_BASE}/admin/turmas/${turmaId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify(formData)
        });

        const responseText = await response.text();
        console.log('Resposta do servidor:', responseText);

        let result;
        try {
            result = JSON.parse(responseText);
        } catch (e) {
            throw new Error('Resposta inválida do servidor');
        }

        if (response.ok) {
            showNotification('Turma atualizada com sucesso!', 'success');
            closeModal('edit-turma-modal');
            // Recarregar a seção de turmas
            showSection('turmas');
        } else {
            throw new Error(result.error || 'Erro ao atualizar turma');
        }
    } catch (error) {
        console.error('Erro ao atualizar turma:', error);
        showNotification('Erro ao atualizar turma: ' + error.message, 'error');
    }
}


// Função para visualizar detalhes completos da turma - MELHORADA
async function viewTurmaDetails(turmaId) {
    try {
        console.log('Carregando detalhes da turma:', turmaId);

        // Mostrar loading
        const modalContent = `
            <div class="modal-header">
                <h3>Carregando detalhes da turma...</h3>
                <button class="modal-close" onclick="closeModal('view-turma-modal')">&times;</button>
            </div>
            <div class="modal-body">
                <div class="loading-state">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Carregando informações da turma...</p>
                </div>
            </div>
        `;
        showCustomModal('view-turma-modal', modalContent);

        let turma = null;
        let alunos = [];
        let professores = [];

        // Tentar carregar dados da turma
        try {
            const turmaResponse = await fetchWithTimeout(`${API_BASE}/admin/turmas/${turmaId}`, {
                method: 'GET',
                headers: getAuthHeaders(),
            }, 5000);

            if (turmaResponse.ok) {
                const turmaData = await turmaResponse.json();
                turma = turmaData.turma;
            } else {
                console.warn('Erro ao carregar turma, usando dados mock');
                turma = await getTurmaMockData(turmaId);
            }
        } catch (turmaError) {
            console.warn('Erro de conexão ao carregar turma:', turmaError);
            turma = await getTurmaMockData(turmaId);
        }

        // Tentar carregar alunos
        try {
            const alunosResponse = await fetchWithTimeout(`${API_BASE}/admin/turmas/${turmaId}/alunos`, {
                method: 'GET',
                headers: getAuthHeaders(),
            }, 5000);

            if (alunosResponse.ok) {
                const alunosData = await alunosResponse.json();
                alunos = alunosData.alunos || [];
            } else {
                console.warn('Erro ao carregar alunos, usando dados mock');
                alunos = await getAlunosMockData(turmaId);
            }
        } catch (alunoError) {
            console.warn('Erro de conexão ao carregar alunos:', alunoError);
            alunos = await getAlunosMockData(turmaId);
        }

        // Tentar carregar professores - COM MELHOR TRATAMENTO DE ERRO
        try {
            const professoresResponse = await fetchWithTimeout(`${API_BASE}/admin/turmas/${turmaId}/professores`, {
                method: 'GET',
                headers: getAuthHeaders(),
            }, 5000);

            if (professoresResponse.ok) {
                const professoresData = await professoresResponse.json();
                professores = professoresData.professores || [];
                console.log('Professores carregados:', professores);
            } else {
                console.warn('Erro ao carregar professores, usando dados mock');
                professores = await getProfessoresMockData(turmaId);
            }
        } catch (professorError) {
            console.warn('Erro de conexão ao carregar professores:', professorError);
            professores = await getProfessoresMockData(turmaId);
        }

        // Renderizar modal com os dados
        renderTurmaDetailsModal(turma, alunos, professores);

    } catch (error) {
        console.error('Erro crítico ao carregar detalhes da turma:', error);

        const errorContent = `
            <div class="modal-header">
                <h3>Erro ao Carregar Dados</h3>
                <button class="modal-close" onclick="closeModal('view-turma-modal')">&times;</button>
            </div>
            <div class="modal-body">
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h4>Erro de Conexão</h4>
                    <p>Não foi possível carregar todos os dados da turma.</p>
                    <p><strong>Detalhes:</strong> ${error.message}</p>
                    
                    <div class="form-actions">
                        <button type="button" class="btn btn-primary" onclick="viewTurmaDetailsWithMock(${turmaId})">
                            <i class="fas fa-eye"></i> Continuar com Dados Demo
                        </button>
                        <button type="button" class="btn btn-secondary" onclick="closeModal('view-turma-modal')">
                            Fechar
                        </button>
                    </div>
                </div>
            </div>
        `;

        showCustomModal('view-turma-modal', errorContent);
    }
}

// Função auxiliar para fetch com timeout
function fetchWithTimeout(url, options = {}, timeout = 8000) {
    return Promise.race([
        fetch(url, options),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), timeout)
        )
    ]);
}

// Função para usar apenas dados mock
async function viewTurmaDetailsWithMock(turmaId) {
    const turma = await getTurmaMockData(turmaId);
    const alunos = await getAlunosMockData(turmaId);
    const professores = await getProfessoresMockData(turmaId);
    renderTurmaDetailsModal(turma, alunos, professores);
}

// Dados mock para fallback
async function getTurmaMockData(turmaId) {
    const turmasMock = {
        1: { id: 1, nome: "1º Ano A - Manhã", codigo: "1A2024", ano_letivo: "2024", periodo: "manhã", capacidade_max: 90, alunos_matriculados: 25, descricao: "Turma do primeiro ano do ensino fundamental" },
        2: { id: 2, nome: "2º Ano B - Tarde", codigo: "2B2024", ano_letivo: "2024", periodo: "tarde", capacidade_max: 90, alunos_matriculados: 28, descricao: "Turma do segundo ano do ensino fundamental" },
        3: { id: 3, nome: "3º Ano C - Manhã", codigo: "3C2024", ano_letivo: "2024", periodo: "manhã", capacidade_max: 90, alunos_matriculados: 22, descricao: "" }
    };

    return turmasMock[turmaId] || {
        id: turmaId,
        nome: `Turma ${turmaId}`,
        codigo: `T${turmaId}2024`,
        ano_letivo: "2024",
        periodo: "manhã",
        capacidade_max: 90,
        alunos_matriculados: 0,
        descricao: "Turma de exemplo"
    };
}

async function getAlunosMockData(turmaId) {
    const alunosMock = [
        { id: 1, nome: "Ana Silva", matricula: "20240001", email: "ana.silva@escola.com", telefone: "(11) 99999-0001", media_geral: 8.5 },
        { id: 2, nome: "Bruno Oliveira", matricula: "20240002", email: "bruno.oliveira@escola.com", telefone: "(11) 99999-0002", media_geral: 7.2 },
        { id: 3, nome: "Carla Santos", matricula: "20240003", email: "carla.santos@escola.com", telefone: "(11) 99999-0003", media_geral: 9.1 },
        { id: 4, nome: "Daniel Costa", matricula: "20240004", email: "daniel.costa@escola.com", telefone: "(11) 99999-0004", media_geral: 6.8 },
        { id: 5, nome: "Eduarda Lima", matricula: "20240005", email: "eduarda.lima@escola.com", telefone: "(11) 99999-0005", media_geral: 8.9 }
    ];

    return alunosMock;
}

async function getProfessoresMockData(turmaId) {
    const professoresMock = [
        { id: 1, nome: "Prof. Maria Santos", email: "maria.santos@escola.com", telefone: "(11) 99999-1001", materia_principal: "Matemática" },
        { id: 2, nome: "Prof. João Silva", email: "joao.silva@escola.com", telefone: "(11) 99999-1002", materia_principal: "Português" },
        { id: 3, nome: "Prof. Ana Costa", email: "ana.costa@escola.com", telefone: "(11) 99999-1003", materia_principal: "Ciências" }
    ];

    return professoresMock;
}

function renderTurmaDetailsModal(turma, alunos, professores) {
    const modalContent = `
        <div class="modal-header">
            <h3>Detalhes da Turma - ${turma.nome}</h3>
            <div class="header-badges">
                <span class="badge badge-info">ID: ${turma.id}</span>
                <span class="badge-status-expanded ${alunos.length < turma.capacidade_max ? 'badge-disponivel' : 'badge-lotada'}">
                    ${alunos.length < turma.capacidade_max ? '📚 Com Vagas' : '🚫 Lotada'}
                </span>
            </div>
            <button class="modal-close" onclick="closeModal('view-turma-modal')">&times;</button>
        </div>
        <div class="modal-body turma-detalhes-body">
            <div class="turma-details-expanded">
                <!-- Estatísticas Rápidas Expandidas -->
                <div class="stats-cards-expanded">
                    <div class="stat-card-expanded">
                        <div class="stat-card-icon-expanded alunos">
                            <i class="fas fa-user-graduate"></i>
                        </div>
                        <div class="stat-card-value-expanded">${alunos.length}</div>
                        <div class="stat-card-label-expanded">Total de Alunos</div>
                    </div>
                    <div class="stat-card-expanded">
                        <div class="stat-card-icon-expanded professores">
                            <i class="fas fa-chalkboard-teacher"></i>
                        </div>
                        <div class="stat-card-value-expanded">${professores.length}</div>
                        <div class="stat-card-label-expanded">Professores</div>
                    </div>
                    <div class="stat-card-expanded">
                        <div class="stat-card-icon-expanded capacidade">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="stat-card-value-expanded">${turma.capacidade_max}</div>
                        <div class="stat-card-label-expanded">Capacidade Máx</div>
                    </div>
                    <div class="stat-card-expanded">
                        <div class="stat-card-icon-expanded media">
                            <i class="fas fa-chart-line"></i>
                        </div>
                        <div class="stat-card-value-expanded">${calcularMediaTurma(alunos)}</div>
                        <div class="stat-card-label-expanded">Média Geral</div>
                    </div>
                </div>

                <!-- Informações da Turma Expandida -->
                <div class="detail-section-expanded">
                    <div class="detail-section-header-expanded">
                        <div class="detail-section-title-expanded">
                            <i class="fas fa-info-circle" style="color: var(--info);"></i>
                            <h4>Informações da Turma</h4>
                        </div>
                    </div>
                    <div class="turma-info-grid-expanded">
                        <div class="info-card-expanded">
                            <strong>📝 Nome da Turma</strong>
                            <span>${turma.nome}</span>
                        </div>
                        <div class="info-card-expanded">
                            <strong>🔢 Código</strong>
                            <span>${turma.codigo}</span>
                        </div>
                        <div class="info-card-expanded">
                            <strong>📅 Ano Letivo</strong>
                            <span>${turma.ano_letivo}</span>
                        </div>
                        <div class="info-card-expanded">
                            <strong>⏰ Período</strong>
                            <span>${turma.periodo}</span>
                        </div>
                        <div class="info-card-expanded">
                            <strong>👥 Capacidade</strong>
                            <span>${Math.max(0, alunos.length)} / ${turma.capacidade_max}</span>
                        </div>
                        <div class="info-card-expanded">
                            <strong>📊 Status</strong>
                            <span class="badge-status-expanded ${alunos.length < turma.capacidade_max ? 'badge-disponivel' : 'badge-lotada'}">
                                ${alunos.length < turma.capacidade_max ? '✅ Com Vagas' : '❌ Lotada'}
                            </span>
                        </div>
                    </div>
                    ${turma.descricao ? `
                        <div class="info-card-expanded" style="grid-column: 1 / -1;">
                            <strong>📋 Descrição</strong>
                            <span style="font-weight: 400; line-height: 1.6;">${turma.descricao}</span>
                        </div>
                    ` : ''}
                </div>

                <!-- Lista de Alunos Expandida -->
                <div class="detail-section-expanded">
                    <div class="detail-section-header-expanded">
                        <div class="detail-section-title-expanded">
                            <i class="fas fa-user-graduate" style="color: var(--success);"></i>
                            <h4>Alunos da Turma</h4>
                            <span class="integrantes-count-expanded">${alunos.length}</span>
                        </div>
                        ${alunos.length < turma.capacidade_max ? `
                            <button class="btn btn-primary" onclick="adicionarAlunoTurma(${turma.id})">
                                <i class="fas fa-plus"></i> Adicionar Aluno
                            </button>
                        ` : ''}
                    </div>
                    
                    ${alunos.length > 0 ? `
                        <div class="integrantes-grid-expanded">
                            ${alunos.map(aluno => `
                                <div class="integrante-card-expanded aluno">
                                    <div class="integrante-header-expanded">
                                        <div class="integrante-avatar-expanded">
                                            ${aluno.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                        </div>
                                        <div class="integrante-info-expanded">
                                            <div class="integrante-nome-expanded">${aluno.nome}</div>
                                            <div class="integrante-detalhes-expanded">
                                                <strong>Matrícula:</strong> ${aluno.matricula}
                                            </div>
                                            <div class="integrante-email-expanded">
                                                <i class="fas fa-envelope"></i> ${aluno.email}
                                            </div>
                                            ${aluno.telefone ? `
                                                <div class="integrante-detalhes-expanded">
                                                    <i class="fas fa-phone"></i> ${aluno.telefone}
                                                </div>
                                            ` : ''}
                                        </div>
                                    </div>
                                    <div class="integrante-stats-expanded">
                                        <div class="stat-item-expanded">
                                            <span class="stat-value-expanded ${getNotaBadgeClass(aluno.media_geral)}">
                                                ${aluno.media_geral ? aluno.media_geral.toFixed(1) : 'N/A'}
                                            </span>
                                            <span class="stat-label-expanded">Média Geral</span>
                                        </div>
                                        <div class="stat-item-expanded">
                                            <span class="stat-value-expanded">${aluno.total_avaliacoes || 0}</span>
                                            <span class="stat-label-expanded">Avaliações</span>
                                        </div>
                                    </div>
                                    <div class="integrante-actions-expanded">
                                        <button class="btn btn-info" onclick="viewAlunoDetails(${aluno.id})">
                                            <i class="fas fa-eye"></i> Ver Detalhes
                                        </button>
                                        <button class="btn btn-warning" onclick="removerAlunoTurma(${turma.id}, ${aluno.id}, '${aluno.nome.replace(/'/g, "\\'")}')">
                                            <i class="fas fa-user-minus"></i> Remover
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <div class="empty-state-integrantes-expanded">
                            <i class="fas fa-users-slash"></i>
                            <h5>Nenhum aluno matriculado</h5>
                            <p>Esta turma ainda não possui alunos matriculados. Clique no botão abaixo para adicionar o primeiro aluno.</p>
                            <button class="btn btn-primary btn-lg" onclick="adicionarAlunoTurma(${turma.id})">
                                <i class="fas fa-plus"></i> Adicionar Primeiro Aluno
                            </button>
                        </div>
                    `}
                </div>

                <!-- Lista de Professores Expandida -->
                <div class="detail-section-expanded">
                    <div class="detail-section-header-expanded">
                        <div class="detail-section-title-expanded">
                            <i class="fas fa-chalkboard-teacher" style="color: var(--warning);"></i>
                            <h4>Professores da Turma</h4>
                            <span class="integrantes-count-expanded">${professores.length}</span>
                        </div>
                        <button class="btn btn-primary" onclick="adicionarProfessorTurma(${turma.id})">
                            <i class="fas fa-plus"></i> Adicionar Professor
                        </button>
                    </div>
                    
                    ${professores.length > 0 ? `
                        <div class="integrantes-grid-expanded">
                            ${professores.map(professor => `
                                <div class="integrante-card-expanded professor">
                                    <div class="integrante-header-expanded">
                                        <div class="integrante-avatar-expanded">
                                            ${professor.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                        </div>
                                        <div class="integrante-info-expanded">
                                            <div class="integrante-nome-expanded">${professor.nome}</div>
                                            <div class="integrante-detalhes-expanded">
                                                <strong>Matéria:</strong> ${professor.materia_nome || 'Professor Geral'}
                                            </div>
                                            <div class="integrante-email-expanded">
                                                <i class="fas fa-envelope"></i> ${professor.email}
                                            </div>
                                            ${professor.telefone ? `
                                                <div class="integrante-detalhes-expanded">
                                                    <i class="fas fa-phone"></i> ${professor.telefone}
                                                </div>
                                            ` : ''}
                                        </div>
                                    </div>
                                    <div class="integrante-stats-expanded">
                                        <div class="stat-item-expanded">
                                            <span class="stat-value-expanded badge-ativo">Ativo</span>
                                            <span class="stat-label-expanded">Status</span>
                                        </div>
                                        <div class="stat-item-expanded">
                                            <span class="stat-value-expanded">${professor.turmas_count || 1}</span>
                                            <span class="stat-label-expanded">Turmas</span>
                                        </div>
                                    </div>
                                    <div class="integrante-actions-expanded">
                                        <button class="btn btn-info" onclick="viewProfessorDetails(${professor.id})">
                                            <i class="fas fa-eye"></i> Ver Detalhes
                                        </button>
                                        <button class="btn btn-warning" onclick="removerProfessorTurma(${turma.id}, ${professor.id}, '${professor.nome.replace(/'/g, "\\'")}')">
                                            <i class="fas fa-user-minus"></i> Remover
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <div class="empty-state-integrantes-expanded">
                            <i class="fas fa-chalkboard-teacher"></i>
                            <h5>Nenhum professor atribuído</h5>
                            <p>Esta turma ainda não possui professores designados. Clique no botão abaixo para adicionar o primeiro professor.</p>
                            <button class="btn btn-primary btn-lg" onclick="adicionarProfessorTurma(${turma.id})">
                                <i class="fas fa-plus"></i> Adicionar Primeiro Professor
                            </button>
                        </div>
                    `}
                </div>
            </div>
            
            <div class="form-actions-expanded">
                <button type="button" class="btn btn-primary" onclick="editTurma(${turma.id})">
                    <i class="fas fa-edit"></i> Editar Turma
                </button>
                <button type="button" class="btn btn-secondary" onclick="closeModal('view-turma-modal')">
                    <i class="fas fa-times"></i> Fechar
                </button>
            </div>
        </div>
    `;

    showCustomModal('view-turma-modal', modalContent);
}

// Função auxiliar para calcular média da turma
function calcularMediaTurma(alunos) {
    if (!alunos.length) return 'N/A';
    const soma = alunos.reduce((acc, aluno) => acc + (aluno.media_geral || 0), 0);
    return (soma / alunos.length).toFixed(1);
}

// =============================================
// FUNÇÕES DE GERENCIAMENTO DE ALUNOS NA TURMA
// =============================================

// Função para adicionar aluno à turma
async function adicionarAlunoTurma(turmaId) {
    try {
        // Carregar alunos sem turma
        const response = await fetch(`${API_BASE}/admin/alunos-sem-turma`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar alunos disponíveis');
        }

        const data = await response.json();
        const alunos = data.alunos || [];

        if (alunos.length === 0) {
            showNotification('Não há alunos disponíveis para adicionar à turma', 'warning');
            return;
        }

        // Carregar informações da turma para mostrar capacidade
        const turmaResponse = await fetch(`${API_BASE}/admin/turmas/${turmaId}`, {
            headers: getAuthHeaders()
        });

        let turmaInfo = '';
        if (turmaResponse.ok) {
            const turmaData = await turmaResponse.json();
            const turma = turmaData.turma;
            turmaInfo = `
                <div class="info-box" style="margin-bottom: 15px; padding: 10px; background: #e3f2fd; border-radius: 5px;">
                    <strong>Turma:</strong> ${turma.nome}<br>
                    <strong>Capacidade:</strong> ${turma.alunos_matriculados || 0}/${turma.capacidade_max} alunos
                </div>
            `;
        }

        const options = alunos.map(aluno => `
            <option value="${aluno.id}">
                ${aluno.nome} - ${aluno.matricula} - ${aluno.email}
                ${aluno.media_geral ? ` (Média: ${aluno.media_geral.toFixed(1)})` : ''}
            </option>
        `).join('');

        const modalContent = `
            <div class="modal-header">
                <h3>Adicionar Aluno à Turma</h3>
                <button class="modal-close" onclick="closeModal('add-aluno-turma-modal')">&times;</button>
            </div>
            <form onsubmit="adicionarAlunoTurmaSubmit(${turmaId}, event)">
                ${turmaInfo}
                <div class="form-group">
                    <label for="aluno-select">Selecionar Aluno *</label>
                    <select id="aluno-select" required>
                        <option value="">Selecione um aluno...</option>
                        ${options}
                    </select>
                    <small>${alunos.length} aluno(s) disponível(is) sem turma</small>
                </div>
                
                <div class="form-group">
                    <label for="data-matricula">Data de Matrícula</label>
                    <input type="date" id="data-matricula" value="${new Date().toISOString().split('T')[0]}">
                </div>
                
                <div class="form-group">
                    <label for="observacoes-aluno">Observações</label>
                    <textarea id="observacoes-aluno" placeholder="Observações sobre a matrícula (opcional)" rows="3"></textarea>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal('add-aluno-turma-modal')">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Adicionar à Turma</button>
                </div>
            </form>
        `;

        showCustomModal('add-aluno-turma-modal', modalContent);

    } catch (error) {
        console.error('Erro ao carregar alunos:', error);
        showNotification('Erro ao carregar alunos: ' + error.message, 'error');
    }
}

// Função para submeter adição de aluno à turma
async function adicionarAlunoTurmaSubmit(turmaId, event) {
    event.preventDefault();

    const alunoSelect = document.getElementById('aluno-select');
    const alunoId = alunoSelect.value;
    const dataMatricula = document.getElementById('data-matricula').value;
    const observacoes = document.getElementById('observacoes-aluno').value;

    if (!alunoId) {
        showNotification('Selecione um aluno', 'warning');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/admin/turmas/${turmaId}/alunos/${alunoId}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                data_matricula: dataMatricula || new Date().toISOString().split('T')[0],
                observacoes: observacoes || null
            })
        });

        if (response.ok) {
            showNotification('Aluno adicionado à turma com sucesso!', 'success');
            closeModal('add-aluno-turma-modal');
            // Recarregar os detalhes da turma
            viewTurmaDetails(turmaId);
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao adicionar aluno à turma');
        }
    } catch (error) {
        showNotification('Erro ao adicionar aluno: ' + error.message, 'error');
    }
}

// Função para remover aluno da turma
async function removerAlunoTurma(turmaId, alunoId, alunoNome) {
    if (!confirm(`Tem certeza que deseja remover o aluno "${alunoNome}" desta turma?\n\nO aluno permanecerá no sistema, mas ficará sem turma.`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/admin/turmas/${turmaId}/alunos/${alunoId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            showNotification('Aluno removido da turma com sucesso!', 'success');
            // Recarregar os detalhes da turma
            viewTurmaDetails(turmaId);
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao remover aluno da turma');
        }
    } catch (error) {
        showNotification('Erro ao remover aluno: ' + error.message, 'error');
    }
}

// =============================================
// FUNÇÕES DE GERENCIAMENTO DE PROFESSORES NA TURMA
// =============================================


// Função para adicionar professor à turma - CORRIGIDA
async function adicionarProfessorTurma(turmaId) {
    try {
        console.log('Carregando professores disponíveis para turma:', turmaId);

        // Carregar professores disponíveis
        const response = await fetch(`${API_BASE}/admin/professores-disponiveis`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
            throw new Error(errorData.error || `Erro ${response.status} ao carregar professores`);
        }

        const data = await response.json();
        const professores = data.professores || [];

        console.log('Professores carregados:', professores);

        if (professores.length === 0) {
            showNotification('Não há professores disponíveis para adicionar à turma', 'warning');
            return;
        }

        // Carregar matérias disponíveis
        const materiasResponse = await fetch(`${API_BASE}/admin/materias`, {
            headers: getAuthHeaders()
        });

        let materiasOptions = '<option value="">Selecione a matéria...</option>';
        if (materiasResponse.ok) {
            const materiasData = await materiasResponse.json();
            if (materiasData.materias) {
                materiasOptions += materiasData.materias.map(materia =>
                    `<option value="${materia.id}">${materia.nome}</option>`
                ).join('');
            }
        } else {
            // Fallback para matérias padrão se a API falhar
            materiasOptions = `
                <option value="1">Matemática</option>
                <option value="2">Português</option>
                <option value="3">Ciências</option>
                <option value="4">História</option>
                <option value="5">Geografia</option>
                <option value="6">Inglês</option>
                <option value="7">Educação Física</option>
                <option value="8">Artes</option>
            `;
        }

        const options = professores.map(professor => `
            <option value="${professor.id}">
                ${professor.nome} - ${professor.email} 
                ${professor.turmas_count ? ` (${professor.turmas_count} turmas)` : ''}
            </option>
        `).join('');

        const modalContent = `
            <div class="modal-header">
                <h3>Adicionar Professor à Turma</h3>
                <button class="modal-close" onclick="closeModal('add-professor-turma-modal')">&times;</button>
            </div>
            <form onsubmit="adicionarProfessorTurmaSubmit(${turmaId}, event)">
                <div class="form-group">
                    <label for="professor-select">Selecionar Professor *</label>
                    <select id="professor-select" required>
                        <option value="">Selecione um professor...</option>
                        ${options}
                    </select>
                    <small>${professores.length} professor(es) disponível(is)</small>
                </div>
                
                <div class="form-group">
                    <label for="materia-turma">Matéria *</label>
                    <select id="materia-turma" required>
                        ${materiasOptions}
                    </select>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="carga-horaria">Carga Horária Semanal (h)</label>
                        <input type="number" id="carga-horaria" min="1" max="40" value="4" required>
                    </div>
                    <div class="form-group">
                        <label for="data-inicio">Data de Início</label>
                        <input type="date" id="data-inicio" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="dias-aula">Dias de Aula *</label>
                    <div class="checkbox-group">
                        <label><input type="checkbox" name="dias" value="segunda"> Segunda</label>
                        <label><input type="checkbox" name="dias" value="terca"> Terça</label>
                        <label><input type="checkbox" name="dias" value="quarta"> Quarta</label>
                        <label><input type="checkbox" name="dias" value="quinta"> Quinta</label>
                        <label><input type="checkbox" name="dias" value="sexta"> Sexta</label>
                        <label><input type="checkbox" name="dias" value="sabado"> Sábado</label>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="observacoes-professor">Observações</label>
                    <textarea id="observacoes-professor" placeholder="Observações sobre a atribuição (opcional)" rows="3"></textarea>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal('add-professor-turma-modal')">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Adicionar à Turma</button>
                </div>
            </form>
        `;

        showCustomModal('add-professor-turma-modal', modalContent);

    } catch (error) {
        console.error('Erro detalhado ao carregar professores:', error);
        showNotification('Erro ao carregar professores: ' + error.message, 'error');

        // Fallback: mostrar modal mesmo sem professores
        const fallbackModalContent = `
            <div class="modal-header">
                <h3>Adicionar Professor à Turma</h3>
                <button class="modal-close" onclick="closeModal('add-professor-turma-modal')">&times;</button>
            </div>
            <div class="modal-body">
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h4>Erro ao carregar professores</h4>
                    <p>${error.message}</p>
                    <p><small>Verifique se há professores cadastrados no sistema.</small></p>
                    
                    <div class="form-actions">
                        <button type="button" class="btn btn-primary" onclick="closeModal('add-professor-turma-modal'); showSection('professores')">
                            <i class="fas fa-users"></i> Gerenciar Professores
                        </button>
                        <button type="button" class="btn btn-secondary" onclick="closeModal('add-professor-turma-modal')">
                            Fechar
                        </button>
                    </div>
                </div>
            </div>
        `;
        showCustomModal('add-professor-turma-modal', fallbackModalContent);
    }
}

// Função de debug - execute no console do navegador
async function debugAlocacaoProfessor() {
    try {
        console.log('🔍 Debug: Verificando alocação de professores...');

        // Testar carregamento de professores disponíveis
        const professoresRes = await fetch(`${API_BASE}/admin/professores-disponiveis`, {
            headers: getAuthHeaders()
        });
        const professoresData = await professoresRes.json();
        console.log('📊 Professores disponíveis:', professoresData.professores);

        // Testar carregamento de professores de uma turma específica
        const turmaId = 1; // Altere para a turma que está testando
        const turmaRes = await fetch(`${API_BASE}/admin/turmas/${turmaId}/professores`, {
            headers: getAuthHeaders()
        });
        const turmaData = await turmaRes.json();
        console.log(`📊 Professores na turma ${turmaId}:`, turmaData.professores);

        // Verificar estrutura do banco
        const materiasRes = await fetch(`${API_BASE}/admin/materias`, {
            headers: getAuthHeaders()
        });
        const materiasData = await materiasRes.json();
        console.log('📚 Matérias no sistema:', materiasData.materias);

    } catch (error) {
        console.error('❌ Erro no debug:', error);
    }
}

// Execute no console: debugAlocacaoProfessor()

// Função para submeter adição de professor à turma - SIMPLIFICADA
async function adicionarProfessorTurmaSubmit(turmaId, event) {
    event.preventDefault();

    const professorId = document.getElementById('professor-select').value;
    const materiaNome = document.getElementById('materia-nome').value;
    const cargaHoraria = document.getElementById('carga-horaria').value;
    const dataInicio = document.getElementById('data-inicio').value;
    const horarioAula = document.getElementById('horario-aula').value;
    const diaSemana = document.getElementById('dia-semana').value;
    const observacoes = document.getElementById('observacoes-professor').value;

    if (!professorId || !materiaNome || !horarioAula || !diaSemana) {
        showNotification('Preencha todos os campos obrigatórios', 'warning');
        return;
    }

    console.log('📤 Enviando dados para alocação:', {
        turmaId,
        professorId,
        materiaNome,
        cargaHoraria,
        dataInicio,
        horarioAula,
        diaSemana
    });

    try {
        const response = await fetch(`${API_BASE}/admin/turmas/${turmaId}/professores`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                professor_id: professorId,
                materia_nome: materiaNome,
                carga_horaria_semanal: parseInt(cargaHoraria),
                data_inicio: dataInicio,
                horario: horarioAula,
                dia_semana: diaSemana,
                observacoes: observacoes || null
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Erro na resposta:', errorText);
            throw new Error(`Erro ${response.status}: ${errorText}`);
        }

        const result = await response.json();

        showNotification('Professor alocado na turma com sucesso!', 'success');
        closeModal('add-professor-turma-modal');

        // Recarregar os detalhes da turma após um delay
        setTimeout(() => {
            viewTurmaDetails(turmaId);
        }, 1000);

    } catch (error) {
        console.error('❌ Erro ao adicionar professor:', error);
        showNotification('Erro ao adicionar professor: ' + error.message, 'error');
    }
}
// Função para visualizar detalhes do professor
async function viewProfessorDetails(professorId) {
    try {
        const response = await fetch(`${API_BASE}/admin/professores/${professorId}`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar dados do professor');
        }

        const data = await response.json();
        const professor = data.professor;

        // Carregar turmas do professor
        const turmasResponse = await fetch(`${API_BASE}/admin/professores/${professorId}/turmas`, {
            headers: getAuthHeaders()
        });

        let turmasHTML = '<p>Nenhuma turma atribuída</p>';
        if (turmasResponse.ok) {
            const turmasData = await turmasResponse.json();
            if (turmasData.turmas && turmasData.turmas.length > 0) {
                turmasHTML = turmasData.turmas.map(turma => `
                    <div class="turma-item">
                        <strong>${turma.turma_nome}</strong> - ${turma.materia_nome}
                        <br><small>Carga horária: ${turma.carga_horaria_semanal}h/semana</small>
                    </div>
                `).join('');
            }
        }

        const modalContent = `
            <div class="modal-header">
                <h3>Detalhes do Professor</h3>
                <button class="modal-close" onclick="closeModal('view-professor-modal')">&times;</button>
            </div>
            <div class="modal-body">
                <div class="professor-details">
                    <div class="detail-section">
                        <h4>Informações Pessoais</h4>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <strong>Nome:</strong> ${professor.nome}
                            </div>
                            <div class="detail-item">
                                <strong>Email:</strong> ${professor.email}
                            </div>
                            <div class="detail-item">
                                <strong>Telefone:</strong> ${professor.telefone || 'Não informado'}
                            </div>
                            
                            <div class="detail-item">
                                <strong>Formação:</strong> ${professor.formacao || 'Não informada'}
                            </div>
                            <div class="detail-item">
                                <strong>Status:</strong> 
                                <span class="badge ${professor.total_turmas ? 'badge-success' : 'badge-warning'}">
                                    ${professor.total_turmas > 0 ? 'Ativo' : 'Inativo'}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h4>Turmas Atribuídas</h4>
                        <div class="turmas-list">
                            ${turmasHTML}
                        </div>
                    </div>
                    
                    ${professor.experiencia ? `
                    <div class="detail-section">
                        <h4>Experiência Profissional</h4>
                        <p>${professor.experiencia}</p>
                    </div>
                    ` : ''}
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-primary" onclick="editProfessor(${professorId})">
                        <i class="fas fa-edit"></i> Editar Professor
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="closeModal('view-professor-modal')">
                        Fechar
                    </button>
                </div>
            </div>
        `;

        showCustomModal('view-professor-modal', modalContent);

    } catch (error) {
        console.error('Erro ao carregar detalhes do professor:', error);
        showNotification('Erro ao carregar detalhes do professor: ' + error.message, 'error');
    }
}

// Função para remover professor da turma
async function removerProfessorTurma(turmaId, professorId, professorNome) {
    if (!confirm(`Tem certeza que deseja remover o professor "${professorNome}" desta turma?\n\nEsta ação removerá a atribuição do professor para esta turma específica.`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/admin/turmas/${turmaId}/professores/${professorId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            showNotification('Professor removido da turma com sucesso!', 'success');
            // Recarregar os detalhes da turma
            viewTurmaDetails(turmaId);
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao remover professor da turma');
        }
    } catch (error) {
        showNotification('Erro ao remover professor: ' + error.message, 'error');
    }
}

// =============================================
// FUNÇÃO AUXILIAR PARA EDIÇÃO DE PROFESSOR
// =============================================




// Função para adicionar aluno à turma
async function adicionarAlunoTurma(turmaId) {
    try {
        // Carregar alunos sem turma
        const response = await fetch(`${API_BASE}/admin/alunos-sem-turma`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar alunos disponíveis');
        }

        const data = await response.json();
        const alunos = data.alunos || [];

        if (alunos.length === 0) {
            showNotification('Não há alunos disponíveis para adicionar à turma', 'warning');
            return;
        }

        const options = alunos.map(aluno => `
            <option value="${aluno.id}">${aluno.nome} - ${aluno.matricula} - ${aluno.email}</option>
        `).join('');

        const modalContent = `
            <div class="modal-header">
                <h3>Adicionar Aluno à Turma</h3>
                <button class="modal-close" onclick="closeModal('add-aluno-turma-modal')">&times;</button>
            </div>
            <form onsubmit="adicionarAlunoTurmaSubmit(${turmaId}, event)">
                <div class="form-group">
                    <label for="aluno-select">Selecionar Aluno</label>
                    <select id="aluno-select" required>
                        <option value="">Selecione um aluno...</option>
                        ${options}
                    </select>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal('add-aluno-turma-modal')">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Adicionar à Turma</button>
                </div>
            </form>
        `;

        showCustomModal('add-aluno-turma-modal', modalContent);

    } catch (error) {
        console.error('Erro ao carregar alunos:', error);
        showNotification('Erro ao carregar alunos: ' + error.message, 'error');
    }
}


// Função para adicionar aluno à turma 
async function adicionarAlunoTurmaSubmit(turmaId, event) {
    event.preventDefault();

    const alunoId = document.getElementById('aluno-select').value;

    if (!alunoId) {
        showNotification('Selecione um aluno', 'warning');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/admin/turmas/${turmaId}/alunos/${alunoId}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                data_matricula: new Date().toISOString().split('T')[0]
            })
        });

        if (response.ok) {
            showNotification('Aluno adicionado à turma com sucesso!', 'success');
            closeModal('add-aluno-turma-modal');
            viewTurmaDetails(turmaId);
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao adicionar aluno');
        }
    } catch (error) {
        showNotification('Erro ao adicionar aluno: ' + error.message, 'error');
    }
}

// Função para remover aluno da turma (JÁ EXISTE - apenas certificar que está correta)
async function removerAlunoTurma(turmaId, alunoId, alunoNome) {
    if (!confirm(`Tem certeza que deseja remover o aluno "${alunoNome}" desta turma?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/admin/turmas/${turmaId}/alunos/${alunoId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            showNotification('Aluno removido da turma com sucesso!', 'success');
            viewTurmaDetails(turmaId);
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao remover aluno');
        }
    } catch (error) {
        showNotification('Erro ao remover aluno: ' + error.message, 'error');
    }
}

// Função para remover professor da turma (NOVA)
async function removerProfessorTurma(turmaId, professorId, professorNome) {
    if (!confirm(`Tem certeza que deseja remover o professor "${professorNome}" desta turma?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/admin/turmas/${turmaId}/professores/${professorId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            showNotification('Professor removido da turma com sucesso!', 'success');
            viewTurmaDetails(turmaId);
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao remover professor');
        }
    } catch (error) {
        showNotification('Erro ao remover professor: ' + error.message, 'error');
    }
}

// Função para remover aluno da turma
async function removerAlunoTurma(turmaId, alunoId, alunoNome) {
    if (!confirm(`Tem certeza que deseja remover o aluno "${alunoNome}" desta turma?\n\nO aluno permanecerá no sistema, mas ficará sem turma.`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/admin/turmas/${turmaId}/alunos/${alunoId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            showNotification('Aluno removido da turma com sucesso!', 'success');
            // Recarregar os detalhes da turma
            viewTurmaDetails(turmaId);
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao remover aluno da turma');
        }
    } catch (error) {
        showNotification('Erro ao remover aluno: ' + error.message, 'error');
    }
}

// Função para adicionar professor à turma
async function adicionarProfessorTurma(turmaId) {
    try {
        console.log('🔍 Carregando professores disponíveis para turma:', turmaId);

        // Carregar professores disponíveis
        const response = await fetch(`${API_BASE}/admin/professores-disponiveis`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Erro na resposta:', errorText);
            throw new Error(`Erro ${response.status} ao carregar professores`);
        }

        const data = await response.json();
        const professores = data.professores || [];

        console.log('📊 Professores carregados:', professores);

        if (professores.length === 0) {
            showNotification('Não há professores disponíveis para adicionar à turma', 'warning');
            return;
        }

        const options = professores.map(professor => `
            <option value="${professor.id}">
                ${professor.nome} - ${professor.email} 
                ${professor.turmas_count ? ` (${professor.turmas_count} turma(s))` : ' (Sem turmas)'}
                ${professor.formacao ? ` - ${professor.formacao}` : ''}
            </option>
        `).join('');

        const modalContent = `
            <div class="modal-header">
                <h3>Adicionar Professor à Turma</h3>
                <button class="modal-close" onclick="closeModal('add-professor-turma-modal')">&times;</button>
            </div>
            <form onsubmit="adicionarProfessorTurmaSubmit(${turmaId}, event)">
                <div class="form-group">
                    <label for="professor-select">Selecionar Professor *</label>
                    <select id="professor-select" required>
                        <option value="">Selecione um professor...</option>
                        ${options}
                    </select>
                    <small>${professores.length} professor(es) disponível(is)</small>
                </div>
                
                <div class="form-group">
                    <label for="materia-nome">Matéria *</label>
                    <input type="text" id="materia-nome" required placeholder="Ex: Matemática, Português, Ciências">
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="carga-horaria">Carga Horária Semanal (h)</label>
                        <input type="number" id="carga-horaria" min="1" max="40" value="4" required>
                    </div>
                    <div class="form-group">
                        <label for="data-inicio">Data de Início</label>
                        <input type="date" id="data-inicio" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="horario-aula">Horário de Aula *</label>
                    <input type="text" id="horario-aula" required placeholder="Ex: 08:00-10:00">
                </div>
                
                <div class="form-group">
                    <label for="dia-semana">Dia da Semana *</label>
                    <select id="dia-semana" required>
                        <option value="">Selecione...</option>
                        <option value="segunda">Segunda-feira</option>
                        <option value="terca">Terça-feira</option>
                        <option value="quarta">Quarta-feira</option>
                        <option value="quinta">Quinta-feira</option>
                        <option value="sexta">Sexta-feira</option>
                        <option value="sabado">Sábado</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="observacoes-professor">Observações</label>
                    <textarea id="observacoes-professor" placeholder="Observações sobre a atribuição (opcional)" rows="3"></textarea>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal('add-professor-turma-modal')">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Adicionar à Turma</button>
                </div>
            </form>
        `;

        showCustomModal('add-professor-turma-modal', modalContent);

    } catch (error) {
        console.error('❌ Erro detalhado ao carregar professores:', error);
        showNotification('Erro ao carregar professores: ' + error.message, 'error');
    }
}

async function testarProfessores() {
    try {
        const response = await fetch(`${API_BASE}/admin/professores-disponiveis`, {
            headers: getAuthHeaders()
        });

        const data = await response.json();
        console.log('🧪 TESTE - Professores:', data);

        if (data.professores && data.professores.length > 0) {
            showNotification(`✅ ${data.professores.length} professores carregados com sucesso!`, 'success');
        } else {
            showNotification('❌ Nenhum professor encontrado no banco', 'error');
        }
    } catch (error) {
        console.error('❌ Erro no teste:', error);
        showNotification('Erro no teste: ' + error.message, 'error');
    }
}

// Chame esta função no console do navegador para testar

// Função de teste - execute no console do navegador
async function verificarProfessores() {
    try {
        console.log('🔍 Verificando professores...');

        const response = await fetch('http://localhost:8000/api/admin/professores-disponiveis', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('academic_token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Erro ${response.status}: ${await response.text()}`);
        }

        const data = await response.json();
        console.log('📊 Professores encontrados:', data.professores);

        if (data.professores && data.professores.length > 0) {
            alert(`✅ Sucesso! ${data.professores.length} professores carregados:\n\n${data.professores.map(p => `• ${p.nome} (${p.email}) - ${p.turmas_count || 0} turmas`).join('\n')
                }`);
        } else {
            alert('❌ Nenhum professor encontrado no banco de dados');
        }

        return data.professores;
    } catch (error) {
        console.error('❌ Erro na verificação:', error);
        alert('❌ Erro ao verificar professores: ' + error.message);
    }
}

// Execute no console: verificarProfessores()


// Função para remover professor da turma
async function removerProfessorTurma(turmaId, professorId, professorNome) {
    if (!confirm(`Tem certeza que deseja remover o professor "${professorNome}" desta turma?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/admin/turmas/${turmaId}/professores/${professorId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            showNotification('Professor removido da turma com sucesso!', 'success');
            // Recarregar os detalhes da turma
            viewTurmaDetails(turmaId);
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao remover professor da turma');
        }
    } catch (error) {
        showNotification('Erro ao remover professor: ' + error.message, 'error');
    }
}

function openCreateTurmaModal() {
    const modalContent = `
        <div class="modal-header">
            <h3>Criar Nova Turma</h3>
            <button class="modal-close" onclick="closeModal('create-turma-modal')">&times;</button>
        </div>
        <form id="create-turma-form" onsubmit="createTurma(event)">
            <div class="form-group">
                <label for="turma-nome">Nome da Turma *</label>
                <input type="text" id="turma-nome" required placeholder="Ex: 1º Ano A - Manhã">
            </div>
            <div class="form-group">
                <label for="turma-codigo">Código *</label>
                <input type="text" id="turma-codigo" required placeholder="Ex: 1A2024">
            </div>
            <div class="form-group">
                <label for="turma-descricao">Descrição</label>
                <textarea id="turma-descricao" placeholder="Descrição opcional da turma"></textarea>
            </div>
            <div class="form-group">
                <label for="turma-ano">Ano Letivo *</label>
                <input type="text" id="turma-ano" value="2024" required>
            </div>
            <div class="form-group">
                <label for="turma-periodo">Período *</label>
                <select id="turma-periodo" required>
                    <option value="manhã">Manhã</option>
                    <option value="tarde">Tarde</option>
                    <option value="noite">Noite</option>
                    <option value="integral">Integral</option>
                </select>
            </div>
            <div class="form-group">
                <label for="turma-capacidade">Capacidade Máxima</label>
                <input type="number" id="turma-capacidade" value="90" min="30" max="90" required>
                <small>Mínimo: 30, Máximo: 90 alunos</small>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal('create-turma-modal')">Cancelar</button>
                <button type="submit" class="btn btn-primary">Criar Turma</button>
            </div>
        </form>
    `;

    showCustomModal('create-turma-modal', modalContent);
}

async function createTurma(event) {
    event.preventDefault();

    const formData = {
        nome: document.getElementById('turma-nome').value,
        codigo: document.getElementById('turma-codigo').value,
        descricao: document.getElementById('turma-descricao').value,
        ano_letivo: document.getElementById('turma-ano').value,
        periodo: document.getElementById('turma-periodo').value,
        capacidade_max: parseInt(document.getElementById('turma-capacidade').value)
    };

    console.log('Enviando dados:', formData);

    try {
        const response = await fetch(`${API_BASE}/admin/turmas`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(formData)
        });

        const responseText = await response.text();
        console.log('Resposta do servidor:', responseText);

        let result;
        try {
            result = JSON.parse(responseText);
        } catch (e) {
            throw new Error('Resposta inválida do servidor: ' + responseText.substring(0, 100));
        }

        if (response.ok) {
            showNotification('Turma criada com sucesso!', 'success');
            closeModal('create-turma-modal');
            showSection('turmas');
        } else {
            throw new Error(result.error || 'Erro ao criar turma');
        }
    } catch (error) {
        console.error('Erro ao criar turma:', error);
        showNotification('Erro ao criar turma: ' + error.message, 'error');
    }
}

async function deleteTurma(turmaId) {
    if (!confirm('Tem certeza que deseja excluir esta turma?\n\nEsta ação não pode ser desfeita.')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/admin/turmas/${turmaId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao excluir turma');
        }

        showNotification('Turma excluída com sucesso!', 'success');
        showSection('turmas');
    } catch (error) {
        showNotification('Erro ao excluir turma: ' + error.message, 'error');
    }
}

// Função auxiliar para classificar notas
function getNotaBadgeClass(nota) {
    if (!nota) return 'badge-secondary';
    if (nota >= 8) return 'badge-success';
    if (nota >= 6) return 'badge-warning';
    return 'badge-danger';
}

// Função para mostrar modal customizado
function showCustomModal(modalId, content) {
    let modal = document.getElementById(modalId);

    if (!modal) {
        modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal';
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div class="modal-content">
            ${content}
        </div>
    `;

    modal.style.display = 'flex';
}

// =============================================
// SISTEMA DE MATÉRIAS 
// =============================================

async function loadMateriasSection() {
    try {
        const response = await fetch(`${API_BASE}/admin/materias`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar matérias');
        }

        const data = await response.json();

        return `
            <div class="section">
                <div class="section-header">
                    <h2>Gerenciar Matérias</h2>
                    <button class="btn btn-primary" onclick="openCreateMateriaModal()">
                        <i class="fas fa-plus"></i> Nova Matéria
                    </button>
                </div>
                
                <div class="dashboard">
                    <div class="card">
                        <div class="card-header">
                            <div>
                                <h3>${data.materias ? data.materias.length : 0}</h3>
                                <p>Total de Matérias</p>
                            </div>
                            <div class="card-icon blue">
                                <i class="fas fa-book"></i>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>Matéria</th>
                                <th>Turma</th>
                                <th>Professor</th>
                                <th>Horário</th>
                                <th>Dia</th>
                                <th>Carga Horária</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.materias && data.materias.length > 0 ? data.materias.map(materia => `
                                <tr>
                                    <td>${materia.nome || 'N/A'}</td>
                                    <td>${materia.turma_nome || 'N/A'}</td>
                                    <td>${materia.professor_nome || 'N/A'}</td>
                                    <td>${materia.horario || 'N/A'}</td>
                                    <td>${materia.dia_semana || 'N/A'}</td>
                                    <td>${materia.carga_horaria_semanal || 0}h</td>
                                    <td>
                                        <button class="btn btn-sm btn-info" onclick="editMateria(${materia.id})" title="Editar">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-sm btn-danger" onclick="deleteMateria(${materia.id})" title="Excluir">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('') : `
                                <tr>
                                    <td colspan="7" class="text-center">Nenhuma matéria encontrada</td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Erro ao carregar matérias:', error);
        return `
            <div class="section">
                <h3>Erro ao carregar matérias</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Modal para criar matéria
async function openCreateMateriaModal() {
    try {
        // Carregar turmas e professores
        const [turmasRes, professoresRes] = await Promise.all([
            fetch(`${API_BASE}/admin/todas-turmas`, { headers: getAuthHeaders() }),
            fetch(`${API_BASE}/admin/professores-disponiveis`, { headers: getAuthHeaders() })
        ]);

        const turmasData = await turmasRes.json();
        const professoresData = await professoresRes.json();

        const turmasOptions = turmasData.turmas ? turmasData.turmas.map(turma => `
            <option value="${turma.id}">${turma.nome} (${turma.codigo})</option>
        `).join('') : '<option value="">Nenhuma turma disponível</option>';

        const professoresOptions = professoresData.professores ? professoresData.professores.map(prof => `
            <option value="${prof.id}">${prof.nome} - ${prof.formacao || 'Sem formação'}</option>
        `).join('') : '<option value="">Nenhum professor disponível</option>';

        const modalContent = `
            <div class="modal-header">
                <h3>Criar Nova Matéria</h3>
                <button class="modal-close" onclick="closeModal('create-materia-modal')">&times;</button>
            </div>
            <form id="create-materia-form" onsubmit="createMateria(event)">
                <div class="form-group">
                    <label for="materia-nome">Nome da Matéria *</label>
                    <input type="text" id="materia-nome" required placeholder="Ex: Matemática, Português">
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="materia-turma">Turma *</label>
                        <select id="materia-turma" required>
                            <option value="">Selecione uma turma...</option>
                            ${turmasOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="materia-professor">Professor *</label>
                        <select id="materia-professor" required>
                            <option value="">Selecione um professor...</option>
                            ${professoresOptions}
                        </select>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="materia-horario">Horário *</label>
                        <input type="text" id="materia-horario" required placeholder="Ex: 08:00-09:30">
                    </div>
                    <div class="form-group">
                        <label for="materia-dia">Dia da Semana *</label>
                        <select id="materia-dia" required>
                            <option value="">Selecione...</option>
                            <option value="segunda">Segunda-feira</option>
                            <option value="terca">Terça-feira</option>
                            <option value="quarta">Quarta-feira</option>
                            <option value="quinta">Quinta-feira</option>
                            <option value="sexta">Sexta-feira</option>
                            <option value="sabado">Sábado</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="materia-carga-horaria">Carga Horária Semanal (h)</label>
                        <input type="number" id="materia-carga-horaria" min="1" max="40" value="4" required>
                    </div>
                    <div class="form-group">
                        <label for="materia-data-inicio">Data de Início</label>
                        <input type="date" id="materia-data-inicio" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="materia-observacoes">Observações</label>
                    <textarea id="materia-observacoes" placeholder="Observações sobre a matéria" rows="3"></textarea>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal('create-materia-modal')">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Criar Matéria</button>
                </div>
            </form>
        `;

        showCustomModal('create-materia-modal', modalContent);

    } catch (error) {
        console.error('Erro ao carregar dados para criar matéria:', error);
        showNotification('Erro ao carregar dados: ' + error.message, 'error');
    }
}

// Criar matéria
async function createMateria(event) {
    event.preventDefault();

    const formData = {
        nome: document.getElementById('materia-nome').value,
        turma_id: document.getElementById('materia-turma').value,
        professor_id: document.getElementById('materia-professor').value,
        horario: document.getElementById('materia-horario').value,
        dia_semana: document.getElementById('materia-dia').value,
        carga_horaria_semanal: parseInt(document.getElementById('materia-carga-horaria').value),
        data_inicio: document.getElementById('materia-data-inicio').value,
        observacoes: document.getElementById('materia-observacoes').value || null
    };

    try {
        const response = await fetch(`${API_BASE}/admin/turmas/${formData.turma_id}/professores`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro ${response.status}: ${errorText}`);
        }

        const result = await response.json();

        showNotification('Matéria criada com sucesso!', 'success');
        closeModal('create-materia-modal');
        showSection('materias');

    } catch (error) {
        console.error('Erro ao criar matéria:', error);
        showNotification('Erro ao criar matéria: ' + error.message, 'error');
    }
}

// =============================================
// RELATÓRIOS  
// =============================================

async function loadRelatoriosSection() {
    return `
        <div class="section">
            <div class="section-header">
                <h2>Relatórios do Sistema</h2>
            </div>
            
            <div class="dashboard">
                <div class="card" onclick="gerarRelatorio('alunos')" style="cursor: pointer;">
                    <div class="card-header">
                        <div>
                            <h3>📊</h3>
                            <p>Relatório de Alunos</p>
                        </div>
                        <div class="card-icon blue">
                            <i class="fas fa-user-graduate"></i>
                        </div>
                    </div>
                </div>
                
                <div class="card" onclick="gerarRelatorio('professores')" style="cursor: pointer;">
                    <div class="card-header">
                        <div>
                            <h3>👨‍🏫</h3>
                            <p>Relatório de Professores</p>
                        </div>
                        <div class="card-icon green">
                            <i class="fas fa-chalkboard-teacher"></i>
                        </div>
                    </div>
                </div>
                
                <div class="card" onclick="gerarRelatorio('turmas')" style="cursor: pointer;">
                    <div class="card-header">
                        <div>
                            <h3>🏫</h3>
                            <p>Relatório de Turmas</p>
                        </div>
                        <div class="card-icon orange">
                            <i class="fas fa-users"></i>
                        </div>
                    </div>
                </div>
                
                <div class="card" onclick="gerarRelatorio('sustentabilidade')" style="cursor: pointer;">
                    <div class="card-header">
                        <div>
                            <h3>🌱</h3>
                            <p>Relatório de Sustentabilidade</p>
                        </div>
                        <div class="card-icon purple">
                            <i class="fas fa-leaf"></i>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h3>Relatórios Rápidos</h3>
                <div class="form-row">
                    <div class="form-group">
                        <label for="relatorio-tipo">Tipo de Relatório</label>
                        <select id="relatorio-tipo">
                            <option value="alunos_por_turma">Alunos por Turma</option>
                            <option value="professor.total_turmas">Professores Ativos</option>
                            <option value="turmas_lotadas">Turmas Lotadas</option>
                            <option value="media_geral">Média Geral por Turma</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="relatorio-formato">Formato</label>
                        <select id="relatorio-formato">
                            <option value="tela">Visualizar na Tela</option>
                            <option value="pdf">PDF</option>
                            <option value="excel">Excel</option>
                        </select>
                    </div>
                </div>
                <button class="btn btn-primary" onclick="gerarRelatorioCustomizado()">
                    <i class="fas fa-download"></i> Gerar Relatório
                </button>
            </div>
        </div>
    `;
}

async function gerarRelatorio(tipo) {
    try {
        showNotification(`Gerando relatório de ${tipo}...`, 'info');

        // Simular geração de relatório
        setTimeout(() => {
            showNotification(`Relatório de ${tipo} gerado com sucesso!`, 'success');

            // Aqui você implementaria a lógica real de geração de relatórios
            const relatorioData = {
                alunos: { total: 150, ativos: 142, inativos: 8 },
                professores: { total: 25, ativos: 22, disponiveis: 3 },
                turmas: { total: 15, lotadas: 8, com_vagas: 7 },
                sustentabilidade: { papel_salvo: 1247, co2_evitado: 45.8 }
            };

            mostrarRelatorioNaTela(tipo, relatorioData[tipo]);
        }, 2000);

    } catch (error) {
        showNotification('Erro ao gerar relatório: ' + error.message, 'error');
    }
}

function mostrarRelatorioNaTela(tipo, dados) {
    const modalContent = `
        <div class="modal-header">
            <h3>Relatório de ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}</h3>
            <button class="modal-close" onclick="closeModal('relatorio-modal')">&times;</button>
        </div>
        <div class="modal-body">
            <div class="relatorio-content">
                <h4>Dados do Relatório</h4>
                <pre>${JSON.stringify(dados, null, 2)}</pre>
                
                <div class="form-actions">
                    <button class="btn btn-primary" onclick="exportarRelatorio('pdf')">
                        <i class="fas fa-file-pdf"></i> Exportar PDF
                    </button>
                    <button class="btn btn-success" onclick="exportarRelatorio('excel')">
                        <i class="fas fa-file-excel"></i> Exportar Excel
                    </button>
                    <button class="btn btn-secondary" onclick="closeModal('relatorio-modal')">
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    `;

    showCustomModal('relatorio-modal', modalContent);
}



async function realizarBackup() {
    try {
        showNotification('Iniciando backup do sistema...', 'info');

        // Simular backup
        setTimeout(() => {
            showNotification('Backup realizado com sucesso!', 'success');

            // Criar link de download simulado
            const blob = new Blob(['Dados de backup do sistema'], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup-sistema-${new Date().toISOString().split('T')[0]}.bak`;
            a.click();
            URL.revokeObjectURL(url);
        }, 3000);

    } catch (error) {
        showNotification('Erro ao realizar backup: ' + error.message, 'error');
    }
}