from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3
import os
from werkzeug.security import check_password_hash, generate_password_hash

app = Flask(__name__)
app.config['SECRET_KEY'] = 'sistema-academico-secret-key'

# Configuração COMPLETA do CORS
CORS(app, origins=["http://127.0.0.1:5500", "http://localhost:5500", "http://localhost:8000", "http://127.0.0.1:8000"], 
     supports_credentials=True, 
     allow_headers=["Content-Type", "Authorization", "Accept"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

# Configuração do banco de dados
DB_PATH = os.path.join(os.path.dirname(__file__), 'database', 'sistema_academico.db')

# Criar diretório se não existir
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn
# ... (código existente acima)

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# ⭐⭐ ADICIONE A FUNÇÃO init_db() AQUI ⭐⭐
def init_db():
    """Inicializa o banco de dados com tabelas e dados de exemplo"""
    try:
        db = get_db()
        
        # Criar tabela de usuários
        db.execute('''
            CREATE TABLE IF NOT EXISTS usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                senha TEXT NOT NULL,
                tipo TEXT NOT NULL DEFAULT 'aluno',
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Verificar se já existem usuários
        existing_users = db.execute('SELECT COUNT(*) as count FROM usuarios').fetchone()['count']
        
        if existing_users == 0:
            # Inserir usuários de exemplo
            usuarios_exemplo = [
                ('João Silva', 'joao@escola.com', generate_password_hash('123456'), 'aluno'),
                ('Maria Santos', 'maria@escola.com', generate_password_hash('aluno123'), 'aluno'),
                ('Professor Carlos', 'prof.carlos@escola.com', generate_password_hash('prof123'), 'professor'),
                ('Admin Sistema', 'admin@escola.com', generate_password_hash('admin123'), 'admin')
            ]
            
            db.executemany(
                'INSERT INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, ?)',
                usuarios_exemplo
            )
        
        # Criar outras tabelas necessárias
        db.execute('''
            CREATE TABLE IF NOT EXISTS turmas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                codigo TEXT UNIQUE NOT NULL,
                ano_letivo TEXT NOT NULL,
                periodo TEXT NOT NULL,
                capacidade_max INTEGER NOT NULL,
                descricao TEXT
            )
        ''')
        
        db.commit()
        print("✅ Banco de dados inicializado com sucesso!")
        
    except Exception as e:
        print(f"❌ Erro ao inicializar banco de dados: {e}")
        raise e
    finally:
        db.close()

# ... (o resto do código continua igual - headers CORS, rotas, etc.)
# Headers CORS para todas as respostas
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', 'http://127.0.0.1:5500')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

# Rotas para servir arquivos estáticos (frontend)
@app.route('/')
def serve_index():
    return send_from_directory('../frontend', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('../frontend', path)

# Rota de saúde do sistema
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'online',
        'message': 'Sistema Acadêmico Integrado está funcionando'
    })

# Rota de login
@app.route('/api/auth/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Dados não fornecidos'}), 400
            
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'error': 'Email e senha são obrigatórios'}), 400
        
        db = get_db()
        user = db.execute(
            'SELECT * FROM usuarios WHERE email = ?', (email,)
        ).fetchone()
        
        if user and check_password_hash(user['senha'], password):
            return jsonify({
                'access_token': 'fake-jwt-token-for-now',
                'user': {
                    'id': user['id'],
                    'nome': user['nome'],
                    'email': user['email'],
                    'tipo': user['tipo']
                }
            }), 200
        
        return jsonify({'error': 'Credenciais inválidas'}), 401
        
    except Exception as e:
        print(f'Erro no login: {e}')
        return jsonify({'error': 'Erro interno do servidor'}), 500

# Rota para atividades pendentes
@app.route('/api/aluno/atividades-pendentes', methods=['GET', 'OPTIONS'])
def get_atividades_pendentes():
    if request.method == 'OPTIONS':
        return '', 200
        
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
            },
            {
                'id': 3,
                'titulo': 'Relatório de Experimento de Física',
                'materia_nome': 'Física',
                'data_entrega': '2024-01-25',
                'valor': 12.0,
                'entregue': False,
                'descricao': 'Relatório do experimento sobre leis de Newton'
            },
            {
                'id': 4,
                'titulo': 'Pesquisa Histórica - Brasil Colônia',
                'materia_nome': 'História',
                'data_entrega': '2024-01-18',
                'valor': 15.0,
                'entregue': False,
                'descricao': 'Pesquisa sobre o período colonial brasileiro'
            }
        ]
        
        return jsonify({
            'atividades': atividades_mock,
            'total': len(atividades_mock),
            'pendentes': len([a for a in atividades_mock if not a['entregue']])
        })
        
    except Exception as e:
        print(f'Erro em atividades pendentes: {e}')
        return jsonify({'error': str(e)}), 500

# Rota para notas do aluno
@app.route('/api/aluno/minhas-notas', methods=['GET', 'OPTIONS'])
def get_minhas_notas():
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        # Dados mock para teste
        notas_mock = [
            {
                'id': 1,
                'atividade_titulo': 'Prova Bimestral - Unidade 1',
                'materia_nome': 'Matemática',
                'nota': 8.5,
                'valor_atividade': 10.0,
                'feedback': 'Bom trabalho! Continue assim. Demonstrou bom entendimento dos conceitos.',
                'data_avaliacao': '2024-01-10',
                'professor_nome': 'Prof. Carlos Silva'
            },
            {
                'id': 2,
                'atividade_titulo': 'Trabalho em Grupo - Análise Literária',
                'materia_nome': 'Português',
                'nota': 9.0,
                'valor_atividade': 8.0,
                'feedback': 'Excelente colaboração e análise profunda da obra.',
                'data_avaliacao': '2024-01-08',
                'professor_nome': 'Prof. Maria Santos'
            },
            {
                'id': 3,
                'atividade_titulo': 'Relatório de Experimento Prático',
                'materia_nome': 'Física',
                'nota': 7.5,
                'valor_atividade': 12.0,
                'feedback': 'Precisa melhorar a metodologia e detalhar mais os resultados.',
                'data_avaliacao': '2024-01-05',
                'professor_nome': 'Prof. João Oliveira'
            },
            {
                'id': 4,
                'atividade_titulo': 'Prova - Revolução Industrial',
                'materia_nome': 'História',
                'nota': 8.8,
                'valor_atividade': 10.0,
                'feedback': 'Ótima compreensão do tema, mas poderia citar mais exemplos.',
                'data_avaliacao': '2024-01-03',
                'professor_nome': 'Prof. Ana Costa'
            }
        ]
        
        media_geral = sum(nota['nota'] for nota in notas_mock) / len(notas_mock)
        
        return jsonify({
            'notas': notas_mock,
            'media_geral': round(media_geral, 1),
            'total_avaliacoes': len(notas_mock)
        })
        
    except Exception as e:
        print(f'Erro em minhas notas: {e}')
        return jsonify({'error': str(e)}), 500
# Rota para calendário de aulas do aluno
@app.route('/api/aluno/calendario-aulas', methods=['GET', 'OPTIONS'])
def get_calendario_aulas():
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        # Dados mock melhorados para calendário
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
                'data': dias_semana[0],  # Segunda-feira
                'tipo': 'aula',
                'cor': '#3498db'
            },
            {
                'id': 2,
                'materia': 'Português',
                'horario': '10:00 - 11:30', 
                'dia_semana': 'segunda',
                'professor': 'Prof. Maria Santos',
                'sala': 'Sala 102',
                'data': dias_semana[0],
                'tipo': 'aula',
                'cor': '#3498db'
            },
            {
                'id': 3,
                'materia': 'Física',
                'horario': '08:00 - 09:30',
                'dia_semana': 'quarta',
                'professor': 'Prof. João Oliveira',
                'sala': 'Lab. Física',
                'data': dias_semana[2], 
                'tipo': 'aula',
                'cor': '#3498db'
            },
            {
                'id': 4,
                'materia': 'História',
                'horario': '14:00 - 15:30',
                'dia_semana': 'quinta',
                'professor': 'Prof. Ana Costa',
                'sala': 'Sala 103',
                'data': dias_semana[3],
                'tipo': 'aula', 
                'cor': '#3498db'
            },
            {
                'id': 5,
                'materia': 'Química',
                'horario': '10:00 - 11:30',
                'dia_semana': 'sexta',
                'professor': 'Prof. Pedro Almeida',
                'sala': 'Lab. Química',
                'data': dias_semana[4],
                'tipo': 'aula',
                'cor': '#3498db'
            }
        ]
        
        return jsonify({
            'dias_aula': aulas_mock,
            'total_aulas': len(aulas_mock),
            'semana_inicio': dias_semana[0],
            'semana_fim': dias_semana[6]
        })
        
    except Exception as e:
        print(f'Erro no calendário de aulas: {e}')
        return jsonify({'error': str(e)}), 500
# Rotas do Admin
@app.route('/api/admin/turmas', methods=['GET', 'OPTIONS'])
def get_turmas():
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        turmas_mock = [
            {
                'id': 1,
                'nome': '1º Ano A - Ensino Médio',
                'codigo': '1A-2024',
                'ano_letivo': '2024',
                'periodo': 'Manhã',
                'capacidade_max': 35,
                'alunos_matriculados': 32,
                'descricao': 'Turma do primeiro ano do ensino médio'
            },
            {
                'id': 2,
                'nome': '2º Ano B - Ensino Médio',
                'codigo': '2B-2024',
                'ano_letivo': '2024',
                'periodo': 'Tarde',
                'capacidade_max': 35,
                'alunos_matriculados': 28,
                'descricao': 'Turma do segundo ano do ensino médio'
            },
            {
                'id': 3,
                'nome': '3º Ano C - Ensino Médio',
                'codigo': '3C-2024',
                'ano_letivo': '2024',
                'periodo': 'Manhã',
                'capacidade_max': 35,
                'alunos_matriculados': 30,
                'descricao': 'Turma do terceiro ano do ensino médio'
            }
        ]
        
        return jsonify({
            'turmas': turmas_mock,
            'total': len(turmas_mock)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/alunos', methods=['GET', 'OPTIONS'])
def get_alunos():
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        alunos_mock = [
            {
                'id': 1,
                'nome': 'João Silva',
                'email': 'joao@escola.com',
                'matricula': '2024001',
                'turma_nome': '1º Ano A - Ensino Médio'
            },
            {
                'id': 2,
                'nome': 'Maria Santos',
                'email': 'maria@escola.com',
                'matricula': '2024002',
                'turma_nome': '1º Ano A - Ensino Médio'
            }
        ]
        
        return jsonify({
            'alunos': alunos_mock,
            'total': len(alunos_mock)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/professores', methods=['GET', 'OPTIONS'])
def get_professores():
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        professores_mock = [
            {
                'id': 1,
                'nome': 'Prof. Carlos Silva',
                'email': 'carlos@escola.com',
                'materias_count': 3
            },
            {
                'id': 2,
                'nome': 'Prof. Maria Santos',
                'email': 'maria@escola.com',
                'materias_count': 2
            }
        ]
        
        return jsonify({
            'professores': professores_mock,
            'total': len(professores_mock)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Rota de feedback
@app.route('/api/feedback', methods=['POST', 'OPTIONS'])
def submit_feedback():
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        data = request.get_json()
        
        print(f"Feedback recebido: {data}")
        
        return jsonify({
            'message': 'Feedback enviado com sucesso! Obrigado pela contribuição.',
            'id': 1
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Rota de sustentabilidade
@app.route('/api/sustainability', methods=['GET', 'OPTIONS'])
def get_sustainability_metrics():
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        metrics = {
            'paper_saved_pages': 1247,
            'co2_saved_kg': 45.8,
            'trees_saved': 0.15,
            'digital_assignments': 89,
            'students_impacted': 150
        }
        
        return jsonify(metrics)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Inicializar banco de dados
    from database import init_db
    init_db()
    
    print("🚀 Iniciando servidor Flask...")
    print("📊 Banco de dados:", DB_PATH)
    print("🌐 Servidor rodando em: http://localhost:8000")
    print("📱 Frontend disponível em: http://localhost:8000")
    print("🔧 API disponível em: http://localhost:8000/api/")
    app.run(debug=True, host='0.0.0.0', port=8000)