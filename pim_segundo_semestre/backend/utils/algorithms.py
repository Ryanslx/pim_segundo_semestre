def quick_sort(arr, key=lambda x: x):
    """
    Implementação do algoritmo Quick Sort para ordenação eficiente
    """
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if key(x) < key(pivot)]
    middle = [x for x in arr if key(x) == key(pivot)]
    right = [x for x in arr if key(x) > key(pivot)]
    return quick_sort(left, key) + middle + quick_sort(right, key)

def binary_search(arr, target, key=lambda x: x):
    """
    Implementação da busca binária para busca eficiente
    """
    low = 0
    high = len(arr) - 1
    
    while low <= high:
        mid = (low + high) // 2
        mid_val = key(arr[mid])
        
        if mid_val == target:
            return mid
        elif mid_val < target:
            low = mid + 1
        else:
            high = mid - 1
    
    return -1

def search_students(students, query, field='nome'):
    """
    Busca de alunos com diferentes critérios
    """
    results = []
    query = query.lower()
    
    for student in students:
        if field in student and student[field] and query in str(student[field]).lower():
            results.append(student)
    
    return results

def sort_by_performance(students_data):
    """
    Ordena alunos por desempenho (média de notas)
    """
    return quick_sort(students_data, key=lambda x: x.get('media', 0))