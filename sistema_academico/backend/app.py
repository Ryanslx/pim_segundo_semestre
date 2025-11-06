from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import os
from werkzeug.security import check_password_hash, generate_password_hash
from datetime import timedelta

app = Flask(__name__)
app.config['SECRET_KEY'] = 'sistema-academico-secret-key'
CORS(app)

# Configuração do banco de dados
DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'database', 'sistema_academico.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# Rota de login simplificada
@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
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

# Rota de saúde do sistema
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'online',
        'message': 'Sistema Acadêmico Integrado está funcionando'
    })

# Rota para obter turmas (admin)
@app.route('/api/admin/turmas', methods=['GET'])
def get_turmas():
    try:
        db = get_db()
        turmas = db.execute('''
            SELECT t.*, u.nome as criado_por_nome 
            FROM turmas t 
            LEFT JOIN usuarios u ON t.criado_por = u.id
        ''').fetchall()
        
        return jsonify({
            'turmas': [dict(turma) for turma in turmas]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Rota para obter alunos (admin)
@app.route('/api/admin/alunos', methods=['GET'])
def get_alunos():
    try:
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
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Rota para obter professores (admin)
@app.route('/api/admin/professores', methods=['GET'])
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
        
        return jsonify({
            'professores': [dict(prof) for prof in professores]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Rota para notas do aluno
@app.route('/api/aluno/minhas-notas', methods=['GET'])
def get_minhas_notas():
    try:
        # Para teste, vamos retornar dados fixos primeiro
        db = get_db()
        
        # Obter algum aluno para teste
        aluno = db.execute('SELECT id FROM alunos LIMIT 1').fetchone()
        if not aluno:
            return jsonify({'notas': [], 'media_geral': 0})
            
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
        
        return jsonify({
            'notas': [dict(nota) for nota in notas],
            'media_geral': media_geral['media'] if media_geral['media'] else 0
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Rota de feedback do sistema
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
        
        return jsonify({'message': 'Feedback enviado com sucesso!'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@app.route('/api/admin/turmas', methods=['POST'])
def create_turma():
    try:
        data = request.get_json()
        print("Dados recebidos:", data)  # Para debug
        
        # Validar dados obrigatórios
        required_fields = ['nome', 'codigo', 'ano_letivo', 'periodo']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'Campo obrigatório faltando: {field}'}), 400
        
        db = get_db()
        
        # Verificar se código já existe
        existing = db.execute(
            'SELECT id FROM turmas WHERE codigo = ?', (data['codigo'],)
        ).fetchone()
        
        if existing:
            return jsonify({'error': 'Código de turma já existe'}), 400
        
        # Inserir nova turma (usando admin como criado_por)
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
        
        return jsonify({'message': 'Turma criada com sucesso!'})
        
    except Exception as e:
        print(f'Erro ao criar turma: {e}')
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

# Rota para deletar turmas (admin)
@app.route('/api/admin/turmas/<int:turma_id>', methods=['DELETE'])
def delete_turma(turma_id):
    try:
        db = get_db()
        
        # Verificar se há alunos matriculados
        alunos_count = db.execute(
            'SELECT COUNT(*) FROM alunos WHERE turma_id = ?', (turma_id,)
        ).fetchone()[0]
        
        if alunos_count > 0:
            return jsonify({'error': 'Não é possível excluir turma com alunos matriculados'}), 400
        
        db.execute('DELETE FROM turmas WHERE id = ?', (turma_id,))
        db.commit()
        
        return jsonify({'message': 'Turma excluída com sucesso!'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Rota de sustentabilidade
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
        
        return jsonify(metrics)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("🚀 Iniciando servidor Flask...")
    print("📊 Banco de dados:", DB_PATH)
    print("🌐 Servidor rodando em: http://localhost:8000")
    app.run(debug=True, host='0.0.0.0', port=8000)
