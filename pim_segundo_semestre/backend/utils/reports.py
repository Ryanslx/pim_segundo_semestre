import json
from datetime import datetime, timedelta
from .algorithms import quick_sort

def generate_report(report_type, data):
    """
    Gera relatórios baseados no tipo e dados fornecidos
    """
    if report_type == 'desempenho_turma':
        return generate_desempenho_turma_report(data)
    elif report_type == 'frequencia':
        return generate_frequencia_report(data)
    elif report_type == 'sustentabilidade':
        return generate_sustentabilidade_report(data)
    else:
        return {'error': 'Tipo de relatório não suportado'}

def generate_desempenho_turma_report(data):
    """
    Gera relatório de desempenho da turma
    """
    alunos_ordenados = quick_sort(data['alunos'], key=lambda x: x.get('media', 0))
    
    report = {
        'turma': data['turma_info'],
        'resumo': {
            'total_alunos': len(alunos_ordenados),
            'media_geral': sum(aluno.get('media', 0) for aluno in alunos_ordenados) / len(alunos_ordenados) if alunos_ordenados else 0,
            'melhor_desempenho': alunos_ordenados[-1] if alunos_ordenados else None,
            'pior_desempenho': alunos_ordenados[0] if alunos_ordenados else None
        },
        'alunos_por_desempenho': {
            'excelente': len([a for a in alunos_ordenados if a.get('media', 0) >= 9]),
            'bom': len([a for a in alunos_ordenados if 7 <= a.get('media', 0) < 9]),
            'regular': len([a for a in alunos_ordenados if 5 <= a.get('media', 0) < 7]),
            'insuficiente': len([a for a in alunos_ordenados if a.get('media', 0) < 5])
        },
        'ranking': alunos_ordenados
    }
    
    return report

def generate_sustentabilidade_report(data):
    """
    Gera relatório de impacto ambiental positivo
    """
    total_atividades = data.get('total_atividades', 0)
    total_alunos = data.get('total_alunos', 0)
    
    # Cálculos baseados em métricas ambientais
    papel_salvo = total_atividades * 3  # 3 páginas por atividade em média
    co2_economizado = total_alunos * 0.5  # 0.5kg CO2 por aluno/mês
    arvores_salvas = papel_salvo / 8000  # 8000 páginas por árvore
    
    report = {
        'impacto_ambiental': {
            'papel_salvo_paginas': papel_salvo,
            'co2_economizado_kg': co2_economizado,
            'arvores_salvas': arvores_salvas,
            'agua_economizada_litros': papel_salvo * 10  # 10 litros por página
        },
        'metricas_digitais': {
            'total_atividades_digitais': total_atividades,
            'taxa_digitalizacao': '100%',
            'comunicacao_digital': '100%'
        },
        'recomendacoes': [
            'Continue utilizando o sistema digital para reduzir o impacto ambiental',
            'Incentive a comunicação digital entre professores e alunos',
            'Utilize os relatórios online para evitar impressões desnecessárias'
        ]
    }
    
    return report