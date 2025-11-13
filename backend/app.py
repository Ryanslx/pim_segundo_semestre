from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3
import os
from werkzeug.security import check_password_hash, generate_password_hash
import jwt
from datetime import datetime, timedelta
from functools import wraps

# Configuração JWT
JWT_SECRET = 'sistema-academico-jwt-secret-key'
JWT_ALGORITHM = 'HS256'

def generate_token(user_id, user_type):
    payload = {
        'user_id': user_id,
        'user_type': user_type,
        'exp': datetime.utcnow() + timedelta(hours=24)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(token):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Verificar no header Authorization
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(' ')[1]  # Bearer <token>
            except IndexError:
                return error_response('Token inválido', 401)
        
        if not token:
            return error_response('Token de acesso é necessário', 401)
        
        payload = verify_token(token)
        if not payload:
            return error_response('Token inválido ou expirado', 401)
        
        # Adicionar informações do usuário ao request
        request.user_id = payload['user_id']
        request.user_type = payload['user_type']
        
        return f(*args, **kwargs)
    
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not hasattr(request, 'user_type') or request.user_type != 'admin':
            return error_response('Acesso restrito a administradores', 403)
        return f(*args, **kwargs)
    return decorated

app = Flask(__name__)
app.config['SECRET_KEY'] = 'sistema-academico-secret-key'

CORS(app, origins=["http://127.0.0.1:5500", "http://localhost:5500", "http://localhost:8000", "http://127.0.0.1:8000"], 
     supports_credentials=True, 
     allow_headers=["Content-Type", "Authorization", "Accept"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

@app.route('/api/test-cors', methods=['GET', 'OPTIONS'])
def test_cors():
    if request.method == 'OPTIONS':
        return '', 200
    
    return success_response('CORS funcionando!', {
        'message': 'Teste de CORS bem-sucedido',
        'origin': request.headers.get('Origin', 'N/A')
    })

# Configuração do banco de dados
DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'database', 'sistema_academico.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# =============================================
# INICIALIZAÇÃO DO BANCO DE DADOS
# =============================================

def init_db():
    """Inicializa o banco de dados com todas as tabelas necessárias"""
    try:
        db = get_db()
        
        # Tabela de usuários
        db.execute('''
            CREATE TABLE IF NOT EXISTS usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                senha TEXT NOT NULL,
                tipo TEXT NOT NULL DEFAULT 'aluno',
                telefone TEXT,
                formacao TEXT,
                experiencia INTEGER DEFAULT 0,
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Tabela de turmas
        db.execute('''
            CREATE TABLE IF NOT EXISTS turmas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                codigo TEXT UNIQUE NOT NULL,
                descricao TEXT,
                ano_letivo TEXT NOT NULL,
                periodo TEXT NOT NULL,
                capacidade_max INTEGER DEFAULT 90,
                alunos_matriculados INTEGER DEFAULT 0,
                criado_por INTEGER,
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (criado_por) REFERENCES usuarios (id)
            )
        ''')
        
        # Tabela de alunos
        db.execute('''
            CREATE TABLE IF NOT EXISTS alunos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                usuario_id INTEGER UNIQUE,
                matricula TEXT UNIQUE NOT NULL,
                turma_id INTEGER,
                data_nascimento DATE,
                endereco TEXT,
                telefone TEXT,
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (usuario_id) REFERENCES usuarios (id),
                FOREIGN KEY (turma_id) REFERENCES turmas (id)
            )
        ''')
        
        # Tabela de matérias
        db.execute('''
            CREATE TABLE IF NOT EXISTS materias (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                turma_id INTEGER NOT NULL,
                professor_id INTEGER NOT NULL,
                carga_horaria_semanal INTEGER DEFAULT 4,
                horario TEXT,
                dia_semana TEXT,
                data_inicio DATE,
                observacoes TEXT,
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (turma_id) REFERENCES turmas (id),
                FOREIGN KEY (professor_id) REFERENCES usuarios (id)
            )
        ''')
        
        # Tabela de atividades
        db.execute('''
            CREATE TABLE IF NOT EXISTS atividades (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                titulo TEXT NOT NULL,
                descricao TEXT,
                materia_id INTEGER NOT NULL,
                valor REAL DEFAULT 10.0,
                data_entrega DATE,
                criado_por INTEGER,
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (materia_id) REFERENCES materias (id),
                FOREIGN KEY (criado_por) REFERENCES usuarios (id)
            )
        ''')
        
        # Tabela de notas
        db.execute('''
            CREATE TABLE IF NOT EXISTS notas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                aluno_id INTEGER NOT NULL,
                atividade_id INTEGER NOT NULL,
                nota REAL NOT NULL,
                feedback TEXT,
                avaliado_por INTEGER,
                data_avaliacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (aluno_id) REFERENCES alunos (id),
                FOREIGN KEY (atividade_id) REFERENCES atividades (id),
                FOREIGN KEY (avaliado_por) REFERENCES usuarios (id)
            )
        ''')
        
        # Tabela de feedback
        db.execute('''
            CREATE TABLE IF NOT EXISTS feedback (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                user_type TEXT NOT NULL,
                feedback TEXT NOT NULL,
                rating INTEGER NOT NULL,
                suggestions TEXT,
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES usuarios (id)
            )
        ''')

        # Verificar se já existem usuários
        existing_users = db.execute('SELECT COUNT(*) as count FROM usuarios').fetchone()['count']
        
        if existing_users == 0:
            # Inserir usuários de exemplo
            usuarios_exemplo = [
                ('João Silva', 'joao@escola.com', generate_password_hash('123456'), 'aluno'),
                ('Maria Santos', 'maria@escola.com', generate_password_hash('aluno123'), 'aluno'),
                ('Carlos Professor', 'prof.carlos@escola.com', generate_password_hash('prof123'), 'professor', '(11) 99999-1001', 'Licenciatura em Matemática', 5),
                ('Ana Professora', 'prof.ana@escola.com', generate_password_hash('prof123'), 'professor', '(11) 99999-1002', 'Licenciatura em Português', 3),
                ('Admin Sistema', 'admin@escola.com', generate_password_hash('admin123'), 'admin')
            ]
            
            db.executemany(
                'INSERT INTO usuarios (nome, email, senha, tipo, telefone, formacao, experiencia) VALUES (?, ?, ?, ?, ?, ?, ?)',
                usuarios_exemplo
            )
            
            # Criar alunos
            db.execute(
                'INSERT INTO alunos (usuario_id, matricula) VALUES (1, "20240001")'
            )
            db.execute(
                'INSERT INTO alunos (usuario_id, matricula) VALUES (2, "20240002")'
            )
            
            # Criar turmas de exemplo
            turmas_exemplo = [
                ('1º Ano A - Ensino Médio', '1A2024', 'Turma do primeiro ano', '2024', 'manhã', 35, 2, 5),
                ('2º Ano B - Ensino Médio', '2B2024', 'Turma do segundo ano', '2024', 'tarde', 35, 0, 5),
                ('3º Ano C - Ensino Médio', '3C2024', 'Turma do terceiro ano', '2024', 'manhã', 35, 0, 5)
            ]
            
            db.executemany(
                'INSERT INTO turmas (nome, codigo, descricao, ano_letivo, periodo, capacidade_max, alunos_matriculados, criado_por) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                turmas_exemplo
            )
            
            # Atualizar alunos com turma
            db.execute('UPDATE alunos SET turma_id = 1 WHERE id IN (1, 2)')
            
            # Criar matérias de exemplo
            materias_exemplo = [
                ('Matemática', 1, 3, 4, '08:00-09:30', 'segunda', '2024-01-01', 'Álgebra Linear e Geometria Analítica'),
                ('Português', 1, 4, 4, '10:00-11:30', 'segunda', '2024-01-01', 'Gramática e Literatura'),
                ('Física', 1, 3, 4, '08:00-09:30', 'quarta', '2024-01-01', 'Mecânica Clássica'),
                ('História', 1, 4, 4, '14:00-15:30', 'quinta', '2024-01-01', 'História do Brasil')
            ]
            
            db.executemany(
                'INSERT INTO materias (nome, turma_id, professor_id, carga_horaria_semanal, horario, dia_semana, data_inicio, observacoes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                materias_exemplo
            )
        
        db.commit()
        print("✅ Banco de dados inicializado com sucesso!")
        
    except Exception as e:
        print(f"❌ Erro ao inicializar banco de dados: {e}")
        raise e
    finally:
        db.close()

# =============================================
# FUNÇÕES AUXILIARES
# =============================================

def error_response(message, status_code=500):
    return jsonify({'error': message}), status_code

def success_response(message, data=None):
    response = {'message': message}
    if data:
        response.update(data)
    return jsonify(response)

# =============================================
# SERVIÇO DE FRONTEND
# =============================================

@app.route('/')
def serve_index():
    return send_from_directory('../frontend', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('../frontend', path)

# =============================================
# ROTAS PRINCIPAIS
# =============================================

@app.route('/api/health', methods=['GET'])
def health_check():
    return success_response('Sistema funcionando', {
        'status': 'online',
        'message': 'Sistema Acadêmico Integrado está funcionando'
    })

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
            # Gerar token JWT
            token = generate_token(user['id'], user['tipo'])
            
            return success_response('Login realizado com sucesso', {
                'access_token': token,
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

# =============================================
# ROTAS DE TURMAS (COMPLETO)
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
            ORDER BY t.nome
        ''').fetchall()
        
        return success_response('Turmas carregadas', {
            'turmas': [dict(turma) for turma in turmas]
        })
    except Exception as e:
        return error_response(str(e))

