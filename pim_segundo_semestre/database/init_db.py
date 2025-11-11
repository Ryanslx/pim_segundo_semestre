import sqlite3
import os
import sys
from werkzeug.security import generate_password_hash

# Adicionar o diretório backend ao path para importar os módulos
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Caminho do banco de dados
DB_DIR = os.path.dirname(__file__)
DB_PATH = os.path.join(DB_DIR, 'sistema_academico.db')

def create_tables(cursor):
    """Cria todas as tabelas do sistema"""
    
    # Tabela de usuários
    cursor.execute('''
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
    cursor.execute('''
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
    cursor.execute('''
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
    cursor.execute('''
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
    cursor.execute('''
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
    cursor.execute('''
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
    cursor.execute('''
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
    cursor.execute('''
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
    
    print("✅ Tabelas criadas com sucesso!")

def insert_sample_data(cursor):
    """Insere dados de exemplo no banco"""
    
    # Inserir usuários de exemplo
    usuarios = [
        ('Administrador Sistema', 'admin@escola.com', generate_password_hash('admin123'), 'admin'),
        ('Professor João Silva', 'professor@escola.com', generate_password_hash('prof123'), 'professor'),
        ('Professor Maria Santos', 'maria.prof@escola.com', generate_password_hash('prof123'), 'professor'),
        ('Aluno Pedro Oliveira', 'aluno@escola.com', generate_password_hash('aluno123'), 'aluno'),
        ('Aluna Ana Costa', 'ana@escola.com', generate_password_hash('aluno123'), 'aluno'),
        ('Aluno Carlos Souza', 'carlos@escola.com', generate_password_hash('aluno123'), 'aluno'),
        ('Aluna Beatriz Lima', 'beatriz@escola.com', generate_password_hash('aluno123'), 'aluno')
    ]
    
    cursor.executemany(
        'INSERT OR IGNORE INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, ?)',
        usuarios
    )
    print("✅ Usuários de exemplo inseridos!")
    
    # Inserir turmas de exemplo
    turmas = [
        ('1º Ano A - Manhã', '1A2024', 'Turma do primeiro ano - Turno Manhã', '2024', 'manhã', 1),
        ('2º Ano B - Tarde', '2B2024', 'Turma do segundo ano - Turno Tarde', '2024', 'tarde', 1),
        ('3º Ano C - Noite', '3C2024', 'Turma do terceiro ano - Turno Noite', '2024', 'noite', 1)
    ]
    
    cursor.executemany(
        'INSERT OR IGNORE INTO turmas (nome, codigo, descricao, ano_letivo, periodo, criado_por) VALUES (?, ?, ?, ?, ?, ?)',
        turmas
    )
    print("✅ Turmas de exemplo inseridas!")
    
    # Inserir alunos
    alunos = [
        (4, '20240001', 1, '2008-05-15', 'Rua A, 123', '(11) 9999-1111'),
        (5, '20240002', 1, '2008-08-20', 'Rua B, 456', '(11) 9999-2222'),
        (6, '20240003', 2, '2007-03-10', 'Rua C, 789', '(11) 9999-3333'),
        (7, '20240004', 2, '2007-11-25', 'Rua D, 101', '(11) 9999-4444')
    ]
    
    cursor.executemany(
        '''INSERT OR IGNORE INTO alunos 
           (usuario_id, matricula, turma_id, data_nascimento, endereco, telefone) 
           VALUES (?, ?, ?, ?, ?, ?)''',
        alunos
    )
    print("✅ Alunos de exemplo inseridos!")
    
    # Atualizar contagem de alunos nas turmas
    cursor.execute('UPDATE turmas SET alunos_matriculados = 2 WHERE id = 1')
    cursor.execute('UPDATE turmas SET alunos_matriculados = 2 WHERE id = 2')
    print("✅ Contagem de alunos atualizada!")
    
    # Inserir matérias
    materias = [
        ('Matemática', 'Matemática Básica e Álgebra', 1, 2, '08:00-09:30', 'segunda'),
        ('Português', 'Língua Portuguesa e Literatura', 1, 2, '10:00-11:30', 'terca'),
        ('História', 'História do Brasil e Geral', 1, 3, '08:00-09:30', 'quarta'),
        ('Geografia', 'Geografia Física e Humana', 1, 3, '10:00-11:30', 'quinta'),
        ('Ciências', 'Ciências Naturais e Biológicas', 2, 2, '14:00-15:30', 'segunda'),
        ('Inglês', 'Língua Inglesa', 2, 3, '16:00-17:30', 'terca')
    ]
    
    cursor.executemany(
        '''INSERT OR IGNORE INTO materias 
           (nome, descricao, turma_id, professor_id, horario, dia_semana) 
           VALUES (?, ?, ?, ?, ?, ?)''',
        materias
    )
    print("✅ Matérias de exemplo inseridas!")
    
    # Inserir atividades
    from datetime import date, timedelta
    
    atividades = [
        ('Prova de Matemática - Unidade 1', 'Prova sobre os primeiros conteúdos de matemática', 1, 
         (date.today() + timedelta(days=7)).isoformat(), 10.0, 2),
        ('Redação - Tema Livre', 'Redação dissertativa sobre tema da atualidade', 2, 
         (date.today() + timedelta(days=5)).isoformat(), 8.0, 2),
        ('Trabalho de História - Brasil Colônia', 'Pesquisa sobre o período colonial brasileiro', 3, 
         (date.today() + timedelta(days=10)).isoformat(), 7.5, 3),
        ('Exercícios de Ciências - Células', 'Lista de exercícios sobre biologia celular', 5, 
         (date.today() + timedelta(days=3)).isoformat(), 5.0, 2)
    ]
    
    cursor.executemany(
        '''INSERT OR IGNORE INTO atividades 
           (titulo, descricao, materia_id, data_entrega, valor, criado_por) 
           VALUES (?, ?, ?, ?, ?, ?)''',
        atividades
    )
    print("✅ Atividades de exemplo inseridas!")
    
    # Inserir notas de exemplo
    notas = [
        (1, 1, 8.5, 'Bom desempenho, mas pode melhorar nos cálculos.', 2),
        (2, 1, 9.2, 'Excelente trabalho! Continue assim.', 2),
        (1, 2, 7.0, 'Conteúdo bom, mas precisa melhorar a gramática.', 2),
        (2, 2, 8.8, 'Redação muito bem estruturada e argumentada.', 2),
        (3, 4, 6.5, 'Precisa estudar mais o conteúdo.', 2),
        (4, 4, 9.0, 'Desempenho excelente na atividade.', 2)
    ]
    
    cursor.executemany(
        '''INSERT OR IGNORE INTO notas 
           (aluno_id, atividade_id, nota, feedback, avaliado_por) 
           VALUES (?, ?, ?, ?, ?)''',
        notas
    )
    print("✅ Notas de exemplo inseridas!")
    
    # Inserir dias sem aula
    dias_sem_aula = [
        ('2024-02-12', 'Feriado - Carnaval', 1, 1),
        ('2024-02-13', 'Feriado - Carnaval', 1, 1),
        ('2024-04-21', 'Feriado - Tiradentes', 1, 1),
        ('2024-09-07', 'Feriado - Independência', 1, 1)
    ]
    
    cursor.executemany(
        '''INSERT OR IGNORE INTO dias_sem_aula 
           (data, motivo, turma_id, criado_por) 
           VALUES (?, ?, ?, ?)''',
        dias_sem_aula
    )
    print("✅ Dias sem aula inseridos!")

def init_database():
    """Inicializa o banco de dados completo"""
    
    print("🚀 Inicializando banco de dados do Sistema Acadêmico...")
    
    try:
        # Verificar se o diretório existe, se não, criar
        if not os.path.exists(DB_DIR):
            os.makedirs(DB_DIR)
            print(f"📁 Diretório criado: {DB_DIR}")
        
        # Conectar ao banco (cria se não existir)
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        print("📊 Criando tabelas...")
        create_tables(cursor)
        
        print("📝 Inserindo dados de exemplo...")
        insert_sample_data(cursor)
        
        # Commit das alterações
        conn.commit()
        conn.close()
        
        print("\n🎉 Banco de dados inicializado com sucesso!")
        print(f"📁 Local do banco: {DB_PATH}")
        
        # Mostrar credenciais
        print("\n🔐 CREDENCIAIS DE ACESSO:")
        print("=" * 40)
        print("👨‍💼 ADMIN:")
        print("   Email: admin@escola.com")
        print("   Senha: admin123")
        print("\n👨‍🏫 PROFESSOR:")
        print("   Email: professor@escola.com")
        print("   Senha: prof123")
        print("   Email: maria.prof@escola.com") 
        print("   Senha: prof123")
        print("\n👨‍🎓 ALUNOS:")
        print("   Email: aluno@escola.com")
        print("   Senha: aluno123")
        print("   Email: ana@escola.com")
        print("   Senha: aluno123")
        print("=" * 40)
        
    except Exception as e:
        print(f"❌ Erro ao inicializar banco de dados: {e}")
        return False
    
    return True

def check_database():
    """Verifica se o banco de dados existe e está íntegro"""
    
    if not os.path.exists(DB_PATH):
        print("❌ Banco de dados não encontrado!")
        return False
    
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Verificar tabelas essenciais
        tables = ['usuarios', 'turmas', 'alunos', 'materias', 'atividades', 'notas']
        
        for table in tables:
            cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table}'")
            if not cursor.fetchone():
                print(f"❌ Tabela '{table}' não encontrada!")
                conn.close()
                return False
        
        # Verificar se há usuários
        cursor.execute("SELECT COUNT(*) FROM usuarios")
        user_count = cursor.fetchone()[0]
        
        conn.close()
        
        if user_count == 0:
            print("❌ Nenhum usuário encontrado no banco!")
            return False
        
        print("✅ Banco de dados verificado e íntegro!")
        return True
        
    except Exception as e:
        print(f"❌ Erro ao verificar banco: {e}")
        return False

if __name__ == '__main__':
    print("=" * 60)
    print("SISTEMA ACADÊMICO INTEGRADO - INICIALIZADOR DO BANCO")
    print("=" * 60)
    
    # Verificar se o banco já existe
    if check_database():
        resposta = input("\n📂 Banco já existe. Deseja recriar? (s/N): ")
        if resposta.lower() != 's':
            print("Operação cancelada.")
            exit(0)
        
        # Remover arquivo existente
        try:
            os.remove(DB_PATH)
            print("🗑️  Banco anterior removido.")
        except Exception as e:
            print(f"❌ Erro ao remover banco anterior: {e}")
            exit(1)
    
    # Inicializar novo banco
    success = init_database()
    
    if success:
        print("\n✅ Pronto! Agora você pode:")
        print("   1. Executar o backend: python backend/app.py")
        print("   2. Abrir o frontend: frontend/index.html no navebador")
        print("   3. Fazer login com as credenciais acima")
    else:
        print("\n❌ Falha na inicialização do banco.")
        exit(1)