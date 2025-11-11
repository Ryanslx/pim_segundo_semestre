from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import os
from werkzeug.security import check_password_hash, generate_password_hash

app = Flask(__name__)
app.config['SECRET_KEY'] = 'sistema-academico-secret-key'

# Configuração CORS mais permissiva para desenvolvimento
CORS(app)

# Configuração do banco de dados
DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'database', 'sistema_academico.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# Função auxiliar para respostas de erro
def error_response(message, status_code=500):
    return jsonify({'error': message}), status_code

# Função auxiliar para respostas de sucesso
def success_response(message, data=None):
    response = {'message': message}
    if data:
        response.update(data)
    return jsonify(response)

# =============================================
# ROTAS PRINCIPAIS
# =============================================

# Rota de login
@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return error_response('Email e senha são obrigatórios', 400)
        
        db = get_db()
        user = db.execute(
            'SELECT * FROM usuarios WHERE email = ?', (email,)
        ).fetchone()
        
        if user and check_password_hash(user['senha'], password):
            return success_response('Login realizado com sucesso', {
                'access_token': 'fake-jwt-token-for-now',
                'user': {
                    'id': user['id'],
                    'nome': user['nome'],
                    'email': user['email'],
                    'tipo': user['tipo']
                }
            })
        
        return error_response('Credenciais inválidas', 401)
        
    except Exception as e:
        print(f'Erro no login: {e}')
        return error_response('Erro interno do servidor')

# Rota de saúde do sistema
@app.route('/api/health', methods=['GET'])
def health_check():
    return success_response('Sistema funcionando', {
        'status': 'online',
        'message': 'Sistema Acadêmico Integrado está funcionando'
    })

# =============================================
# ROTAS DE TURMAS
# =============================================

@app.route('/api/admin/turmas', methods=['GET', 'POST'])
def manage_turmas():
    if request.method == 'GET':
        return get_turmas()
    elif request.method == 'POST':
        return create_turma()

def get_turmas():
    try:
        db = get_db()
        turmas = db.execute('''
            SELECT t.*, u.nome as criado_por_nome 
            FROM turmas t 
            LEFT JOIN usuarios u ON t.criado_por = u.id
        ''').fetchall()
        
        return success_response('Turmas carregadas', {
            'turmas': [dict(turma) for turma in turmas]
        })
    except Exception as e:
        return error_response(str(e))