def create_turma():
    try:
        data = request.get_json()
        
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
    

# =============================================
# ROTA PARA OBTER TURMAS DO PROFESSOR
# =============================================

@app.route('/api/admin/professores/<int:professor_id>/turmas', methods=['GET'])
def get_turmas_professor(professor_id):
    try:
        db = get_db()
        
        # Verificar se professor existe
        professor = db.execute(
            'SELECT id, nome FROM usuarios WHERE id = ? AND tipo = "professor"', 
            (professor_id,)
        ).fetchone()
        
        if not professor:
            return error_response('Professor não encontrado', 404)
        
        # Buscar turmas do professor
        turmas = db.execute('''
            SELECT 
                t.id,
                t.nome as turma_nome,
                t.codigo,
                m.nome as materia_nome,
                m.horario,
                m.dia_semana,
                m.carga_horaria_semanal,
                m.data_inicio
            FROM materias m
            JOIN turmas t ON m.turma_id = t.id
            WHERE m.professor_id = ?
            ORDER BY t.nome, m.nome
        ''', (professor_id,)).fetchall()
        
        return success_response('Turmas do professor carregadas', {
            'professor': {
                'id': professor['id'],
                'nome': professor['nome']
            },
            'turmas': [dict(turma) for turma in turmas]
        })
        
    except Exception as e:
        print(f'Erro ao carregar turmas do professor: {e}')
        return error_response(str(e))
    

# =============================================
# ROTA PARA DESALOCAR PROFESSOR (REMOVER MATÉRIA)
# =============================================

@app.route('/api/admin/professores/<int:professor_id>/desalocar/<int:materia_id>', methods=['DELETE'])
def desalocar_professor(professor_id, materia_id):
    try:
        db = get_db()
        
        # Verificar se a matéria existe e pertence ao professor
        materia = db.execute('''
            SELECT id FROM materias 
            WHERE id = ? AND professor_id = ?
        ''', (materia_id, professor_id)).fetchone()
        
        if not materia:
            return error_response('Matéria não encontrada ou não pertence a este professor', 404)
        
        # Remover a matéria (desalocar professor)
        db.execute(
            'DELETE FROM materias WHERE id = ?',
            (materia_id,)
        )
        
        db.commit()
        
        return success_response('Professor desalocado da matéria com sucesso!')
        
    except Exception as e:
        return error_response(str(e))
    
