// Funções específicas para professores

async function loadTurmasSection() {
    try {
        const response = await fetch(`${API_BASE}/professor/minhas-turmas`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar turmas');
        }

        const data = await response.json();

        return `
            <div class="section">
                <div class="section-header">
                    <h2>Minhas Turmas</h2>
                </div>
                <div class="turmas-grid">
                    ${data.turmas.length > 0 ? data.turmas.map(turma => `
                        <div class="turma-card">
                            <div class="turma-header">
                                <h3>${turma.nome}</h3>
                                <span class="turma-codigo">${turma.codigo}</span>
                            </div>
                            <div class="turma-info">
                                <div class="info-item">
                                    <i class="fas fa-calendar"></i>
                                    <span>${turma.ano_letivo} - ${turma.periodo}</span>
                                </div>
                                <div class="info-item">
                                    <i class="fas fa-clock"></i>
                                    <span>${turma.horario} - ${turma.dia_semana}</span>
                                </div>
                                <div class="info-item">
                                    <i class="fas fa-book"></i>
                                    <span>${turma.materia_nome}</span>
                                </div>
                            </div>
                            <div class="turma-actions">
                                <button class="btn btn-primary" onclick="viewTurmaAlunos(${turma.id})">
                                    <i class="fas fa-users"></i> Ver Alunos
                                </button>
                                <button class="btn btn-success" onclick="createAtividade(${turma.id})">
                                    <i class="fas fa-plus"></i> Nova Atividade
                                </button>
                            </div>
                        </div>
                    `).join('') : `
                        <div class="empty-state">
                            <i class="fas fa-users fa-3x"></i>
                            <h3>Nenhuma turma atribuída</h3>
                            <p>Você não está ministrando aulas em nenhuma turma no momento.</p>
                        </div>
                    `}
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

async function viewTurmaAlunos(turmaId) {
    try {
        const response = await fetch(`${API_BASE}/professor/turma/${turmaId}/alunos`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar alunos da turma');
        }

        const data = await response.json();

        // Criar modal com alunos da turma
        const modalContent = `
            <div class="modal-header">
                <h3>Alunos da Turma</h3>
                <button class="modal-close" onclick="closeModal('alunos-modal')">&times;</button>
            </div>
            <div class="modal-body">
                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Matrícula</th>
                                <th>Email</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.alunos.map(aluno => `
                                <tr>
                                    <td>${aluno.nome}</td>
                                    <td>${aluno.matricula}</td>
                                    <td>${aluno.email}</td>
                                    <td>
                                        <button class="btn btn-sm btn-info" onclick="viewAlunoPerformance(${aluno.id})">
                                            <i class="fas fa-chart-line"></i> Desempenho
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        showCustomModal('alunos-modal', modalContent);
    } catch (error) {
        showNotification('Erro ao carregar alunos: ' + error.message, 'error');
    }
}

function showCustomModal(modalId, content) {
    // Criar modal dinâmico
    let modal = document.getElementById(modalId);

    if (!modal) {
        modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                ${content}
            </div>
        `;
        document.body.appendChild(modal);
    }

    modal.style.display = 'flex';
}