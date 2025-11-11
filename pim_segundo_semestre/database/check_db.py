import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'sistema_academico.db')

def check_database_status():
    """Verifica o status atual do banco de dados"""
    
    print("🔍 Verificando status do banco de dados...")
    
    if not os.path.exists(DB_PATH):
        print("❌ Banco de dados não encontrado!")
        print("💡 Execute: python database/init_db.py")
        return False
    
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Contar registros em cada tabela
        tables = {
            'usuarios': '👥 Usuários',
            'turmas': '🏫 Turmas', 
            'alunos': '👨‍🎓 Alunos',
            'materias': '📚 Matérias',
            'atividades': '📝 Atividades',
            'notas': '📊 Notas',
            'dias_sem_aula': '📅 Dias sem aula'
        }
        
        print("\n📈 ESTATÍSTICAS DO BANCO:")
        print("=" * 40)
        
        for table, description in tables.items():
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            print(f"{description}: {count} registros")
        
        # Informações específicas
        cursor.execute("SELECT tipo, COUNT(*) FROM usuarios GROUP BY tipo")
        print("\n👥 DISTRIBUIÇÃO DE USUÁRIOS:")
        for tipo, count in cursor.fetchall():
            print(f"   {tipo.capitalize()}: {count}")
        
        cursor.execute("SELECT periodo, COUNT(*) FROM turmas GROUP BY periodo")
        print("\n🏫 TURMAS POR PERÍODO:")
        for periodo, count in cursor.fetchall():
            print(f"   {periodo.capitalize()}: {count}")
        
        conn.close()
        
        print("\n✅ Banco de dados está operacional!")
        return True
        
    except Exception as e:
        print(f"❌ Erro ao verificar banco: {e}")
        return False

if __name__ == '__main__':
    check_database_status()