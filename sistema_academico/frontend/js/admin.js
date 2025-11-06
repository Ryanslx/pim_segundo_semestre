// Funções específicas para administradores

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
                            ${data.turmas.length > 0 ? data.turmas.map(turma => `
                                <tr>
                                    <td>${turma.nome}</td>
                                    <td>${turma.codigo}</td>
                                    <td>${turma.descricao || '-'}</td>
                                    <td>${turma.ano_letivo}</td>
                                    <td>${turma.periodo}</td>
                                    <td>${turma.alunos_matriculados || 0}/${turma.capacidade_max}</td>
                                    <td>
                                        <button class="btn btn-sm btn-info" onclick="editTurma(${turma.id})">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-sm btn-danger" onclick="deleteTurma(${turma.id})" 
                                                ${turma.alunos_matriculados > 0 ? 'disabled' : ''}>
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
        return `
            <div class="section">
                <h3>Erro ao carregar turmas</h3>
                <p>${error.message}</p>
            </div>
        `;
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