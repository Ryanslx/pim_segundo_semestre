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
<<<<<<< HEAD
    })

# ... código existente ...

@admin_bp.route('/turmas/<int:turma_id>/integrantes', methods=['GET'])
def get_integrantes_turma(turma_id):
    db = get_db()
    
    # Verificar se turma existe
    turma = db.execute('SELECT * FROM turmas WHERE id = ?', (turma_id,)).fetchone()
    if not turma:
        return jsonify({'error': 'Turma não encontrada'}), 404
    
    # Obter alunos da turma
    alunos = db.execute('''
        SELECT a.id, u.nome, u.email, a.matricula
        FROM alunos a
        JOIN usuarios u ON a.usuario_id = u.id
        WHERE a.turma_id = ?
        ORDER BY u.nome
    ''', (turma_id,)).fetchall()
    
    # Obter professores e horários da turma
    professores = db.execute('''
        SELECT DISTINCT 
            u.id as professor_id,
            u.nome as professor_nome,
            m.nome as materia_nome,
            pa.dia_semana,
            pa.horario_inicio,
            pa.horario_fim
        FROM professor_alocacao pa
        JOIN usuarios u ON pa.professor_id = u.id
        JOIN materias m ON pa.materia_id = m.id
        WHERE pa.turma_id = ?
        ORDER BY 
            CASE pa.dia_semana 
                WHEN 'segunda' THEN 1
                WHEN 'terca' THEN 2
                WHEN 'quarta' THEN 3
                WHEN 'quinta' THEN 4
                WHEN 'sexta' THEN 5
                WHEN 'sabado' THEN 6
                ELSE 7
            END,
            pa.horario_inicio
    ''', (turma_id,)).fetchall()
    
    return jsonify({
        'turma': dict(turma),
        'alunos': [dict(aluno) for aluno in alunos],
        'professores': [dict(prof) for prof in professores]
    })

@admin_bp.route('/professores/completo', methods=['GET'])
def get_professores_completo():
    db = get_db()
    
    professores = db.execute('''
        SELECT 
            u.id, u.nome, u.email, u.criado_em,
            GROUP_CONCAT(DISTINCT m.nome) as materias_lecionadas,
            COUNT(DISTINCT pa.id) as turmas_alocadas
        FROM usuarios u
        LEFT JOIN materias m ON u.id = m.professor_id
        LEFT JOIN professor_alocacao pa ON u.id = pa.professor_id
        WHERE u.tipo = 'professor'
        GROUP BY u.id
        ORDER BY u.nome
    ''').fetchall()
    
    return jsonify({
        'professores': [dict(prof) for prof in professores]
    })