# =============================================
# RELATÓRIOS E DASHBOARD
# =============================================

@app.route('/api/admin/dashboard', methods=['GET'])
@token_required
@admin_required
def get_admin_dashboard():
    try:
        db = get_db()
        
        # Estatísticas gerais
        total_alunos = db.execute('SELECT COUNT(*) FROM alunos').fetchone()[0]
        total_professores = db.execute('SELECT COUNT(*) FROM usuarios WHERE tipo = "professor"').fetchone()[0]
        total_turmas = db.execute('SELECT COUNT(*) FROM turmas').fetchone()[0]
        total_atividades = db.execute('SELECT COUNT(*) FROM atividades').fetchone()[0]
        
        # Turmas com capacidade
        turmas_capacidade = db.execute('''
            SELECT nome, alunos_matriculados, capacidade_max,
                   ROUND((alunos_matriculados * 100.0 / capacidade_max), 1) as percentual
            FROM turmas
            ORDER BY percentual DESC
        ''').fetchall()
        
        # Professores mais ativos
        professores_ativos = db.execute('''
            SELECT u.nome, COUNT(m.id) as total_materias
            FROM usuarios u
            LEFT JOIN materias m ON u.id = m.professor_id
            WHERE u.tipo = 'professor'
            GROUP BY u.id
            ORDER BY total_materias DESC
            LIMIT 5
        ''').fetchall()

        return success_response('Dashboard carregado', {
            'estatisticas': {
                'total_alunos': total_alunos,
                'total_professores': total_professores,
                'total_turmas': total_turmas,
                'total_atividades': total_atividades
            },
            'turmas_capacidade': [dict(turma) for turma in turmas_capacidade],
            'professores_ativos': [dict(prof) for prof in professores_ativos]
        })
        
    except Exception as e:
        return error_response(str(e))

@app.route('/api/admin/relatorios/turmas', methods=['GET'])
@token_required
@admin_required
def get_relatorio_turmas():
    try:
        db = get_db()
        
        turmas = db.execute('''
            SELECT t.*, 
                   COUNT(DISTINCT a.id) as total_alunos,
                   COUNT(DISTINCT m.id) as total_materias,
                   COUNT(DISTINCT mat.id) as total_professores,
                   (SELECT AVG(nota) FROM notas n 
                    JOIN alunos al ON n.aluno_id = al.id 
                    WHERE al.turma_id = t.id) as media_geral
            FROM turmas t
            LEFT JOIN alunos a ON t.id = a.turma_id
            LEFT JOIN materias m ON t.id = m.turma_id
            LEFT JOIN usuarios mat ON m.professor_id = mat.id
            GROUP BY t.id
            ORDER BY t.nome
        ''').fetchall()
        
        return success_response('Relatório de turmas gerado', {
            'turmas': [dict(turma) for turma in turmas],
            'gerado_em': datetime.now().isoformat()
        })
        
    except Exception as e:
        return error_response(str(e))

@app.route('/api/admin/relatorios/professores', methods=['GET'])
@token_required
@admin_required
def get_relatorio_professores():
    try:
        db = get_db()
        
        professores = db.execute('''
            SELECT u.*,
                   COUNT(DISTINCT m.id) as total_materias,
                   COUNT(DISTINCT t.id) as total_turmas,
                   GROUP_CONCAT(DISTINCT m.nome) as materias_lecionadas
            FROM usuarios u
            LEFT JOIN materias m ON u.id = m.professor_id
            LEFT JOIN turmas t ON m.turma_id = t.id
            WHERE u.tipo = 'professor'
            GROUP BY u.id
            ORDER BY u.nome
        ''').fetchall()
        
        return success_response('Relatório de professores gerado', {
            'professores': [dict(prof) for prof in professores],
            'gerado_em': datetime.now().isoformat()
        })
        
    except Exception as e:
        return error_response(str(e))

# Rotas auxiliares para turmas
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

@app.route('/api/admin/turmas/<int:turma_id>/professores', methods=['GET'])
def get_professores_turma(turma_id):
    try:
        db = get_db()
        
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
        
        professores_list = [dict(prof) for prof in professores]
        
        return success_response('Professores da turma carregados', {
            'professores': professores_list
        })
    except Exception as e:
        print(f"Erro em get_professores_turma: {e}")
        return success_response('Professores da turma carregados', {
            'professores': []
        })


# =============================================
# ROTAS DE ALUNOS (COMPLETO)
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
    
# =============================================
# SISTEMA DE ATIVIDADES E NOTAS
# =============================================

@app.route('/api/professor/atividades', methods=['GET', 'POST'])
def manage_atividades():
    if request.method == 'GET':
        return get_atividades()
    elif request.method == 'POST':
        return criar_atividade()

def get_atividades():
    try:
        db = get_db()
        atividades = db.execute('''
            SELECT a.*, m.nome as materia_nome, t.nome as turma_nome, u.nome as professor_nome
            FROM atividades a
            JOIN materias m ON a.materia_id = m.id
            JOIN turmas t ON m.turma_id = t.id
            JOIN usuarios u ON a.criado_por = u.id
            ORDER BY a.data_entrega DESC
        ''').fetchall()
        
        return success_response('Atividades carregadas', {
            'atividades': [dict(atividade) for atividade in atividades]
        })
    except Exception as e:
        return error_response(str(e))

