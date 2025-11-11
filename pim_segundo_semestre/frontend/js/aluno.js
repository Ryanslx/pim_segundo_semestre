// Funções específicas para alunos

async function loadMinhasNotas() {
    try {
        const response = await fetch(`${API_BASE}/aluno/minhas-notas`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar notas');
        }

        const data = await response.json();

        return `
            <div class="dashboard">
                <div class="card">
                    <div class="card-header">
                        <div>
                            <h3>${data.media_geral ? data.media_geral.toFixed(1) : '0.0'}</h3>
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
                            <h3>${data.notas.length}</h3>
                            <p>Atividades Avaliadas</p>
                        </div>
                        <div class="card-icon green">
                            <i class="fas fa-clipboard-check"></i>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <div>
                            <h3>${calculateAproveitamento(data.notas)}%</h3>
                            <p>Aproveitamento</p>
                        </div>
                        <div class="card-icon orange">
                            <i class="fas fa-percentage"></i>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <div class="section-header">
                    <h2>Histórico de Avaliações</h2>
                </div>
                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>Atividade</th>
                                <th>Matéria</th>
                                <th>Nota</th>
                                <th>Valor</th>
                                <th>Feedback</th>
                                <th>Data</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.notas.length > 0 ? data.notas.map(nota => `
                                <tr>
                                    <td>${nota.atividade_titulo}</td>
                                    <td>${nota.materia_nome}</td>
                                    <td>
                                        <span class="badge ${getNotaBadgeClass(nota.nota)}">
                                            ${nota.nota}
                                        </span>
                                    </td>
                                    <td>${nota.valor_atividade}</td>
                                    <td>
                                        ${nota.feedback ?
                `<button class="btn btn-sm btn-info" onclick="showFeedback(${nota.id})">
                                                <i class="fas fa-eye"></i> Ver
                                            </button>` :
                '<span class="badge badge-warning">Sem feedback</span>'
            }
                                    </td>
                                    <td>${new Date(nota.data_avaliacao).toLocaleDateString('pt-BR')}</td>
                                </tr>
                            `).join('') : `
                                <tr>
                                    <td colspan="6" class="text-center">Nenhuma avaliação encontrada</td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div class="section">
                <div class="section-header">
                    <h2>Desempenho por Matéria</h2>
                </div>
                <div id="materias-chart">
                    ${generateMateriasChart(data.notas)}
                </div>
            </div>
        `;
    } catch (error) {
        return `
            <div class="section">
                <h3>Erro ao carregar notas</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

async function loadAtividadesAluno() {
    try {
        const response = await fetch(`${API_BASE}/aluno/atividades-pendentes`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar atividades');
        }

        const data = await response.json();

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
                            ${data.atividades.length > 0 ? data.atividades.map(atividade => `
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
                            `).join('') : `
                                <tr>
                                    <td colspan="6" class="text-center">Nenhuma atividade pendente</td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div class="section">
                <div class="section-header">
                    <h2>Calendário de Entregas</h2>
                </div>
                <div id="calendario-entregas">
                    ${generateCalendarioEntregas(data.atividades)}
                </div>
            </div>
        `;
    } catch (error) {
        return `
            <div class="section">
                <h3>Erro ao carregar atividades</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Funções auxiliares para alunos
function calculateAproveitamento(notas) {
    if (notas.length === 0) return 0;

    const totalPossivel = notas.reduce((sum, nota) => sum + parseFloat(nota.valor_atividade || 10), 0);
    const totalObtido = notas.reduce((sum, nota) => sum + parseFloat(nota.nota || 0), 0);

    return totalPossivel > 0 ? ((totalObtido / totalPossivel) * 100).toFixed(1) : 0;
}

function getNotaBadgeClass(nota) {
    if (nota >= 8) return 'badge-success';
    if (nota >= 6) return 'badge-warning';
    return 'badge-danger';
}

function generateMateriasChart(notas) {
    const materias = {};

    notas.forEach(nota => {
        if (!materias[nota.materia_nome]) {
            materias[nota.materia_nome] = {
                notas: [],
                soma: 0
            };
        }
        materias[nota.materia_nome].notas.push(parseFloat(nota.nota));
        materias[nota.materia_nome].soma += parseFloat(nota.nota);
    });

    let chartHTML = '<div class="materias-grid">';

    Object.keys(materias).forEach(materia => {
        const media = materias[materia].soma / materias[materia].notas.length;
        const progresso = (media / 10) * 100;

        chartHTML += `
            <div class="materia-item">
                <div class="materia-header">
                    <h4>${materia}</h4>
                    <span class="media">${media.toFixed(1)}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progresso}%"></div>
                </div>
                <div class="materia-info">
                    <span>${materias[materia].notas.length} avaliações</span>
                </div>
            </div>
        `;
    });

    chartHTML += '</div>';

    return chartHTML;
}

function generateCalendarioEntregas(atividades) {
    const hoje = new Date();
    const proximosDias = [];

    for (let i = 0; i < 7; i++) {
        const data = new Date();
        data.setDate(hoje.getDate() + i);
        proximosDias.push(data.toISOString().split('T')[0]);
    }

    let calendarioHTML = '<div class="calendario-grid">';

    proximosDias.forEach(dia => {
        const atividadesDia = atividades.filter(a => a.data_entrega === dia);
        const dataObj = new Date(dia);

        calendarioHTML += `
            <div class="calendario-dia ${atividadesDia.length > 0 ? 'com-atividade' : ''}">
                <div class="dia-header">
                    <strong>${dataObj.toLocaleDateString('pt-BR', { weekday: 'short' })}</strong>
                    <span>${dataObj.getDate()}</span>
                </div>
                <div class="dia-atividades">
                    ${atividadesDia.map(atividade => `
                        <div class="atividade-item">
                            <i class="fas fa-tasks"></i>
                            <span>${atividade.titulo}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });

    calendarioHTML += '</div>';

    return calendarioHTML;
}

function showFeedback(notaId) {
    // Implementar modal de feedback
    alert('Modal de feedback será implementado aqui para a nota ID: ' + notaId);
}

function viewAtividadeDetails(atividadeId) {
    // Implementar modal de detalhes da atividade
    alert('Modal de detalhes da atividade será implementado aqui para ID: ' + atividadeId);
}