def create_turma():
    try:
        data = request.get_json()
        
        # Validar dados obrigatórios
        required_fields = ['nome', 'codigo', 'ano_letivo', 'periodo']
        for field in required_fields:
            if field not in data or not data[field]:
                return error_response(f'Campo obrigatório faltando: {field}', 400)
        
        db = get_db()
        
        # Verificar se código já existe
        existing = db.execute(
            'SELECT id FROM turmas WHERE codigo = ?', (data['codigo'],)
        ).fetchone()
        
        if existing:
            return error_response('Código de turma já existe', 400)
        
        # Inserir nova turma
        db.execute('''
            INSERT INTO turmas (nome, codigo, descricao, ano_letivo, periodo, capacidade_max, criado_por)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            data['nome'], 
            data['codigo'], 
            data.get('descricao', ''), 
            data['ano_letivo'], 
            data['periodo'],
            data.get('capacidade_max', 90),
            1  # admin user
        ))
        db.commit()
        
        return success_response('Turma criada com sucesso!')
        
    except Exception as e:
        print(f'Erro ao criar turma: {e}')
        return error_response(f'Erro interno: {str(e)}')

@app.route('/api/admin/turmas/<int:turma_id>', methods=['GET', 'PUT', 'DELETE'])
def manage_turma(turma_id):
    if request.method == 'GET':
        return get_turma(turma_id)
    elif request.method == 'PUT':
        return update_turma(turma_id)
    elif request.method == 'DELETE':
        return delete_turma(turma_id)

def get_turma(turma_id):
    try:
        db = get_db()
        turma = db.execute('''
            SELECT t.*, u.nome as criado_por_nome 
            FROM turmas t 
            LEFT JOIN usuarios u ON t.criado_por = u.id
            WHERE t.id = ?
        ''', (turma_id,)).fetchone()
        
        if not turma:
            return error_response('Turma não encontrada', 404)
        
        return success_response('Turma carregada', {
            'turma': dict(turma)
        })
    except Exception as e:
        return error_response(str(e))

def update_turma(turma_id):
    try:
        data = request.get_json()
        
        # Validar dados obrigatórios
        required_fields = ['nome', 'codigo', 'ano_letivo', 'periodo']
        for field in required_fields:
            if field not in data or not data[field]:
                return error_response(f'Campo obrigatório faltando: {field}', 400)
        
        db = get_db()
        
        # Verificar se a turma existe
        turma_existente = db.execute(
            'SELECT id FROM turmas WHERE id = ?', (turma_id,)
        ).fetchone()
        
        if not turma_existente:
            return error_response('Turma não encontrada', 404)
        
        # Verificar se código já existe (excluindo a própria turma)
        existing = db.execute(
            'SELECT id FROM turmas WHERE codigo = ? AND id != ?', (data['codigo'], turma_id)
        ).fetchone()
        
        if existing:
            return error_response('Código de turma já existe', 400)
        
        # Verificar capacidade
        capacidade_max = data.get('capacidade_max', 90)
        if capacidade_max < 30 or capacidade_max > 90:
            return error_response('Capacidade deve ser entre 30 e 90 alunos', 400)
        
        # Obter número atual de alunos matriculados
        alunos_count = db.execute(
            'SELECT COUNT(*) FROM alunos WHERE turma_id = ?', (turma_id,)
        ).fetchone()[0]
        
        if capacidade_max < alunos_count:
            return error_response(f'Não é possível reduzir a capacidade para {capacidade_max}. Existem {alunos_count} alunos matriculados.', 400)
        
        # Atualizar turma
        db.execute('''
            UPDATE turmas 
            SET nome = ?, codigo = ?, descricao = ?, ano_letivo = ?, 
                periodo = ?, capacidade_max = ?
            WHERE id = ?
        ''', (
            data['nome'], 
            data['codigo'], 
            data.get('descricao', ''), 
            data['ano_letivo'], 
            data['periodo'],
            capacidade_max,
            turma_id
        ))
        
        db.commit()
        
        return success_response('Turma atualizada com sucesso!')
        
    except Exception as e:
        print(f'Erro ao atualizar turma: {e}')
        return error_response(f'Erro interno: {str(e)}')

def delete_turma(turma_id):
    try:
        db = get_db()
        
        # Verificar se há alunos matriculados
        alunos_count = db.execute(
            'SELECT COUNT(*) FROM alunos WHERE turma_id = ?', (turma_id,)
        ).fetchone()[0]
        
        if alunos_count > 0:
            return error_response('Não é possível excluir turma com alunos matriculados', 400)
        
        db.execute('DELETE FROM turmas WHERE id = ?', (turma_id,))
        db.commit()
        
        return success_response('Turma excluída com sucesso!')
        
    except Exception as e:
        return error_response(str(e))

# Rotas auxiliares para turmas
@app.route('/api/admin/turmas-select', methods=['GET'])
def get_turmas_select():
    try:
        db = get_db()
        turmas = db.execute('''
            SELECT id, nome, codigo, capacidade_max, alunos_matriculados
            FROM turmas 
            WHERE alunos_matriculados < capacidade_max
            ORDER BY nome
        ''').fetchall()
        
        return success_response('Turmas carregadas', {
            'turmas': [dict(turma) for turma in turmas]
        })
    except Exception as e:
        return error_response(str(e))

@app.route('/api/admin/todas-turmas', methods=['GET'])
def get_todas_turmas():
    try:
        db = get_db()
        turmas = db.execute('''
            SELECT id, nome, codigo, capacidade_max, alunos_matriculados
            FROM turmas 
            ORDER BY nome
        ''').fetchall()
        
        return success_response('Turmas carregadas', {
            'turmas': [dict(turma) for turma in turmas]
        })
    except Exception as e:
        return error_response(str(e))

# =============================================
# ROTAS DE ALUNOS
# =============================================

@app.route('/api/admin/alunos', methods=['GET', 'POST'])
def manage_alunos():
    if request.method == 'GET':
        return get_alunos_completo()
    elif request.method == 'POST':
        return create_aluno()

@app.route('/api/admin/alunos-completo', methods=['GET'])
def get_alunos_completo():
    try:
        db = get_db()
        alunos = db.execute('''
            SELECT 
                a.id,
                u.nome,
                u.email,
                a.matricula,
                a.data_nascimento,
                a.endereco,
                a.telefone,
                t.nome as turma_nome,
                t.id as turma_id,
                COUNT(n.id) as total_avaliacoes,
                AVG(n.nota) as media_geral
            FROM alunos a
            JOIN usuarios u ON a.usuario_id = u.id
            LEFT JOIN turmas t ON a.turma_id = t.id
            LEFT JOIN notas n ON a.id = n.aluno_id
            GROUP BY a.id
            ORDER BY u.nome
        ''').fetchall()
        
        return success_response('Alunos carregados', {
            'alunos': [dict(aluno) for aluno in alunos]
        })
    except Exception as e:
        return error_response(str(e))

def create_aluno():
    try:
        data = request.get_json()
        
        # Validar campos obrigatórios
        required_fields = ['nome', 'email', 'matricula', 'senha']
        for field in required_fields:
            if field not in data or not data[field]:
                return error_response(f'Campo obrigatório: {field}', 400)
        
        db = get_db()
        
        # Verificar se email já existe
        existing_email = db.execute(
            'SELECT id FROM usuarios WHERE email = ?', (data['email'],)
        ).fetchone()
        if existing_email:
            return error_response('Email já cadastrado', 400)
        
        # Verificar se matrícula já existe
        existing_matricula = db.execute(
            'SELECT id FROM alunos WHERE matricula = ?', (data['matricula'],)
        ).fetchone()
        if existing_matricula:
            return error_response('Matrícula já existe', 400)
        
        # Criar usuário
        db.execute(
            'INSERT INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, ?)',
            (data['nome'], data['email'], generate_password_hash(data['senha']), 'aluno')
        )
        
        usuario_id = db.execute('SELECT last_insert_rowid()').fetchone()[0]
        
        # Criar aluno
        db.execute('''
            INSERT INTO alunos (usuario_id, matricula, turma_id, data_nascimento, endereco, telefone)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            usuario_id,
            data['matricula'],
            data.get('turma_id'),
            data.get('data_nascimento'),
            data.get('endereco'),
            data.get('telefone')
        ))
        
        # Atualizar contagem de alunos na turma se houver turma
        if data.get('turma_id'):
            db.execute(
                'UPDATE turmas SET alunos_matriculados = alunos_matriculados + 1 WHERE id = ?',
                (data['turma_id'],)
            )
        
        db.commit()
        
        return success_response('Aluno criado com sucesso!')
        
    except Exception as e:
        print(f'Erro ao criar aluno: {e}')
        return error_response(f'Erro interno: {str(e)}')

