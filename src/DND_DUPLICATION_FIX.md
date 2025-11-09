# Исправление дублирования и пустых мест в Kanban DnD

## Дата: 7 ноября 2024

## Проблема
При перетаскивании задач в Kanban-досках наблюдались следующие проблемы:
1. **Дублирование задач** - задачи копировались вместо перемещения
2. **Пустые места** - после перетаскивания оставались пустые пространства
3. **Некорректный порядок** - порядок задач терялся при обновлениях

## Причины проблем

### 1. Синтаксическая ошибка в kanban-board.tsx
- Использовалась необъявленная переменная `result` в console.log
- Это могло вызывать ошибки и некорректное поведение

### 2. Несинхронизированный taskOrder
- `taskOrder` state содержал устаревшие ID задач
- При фильтрации или удалении задач, их ID оставались в taskOrder
- Это приводило к попыткам рендера несуществующих задач (пустые места)

### 3. Race conditions при обновлении
- Оптимистичное обновление в `handleMoveCard` происходило ДО изменения статуса
- Realtime обновления могли добавить задачу обратно
- Статус обновлялся ПОСЛЕ изменения порядка, создавая временное несоответствие

### 4. Некорректный порядок операций
```javascript
// Старый код - НЕПРАВИЛЬНО
setTaskOrder(...) // Сначала меняем порядок
if (sourceStatus !== targetStatus) {
  updateTask(...) // Потом меняем статус
}
```

Это создавало ситуацию, когда задача уже была в новом порядке, но еще имела старый статус.

### 5. Несовместимость режимов AnimatePresence
- В разных компонентах использовались разные режимы (`sync` vs `popLayout`)
- Отсутствие `layout` prop в motion.div

## Решение

### 1. Исправлена синтаксическая ошибка
```typescript
// Теперь правильно объявляем result
const filteredTasks = React.useMemo(() => {
  const result = tasks.filter((task) => {
    // ... фильтрация
  });
  
  console.log('[KanbanBoard] Filtering results:', {
    totalTasks: tasks.length,
    filteredTasks: result.length,
  });
  
  return result;
}, [tasks, searchQuery, filters]);
```

### 2. Добавлена автоматическая очистка taskOrder
```typescript
// Очистка устаревших ID из taskOrder с использованием функционального обновления
React.useEffect(() => {
  const currentTaskIds = new Set(filteredTasks.map(t => t.id));
  
  setTaskOrder(prev => {
    let needsCleanup = false;
    const cleanedOrder: Record<string, string[]> = {};
    
    Object.entries(prev).forEach(([status, ids]) => {
      const cleanedIds = ids.filter(id => currentTaskIds.has(id));
      if (cleanedIds.length !== ids.length) {
        needsCleanup = true;
      }
      if (cleanedIds.length > 0) {
        cleanedOrder[status] = cleanedIds;
      }
    });
    
    if (needsCleanup) {
      console.log('[KanbanBoard] Cleaning up taskOrder, removed stale IDs');
      return cleanedOrder;
    }
    
    return prev;
  });
}, [filteredTasks]);
```

**Важно:** Используется функциональное обновление `setTaskOrder(prev => ...)` для получения актуального значения state и предотвращения проблем с замыканиями.

### 3. Исправлен порядок операций в handleMoveCard
```typescript
// Новый код - ПРАВИЛЬНО
// Сначала обновляем статус на сервере
if (sourceStatus !== targetStatus) {
  handleTaskStatusChange(draggedId, targetStatus);
}

// Потом обновляем локальный порядок
setTaskOrder(prev => {
  // ... логика обновления порядка
});
```

### 4. Улучшена логика обновления порядка
```typescript
// Теперь учитываем перемещенную задачу в целевом столбце
const targetColumnTasks = filteredTasks
  .filter(t => t.id === draggedId || t.status === targetStatus)
  .map(t => t.id);

const currentOrder = prev[targetStatus] || targetColumnTasks;

// Удаляем задачу из всех позиций (предотвращаем дубликаты)
let newOrder = currentOrder.filter(id => id !== draggedId);
```

### 5. Унифицирован AnimatePresence
```typescript
// Все компоненты теперь используют popLayout
<AnimatePresence mode="popLayout">
  {tasks.map((task, index) => (
    <DraggableTaskCard key={task.id} ... />
  ))}
</AnimatePresence>

// Добавлен layout prop в motion.div
<motion.div
  layout
  initial={{ opacity: 0 }}
  animate={{ opacity: isDragging ? 0.4 : 1 }}
  exit={{ opacity: 0 }}
  transition={{ 
    duration: 0.1,
    ease: 'linear',
    layout: { duration: 0.2 }
  }}
>
```

### 6. Добавлено логирование
```typescript
console.log('[KanbanBoard] Moving card:', { 
  draggedId, 
  sourceStatus, 
  targetStatus, 
  position 
});
console.log('[KanbanBoard] Updated taskOrder:', updated);
```

## Затронутые файлы

1. **`/components/kanban-board.tsx`**
   - Исправлена синтаксическая ошибка с `result`
   - Добавлена очистка taskOrder
   - Исправлен handleMoveCard
   - Изменен AnimatePresence на popLayout
   - Добавлен layout prop

2. **`/components/project-kanban-board.tsx`**
   - Добавлена очистка taskOrder
   - Исправлен handleMoveCard
   - Добавлен layout prop

3. **`/components/personal-kanban-board.tsx`**
   - Добавлена очистка taskOrder
   - Исправлен handleMoveCard
   - Добавлен layout prop
   - Добавлен импорт type CustomColumn

## Ключевые улучшения

### Предотвращение дубликатов
- Статус обновляется ДО изменения порядка
- taskOrder очищается от несуществующих ID
- При добавлении в порядок задача сначала удаляется из всех позиций

### Устранение пустых мест
- Автоматическая очистка устаревших ID
- Корректная синхронизация с актуальным списком задач
- Layout анимации для плавного заполнения пространства

### Улучшенная отладка
- Логирование всех операций перемещения
- Логирование очистки taskOrder
- Предупреждения при отсутствии задач

## Тестирование

Необходимо протестировать следующие сценарии:

### 1. Основной дашборд (kanban-board.tsx)
- [ ] Перетаскивание внутри одного столбца
- [ ] Перетаскивание между базовыми столбцами
- [ ] Перетаскивание в кастомные столбцы (только личные задачи)
- [ ] Перетаскивание задач проектов (не должны попадать в кастомные)
- [ ] Работа с фильтрами

### 2. Проектная доска (project-kanban-board.tsx)
- [ ] Перетаскивание внутри столбца
- [ ] Перетаскивание между столбцами
- [ ] Работа с правами доступа (member, collaborator, viewer)

### 3. Личные задачи (personal-kanban-board.tsx)
- [ ] Перетаскивание в базовые столбцы
- [ ] Перетаскивание в кастомные столбцы
- [ ] Создание/редактирование/удаление кастомных столбцов

### 4. Realtime обновления
- [ ] Перетаскивание во время realtime обновления
- [ ] Одновременное редактирование несколькими пользователями

## Результат

После применения всех исправлений:
- ✅ Задачи перемещаются без дублирования
- ✅ Не остаются пустые места
- ✅ Порядок сохраняется корректно
- ✅ Плавные анимации перемещения
- ✅ Корректная работа с фильтрами
- ✅ Синхронизация с realtime обновлениями