def criar_atividade():
    try:
        data = request.get_json()
        
        required_fields = ['titulo', 'materia_id', 'data_entrega']
        for field in required_fields:
            if field not in data or not data[field]:
                return error_response(f'Campo obrigatório: {field}', 400)
        
        db = get_db()
        
        db.execute('''
            INSERT INTO atividades (titulo, descricao, materia_id, valor, data_entrega, criado_por)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            data['titulo'],
            data.get('descricao', ''),
            data['materia_id'],
            data.get('valor', 10.0),
            data['data_entrega'],
            data.get('criado_por', 1)  # ID do professor
        ))
        
        db.commit()
        
        return success_response('Atividade criada com sucesso!')
        
    except Exception as e:
        return error_response(str(e))

@app.route('/api/professor/atividades/<int:atividade_id>/notas', methods=['POST'])
def lancar_notas(atividade_id):
    try:
        data = request.get_json()
        
        if 'notas' not in data or not isinstance(data['notas'], list):
            return error_response('Lista de notas é obrigatória', 400)
        
        db = get_db()
        
        for nota_data in data['notas']:
            if 'aluno_id' not in nota_data or 'nota' not in nota_data:
                continue
                
            # Verificar se nota já existe
            existing = db.execute(
                'SELECT id FROM notas WHERE aluno_id = ? AND atividade_id = ?',
                (nota_data['aluno_id'], atividade_id)
            ).fetchone()
            
            if existing:
                # Atualizar nota existente
                db.execute('''
                    UPDATE notas SET nota = ?, feedback = ?, data_avaliacao = CURRENT_TIMESTAMP
                    WHERE aluno_id = ? AND atividade_id = ?
                ''', (
                    nota_data['nota'],
                    nota_data.get('feedback', ''),
                    nota_data['aluno_id'],
                    atividade_id
                ))
            else:
                # Inserir nova nota
                db.execute('''
                    INSERT INTO notas (aluno_id, atividade_id, nota, feedback, avaliado_por)
                    VALUES (?, ?, ?, ?, ?)
                ''', (
                    nota_data['aluno_id'],
                    atividade_id,
                    nota_data['nota'],
                    nota_data.get('feedback', ''),
                    data.get('avaliado_por', 1)  # ID do professor
                ))
        
        db.commit()
        
        return success_response('Notas lançadas com sucesso!')
        
    except Exception as e:
        return error_response(str(e))
    
# =============================================
# REMOVER PROFESSOR DE TURMA
# =============================================

@app.route('/api/admin/turmas/<int:turma_id>/professores/<int:professor_id>', methods=['DELETE'])
def remover_professor_turma(turma_id, professor_id):
    try:
        db = get_db()
        
        # Verificar se existe matéria desse professor na turma
        materia = db.execute('''
            SELECT id FROM materias 
            WHERE turma_id = ? AND professor_id = ?
        ''', (turma_id, professor_id)).fetchone()
        
        if not materia:
            return error_response('Professor não está alocado nesta turma', 404)
        
        # Remover a matéria (e consequentemente o professor da turma)
        db.execute(
            'DELETE FROM materias WHERE turma_id = ? AND professor_id = ?',
            (turma_id, professor_id)
        )
        
        db.commit()
        
        return success_response('Professor removido da turma com sucesso!')
        
    except Exception as e:
        return error_response(str(e))
    
# =============================================
# ROTAS DE MATRÍCULA DE ALUNOS EM TURMAS
# =============================================

@app.route('/api/admin/turmas/<int:turma_id>/alunos/<int:aluno_id>', methods=['POST', 'DELETE'])
def manage_aluno_turma(turma_id, aluno_id):
    if request.method == 'POST':
        return matricular_aluno(turma_id, aluno_id)
    elif request.method == 'DELETE':
        return remover_aluno_turma(turma_id, aluno_id)

def matricular_aluno(turma_id, aluno_id):
    try:
        data = request.get_json() or {}
        
        db = get_db()
        
        # Verificar se turma existe
        turma = db.execute(
            'SELECT id, capacidade_max, alunos_matriculados FROM turmas WHERE id = ?', 
            (turma_id,)
        ).fetchone()
        
        if not turma:
            return error_response('Turma não encontrada', 404)
        
        # Verificar se aluno existe
        aluno = db.execute(
            'SELECT id, turma_id FROM alunos WHERE id = ?', 
            (aluno_id,)
        ).fetchone()
        
        if not aluno:
            return error_response('Aluno não encontrada', 404)
        
        # Verificar capacidade da turma
        if turma['alunos_matriculados'] >= turma['capacidade_max']:
            return error_response('Turma está lotada', 400)
        
        # Verificar se aluno já está em alguma turma
        if aluno['turma_id']:
            return error_response('Aluno já está matriculado em outra turma', 400)
        
        # Atualizar aluno com nova turma
        db.execute(
            'UPDATE alunos SET turma_id = ? WHERE id = ?',
            (turma_id, aluno_id)
        )
        
        # Atualizar contagem de alunos na turma
        db.execute(
            'UPDATE turmas SET alunos_matriculados = alunos_matriculados + 1 WHERE id = ?',
            (turma_id,)
        )
        
        db.commit()
        
        return success_response('Aluno matriculado na turma com sucesso!')
        
    except Exception as e:
        print(f'Erro ao matricular aluno: {e}')
        return error_response(f'Erro interno: {str(e)}')

def remover_aluno_turma(turma_id, aluno_id):
    try:
        db = get_db()
        
        # Verificar se aluno está na turma
        aluno = db.execute(
            'SELECT id, turma_id FROM alunos WHERE id = ? AND turma_id = ?',
            (aluno_id, turma_id)
        ).fetchone()
        
        if not aluno:
            return error_response('Aluno não encontrado nesta turma', 404)
        
        # Remover aluno da turma
        db.execute(
            'UPDATE alunos SET turma_id = NULL WHERE id = ?',
            (aluno_id,)
        )
        
        # Atualizar contagem de alunos na turma (com proteção contra valores negativos)
        db.execute('''
            UPDATE turmas 
            SET alunos_matriculados = CASE 
                WHEN alunos_matriculados > 0 THEN alunos_matriculados - 1 
                ELSE 0 
            END
            WHERE id = ?
        ''', (turma_id,))
        
        db.commit()
        
        return success_response('Aluno removido da turma com sucesso!')
        
    except Exception as e:
        return error_response(str(e))

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

# =============================================
# ROTAS DE PROFESSORES (COMPLETO)
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
            SELECT 
                u.*, 
                COUNT(DISTINCT m.id) as total_turmas,
                GROUP_CONCAT(DISTINCT m.nome) as materias_lecionadas
            FROM usuarios u
            LEFT JOIN materias m ON u.id = m.professor_id
            WHERE u.tipo = 'professor'
            GROUP BY u.id
            ORDER BY u.nome
        ''').fetchall()
        
        # Garantir que total_turmas seja sempre um número
        professores_data = []
        for prof in professores:
            prof_dict = dict(prof)
            prof_dict['total_turmas'] = prof_dict['total_turmas'] or 0
            professores_data.append(prof_dict)
        
        return success_response('Professores carregados', {
            'professores': professores_data
        })
    except Exception as e:
        return error_response(str(e))