@app.route('/api/admin/alunos/<int:aluno_id>', methods=['GET', 'PUT', 'DELETE'])
def manage_aluno(aluno_id):
    if request.method == 'GET':
        return get_aluno(aluno_id)
    elif request.method == 'PUT':
        return update_aluno(aluno_id)
    elif request.method == 'DELETE':
        return delete_aluno(aluno_id)

def get_aluno(aluno_id):
    try:
        db = get_db()
        aluno = db.execute('''
            SELECT 
                a.id,
                u.nome,
                u.email,
                a.matricula,
                a.data_nascimento,
                a.endereco,
                a.telefone,
                t.nome as turma_nome,
                t.id as turma_id,
                u.id as usuario_id
            FROM alunos a
            JOIN usuarios u ON a.usuario_id = u.id
            LEFT JOIN turmas t ON a.turma_id = t.id
            WHERE a.id = ?
        ''', (aluno_id,)).fetchone()
        
        if not aluno:
            return error_response('Aluno não encontrado', 404)
        
        return success_response('Aluno carregado', {
            'aluno': dict(aluno)
        })
    except Exception as e:
        return error_response(str(e))

def update_aluno(aluno_id):
    try:
        data = request.get_json()
        db = get_db()
        
        # Obter dados atuais do aluno
        aluno = db.execute(
            'SELECT usuario_id, turma_id FROM alunos WHERE id = ?', (aluno_id,)
        ).fetchone()
        
        if not aluno:
            return error_response('Aluno não encontrado', 404)
        
        old_turma_id = aluno['turma_id']
        new_turma_id = data.get('turma_id')
        
        # Atualizar usuário
        if 'nome' in data or 'email' in data:
            db.execute('''
                UPDATE usuarios 
                SET nome = COALESCE(?, nome), email = COALESCE(?, email) 
                WHERE id = ?
            ''', (data.get('nome'), data.get('email'), aluno['usuario_id']))
        
        # Atualizar aluno
        db.execute('''
            UPDATE alunos 
            SET matricula = COALESCE(?, matricula),
                turma_id = ?,
                data_nascimento = COALESCE(?, data_nascimento),
                endereco = COALESCE(?, endereco),
                telefone = COALESCE(?, telefone)
            WHERE id = ?
        ''', (
            data.get('matricula'),
            new_turma_id,
            data.get('data_nascimento'),
            data.get('endereco'),
            data.get('telefone'),
            aluno_id
        ))
        
        # Atualizar contagens de alunos nas turmas se a turma mudou
        if old_turma_id != new_turma_id:
            if old_turma_id:
                db.execute(
                    'UPDATE turmas SET alunos_matriculados = alunos_matriculados - 1 WHERE id = ?',
                    (old_turma_id,)
                )
            if new_turma_id:
                db.execute(
                    'UPDATE turmas SET alunos_matriculados = alunos_matriculados + 1 WHERE id = ?',
                    (new_turma_id,)
                )
        
        db.commit()
        
        return success_response('Aluno atualizado com sucesso!')
        
    except Exception as e:
        return error_response(str(e))

