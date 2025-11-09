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
                                        <button class="btn btn-sm btn-success" onclick="viewTurmaDetails(${turma.id})" title="Ver detalhes">
                                            <i class="fas fa-eye"></i>
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
            <div class="modal-body">
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

// Função para visualizar detalhes da turma
function viewTurmaDetails(turmaId) {
    showNotification(`Visualizando detalhes da turma ID: ${turmaId}`, 'info');
    // Aqui você pode implementar uma modal mais detalhada se quiser
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