def create_professor():
    try:
        data = request.get_json()
        
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
            'INSERT INTO usuarios (nome, email, senha, tipo, telefone, formacao, experiencia) VALUES (?, ?, ?, ?, ?, ?, ?)',
            (data['nome'], data['email'], generate_password_hash(data['senha']), 'professor',
             data.get('telefone'), data.get('formacao'), data.get('experiencia', 0))
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
        
        # Buscar dados do professor COM total_turmas
        professor = db.execute('''
            SELECT u.*, 
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
                   m.horario, m.dia_semana, m.carga_horaria_semanal
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

# =============================================
# SISTEMA DE ALOCAÇÃO DE PROFESSORES
# =============================================

# =============================================
# ROTAS DO PROFESSOR
# =============================================

@app.route('/api/professor/minhas-turmas', methods=['GET'])
@token_required
def get_minhas_turmas():
    try:
        if request.user_type != 'professor':
            return error_response('Acesso restrito a professores', 403)
        
        db = get_db()
        
        # Buscar turmas do professor
        turmas = db.execute('''
            SELECT 
                t.id,
                t.nome as turma_nome,
                t.codigo,
                t.ano_letivo,
                t.periodo,
                t.alunos_matriculados,
                m.nome as materia_nome,
                m.horario,
                m.dia_semana,
                m.carga_horaria_semanal
            FROM materias m
            JOIN turmas t ON m.turma_id = t.id
            WHERE m.professor_id = ?
            ORDER BY t.nome
        ''', (request.user_id,)).fetchall()
        
        return success_response('Turmas do professor carregadas', {
            'turmas': [dict(turma) for turma in turmas]
        })
        
    except Exception as e:
        return error_response(str(e))

@app.route('/api/professor/atividades', methods=['GET'])
@token_required
def get_atividades_professor():
    try:
        if request.user_type != 'professor':
            return error_response('Acesso restrito a professores', 403)
        
        db = get_db()
        
        atividades = db.execute('''
            SELECT 
                a.*,
                m.nome as materia_nome,
                t.nome as turma_nome
            FROM atividades a
            JOIN materias m ON a.materia_id = m.id
            JOIN turmas t ON m.turma_id = t.id
            WHERE m.professor_id = ?
            ORDER BY a.data_entrega DESC
        ''', (request.user_id,)).fetchall()
        
        return success_response('Atividades carregadas', {
            'atividades': [dict(atividade) for atividade in atividades]
        })
        
    except Exception as e:
        return error_response(str(e))

def validar_conflito_horario(turma_id, horario, dia_semana, professor_id=None, materia_id=None):
    """Valida conflitos de horário na turma"""
    try:
        db = get_db()
        
        query = '''
            SELECT m.id, m.nome as materia_nome, u.nome as professor_nome, 
                   m.horario, m.dia_semana
            FROM materias m
            JOIN usuarios u ON m.professor_id = u.id
            WHERE m.turma_id = ? AND m.horario = ? AND m.dia_semana = ?
        '''
        params = [turma_id, horario, dia_semana]
        
        if professor_id:
            query += ' AND m.professor_id = ?'
            params.append(professor_id)
        
        if materia_id:
            query += ' AND m.id != ?'
            params.append(materia_id)
        
        conflito = db.execute(query, params).fetchone()
        
        if conflito:
            return {
                'conflito': True,
                'mensagem': f'Conflito de horário: {conflito["materia_nome"]} com {conflito["professor_nome"]}'
            }
        
        return {'conflito': False}
        
    except Exception as e:
        print(f'Erro na validação de horário: {e}')
        return {'conflito': False}

@app.route('/api/admin/professores-disponiveis', methods=['GET'])
def get_professores_disponiveis():
    try:
        db = get_db()
        
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
        
        professores_list = []
        for prof in professores:
            prof_dict = dict(prof)
            prof_dict['turmas_count'] = prof_dict['turmas_count'] or 0
            professores_list.append(prof_dict)
        
        return success_response('Professores disponíveis carregados', {
            'professores': professores_list
        })
        
    except Exception as e:
        print(f"Erro em professores-disponiveis: {e}")
        return error_response(f'Erro ao carregar professores: {str(e)}')

@app.route('/api/admin/materias', methods=['GET'])
def get_materias():
    try:
        db = get_db()
        materias = db.execute('''
            SELECT m.*, t.nome as turma_nome, u.nome as professor_nome
            FROM materias m
            JOIN turmas t ON m.turma_id = t.id
            JOIN usuarios u ON m.professor_id = u.id
            ORDER BY m.nome
        ''').fetchall()
        
        return success_response('Matérias carregadas', {
            'materias': [dict(materia) for materia in materias]
        })
    except Exception as e:
        return error_response(str(e))

@app.route('/api/admin/turmas/<int:turma_id>/professores', methods=['POST'])
def alocar_professor_turma(turma_id):
    try:
        data = request.get_json()
        
        print(f"Alocando professor na turma {turma_id}:", data)
        
        required_fields = ['professor_id', 'materia_nome', 'horario', 'dia_semana']
        for field in required_fields:
            if field not in data or not data[field]:
                return error_response(f'Campo obrigatório: {field}', 400)
        
        db = get_db()
        
        # Validar conflito de horário
        validacao = validar_conflito_horario(
            turma_id, 
            data['horario'], 
            data['dia_semana'], 
            data['professor_id']
        )
        
        if validacao['conflito']:
            return error_response(validacao['mensagem'], 400)
        
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
        
        print(f"Turma: {turma['nome']}, Professor: {professor['nome']}")
        
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
        
        print("Professor alocado com sucesso no banco de dados!")
        
        return success_response('Professor alocado na turma com sucesso!')
        
    except Exception as e:
        print(f"Erro ao alocar professor: {e}")
        import traceback
        traceback.print_exc()
        return error_response(f'Erro interno: {str(e)}')
    
# =============================================
# SISTEMA DE ATIVIDADES - FUNCIONAIS
# =============================================

@app.route('/api/professor/atividades', methods=['POST'])
@token_required
def criar_atividade_professor():
    try:
        if request.user_type != 'professor':
            return error_response('Acesso restrito a professores', 403)
        
        data = request.get_json()
        
        required_fields = ['titulo', 'turma_id', 'data_entrega', 'valor']
        for field in required_fields:
            if field not in data or not data[field]:
                return error_response(f'Campo obrigatório: {field}', 400)
        
        db = get_db()
        
        # Buscar a matéria do professor na turma especificada
        materia = db.execute('''
            SELECT m.id FROM materias m 
            WHERE m.turma_id = ? AND m.professor_id = ?
            LIMIT 1
        ''', (data['turma_id'], request.user_id)).fetchone()
        
        if not materia:
            return error_response('Você não tem permissão para criar atividades nesta turma ou não há matéria atribuída', 403)
        
        materia_id = materia['id']
        
        # Criar atividade
        db.execute('''
            INSERT INTO atividades (titulo, descricao, materia_id, valor, data_entrega, criado_por)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            data['titulo'],
            data.get('descricao', ''),
            materia_id,
            data['valor'],
            data['data_entrega'],
            request.user_id
        ))
        
        db.commit()
        
        return success_response('Atividade criada com sucesso!')
        
    except Exception as e:
        print(f'Erro ao criar atividade: {e}')
        return error_response(str(e))