def delete_aluno(aluno_id):
    try:
        db = get_db()
        
        # Obter dados do aluno
        aluno = db.execute('''
            SELECT a.usuario_id, a.turma_id 
            FROM alunos a 
            WHERE a.id = ?
        ''', (aluno_id,)).fetchone()
        
        if not aluno:
            return error_response('Aluno não encontrado', 404)
        
        # Verificar se há notas associadas
        notas_count = db.execute(
            'SELECT COUNT(*) FROM notas WHERE aluno_id = ?', (aluno_id,)
        ).fetchone()[0]
        
        if notas_count > 0:
            return error_response('Não é possível excluir aluno com notas registradas', 400)
        
        # Deletar aluno
        db.execute('DELETE FROM alunos WHERE id = ?', (aluno_id,))
        
        # Deletar usuário
        db.execute('DELETE FROM usuarios WHERE id = ?', (aluno['usuario_id'],))
        
        # Atualizar contagem na turma se houver
        if aluno['turma_id']:
            db.execute(
                'UPDATE turmas SET alunos_matriculados = alunos_matriculados - 1 WHERE id = ?',
                (aluno['turma_id'],)
            )
        
        db.commit()
        
        return success_response('Aluno excluído com sucesso!')
        
    except Exception as e:
        return error_response(str(e))

# =============================================
# ROTAS ADICIONAIS PARA TURMAS
# =============================================

@app.route('/api/admin/turmas/<int:turma_id>/alunos', methods=['GET'])
def get_alunos_turma(turma_id):
    try:
        db = get_db()
        alunos = db.execute('''
            SELECT a.id, u.nome, u.email, a.matricula, a.telefone,
                   AVG(n.nota) as media_geral, COUNT(n.id) as total_avaliacoes
            FROM alunos a
            JOIN usuarios u ON a.usuario_id = u.id
            LEFT JOIN notas n ON a.id = n.aluno_id
            WHERE a.turma_id = ?
            GROUP BY a.id
        ''', (turma_id,)).fetchall()
        
        return success_response('Alunos da turma carregados', {
            'alunos': [dict(aluno) for aluno in alunos]
        })
    except Exception as e:
        return error_response(str(e))

@app.route('/api/debug/materias', methods=['GET'])
def debug_materias():
    try:
        db = get_db()
        materias = db.execute('''
            SELECT m.*, u.nome as professor_nome, t.nome as turma_nome
            FROM materias m
            JOIN usuarios u ON m.professor_id = u.id
            JOIN turmas t ON m.turma_id = t.id
        ''').fetchall()
        
        return success_response('Debug - Matérias', {
            'materias': [dict(materia) for materia in materias]
        })
    except Exception as e:
        return error_response(str(e))

