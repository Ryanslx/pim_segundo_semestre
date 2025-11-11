import sqlite3
import os
<<<<<<< HEAD
=======
from werkzeug.security import generate_password_hash
>>>>>>> origin/admin

DATABASE_PATH = os.path.join(os.path.dirname(__file__), '..', 'database', 'sistema_academico.db')

def get_db():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
<<<<<<< HEAD
    db = get_db()
    
    # Tabela de usuários
    db.execute('''
=======
    # Remover banco existente para recriar com estrutura correta
    if os.path.exists(DATABASE_PATH):
        print("🗑️ Removendo banco de dados antigo...")
        os.remove(DATABASE_PATH)
    
    conn = get_db()
    cursor = conn.cursor()
    
    print("🔄 Criando novo banco de dados...")
    
    # Tabela de usuários (ESTRUTURA COMPLETA E CORRETA)
    cursor.execute('''
>>>>>>> origin/admin
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            senha TEXT NOT NULL,
            tipo TEXT NOT NULL CHECK(tipo IN ('aluno', 'professor', 'admin')),
<<<<<<< HEAD
=======
            telefone TEXT,
            formacao TEXT,
            experiencia INTEGER,
>>>>>>> origin/admin
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Tabela de turmas
<<<<<<< HEAD
    db.execute('''
=======
    cursor.execute('''
>>>>>>> origin/admin
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
<<<<<<< HEAD
    db.execute('''
=======
    cursor.execute('''
>>>>>>> origin/admin
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
<<<<<<< HEAD
    db.execute('''
=======
    cursor.execute('''
>>>>>>> origin/admin
        CREATE TABLE IF NOT EXISTS materias (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            descricao TEXT,
            turma_id INTEGER,
            professor_id INTEGER,
            horario TEXT,
            dia_semana TEXT,
<<<<<<< HEAD
=======
            carga_horaria_semanal INTEGER DEFAULT 4,
            data_inicio DATE,
            dias_aula TEXT,
            observacoes TEXT,
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
>>>>>>> origin/admin
            FOREIGN KEY (turma_id) REFERENCES turmas (id),
            FOREIGN KEY (professor_id) REFERENCES usuarios (id)
        )
    ''')
<<<<<<< HEAD

    # Adicionar após a tabela de matérias no database.py
    db.execute('''
        CREATE TABLE IF NOT EXISTS professor_alocacao (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            professor_id INTEGER,
            turma_id INTEGER,
            materia_id INTEGER,
            dia_semana TEXT NOT NULL,
            horario_inicio TIME NOT NULL,
            horario_fim TIME NOT NULL,
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (professor_id) REFERENCES usuarios (id),
            FOREIGN KEY (turma_id) REFERENCES turmas (id),
            FOREIGN KEY (materia_id) REFERENCES materias (id),
            UNIQUE(turma_id, dia_semana, horario_inicio)
        )
    ''')
    
    # Tabela de atividades
    db.execute('''
=======
    
    # Tabela de atividades
    cursor.execute('''
>>>>>>> origin/admin
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
<<<<<<< HEAD
    db.execute('''
=======
    cursor.execute('''
>>>>>>> origin/admin
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
    
<<<<<<< HEAD
    # Tabela de feedback do sistema
    db.execute('''
=======
    # Tabela de feedback
    cursor.execute('''
>>>>>>> origin/admin
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
<<<<<<< HEAD
    db.execute('''
=======
    cursor.execute('''
>>>>>>> origin/admin
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
    
<<<<<<< HEAD
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
=======
    print("✅ Tabelas criadas com sucesso!")
    
    # Inserir usuários padrão (AGORA COM TODOS OS CAMPOS)
    usuarios_padrao = [
        ('Administrador', 'admin@escola.com', generate_password_hash('admin123'), 'admin', None, None, None),
        ('Professor Demo', 'professor@escola.com', generate_password_hash('prof123'), 'professor', '(11) 99999-9999', 'Licenciatura em Matemática', 5),
        ('Aluno Demo', 'aluno@escola.com', generate_password_hash('aluno123'), 'aluno', None, None, None),
        ('Maria Silva', 'maria.silva@escola.com', generate_password_hash('senha123'), 'professor', '(11) 99999-8888', 'Licenciatura em Português', 8),
        ('João Santos', 'joao.santos@escola.com', generate_password_hash('senha123'), 'professor', '(11) 99999-7777', 'Licenciatura em Ciências', 3)
    ]
    
    for usuario in usuarios_padrao:
        try:
            cursor.execute(
                'INSERT INTO usuarios (nome, email, senha, tipo, telefone, formacao, experiencia) VALUES (?, ?, ?, ?, ?, ?, ?)',
                usuario
            )
            print(f"✅ Usuário criado: {usuario[0]} ({usuario[1]})")
        except sqlite3.IntegrityError as e:
            print(f"⚠️ Usuário já existe: {usuario[1]} - {e}")
    
    # Inserir turmas padrão
    turmas_padrao = [
        ('1º Ano A - Manhã', '1A2024', 'Turma do primeiro ano', '2024', 'manhã', 90, 1),
        ('2º Ano B - Tarde', '2B2024', 'Turma do segundo ano', '2024', 'tarde', 90, 1),
        ('3º Ano C - Manhã', '3C2024', 'Turma do terceiro ano', '2024', 'manhã', 90, 1)
    ]
    
    for turma in turmas_padrao:
        try:
            cursor.execute(
                'INSERT INTO turmas (nome, codigo, descricao, ano_letivo, periodo, capacidade_max, criado_por) VALUES (?, ?, ?, ?, ?, ?, ?)',
                turma
            )
            print(f"✅ Turma criada: {turma[0]} ({turma[1]})")
        except sqlite3.IntegrityError as e:
            print(f"⚠️ Turma já existe: {turma[1]} - {e}")
    
    # Inserir aluno demo
    try:
        cursor.execute('SELECT id FROM usuarios WHERE email = ?', ('aluno@escola.com',))
        usuario_aluno = cursor.fetchone()
        if usuario_aluno:
            cursor.execute(
                'INSERT INTO alunos (usuario_id, matricula, turma_id) VALUES (?, ?, ?)',
                (usuario_aluno[0], '20240001', 1)
            )
            print("✅ Aluno demo criado: Aluno Demo (20240001)")
    except sqlite3.IntegrityError as e:
        print(f"⚠️ Aluno já existe: {e}")
    
    # Inserir matérias de exemplo
    materias_padrao = [
        ('Matemática', 'Matemática Básica', 1, 2, '08:00-10:00', 'segunda', 4),
        ('Português', 'Língua Portuguesa', 1, 4, '10:00-12:00', 'terca', 4),
        ('Ciências', 'Ciências Naturais', 1, 5, '08:00-10:00', 'quarta', 4),
        ('História', 'História do Brasil', 2, 4, '14:00-16:00', 'segunda', 4),
        ('Geografia', 'Geografia Geral', 2, 5, '16:00-18:00', 'quarta', 4)
    ]
    
    for materia in materias_padrao:
        try:
            cursor.execute(
                'INSERT INTO materias (nome, descricao, turma_id, professor_id, horario, dia_semana, carga_horaria_semanal) VALUES (?, ?, ?, ?, ?, ?, ?)',
                materia
            )
            print(f"✅ Matéria criada: {materia[0]} para turma {materia[2]}")
        except sqlite3.IntegrityError as e:
            print(f"⚠️ Matéria já existe: {e}")
    
    conn.commit()
    conn.close()
    
    print("\n🎉 Banco de dados inicializado com sucesso!")
    print("📊 Estrutura completa criada:")
    print("   👤 5 usuários (2 admins, 3 professores, 1 aluno)")
    print("   🏫 3 turmas")
    print("   📚 5 matérias de exemplo")
    print("\n🔑 Credenciais para teste:")
    print("   Admin: admin@escola.com / admin123")
    print("   Professor: professor@escola.com / prof123")
    print("   Aluno: aluno@escola.com / aluno123")

if __name__ == '__main__':
    init_db()
>>>>>>> origin/admin