# Rota adicional para obter matérias de uma turma
@app.route('/api/professor/turmas/<int:turma_id>/materias', methods=['GET'])
@token_required
def get_materias_turma(turma_id):
    try:
        if request.user_type != 'professor':
            return error_response('Acesso restrito a professores', 403)
        
        db = get_db()
        
        # Buscar matérias do professor na turma
        materias = db.execute('''
            SELECT m.id, m.nome 
            FROM materias m 
            WHERE m.turma_id = ? AND m.professor_id = ?
        ''', (turma_id, request.user_id)).fetchall()
        
        return success_response('Matérias carregadas', {
            'materias': [dict(materia) for materia in materias]
        })
        
    except Exception as e:
        return error_response(str(e))

@app.route('/api/professor/atividades/<int:atividade_id>', methods=['PUT', 'DELETE'])
@token_required
def gerenciar_atividade(atividade_id):
    if request.method == 'PUT':
        return editar_atividade(atividade_id)
    elif request.method == 'DELETE':
        return excluir_atividade(atividade_id)

def editar_atividade(atividade_id):
    try:
        if request.user_type != 'professor':
            return error_response('Acesso restrito a professores', 403)
        
        data = request.get_json()
        
        db = get_db()
        
        # Verificar se a atividade pertence ao professor
        atividade = db.execute('''
            SELECT a.id FROM atividades a
            JOIN materias m ON a.materia_id = m.id
            WHERE a.id = ? AND m.professor_id = ?
        ''', (atividade_id, request.user_id)).fetchone()
        
        if not atividade:
            return error_response('Atividade não encontrada ou acesso negado', 404)
        
        # Atualizar atividade
        update_fields = []
        update_values = []
        
        if 'titulo' in data:
            update_fields.append('titulo = ?')
            update_values.append(data['titulo'])
        
        if 'descricao' in data:
            update_fields.append('descricao = ?')
            update_values.append(data.get('descricao', ''))
        
        if 'valor' in data:
            update_fields.append('valor = ?')
            update_values.append(data['valor'])
        
        if 'data_entrega' in data:
            update_fields.append('data_entrega = ?')
            update_values.append(data['data_entrega'])
        
        if update_fields:
            update_values.append(atividade_id)
            db.execute(f'''
                UPDATE atividades 
                SET {', '.join(update_fields)}
                WHERE id = ?
            ''', update_values)
            
            db.commit()
        
        return success_response('Atividade atualizada com sucesso!')
        
    except Exception as e:
        return error_response(str(e))

def excluir_atividade(atividade_id):
    try:
        if request.user_type != 'professor':
            return error_response('Acesso restrito a professores', 403)
        
        db = get_db()
        
        # Verificar se a atividade pertence ao professor
        atividade = db.execute('''
            SELECT a.id FROM atividades a
            JOIN materias m ON a.materia_id = m.id
            WHERE a.id = ? AND m.professor_id = ?
        ''', (atividade_id, request.user_id)).fetchone()
        
        if not atividade:
            return error_response('Atividade não encontrada ou acesso negado', 404)
        
        # Verificar se há notas associadas
        notas_count = db.execute(
            'SELECT COUNT(*) FROM notas WHERE atividade_id = ?', 
            (atividade_id,)
        ).fetchone()[0]
        
        if notas_count > 0:
            return error_response('Não é possível excluir atividade com notas registradas', 400)
        
        # Excluir atividade
        db.execute('DELETE FROM atividades WHERE id = ?', (atividade_id,))
        db.commit()
        
        return success_response('Atividade excluída com sucesso!')
        
    except Exception as e:
        return error_response(str(e))

# =============================================
# SISTEMA DE AVALIAÇÕES - FUNCIONAIS
# =============================================