# ROTA CORRIGIDA - Professores da turma
@app.route('/api/admin/turmas/<int:turma_id>/professores', methods=['GET'])
def get_professores_turma(turma_id):
    try:
        db = get_db()
        
        print(f"🔍 Buscando professores da turma {turma_id}...")
        
        # Verificar se a turma existe
        turma = db.execute('SELECT id, nome FROM turmas WHERE id = ?', (turma_id,)).fetchone()
        if not turma:
            return error_response('Turma não encontrada', 404)
        
        professores = db.execute('''
            SELECT 
                u.id, 
                u.nome, 
                u.email, 
                u.telefone,
                u.formacao,
                m.nome as materia_nome,
                m.horario,
                m.dia_semana,
                m.carga_horaria_semanal,
                m.data_inicio
            FROM materias m
            JOIN usuarios u ON m.professor_id = u.id
            WHERE m.turma_id = ? AND u.tipo = 'professor'
        ''', (turma_id,)).fetchall()
        
        print(f"✅ Encontrados {len(professores)} professores na turma {turma_id}")
        
        professores_list = [dict(prof) for prof in professores]
        
        return success_response('Professores da turma carregados', {
            'professores': professores_list
        })
    except Exception as e:
        print(f"❌ Erro em get_professores_turma: {e}")
        return success_response('Professores da turma carregados', {
            'professores': []
        })

@app.route('/api/admin/alunos-sem-turma', methods=['GET'])
def get_alunos_sem_turma():
    try:
        db = get_db()
        alunos = db.execute('''
            SELECT a.id, u.nome, u.email, a.matricula, a.telefone,
                   AVG(n.nota) as media_geral
            FROM alunos a
            JOIN usuarios u ON a.usuario_id = u.id
            LEFT JOIN notas n ON a.id = n.aluno_id
            WHERE a.turma_id IS NULL
            GROUP BY a.id
        ''').fetchall()
        
        return success_response('Alunos sem turma carregados', {
            'alunos': [dict(aluno) for aluno in alunos]
        })
    except Exception as e:
        return error_response(str(e))

@app.route('/api/admin/professores-disponiveis', methods=['GET'])
def get_professores_disponiveis():
    try:
        db = get_db()
        
        print("📋 Buscando professores disponíveis...")
        
        professores = db.execute('''
            SELECT 
                u.id, 
                u.nome, 
                u.email, 
                u.telefone,
                u.formacao,
                u.experiencia,
                COUNT(m.id) as turmas_count
            FROM usuarios u
            LEFT JOIN materias m ON u.id = m.professor_id
            WHERE u.tipo = 'professor'
            GROUP BY u.id
            ORDER BY u.nome
        ''').fetchall()
        
        print(f"✅ Encontrados {len(professores)} professores")
        
        professores_list = []
        for prof in professores:
            prof_dict = dict(prof)
            print(f"👨‍🏫 Professor: {prof_dict['nome']} - ID: {prof_dict['id']} - Turmas: {prof_dict['turmas_count']}")
            professores_list.append(prof_dict)
        
        return success_response('Professores disponíveis carregados', {
            'professores': professores_list
        })
        
    except Exception as e:
        print(f"❌ Erro CRÍTICO em professores-disponiveis: {e}")
        import traceback
        traceback.print_exc()
        return error_response(f'Erro ao carregar professores: {str(e)}')

@app.route('/api/admin/materias', methods=['GET'])
def get_materias():
    try:
        db = get_db()
        materias = db.execute('SELECT id, nome FROM materias').fetchall()
        
        return success_response('Matérias carregadas', {
            'materias': [dict(materia) for materia in materias]
        })
    except Exception as e:
        return error_response(str(e))

# =============================================
# ROTAS DE PROFESSORES
# =============================================

@app.route('/api/admin/professores', methods=['GET', 'POST'])
def manage_professores():
    if request.method == 'GET':
        return get_professores()
    elif request.method == 'POST':
        return create_professor()

def get_professores():
    try:
        db = get_db()
        professores = db.execute('''
            SELECT u.*, COUNT(m.id) as materias_count
            FROM usuarios u
            LEFT JOIN materias m ON u.id = m.professor_id
            WHERE u.tipo = 'professor'
            GROUP BY u.id
        ''').fetchall()
        
        return success_response('Professores carregados', {
            'professores': [dict(prof) for prof in professores]
        })
    except Exception as e:
        return error_response(str(e))

