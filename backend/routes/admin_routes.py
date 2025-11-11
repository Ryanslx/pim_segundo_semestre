from flask import Blueprint, request, jsonify, g
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import get_db
from utils.algorithms import quick_sort, binary_search

admin_bp = Blueprint('admin', __name__)

@admin_bp.before_request
@jwt_required()
def check_admin():
    current_user = get_jwt_identity()
    if current_user['tipo'] != 'admin':
        return jsonify({'error': 'Acesso negado'}), 403

@admin_bp.route('/turmas', methods=['GET', 'POST'])
def manage_turmas():
    db = get_db()
    
    if request.method == 'GET':
        turmas = db.execute('''
            SELECT t.*, u.nome as criado_por_nome 
            FROM turmas t 
            LEFT JOIN usuarios u ON t.criado_por = u.id
        ''').fetchall()
        
        return jsonify({
            'turmas': [dict(turma) for turma in turmas]
        })
    
    elif request.method == 'POST':
        data = request.get_json()
        current_user = get_jwt_identity()
        
        # Verificar se código já existe
        existing = db.execute(
            'SELECT id FROM turmas WHERE codigo = ?', (data['codigo'],)
        ).fetchone()
        
        if existing:
            return jsonify({'error': 'Código de turma já existe'}), 400
        
        db.execute('''
            INSERT INTO turmas (nome, codigo, descricao, ano_letivo, periodo, criado_por)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (data['nome'], data['codigo'], data.get('descricao'), 
              data['ano_letivo'], data['periodo'], current_user['id']))
        db.commit()
        
        return jsonify({'message': 'Turma criada com sucesso'})

@admin_bp.route('/turmas/<int:turma_id>', methods=['DELETE'])
def delete_turma(turma_id):
    db = get_db()
    
    # Verificar se há alunos matriculados
    alunos_count = db.execute(
        'SELECT COUNT(*) FROM alunos WHERE turma_id = ?', (turma_id,)
    ).fetchone()[0]
    
    if alunos_count > 0:
        return jsonify({'error': 'Não é possível excluir turma com alunos matriculados'}), 400
    
    db.execute('DELETE FROM turmas WHERE id = ?', (turma_id,))
    db.commit()
    
    return jsonify({'message': 'Turma excluída com sucesso'})

@admin_bp.route('/alunos', methods=['GET'])
def get_alunos():
    db = get_db()
    
    alunos = db.execute('''
        SELECT a.*, u.nome, u.email, t.nome as turma_nome
        FROM alunos a
        JOIN usuarios u ON a.usuario_id = u.id
        LEFT JOIN turmas t ON a.turma_id = t.id
    ''').fetchall()
    
    return jsonify({
        'alunos': [dict(aluno) for aluno in alunos]
    })

@admin_bp.route('/professores', methods=['GET', 'POST'])
def manage_professores():
    db = get_db()
    
    if request.method == 'GET':
        professores = db.execute('''
            SELECT u.*, COUNT(m.id) as materias_count
            FROM usuarios u
            LEFT JOIN materias m ON u.id = m.professor_id
            WHERE u.tipo = 'professor'
            GROUP BY u.id
        ''').fetchall()
        
        return jsonify({
            'professores': [dict(prof) for prof in professores]
        })
    
    elif request.method == 'POST':
        data = request.get_json()
        
        # Criar usuário professor
        from werkzeug.security import generate_password_hash
        db.execute('''
            INSERT INTO usuarios (nome, email, senha, tipo)
            VALUES (?, ?, ?, 'professor')
        ''', (data['nome'], data['email'], generate_password_hash(data['senha'])))
        db.commit()
        
        return jsonify({'message': 'Professor criado com sucesso'})

@admin_bp.route('/alocacao-professores', methods=['POST'])
def alocar_professor():
    data = request.get_json()
    db = get_db()
    
    db.execute('''
        INSERT INTO materias (nome, descricao, turma_id, professor_id, horario, dia_semana)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (data['materia'], data.get('descricao'), data['turma_id'], 
          data['professor_id'], data['horario'], data['dia_semana']))
    db.commit()
    
    return jsonify({'message': 'Professor alocado com sucesso'})

@admin_bp.route('/relatorios/desempenho', methods=['GET'])
def relatorio_desempenho():
    db = get_db()
    
    # Obter dados para relatório
    alunos_data = db.execute('''
        SELECT a.id, u.nome, t.nome as turma, 
               AVG(n.nota) as media, COUNT(n.id) as atividades_entregues
        FROM alunos a
        JOIN usuarios u ON a.usuario_id = u.id
        LEFT JOIN turmas t ON a.turma_id = t.id
        LEFT JOIN notas n ON a.id = n.aluno_id
        GROUP BY a.id
    ''').fetchall()
    
    alunos_list = [dict(aluno) for aluno in alunos_data]
    
    # Ordenar por desempenho usando nosso algoritmo
    from utils.algorithms import sort_by_performance
    alunos_ordenados = sort_by_performance(alunos_list)
    
    return jsonify({
        'alunos': alunos_ordenados,
        'total_alunos': len(alunos_ordenados),
        'media_geral': sum(aluno.get('media', 0) for aluno in alunos_ordenados) / len(alunos_ordenados) if alunos_ordenados else 0
    })