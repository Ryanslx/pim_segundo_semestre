#include <stdio.h>
#include <string.h>
#include <stdlib.h>

// Estrutura para representar um aluno
typedef struct {
    int id;
    char nome[100];
    float nota;
} Aluno;

// Busca linear em C para arrays de alunos
int busca_linear_alunos(Aluno alunos[], int n, const char* nome) {
    for (int i = 0; i < n; i++) {
        if (strstr(alunos[i].nome, nome) != NULL) {
            return i;
        }
    }
    return -1;
}

// Ordenação por inserção para arrays de alunos
void ordenacao_insercao(Aluno alunos[], int n) {
    int i, j;
    Aluno chave;
    
    for (i = 1; i < n; i++) {
        chave = alunos[i];
        j = i - 1;
        
        while (j >= 0 && alunos[j].nota < chave.nota) {
            alunos[j + 1] = alunos[j];
            j = j - 1;
        }
        alunos[j + 1] = chave;
    }
}

// Função para calcular média de notas
float calcular_media(Aluno alunos[], int n) {
    float soma = 0;
    for (int i = 0; i < n; i++) {
        soma += alunos[i].nota;
    }
    return n > 0 ? soma / n : 0;
}