def create_professor():
    try:
        data = request.get_json()
        
        # Validar campos obrigatórios
        required_fields = ['nome', 'email', 'senha']
        for field in required_fields:
            if field not in data or not data[field]:
                return error_response(f'Campo obrigatório: {field}', 400)
        
        db = get_db()
        
        # Verificar se email já existe
        existing_email = db.execute(
            'SELECT id FROM usuarios WHERE email = ?', (data['email'],)
        ).fetchone()
        if existing_email:
            return error_response('Email já cadastrado', 400)
        
        # Criar usuário professor
        db.execute(
            'INSERT INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, ?)',
            (data['nome'], data['email'], generate_password_hash(data['senha']), 'professor')
        )
        
        db.commit()
        
        return success_response('Professor criado com sucesso!')
        
    except Exception as e:
        print(f'Erro ao criar professor: {e}')
        return error_response(f'Erro interno: {str(e)}')

@app.route('/api/admin/professores/<int:professor_id>', methods=['GET', 'PUT', 'DELETE'])
def manage_professor(professor_id):
    if request.method == 'GET':
        return get_professor_details(professor_id)
    elif request.method == 'PUT':
        return update_professor(professor_id)
    elif request.method == 'DELETE':
        return delete_professor(professor_id)

def get_professor_details(professor_id):
    try:
        db = get_db()
        professor = db.execute('''
            SELECT u.*, 
                   GROUP_CONCAT(DISTINCT m.nome) as materias_lecionadas,
                   COUNT(DISTINCT m.id) as total_turmas
            FROM usuarios u
            LEFT JOIN materias m ON u.id = m.professor_id
            WHERE u.id = ? AND u.tipo = 'professor'
            GROUP BY u.id
        ''', (professor_id,)).fetchone()
        
        if not professor:
            return error_response('Professor não encontrado', 404)
        
        # Buscar turmas do professor
        turmas = db.execute('''
            SELECT t.id, t.nome, t.codigo, m.nome as materia_nome,
                   m.horario, m.dia_semana
            FROM materias m
            JOIN turmas t ON m.turma_id = t.id
            WHERE m.professor_id = ?
        ''', (professor_id,)).fetchall()
        
        professor_data = dict(professor)
        professor_data['turmas'] = [dict(turma) for turma in turmas]
        
        return success_response('Professor carregado', {
            'professor': professor_data
        })
    except Exception as e:
        return error_response(str(e))

def update_professor(professor_id):
    try:
        data = request.get_json()
        db = get_db()
        
        # Verificar se professor existe
        professor = db.execute(
            'SELECT id FROM usuarios WHERE id = ? AND tipo = "professor"', (professor_id,)
        ).fetchone()
        
        if not professor:
            return error_response('Professor não encontrado', 404)
        
        # Atualizar dados do professor
        db.execute('''
            UPDATE usuarios 
            SET nome = COALESCE(?, nome), email = COALESCE(?, email),
                telefone = COALESCE(?, telefone), formacao = COALESCE(?, formacao),
                experiencia = COALESCE(?, experiencia)
            WHERE id = ?
        ''', (
            data.get('nome'), 
            data.get('email'),
            data.get('telefone'),
            data.get('formacao'),
            data.get('experiencia'),
            professor_id
        ))
        
        db.commit()
        
        return success_response('Professor atualizado com sucesso!')
        
    except Exception as e:
        return error_response(str(e))

def delete_professor(professor_id):
    try:
        db = get_db()
        
        # Verificar se professor existe
        professor = db.execute(
            'SELECT id FROM usuarios WHERE id = ? AND tipo = "professor"', (professor_id,)
        ).fetchone()
        
        if not professor:
            return error_response('Professor não encontrado', 404)
        
        # Verificar se professor tem matérias atribuídas
        materias_count = db.execute(
            'SELECT COUNT(*) FROM materias WHERE professor_id = ?', (professor_id,)
        ).fetchone()[0]
        
        if materias_count > 0:
            return error_response('Não é possível excluir professor com matérias atribuídas', 400)
        
        # Deletar professor
        db.execute('DELETE FROM usuarios WHERE id = ?', (professor_id,))
        db.commit()
        
        return success_response('Professor excluído com sucesso!')
        
    except Exception as e:
        return error_response(str(e))

