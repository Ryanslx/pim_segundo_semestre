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
    // Carregar turmas disponíveis primeiro
    fetch(`${API_BASE}/admin/turmas-select`, {
        headers: getAuthHeaders()
    })
        .then(response => response.json())
        .then(data => {
            const turmasOptions = data.turmas ? data.turmas.map(turma => `
            <option value="${turma.id}">${turma.nome} (${turma.alunos_matriculados}/${turma.capacidade_max})</option>
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
            showNotification('Erro ao carregar turmas: ' + error.message, 'error');
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

function editAluno(alunoId) {
    showNotification('Funcionalidade de edição em desenvolvimento!', 'info');
}

function viewAlunoDetails(alunoId) {
    showNotification('Visualização de detalhes em desenvolvimento!', 'info');
}

// Função auxiliar para classificar notas
function getNotaBadgeClass(nota) {
    if (!nota) return 'badge-secondary';
    if (nota >= 8) return 'badge-success';
    if (nota >= 6) return 'badge-warning';
    return 'badge-danger';
}

function openCreateTurmaModal() {
    const modalContent = `
        <div class="modal-header">
            <h3>Criar Nova Turma</h3>
            <button class="modal-close" onclick="closeModal('create-turma-modal')">&times;</button>
        </div>
        <form id="create-turma-form" onsubmit="createTurma(event)">
            <div class="form-group">
                <label for="turma-nome">Nome da Turma</label>
                <input type="text" id="turma-nome" required>
            </div>
            <div class="form-group">
                <label for="turma-codigo">Código</label>
                <input type="text" id="turma-codigo" required>
            </div>
            <div class="form-group">
                <label for="turma-descricao">Descrição</label>
                <textarea id="turma-descricao"></textarea>
            </div>
            <div class="form-group">
                <label for="turma-ano">Ano Letivo</label>
                <input type="text" id="turma-ano" value="2024" required>
            </div>
            <div class="form-group">
                <label for="turma-periodo">Período</label>
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
            </div>
            <button type="submit" class="btn btn-primary">Criar Turma</button>
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
        capacidade_max: document.getElementById('turma-capacidade').value
    };

    try {
        const response = await fetch(`${API_BASE}/admin/turmas`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            showNotification('Turma criada com sucesso!', 'success');
            closeModal('create-turma-modal');
            showSection('turmas'); // Recarregar a seção
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao criar turma');
        }
    } catch (error) {
        showNotification('Erro ao criar turma: ' + error.message, 'error');
    }
}

async function deleteTurma(turmaId) {
    if (!confirm('Tem certeza que deseja excluir esta turma?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/admin/turmas/${turmaId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            showNotification('Turma excluída com sucesso!', 'success');
            showSection('turmas'); // Recarregar a seção
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao excluir turma');
        }
    } catch (error) {
        showNotification('Erro ao excluir turma: ' + error.message, 'error');
    }
}