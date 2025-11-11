from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import get_db
from utils.algorithms import quick_sort

professor_bp = Blueprint('professor', __name__)

@professor_bp.before_request
@jwt_required()
def check_professor():
    current_user = get_jwt_identity()
    if current_user['tipo'] not in ['professor', 'admin']:
        return jsonify({'error': 'Acesso negado'}), 403

@professor_bp.route('/minhas-turmas', methods=['GET'])
def get_minhas_turmas():
    current_user = get_jwt_identity()
    db = get_db()
    
    turmas = db.execute('''
        SELECT DISTINCT t.*, m.nome as materia_nome, m.horario, m.dia_semana
        FROM turmas t
        JOIN materias m ON t.id = m.turma_id
        WHERE m.professor_id = ?
    ''', (current_user['id'],)).fetchall()
    
    return jsonify({
        'turmas': [dict(turma) for turma in turmas]
    })

@professor_bp.route('/turma/<int:turma_id>/alunos', methods=['GET'])
def get_alunos_turma(turma_id):
    db = get_db()
    
    alunos = db.execute('''
        SELECT a.id, u.nome, u.email, a.matricula
        FROM alunos a
        JOIN usuarios u ON a.usuario_id = u.id
        WHERE a.turma_id = ?
    ''', (turma_id,)).fetchall()
    
    return jsonify({
        'alunos': [dict(aluno) for aluno in alunos]
    })

@professor_bp.route('/atividades', methods=['GET', 'POST'])
def manage_atividades():
    current_user = get_jwt_identity()
    db = get_db()
    
    if request.method == 'GET':
        atividades = db.execute('''
            SELECT a.*, m.nome as materia_nome, t.nome as turma_nome
            FROM atividades a
            JOIN materias m ON a.materia_id = m.id
            JOIN turmas t ON m.turma_id = t.id
            WHERE a.criado_por = ?
            ORDER BY a.data_entrega
        ''', (current_user['id'],)).fetchall()
        
        return jsonify({
            'atividades': [dict(atividade) for atividade in atividades]
        })
    
    elif request.method == 'POST':
        data = request.get_json()
        
        db.execute('''
            INSERT INTO atividades (titulo, descricao, materia_id, data_entrega, valor, criado_por)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (data['titulo'], data.get('descricao'), data['materia_id'], 
              data['data_entrega'], data.get('valor', 10), current_user['id']))
        db.commit()
        
        return jsonify({'message': 'Atividade criada com sucesso'})

@professor_bp.route('/avaliar-atividade', methods=['POST'])
def avaliar_atividade():
    current_user = get_jwt_identity()
    data = request.get_json()
    db = get_db()
    
    # Verificar se já existe avaliação
    existing = db.execute(
        'SELECT id FROM notas WHERE aluno_id = ? AND atividade_id = ?',
        (data['aluno_id'], data['atividade_id'])
    ).fetchone()
    
    if existing:
        # Atualizar avaliação existente
        db.execute('''
            UPDATE notas SET nota = ?, feedback = ?, avaliado_por = ?
            WHERE id = ?
        ''', (data['nota'], data.get('feedback'), current_user['id'], existing['id']))
    else:
        # Criar nova avaliação
        db.execute('''
            INSERT INTO notas (aluno_id, atividade_id, nota, feedback, avaliado_por)
            VALUES (?, ?, ?, ?, ?)
        ''', (data['aluno_id'], data['atividade_id'], data['nota'], 
              data.get('feedback'), current_user['id']))
    
    db.commit()
    
    return jsonify({'message': 'Atividade avaliada com sucesso'})

@professor_bp.route('/atividade/<int:atividade_id>/avaliacoes', methods=['GET'])
def get_avaliacoes_atividade(atividade_id):
    db = get_db()
    
    avaliacoes = db.execute('''
        SELECT n.*, u.nome as aluno_nome, a.matricula
        FROM notas n
        JOIN alunos a ON n.aluno_id = a.id
        JOIN usuarios u ON a.usuario_id = u.id
        WHERE n.atividade_id = ?
    ''', (atividade_id,)).fetchall()
    
    return jsonify({
        'avaliacoes': [dict(avaliacao) for avaliacao in avaliacoes]
    })

@professor_bp.route('/aprovar-aluno/<int:aluno_id>', methods=['POST'])
def aprovar_aluno(aluno_id):
    data = request.get_json()
    db = get_db()
    
    # Aqui você implementaria a lógica de aprovação/reprovação
    # Por exemplo, atualizar status do aluno baseado na média
    
    return jsonify({'message': 'Status do aluno atualizado'})