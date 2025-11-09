import sqlite3
import os

DATABASE_PATH = os.path.join(os.path.dirname(__file__), '..', 'database', 'sistema_academico.db')

def get_db():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    db = get_db()
    
    # Tabela de usuários
    db.execute('''
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            senha TEXT NOT NULL,
            tipo TEXT NOT NULL CHECK(tipo IN ('aluno', 'professor', 'admin')),
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
            capacidade_min INTEGER DEFAULT 30,
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
            descricao TEXT,
            turma_id INTEGER,
            professor_id INTEGER,
            horario TEXT,
            dia_semana TEXT,
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
            materia_id INTEGER,
            data_entrega DATE,
            valor DECIMAL(5,2),
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
            aluno_id INTEGER,
            atividade_id INTEGER,
            nota DECIMAL(5,2),
            feedback TEXT,
            data_avaliacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            avaliado_por INTEGER,
            FOREIGN KEY (aluno_id) REFERENCES alunos (id),
            FOREIGN KEY (atividade_id) REFERENCES atividades (id),
            FOREIGN KEY (avaliado_por) REFERENCES usuarios (id)
        )
    ''')
    
    # Tabela de feedback do sistema
    db.execute('''
        CREATE TABLE IF NOT EXISTS feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            user_type TEXT,
            feedback TEXT,
            rating INTEGER,
            suggestions TEXT,
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES usuarios (id)
        )
    ''')
    
    # Tabela de dias sem aula
    db.execute('''
        CREATE TABLE IF NOT EXISTS dias_sem_aula (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            data DATE NOT NULL,
            motivo TEXT,
            turma_id INTEGER,
            criado_por INTEGER,
            FOREIGN KEY (turma_id) REFERENCES turmas (id),
            FOREIGN KEY (criado_por) REFERENCES usuarios (id)
        )
    ''')
    
    db.commit()
    
    # Inserir usuário admin padrão
    from werkzeug.security import generate_password_hash
    admin_exists = db.execute('SELECT id FROM usuarios WHERE tipo = "admin"').fetchone()
    if not admin_exists:
        db.execute(
            'INSERT INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, ?)',
            ('Administrador', 'admin@escola.com', generate_password_hash('admin123'), 'admin')
        )
        db.commit()

    # Inserir usuários de demonstração (professor e aluno) usados pelo frontend de demo
    professor_exists = db.execute('SELECT id FROM usuarios WHERE email = ?', ('professor@escola.com',)).fetchone()
    if not professor_exists:
        db.execute(
            'INSERT INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, ?) ',
            ('Professor Demo', 'professor@escola.com', generate_password_hash('prof123'), 'professor')
        )
        db.commit()

    aluno_exists = db.execute('SELECT id FROM usuarios WHERE email = ?', ('aluno@escola.com',)).fetchone()
    if not aluno_exists:
        db.execute(
            'INSERT INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, ?)',
            ('Aluno Demo', 'aluno@escola.com', generate_password_hash('aluno123'), 'aluno')
        )
        db.commit()

        # Criar registro na tabela alunos para o usuário demo (necessário para endpoints do aluno)
        usuario_row = db.execute('SELECT id FROM usuarios WHERE email = ?', ('aluno@escola.com',)).fetchone()
        if usuario_row:
            usuario_id = usuario_row['id']
            # Inserir matrícula simples, apenas se não existir
            db.execute('INSERT OR IGNORE INTO alunos (usuario_id, matricula, turma_id) VALUES (?, ?, ?)',
                       (usuario_id, 'ALU123', None))
            db.commit()