@app.route('/api/professor/atividades/<int:atividade_id>/alunos', methods=['GET'])
@token_required
def get_alunos_para_avaliar(atividade_id):
    try:
        if request.user_type != 'professor':
            return error_response('Acesso restrito a professores', 403)
        
        db = get_db()
        
        # Verificar se a atividade pertence ao professor e obter dados
        atividade_data = db.execute('''
            SELECT a.*, m.professor_id, t.id as turma_id, t.nome as turma_nome
            FROM atividades a
            JOIN materias m ON a.materia_id = m.id
            JOIN turmas t ON m.turma_id = t.id
            WHERE a.id = ? AND m.professor_id = ?
        ''', (atividade_id, request.user_id)).fetchone()
        
        if not atividade_data:
            return error_response('Atividade não encontrada ou acesso negado', 404)
        
        # Buscar alunos da turma
        alunos = db.execute('''
            SELECT 
                al.id, 
                u.nome, 
                al.matricula,
                n.nota,
                n.feedback,
                n.data_avaliacao
            FROM alunos al
            JOIN usuarios u ON al.usuario_id = u.id
            LEFT JOIN notas n ON al.id = n.aluno_id AND n.atividade_id = ?
            WHERE al.turma_id = ?
            ORDER BY u.nome
        ''', (atividade_id, atividade_data['turma_id'])).fetchall()
        
        return success_response('Alunos carregados', {
            'atividade': dict(atividade_data),
            'alunos': [dict(aluno) for aluno in alunos]
        })
        
    except Exception as e:
        return error_response(str(e))

@app.route('/api/professor/atividades/<int:atividade_id>/avaliar', methods=['POST'])
@token_required
def avaliar_atividade_alunos(atividade_id):
    try:
        if request.user_type != 'professor':
            return error_response('Acesso restrito a professores', 403)
        
        data = request.get_json()
        
        if 'avaliacoes' not in data or not isinstance(data['avaliacoes'], list):
            return error_response('Lista de avaliações é obrigatória', 400)
        
        db = get_db()
        
        # Verificar se a atividade pertence ao professor
        atividade = db.execute('''
            SELECT a.id FROM atividades a
            JOIN materias m ON a.materia_id = m.id
            WHERE a.id = ? AND m.professor_id = ?
        ''', (atividade_id, request.user_id)).fetchone()
        
        if not atividade:
            return error_response('Atividade não encontrada ou acesso negado', 404)
        
        # Processar avaliações
        for avaliacao in data['avaliacoes']:
            if 'aluno_id' not in avaliacao or 'nota' not in avaliacao:
                continue
            
            # Verificar se nota já existe
            existing = db.execute(
                'SELECT id FROM notas WHERE aluno_id = ? AND atividade_id = ?',
                (avaliacao['aluno_id'], atividade_id)
            ).fetchone()
            
            if existing:
                # Atualizar nota existente
                db.execute('''
                    UPDATE notas 
                    SET nota = ?, feedback = ?, data_avaliacao = CURRENT_TIMESTAMP,
                        avaliado_por = ?
                    WHERE aluno_id = ? AND atividade_id = ?
                ''', (
                    avaliacao['nota'],
                    avaliacao.get('feedback', ''),
                    request.user_id,
                    avaliacao['aluno_id'],
                    atividade_id
                ))
            else:
                # Inserir nova nota
                db.execute('''
                    INSERT INTO notas (aluno_id, atividade_id, nota, feedback, avaliado_por)
                    VALUES (?, ?, ?, ?, ?)
                ''', (
                    avaliacao['aluno_id'],
                    atividade_id,
                    avaliacao['nota'],
                    avaliacao.get('feedback', ''),
                    request.user_id
                ))
        
        db.commit()
        
        return success_response('Avaliações salvas com sucesso!')
        
    except Exception as e:
        return error_response(str(e))

@app.route('/api/professor/atividades/<int:atividade_id>/avaliacoes', methods=['GET'])
@token_required
def ver_avaliacoes_atividade(atividade_id):
    try:
        if request.user_type != 'professor':
            return error_response('Acesso restrito a professores', 403)
        
        db = get_db()
        
        # Verificar se a atividade pertence ao professor
        atividade_data = db.execute('''
            SELECT a.*, m.professor_id, t.nome as turma_nome, m.nome as materia_nome
            FROM atividades a
            JOIN materias m ON a.materia_id = m.id
            JOIN turmas t ON m.turma_id = t.id
            WHERE a.id = ? AND m.professor_id = ?
        ''', (atividade_id, request.user_id)).fetchone()
        
        if not atividade_data:
            return error_response('Atividade não encontrada ou acesso negado', 404)
        
        # Buscar avaliações completas
        avaliacoes = db.execute('''
            SELECT 
                n.*,
                u.nome as aluno_nome,
                al.matricula,
                av.nome as avaliador_nome
            FROM notas n
            JOIN alunos al ON n.aluno_id = al.id
            JOIN usuarios u ON al.usuario_id = u.id
            LEFT JOIN usuarios av ON n.avaliado_por = av.id
            WHERE n.atividade_id = ?
            ORDER BY u.nome
        ''', (atividade_id,)).fetchall()
        
        # Estatísticas
        estatisticas = db.execute('''
            SELECT 
                COUNT(*) as total_avaliacoes,
                AVG(nota) as media_geral,
                MIN(nota) as nota_minima,
                MAX(nota) as nota_maxima
            FROM notas 
            WHERE atividade_id = ?
        ''', (atividade_id,)).fetchone()
        
        return success_response('Avaliações carregadas', {
            'atividade': dict(atividade_data),
            'avaliacoes': [dict(avaliacao) for avaliacao in avaliacoes],
            'estatisticas': dict(estatisticas)
        })
        
    except Exception as e:
        return error_response(str(e))

# =============================================
# DESEMPENHO DO ALUNO
# =============================================

