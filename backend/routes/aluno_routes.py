from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import get_db
from datetime import datetime

aluno_bp = Blueprint('aluno', __name__)

@aluno_bp.before_request
@jwt_required()
def check_aluno():
    current_user = get_jwt_identity()
    if current_user['tipo'] not in ['aluno', 'professor', 'admin']:
        return jsonify({'error': 'Acesso negado'}), 403

@aluno_bp.route('/minhas-notas', methods=['GET'])
def get_minhas_notas():
    current_user = get_jwt_identity()
    db = get_db()
    
    # Obter ID do aluno
    aluno = db.execute(
        'SELECT id FROM alunos WHERE usuario_id = ?', (current_user['id'],)
    ).fetchone()
    
    if not aluno:
        return jsonify({'error': 'Aluno não encontrado'}), 404
    
    notas = db.execute('''
        SELECT n.*, a.titulo as atividade_titulo, m.nome as materia_nome,
               at.valor as valor_atividade, u.nome as professor_nome
        FROM notas n
        JOIN atividades a ON n.atividade_id = a.id
        JOIN materias m ON a.materia_id = m.id
        JOIN usuarios u ON n.avaliado_por = u.id
        WHERE n.aluno_id = ?
        ORDER BY n.data_avaliacao DESC
    ''', (aluno['id'],)).fetchall()
    
    # Calcular média geral
    media_geral = db.execute('''
        SELECT AVG(nota) as media FROM notas WHERE aluno_id = ?
    ''', (aluno['id'],)).fetchone()
    
    return jsonify({
        'notas': [dict(nota) for nota in notas],
        'media_geral': media_geral['media'] if media_geral['media'] else 0
    })

@aluno_bp.route('/minha-turma', methods=['GET'])
def get_minha_turma():
    current_user = get_jwt_identity()
    db = get_db()
    
    turma = db.execute('''
        SELECT t.*, m.nome as materia_nome, m.horario, m.dia_semana, u.nome as professor_nome
        FROM alunos a
        JOIN turmas t ON a.turma_id = t.id
        JOIN materias m ON t.id = m.turma_id
        JOIN usuarios u ON m.professor_id = u.id
        WHERE a.usuario_id = ?
    ''', (current_user['id'],)).fetchall()
    
    return jsonify({
        'turma_info': dict(turma[0]) if turma else {},
        'materias': [dict(materia) for materia in turma]
    })

@aluno_bp.route('/calendario-aulas', methods=['GET'])
def get_calendario_aulas():
    current_user = get_jwt_identity()
    db = get_db()
    
    # Obter turma do aluno
    aluno_turma = db.execute(
        'SELECT turma_id FROM alunos WHERE usuario_id = ?', (current_user['id'],)
    ).fetchone()
    
    if not aluno_turma:
        return jsonify({'error': 'Aluno não matriculado em turma'}), 400
    
    # Dias com aula
    dias_aula = db.execute('''
        SELECT m.nome as materia, m.horario, m.dia_semana, u.nome as professor
        FROM materias m
        JOIN usuarios u ON m.professor_id = u.id
        WHERE m.turma_id = ?
        ORDER BY 
            CASE m.dia_semana 
                WHEN 'segunda' THEN 1
                WHEN 'terca' THEN 2
                WHEN 'quarta' THEN 3
                WHEN 'quinta' THEN 4
                WHEN 'sexta' THEN 5
                WHEN 'sabado' THEN 6
                ELSE 7
            END
    ''', (aluno_turma['turma_id'],)).fetchall()
    
    # Dias sem aula
    dias_sem_aula = db.execute('''
        SELECT data, motivo 
        FROM dias_sem_aula 
        WHERE turma_id = ? AND data >= DATE('now')
        ORDER BY data
    ''', (aluno_turma['turma_id'],)).fetchall()
    
    return jsonify({
        'dias_aula': [dict(dia) for dia in dias_aula],
        'dias_sem_aula': [dict(dia) for dia in dias_sem_aula]
    })

@aluno_bp.route('/atividades-pendentes', methods=['GET'])
def get_atividades_pendentes():
    current_user = get_jwt_identity()
    db = get_db()
    
    # Obter turma do aluno
    aluno_turma = db.execute(
        'SELECT turma_id FROM alunos WHERE usuario_id = ?', (current_user['id'],)
    ).fetchone()
    
    if not aluno_turma:
        return jsonify({'error': 'Aluno não matriculado em turma'}), 400
    
    atividades = db.execute('''
        SELECT a.*, m.nome as materia_nome, 
               CASE WHEN n.id IS NOT NULL THEN 1 ELSE 0 END as entregue
        FROM atividades a
        JOIN materias m ON a.materia_id = m.id
        LEFT JOIN notas n ON a.id = n.atividade_id AND n.aluno_id = (
            SELECT id FROM alunos WHERE usuario_id = ?
        )
        WHERE m.turma_id = ? AND a.data_entrega >= DATE('now')
        ORDER BY a.data_entrega
    ''', (current_user['id'], aluno_turma['turma_id'])).fetchall()
    
    return jsonify({
        'atividades': [dict(atividade) for atividade in atividades]
    })

@aluno_bp.route('/feedback-atividade/<int:atividade_id>', methods=['GET'])
def get_feedback_atividade(atividade_id):
    current_user = get_jwt_identity()
    db = get_db()
    
    # Obter ID do aluno
    aluno = db.execute(
        'SELECT id FROM alunos WHERE usuario_id = ?', (current_user['id'],)
    ).fetchone()
    
    if not aluno:
        return jsonify({'error': 'Aluno não encontrado'}), 404
    
    feedback = db.execute('''
        SELECT n.feedback, n.nota, a.titulo, u.nome as professor_nome
        FROM notas n
        JOIN atividades a ON n.atividade_id = a.id
        JOIN usuarios u ON n.avaliado_por = u.id
        WHERE n.aluno_id = ? AND n.atividade_id = ?
    ''', (aluno['id'], atividade_id)).fetchone()
    
    if not feedback:
        return jsonify({'error': 'Feedback não encontrado'}), 404
    
    return jsonify({
        'feedback': dict(feedback)
    })