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

// ADICIONE ESTA NOVA VERSÃO COM BARRA DE PESQUISA
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
                    <div class="section-actions">
                        <div class="search-container">
                            <input type="text" 
                                   id="search-atividades" 
                                   placeholder="Buscar por matéria, título..." 
                                   class="search-input"
                                   onkeyup="filtrarAtividades()">
                            <i class="fas fa-search search-icon"></i>
                        </div>
                        
                
                    </div>
                </div>
                
                <!-- ... resto do código novo ... -->
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
}// =============================================
// FUNÇÕES DO CALENDÁRIO DO ALUNO
// =============================================

// Função para carregar o calendário do aluno
async function loadCalendarioAluno() {
    try {
        const response = await fetch(`${API_BASE}/aluno/calendario`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar calendário');
        }

        const data = await response.json();

        return `
            <div class="section">
                <div class="section-header">
                    <h2>Meu Calendário</h2>
                    <div class="section-actions">
                        <button class="btn btn-primary" onclick="toggleCalendarioView()">
                            <i class="fas fa-calendar-alt"></i> Alternar Visualização
                        </button>
                        <button class="btn btn-info" onclick="exportarCalendario()">
                            <i class="fas fa-download"></i> Exportar
                        </button>
                    </div>
                </div>
                
                <div id="calendario-view">
                    ${await generateCalendarioMensal(data.eventos)}
                </div>
            </div>
            
            <div class="section">
                <div class="section-header">
                    <h2>Próximos Eventos</h2>
                </div>
                <div id="proximos-eventos">
                    ${generateProximosEventos(data.eventos)}
                </div>
            </div>
            
            <div class="section">
                <div class="section-header">
                    <h2>Horário Semanal</h2>
                </div>
                <div id="horario-semanal">
                    ${await generateHorarioSemanal()}
                </div>
            </div>
        `;
    } catch (error) {
        return `
            <div class="section">
                <h3>Erro ao carregar calendário</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Gerar calendário mensal
async function generateCalendarioMensal(eventos) {
    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();
    
    // Primeiro dia do mês
    const primeiroDia = new Date(anoAtual, mesAtual, 1);
    // Último dia do mês
    const ultimoDia = new Date(anoAtual, mesAtual + 1, 0);
    
    // Dias da semana
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    let calendarioHTML = `
        <div class="calendario-mensal">
            <div class="calendario-header">
                <h3>${hoje.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h3>
                <div class="calendario-navegacao">
                    <button class="btn btn-sm btn-outline" onclick="navegarMes(-1)">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="navegarMes(1)">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
            
            <div class="calendario-grid">
                ${diasSemana.map(dia => `
                    <div class="calendario-dia-header">${dia}</div>
                `).join('')}
    `;
    
    // Dias vazios no início
    for (let i = 0; i < primeiroDia.getDay(); i++) {
        calendarioHTML += `<div class="calendario-dia vazio"></div>`;
    }
    
    // Dias do mês
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
        const dataAtual = new Date(anoAtual, mesAtual, dia);
        const eventosDia = filtrarEventosPorData(eventos, dataAtual);
        const isHoje = dataAtual.toDateString() === hoje.toDateString();
        
        calendarioHTML += `
            <div class="calendario-dia ${isHoje ? 'hoje' : ''} ${eventosDia.length > 0 ? 'com-eventos' : ''}">
                <div class="dia-numero">${dia}</div>
                <div class="dia-eventos">
                    ${eventosDia.slice(0, 2).map(evento => `
                        <div class="evento-marcador ${evento.tipo}" title="${evento.materia} - ${evento.tipo}"></div>
                    `).join('')}
                    ${eventosDia.length > 2 ? `<div class="evento-mais">+${eventosDia.length - 2}</div>` : ''}
                </div>
            </div>
        `;
    }
    
    calendarioHTML += `</div></div>`;
    
    return calendarioHTML;
}

// Gerar horário semanal
async function generateHorarioSemanal() {
    try {
        const response = await fetch(`${API_BASE}/aluno/calendario/semana`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar horário semanal');
        }

        const data = await response.json();
        
        const diasOrdenados = {
            'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4, 
            'friday': 5, 'saturday': 6, 'sunday': 7
        };
        
        let horarioHTML = `
            <div class="horario-semanal">
                <div class="semana-header">
                    <button class="btn btn-sm btn-outline" onclick="mudarSemana(-1)">
                        <i class="fas fa-chevron-left"></i> Semana Anterior
                    </button>
                    <span>Semana de ${formatarData(data.data_inicio)}</span>
                    <button class="btn btn-sm btn-outline" onclick="mudarSemana(1)">
                        Próxima Semana <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
                
                <div class="horario-grid">
                    <div class="horario-col hora-col">
                        <div class="horario-celula header">Horário</div>
                        ${gerarHorarios().map(horario => `
                            <div class="horario-celula hora">${horario}</div>
                        `).join('')}
                    </div>
        `;
        
        // Ordenar dias da semana
        const diasSemana = data.semana.map(s => s.dia.dia_semana).sort((a, b) => {
            return diasOrdenados[a] - diasOrdenados[b];
        });
        
        diasSemana.forEach(dia => {
            const eventosDia = data.semana.find(s => s.dia.dia_semana === dia);
            
            horarioHTML += `
                <div class="horario-col">
                    <div class="horario-celula header">
                        ${capitalizeFirst(dia)}<br>
                        <small>${eventosDia ? eventosDia.dia.dia_mes : ''}</small>
                    </div>
                    ${gerarHorarios().map(horario => {
                        const evento = eventosDia ? eventosDia.eventos.find(e => e.horario === horario) : null;
                        
                        return `
                            <div class="horario-celula ${evento ? `aula ${evento.tipo}` : ''}">
                                ${evento ? `
                                    <div class="aula-info">
                                        <strong>${evento.materia}</strong>
                                        <small>${evento.professor}</small>
                                    </div>
                                ` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        });
        
        horarioHTML += `</div></div>`;
        
        return horarioHTML;
    } catch (error) {
        return `<div class="error-state">Erro ao carregar horário semanal: ${error.message}</div>`;
    }
}

// Gerar lista de próximos eventos
function generateProximosEventos(eventos) {
    const hoje = new Date();
    const eventosFuturos = eventos
        .filter(evento => {
            if (evento.data_especifica) {
                return new Date(evento.data_especifica) >= hoje;
            }
            return true; // Aulas recorrentes
        })
        .sort((a, b) => {
            const dataA = a.data_especifica ? new Date(a.data_especifica) : new Date();
            const dataB = b.data_especifica ? new Date(b.data_especifica) : new Date();
            return dataA - dataB;
        })
        .slice(0, 10);
    
    if (eventosFuturos.length === 0) {
        return `
            <div class="empty-state">
                <i class="fas fa-calendar-check"></i>
                <p>Nenhum evento próximo</p>
            </div>
        `;
    }
    
    return `
        <div class="eventos-lista">
            ${eventosFuturos.map(evento => `
                <div class="evento-item ${evento.tipo}">
                    <div class="evento-marcador ${evento.tipo}"></div>
                    <div class="evento-info">
                        <div class="evento-titulo">${evento.materia}</div>
                        <div class="evento-detalhes">
                            ${evento.data_especifica ? 
                                `<i class="fas fa-calendar"></i> ${new Date(evento.data_especifica).toLocaleDateString('pt-BR')}` : 
                                `<i class="fas fa-clock"></i> ${evento.dia_semana} ${evento.horario}`
                            }
                            ${evento.professor ? ` • ${evento.professor}` : ''}
                        </div>
                        <div class="evento-tipo">${evento.tipo}</div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Funções auxiliares
function filtrarEventosPorData(eventos, data) {
    return eventos.filter(evento => {
        if (evento.data_especifica) {
            return new Date(evento.data_especifica).toDateString() === data.toDateString();
        }
        
        // Para aulas recorrentes, verificar se o dia da semana corresponde
        if (evento.dia_semana) {
            const dias = {
                'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
                'thursday': 4, 'friday': 5, 'saturday': 6
            };
            return dias[evento.dia_semana] === data.getDay();
        }
        
        return false;
    });
}

function gerarHorarios() {
    return [
        '07:00-08:00',
        '08:00-09:00', 
        '09:00-10:00',
        '10:00-11:00',
        '11:00-12:00',
        '13:00-14:00',
        '14:00-15:00',
        '15:00-16:00',
        '16:00-17:00',
        '17:00-18:00'
    ];
}

function formatarData(dataString) {
    return new Date(dataString).toLocaleDateString('pt-BR');
}

function capitalizeFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Funções de navegação (placeholders)
function toggleCalendarioView() {
    alert('Funcionalidade de alternar visualização será implementada');
}

function exportarCalendario() {
    alert('Funcionalidade de exportação será implementada');
}

function navegarMes(direcao) {
    alert(`Navegar ${direcao > 0 ? 'próximo' : 'anterior'} mês`);
}

function mudarSemana(direcao) {
    alert(`Mudar para ${direcao > 0 ? 'próxima' : 'anterior'} semana`);
}// Funções de busca e filtro para atividades
function filtrarAtividades() {
    // ... código completo da função
}

function aplicarFiltro(tipoFiltro) {
    // ... código completo da função
}

function aplicarFiltroLogica(filtro, status, tipo) {
    // ... código completo da função
}

function getTipoAtividade(titulo) {
    // ... código completo da função
}

function getDiasRestantes(dataEntrega) {
    // ... código completo da função
}

function getStatusBadge(dataEntrega) {
    // ... código completo da função
}

function getStatusTexto(dataEntrega) {
    // ... código completo da função
}

function limparBusca() {
    // ... código completo da função
}

function exportarAtividades() {
    // ... código completo da função
}

function marcarComoEntregue(atividadeId) {
    // ... código completo da função
}// Funções auxiliares para o dashboard do aluno
function calcularFrequencia(notas) {
    if (notas.length === 0) return 85;
    const avaliacoesRealizadas = notas.filter(nota => nota.nota > 0).length;
    return Math.min(95, 85 + (avaliacoesRealizadas * 2));
}

function isAtrasada(dataEntrega, entregue) {
    if (entregue) return false;
    return new Date(dataEntrega) < new Date();
}

function getAtividadeIcon(titulo) {
    const tituloLower = titulo.toLowerCase();
    if (tituloLower.includes('prova') || tituloLower.includes('avaliação')) return 'fa-file-alt';
    if (tituloLower.includes('trabalho')) return 'fa-file-word';
    if (tituloLower.includes('exercício')) return 'fa-pen-fancy';
    if (tituloLower.includes('seminário')) return 'fa-presentation';
    return 'fa-tasks';
}

function getEventoIcon(tipo) {
    switch (tipo) {
        case 'aula': return 'fa-chalkboard-teacher';
        case 'prova': return 'fa-file-alt';
        case 'atividade': return 'fa-tasks';
        default: return 'fa-calendar';
    }
}

function getStatusBadgeDash(dataEntrega) {
    const hoje = new Date();
    const entrega = new Date(dataEntrega);
    if (entrega < hoje) return 'badge-danger';
    const diffDays = Math.ceil((entrega - hoje) / (1000 * 60 * 60 * 24));
    if (diffDays <= 3) return 'badge-warning';
    return 'badge-info';
}

function getStatusTextoDash(dataEntrega) {
    const hoje = new Date();
    const entrega = new Date(dataEntrega);
    if (entrega < hoje) return 'Atrasada';
    const diffDays = Math.ceil((entrega - hoje) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Amanhã';
    return `${diffDays}d`;
}

function gerarGraficoDesempenho(notas) {
    // Agrupar notas por matéria
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

    if (Object.keys(materias).length === 0) {
        return `
            <div class="empty-state-small">
                <i class="fas fa-chart-bar"></i>
                <p>Nenhuma avaliação registrada</p>
            </div>
        `;
    }

    return `
        <div class="grafico-desempenho">
            ${Object.keys(materias).map(materia => {
                const media = materias[materia].soma / materias[materia].notas.length;
                const progresso = (media / 10) * 100;
                
                return `
                    <div class="materia-bar">
                        <div class="materia-info">
                            <span class="materia-nome">${materia}</span>
                            <span class="materia-media">${media.toFixed(1)}</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progresso}%; background: ${getCorProgresso(progresso)};"></div>
                        </div>
                        <div class="materia-stats">
                            <small>${materias[materia].notas.length} avaliações</small>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function getCorProgresso(progresso) {
    if (progresso >= 80) return '#2ecc71';
    if (progresso >= 60) return '#f39c12';
    return '#e74c3c';
}

function gerarAlertas(atividadesAtrasadas, proximasAtividades) {
    const alertas = [];
    
    if (atividadesAtrasadas.length > 0) {
        alertas.push(`
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle"></i>
                <div>
                    <strong>${atividadesAtrasadas.length} atividade(s) atrasada(s)</strong>
                    <p>Você tem atividades com prazo vencido. Entre em contato com seus professores.</p>
                </div>
                <button class="btn btn-sm btn-outline" onclick="showSection('atividades-aluno')">
                    Ver Detalhes
                </button>
            </div>
        `);
    }
    
    const atividadesProximas = proximasAtividades.filter(a => {
        const diffDays = Math.ceil((new Date(a.data_entrega) - new Date()) / (1000 * 60 * 60 * 24));
        return diffDays <= 2 && diffDays >= 0;
    });
    
    if (atividadesProximas.length > 0) {
        alertas.push(`
            <div class="alert alert-warning">
                <i class="fas fa-clock"></i>
                <div>
                    <strong>${atividadesProximas.length} atividade(s) com prazo próximo</strong>
                    <p>Verifique suas atividades pendentes para esta semana.</p>
                </div>
                <button class="btn btn-sm btn-outline" onclick="showSection('atividades-aluno')">
                    Ver Atividades
                </button>
            </div>
        `);
    }
    
    if (alertas.length === 0) {
        return `
            <div class="alert alert-success">
                <i class="fas fa-check-circle"></i>
                <div>
                    <strong>Tudo em dia!</strong>
                    <p>Você está com todas as atividades em dia. Continue assim!</p>
                </div>
            </div>
        `;
    }
    
    return alertas.join('');
}

function openFeedbackModal() {
    openModal('feedback-modal');
}