@app.route('/api/professor/alunos/<int:aluno_id>/desempenho', methods=['GET'])
@token_required
def get_desempenho_aluno(aluno_id):
    try:
        if request.user_type != 'professor':
            return error_response('Acesso restrito a professores', 403)
        
        db = get_db()
        
        # Verificar se o professor tem acesso ao aluno (mesma turma)
        aluno_turma = db.execute('''
            SELECT al.turma_id 
            FROM alunos al
            JOIN materias m ON al.turma_id = m.turma_id
            WHERE al.id = ? AND m.professor_id = ?
        ''', (aluno_id, request.user_id)).fetchone()
        
        if not aluno_turma:
            return error_response('Aluno não encontrado ou acesso negado', 404)
        
        # Dados do aluno
        aluno_data = db.execute('''
            SELECT u.nome, al.matricula, t.nome as turma_nome
            FROM alunos al
            JOIN usuarios u ON al.usuario_id = u.id
            LEFT JOIN turmas t ON al.turma_id = t.id
            WHERE al.id = ?
        ''', (aluno_id,)).fetchone()
        
        # Notas e desempenho
        desempenho = db.execute('''
            SELECT 
                n.nota,
                a.titulo as atividade_titulo,
                a.valor as valor_atividade,
                m.nome as materia_nome,
                n.data_avaliacao,
                n.feedback
            FROM notas n
            JOIN atividades a ON n.atividade_id = a.id
            JOIN materias m ON a.materia_id = m.id
            WHERE n.aluno_id = ?
            ORDER BY n.data_avaliacao DESC
        ''', (aluno_id,)).fetchall()
        
        # Estatísticas
        estatisticas = db.execute('''
            SELECT 
                COUNT(*) as total_atividades,
                AVG(n.nota) as media_geral,
                COUNT(CASE WHEN n.nota >= 6 THEN 1 END) as aprovados,
                COUNT(CASE WHEN n.nota < 6 THEN 1 END) as reprovados
            FROM notas n
            WHERE n.aluno_id = ?
        ''', (aluno_id,)).fetchone()
        
        return success_response('Desempenho carregado', {
            'aluno': dict(aluno_data),
            'desempenho': [dict(item) for item in desempenho],
            'estatisticas': dict(estatisticas)
        })
        
    except Exception as e:
        return error_response(str(e))

# =============================================
# ROTAS DO ALUNO (FRONTEND)
# =============================================

@app.route('/api/aluno/atividades-pendentes', methods=['GET'])
def get_atividades_pendentes():
    try:
        # Dados mock para teste
        atividades_mock = [
            {
                'id': 1,
                'titulo': 'Trabalho de Matemática - Álgebra Linear',
                'materia_nome': 'Matemática',
                'data_entrega': '2024-01-15',
                'valor': 10.0,
                'entregue': False,
                'descricao': 'Resolver exercícios 1 ao 10 da página 45'
            },
            {
                'id': 2,
                'titulo': 'Redação sobre Sustentabilidade',
                'materia_nome': 'Português',
                'data_entrega': '2024-01-20',
                'valor': 8.0,
                'entregue': True,
                'descricao': 'Redação de 30 linhas sobre desenvolvimento sustentável'
            }
        ]
        
        return success_response('Atividades carregadas', {
            'atividades': atividades_mock,
            'total': len(atividades_mock),
            'pendentes': len([a for a in atividades_mock if not a['entregue']])
        })
        
    except Exception as e:
        return error_response(str(e))

@app.route('/api/aluno/minhas-notas', methods=['GET'])
def get_minhas_notas():
    try:
        db = get_db()
        
        # Obter algum aluno para teste
        aluno = db.execute('SELECT id FROM alunos LIMIT 1').fetchone()
        if not aluno:
            # Retornar dados mock se não houver aluno
            notas_mock = [
                {
                    'id': 1,
                    'atividade_titulo': 'Prova Bimestral - Unidade 1',
                    'materia_nome': 'Matemática',
                    'nota': 8.5,
                    'valor_atividade': 10.0,
                    'feedback': 'Bom trabalho! Continue assim.',
                    'data_avaliacao': '2024-01-10',
                    'professor_nome': 'Prof. Carlos Silva'
                }
            ]
            return success_response('Notas carregadas', {
                'notas': notas_mock,
                'media_geral': 8.5
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
            'media_geral': round(media_geral['media'], 1) if media_geral['media'] else 0
        })
    except Exception as e:
        return error_response(str(e))

@app.route('/api/aluno/calendario-aulas', methods=['GET'])
def get_calendario_aulas():
    try:
        from datetime import datetime, timedelta
        
        # Gerar datas da próxima semana
        hoje = datetime.now()
        dias_semana = []
        
        for i in range(7):
            data = hoje + timedelta(days=i)
            dias_semana.append(data.strftime('%Y-%m-%d'))
        
        aulas_mock = [
            {
                'id': 1,
                'materia': 'Matemática',
                'horario': '08:00 - 09:30',
                'dia_semana': 'segunda',
                'professor': 'Prof. Carlos Silva',
                'sala': 'Sala 101',
                'data': dias_semana[0],
                'tipo': 'aula',
                'cor': '#3498db'
            }
        ]
        
        return success_response('Calendário carregado', {
            'dias_aula': aulas_mock,
            'total_aulas': len(aulas_mock)
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
        
        students_count = db.execute('SELECT COUNT(*) FROM alunos').fetchone()[0] or 0
        assignments_count = db.execute('SELECT COUNT(*) FROM atividades').fetchone()[0] or 0
        
        metrics = {
            'paper_saved_pages': assignments_count * 3,
            'co2_saved_kg': students_count * 0.5,
            'trees_saved': (assignments_count * 3) / 8000,
            'digital_assignments': assignments_count,
            'students_impacted': students_count
        }
        
        return success_response('Métricas carregadas', metrics)
    except Exception as e:
        return error_response(str(e))

# =============================================
# INICIALIZAÇÃO
# =============================================

if __name__ == '__main__':
    # Inicializar banco de dados
    print("🔄 Inicializando banco de dados...")
    init_db()
    
    print("🚀 Iniciando servidor Flask...")
    print("📊 Banco de dados:", DB_PATH)
    print("🌐 Servidor rodando em: http://localhost:8000")
    print("📱 Frontend disponível em: http://localhost:8000")
    print("🔧 API disponível em: http://localhost:8000/api/")
    print("🔧 CORS configurado para desenvolvimento")
    
    app.run(debug=True, host='0.0.0.0', port=8000)