@admin_bp.route('/professores', methods=['POST'])
def criar_professor():
    data = request.get_json()
    
    required_fields = ['nome', 'email', 'senha', 'materias']
    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({'error': f'Campo obrigatório: {field}'}), 400
    
    db = get_db()
    
    # Verificar se email já existe
    existing = db.execute(
        'SELECT id FROM usuarios WHERE email = ?', (data['email'],)
    ).fetchone()
    
    if existing:
        return jsonify({'error': 'Email já cadastrado'}), 400
    
    try:
        # Criar usuário professor
        from werkzeug.security import generate_password_hash
        db.execute(
            'INSERT INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, ?)',
            (data['nome'], data['email'], generate_password_hash(data['senha']), 'professor')
        )
        
        professor_id = db.execute('SELECT last_insert_rowid()').fetchone()[0]
        
        # Associar matérias ao professor
        for materia in data['materias']:
            db.execute(
                'INSERT INTO materias (nome, professor_id) VALUES (?, ?)',
                (materia, professor_id)
            )
        
        db.commit()
        return jsonify({'message': 'Professor criado com sucesso', 'professor_id': professor_id})
        
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/professores/<int:professor_id>/alocar', methods=['POST'])
def alocar_professor(professor_id):
    data = request.get_json()
    
    required_fields = ['turma_id', 'materia_id', 'dia_semana', 'horario_inicio', 'horario_fim']
    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({'error': f'Campo obrigatório: {field}'}), 400
    
    db = get_db()
    
    # Verificar conflito de horário
    conflito = db.execute('''
        SELECT pa.id, u.nome as professor_nome, t.nome as turma_nome
        FROM professor_alocacao pa
        JOIN usuarios u ON pa.professor_id = u.id
        JOIN turmas t ON pa.turma_id = t.id
        WHERE pa.professor_id = ? 
        AND pa.dia_semana = ?
        AND (
            (pa.horario_inicio <= ? AND pa.horario_fim > ?) OR
            (pa.horario_inicio < ? AND pa.horario_fim >= ?) OR
            (pa.horario_inicio >= ? AND pa.horario_fim <= ?)
        )
    ''', (
        professor_id, data['dia_semana'],
        data['horario_inicio'], data['horario_inicio'],
        data['horario_fim'], data['horario_fim'],
        data['horario_inicio'], data['horario_fim']
    )).fetchone()
    
    if conflito:
        return jsonify({
            'error': f'Conflito de horário: Professor já está alocado na turma {conflito["turma_nome"]} neste horário'
        }), 400
    
    # Verificar se turma já tem aula neste horário
    turma_conflito = db.execute('''
        SELECT pa.id, m.nome as materia_nome, u.nome as professor_nome
        FROM professor_alocacao pa
        JOIN materias m ON pa.materia_id = m.id
        JOIN usuarios u ON pa.professor_id = u.id
        WHERE pa.turma_id = ? 
        AND pa.dia_semana = ?
        AND (
            (pa.horario_inicio <= ? AND pa.horario_fim > ?) OR
            (pa.horario_inicio < ? AND pa.horario_fim >= ?) OR
            (pa.horario_inicio >= ? AND pa.horario_fim <= ?)
        )
    ''', (
        data['turma_id'], data['dia_semana'],
        data['horario_inicio'], data['horario_inicio'],
        data['horario_fim'], data['horario_fim'],
        data['horario_inicio'], data['horario_fim']
    )).fetchone()
    
    if turma_conflito:
        return jsonify({
            'error': f'Conflito de horário: Turma já tem aula de {turma_conflito["materia_nome"]} com {turma_conflito["professor_nome"]} neste horário'
        }), 400
    
    # Inserir alocação
    try:
        db.execute('''
            INSERT INTO professor_alocacao 
            (professor_id, turma_id, materia_id, dia_semana, horario_inicio, horario_fim)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            professor_id, data['turma_id'], data['materia_id'],
            data['dia_semana'], data['horario_inicio'], data['horario_fim']
        ))
        
        db.commit()
        return jsonify({'message': 'Professor alocado com sucesso'})
        
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/dias-sem-aula', methods=['GET', 'POST'])
def gerenciar_dias_sem_aula():
    db = get_db()
    
    if request.method == 'GET':
        dias = db.execute('''
            SELECT d.*, t.nome as turma_nome, u.nome as criado_por_nome
            FROM dias_sem_aula d
            LEFT JOIN turmas t ON d.turma_id = t.id
            LEFT JOIN usuarios u ON d.criado_por = u.id
            WHERE d.data >= DATE('now')
            ORDER BY d.data
        ''').fetchall()
        
        return jsonify({
            'dias_sem_aula': [dict(dia) for dia in dias]
        })
    
    elif request.method == 'POST':
        data = request.get_json()
        current_user = get_jwt_identity()
        
        required_fields = ['data', 'motivo']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'Campo obrigatório: {field}'}), 400
        
        try:
            db.execute('''
                INSERT INTO dias_sem_aula (data, motivo, turma_id, criado_por)
                VALUES (?, ?, ?, ?)
            ''', (data['data'], data['motivo'], data.get('turma_id'), current_user['id']))
            
            db.commit()
            return jsonify({'message': 'Dia sem aula registrado com sucesso'})
            
        except Exception as e:
            db.rollback()
            return jsonify({'error': str(e)}), 500

# Rota para obter matérias de um professor
@admin_bp.route('/professores/<int:professor_id>/materias', methods=['GET'])
def get_materias_professor(professor_id):
    db = get_db()
    
    materias = db.execute('''
        SELECT id, nome 
        FROM materias 
        WHERE professor_id = ?
    ''', (professor_id,)).fetchall()
    
    return jsonify({
        'materias': [dict(materia) for materia in materias]
=======
>>>>>>> origin/admin
    })