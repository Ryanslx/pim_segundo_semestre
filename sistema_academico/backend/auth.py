from flask import Blueprint, request, jsonify
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from database import get_db
from werkzeug.security import check_password_hash, generate_password_hash
from datetime import timedelta

auth_bp = Blueprint('auth', __name__)
jwt = JWTManager()

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    db = get_db()
    user = db.execute(
        'SELECT * FROM usuarios WHERE email = ?', (email,)
    ).fetchone()
    
    if user and check_password_hash(user['senha'], password):
        access_token = create_access_token(
            identity={
                'id': user['id'],
                'email': user['email'],
                'tipo': user['tipo']
            },
            expires_delta=timedelta(hours=24)
        )
        
        return jsonify({
            'access_token': access_token,
            'user': {
                'id': user['id'],
                'nome': user['nome'],
                'email': user['email'],
                'tipo': user['tipo']
            }
        }), 200
    
    return jsonify({'error': 'Credenciais inválidas'}), 401

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    nome = data.get('nome')
    email = data.get('email')
    password = data.get('password')
    tipo = data.get('tipo', 'aluno')  # aluno, professor, admin
    
    db = get_db()
    
    # Verificar se usuário já existe
    existing_user = db.execute(
        'SELECT id FROM usuarios WHERE email = ?', (email,)
    ).fetchone()
    
    if existing_user:
        return jsonify({'error': 'Usuário já existe'}), 400
    
    # Inserir novo usuário
    hashed_password = generate_password_hash(password)
    db.execute(
        'INSERT INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, ?)',
        (nome, email, hashed_password, tipo)
    )
    db.commit()
    
    return jsonify({'message': 'Usuário criado com sucesso'}), 201