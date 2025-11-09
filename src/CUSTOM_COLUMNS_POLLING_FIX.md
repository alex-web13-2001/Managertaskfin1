# Исправление проблемы с отображением кастомных статусов

## Проблема
При отображении задач в табличном виде появлялись ошибки:
```
[TaskTable] No label found for status: custom_1762460538321
[TaskTable] No label found for status: custom_1762116722860
```

Задачи с кастомными статусами существовали в базе данных, но массив `customColumns` был пуст во время рендеринга.

## Причина
В системе polling (обновление данных каждые 3 секунды) обновлялись только задачи и проекты, но НЕ кастомные колонки:

```tsx
// Было:
await Promise.all([
  fetchTasks(),
  fetchProjects(),
]);
```

Это приводило к следующей ситуации:
1. Пользователь создает кастомную колонку (например, "В тестировании")
2. Создается задача с этим статусом (custom_1762460538321)
3. Polling обновляет список задач → задача загружается
4. Но кастомные колонки НЕ обновляются через polling
5. Результат: задача есть, но информация о названии колонки отсутствует

## Решение

### 1. Добавлен fetchCustomColumns в polling
**Файл:** `/contexts/app-context.tsx`

```tsx
// Стало:
await Promise.all([
  fetchTasks(),
  fetchProjects(),
  fetchCustomColumns(), // Добавлено!
]);
```

Обновлены зависимости useEffect:
```tsx
}, [currentUser, fetchTasks, fetchProjects, fetchCustomColumns]);
```

### 2. Улучшен fallback для кастомных статусов
**Файлы:** 
- `/components/task-table.tsx`
- `/components/personal-task-table.tsx`

Вместо отображения "Кастомный статус" или ID статуса, теперь показывается "Загрузка статуса..." или "Загрузка..." с цветом кастомной колонки (фиолетовым), что:
- Более информативно для пользователя
- Визуально согласовано с кастомными колонками
- Указывает на временный характер проблемы

**task-table.tsx:**
```tsx
// Fallback для неизвестных статусов
let fallbackLabel = status;
if (status.startsWith('custom_')) {
  fallbackLabel = 'Загрузка статуса...';
}

return {
  label: fallbackLabel,
  color: 'bg-purple-100 text-purple-700', // Фиолетовый цвет кастомных колонок
};
```

**personal-task-table.tsx:**
```tsx
<Badge variant="outline" className={statusColors[task.status] || 'bg-purple-100 text-purple-700'}>
  {statusLabels[task.status] || (task.status.startsWith('custom_') ? 'Загрузка...' : task.status)}
</Badge>
```

## Результат
- Кастомные колонки теперь автоматически синхронизируются через polling каждые 3 секунды
- Если колонка временно не загружена, показывается понятное сообщение
- Предупреждения в консоли остаются для отладки, но с дополнительным контекстом

## Технические детали
- **Частота обновления:** 3 секунды (как и для задач/проектов)
- **Метод синхронизации:** Polling (вместо realtime из-за совместимости с KV store)
- **Fallback поведение:** Показывает "Загрузка..." до получения данных о колонке
- **Цвет fallback:** Фиолетовый (bg-purple-100 text-purple-700) для согласованности с кастомными колонками

## Затронутые файлы
- `/contexts/app-context.tsx` - добавлен fetchCustomColumns в polling
- `/components/task-table.tsx` - улучшен fallback для кастомных статусов
- `/components/personal-task-table.tsx` - улучшен fallback для кастомных статусов

## Дата исправления
7 ноября 2025