# Rota para alocar professor em turma
@app.route('/api/admin/turmas/<int:turma_id>/professores', methods=['POST'])
def alocar_professor_turma(turma_id):
    try:
        data = request.get_json()
        
        print(f"🎯 Alocando professor na turma {turma_id}:", data)
        
        required_fields = ['professor_id', 'materia_nome', 'horario', 'dia_semana']
        for field in required_fields:
            if field not in data or not data[field]:
                return error_response(f'Campo obrigatório: {field}', 400)
        
        db = get_db()
        
        # Verificar se turma existe
        turma = db.execute(
            'SELECT id, nome FROM turmas WHERE id = ?', (turma_id,)
        ).fetchone()
        
        if not turma:
            return error_response('Turma não encontrada', 404)
        
        # Verificar se professor existe
        professor = db.execute(
            'SELECT id, nome FROM usuarios WHERE id = ? AND tipo = "professor"', (data['professor_id'],)
        ).fetchone()
        
        if not professor:
            return error_response('Professor não encontrado', 404)
        
        print(f"✅ Turma: {turma['nome']}, Professor: {professor['nome']}")
        
        # Criar nova matéria com o professor
        db.execute('''
            INSERT INTO materias (nome, turma_id, professor_id, horario, dia_semana, carga_horaria_semanal, data_inicio, observacoes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data['materia_nome'],
            turma_id,
            data['professor_id'],
            data['horario'],
            data['dia_semana'],
            data.get('carga_horaria_semanal', 4),
            data.get('data_inicio'),
            data.get('observacoes')
        ))
        
        db.commit()
        
        print("✅ Professor alocado com sucesso no banco de dados!")
        
        return success_response('Professor alocado na turma com sucesso!')
        
    except Exception as e:
        print(f"❌ Erro CRÍTICO ao alocar professor: {e}")
        import traceback
        traceback.print_exc()
        return error_response(f'Erro interno: {str(e)}')

# =============================================
# ROTAS DE ALUNO (FRONTEND)
# =============================================

@app.route('/api/aluno/minhas-notas', methods=['GET'])
def get_minhas_notas():
    try:
        db = get_db()
        
        # Obter algum aluno para teste
        aluno = db.execute('SELECT id FROM alunos LIMIT 1').fetchone()
        if not aluno:
            return success_response('Notas carregadas', {
                'notas': [], 
                'media_geral': 0
            })
            
        notas = db.execute('''
            SELECT n.*, a.titulo as atividade_titulo, m.nome as materia_nome,
                   a.valor as valor_atividade, u.nome as professor_nome
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
        
        return success_response('Notas carregadas', {
            'notas': [dict(nota) for nota in notas],
            'media_geral': media_geral['media'] if media_geral['media'] else 0
        })
    except Exception as e:
        return error_response(str(e))

# =============================================
# ROTAS GERAIS
# =============================================

@app.route('/api/feedback', methods=['POST'])
def submit_feedback():
    try:
        data = request.get_json()
        
        db = get_db()
        db.execute(
            'INSERT INTO feedback (user_id, user_type, feedback, rating, suggestions) VALUES (?, ?, ?, ?, ?)',
            (data.get('user_id'), data.get('user_type'), data.get('feedback'), 
             data.get('rating'), data.get('suggestions'))
        )
        db.commit()
        
        return success_response('Feedback enviado com sucesso!')
    except Exception as e:
        return error_response(str(e))

@app.route('/api/sustainability', methods=['GET'])
def get_sustainability_metrics():
    try:
        db = get_db()
        
        students_count = db.execute('SELECT COUNT(*) FROM alunos').fetchone()[0]
        assignments_count = db.execute('SELECT COUNT(*) FROM atividades').fetchone()[0]
        
        metrics = {
            'paper_saved_pages': assignments_count * 3,
            'co2_saved_kg': students_count * 0.5,
            'trees_saved': (assignments_count * 3) / 8000,
            'digital_assignments': assignments_count
        }
        
        return success_response('Métricas carregadas', metrics)
    except Exception as e:
        return error_response(str(e))

if __name__ == '__main__':
    print("🚀 Iniciando servidor Flask...")
    print("📊 Banco de dados:", DB_PATH)
    print("🌐 Servidor rodando em: http://localhost:8000")
    print("🔧 CORS configurado para todas as origens")
    app.run(debug=True, host='0.0.0.0', port=8000)