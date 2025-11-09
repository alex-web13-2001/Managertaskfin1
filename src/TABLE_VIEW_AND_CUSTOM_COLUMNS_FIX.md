# Исправления табличного вида и кастомных колонок

## 1. Исправление табличного вида - проблема с отображением и скроллом

### Проблема
В табличном виде дашборда, личных задач и проектов задачи не отображались на экране, хотя в консоли были видны. Проблема заключалась в неправильной конфигурации flex-контейнеров.

### Причина
Компоненты таблиц (`TaskTable`, `PersonalTaskTable`) имеют корневой `div` с классом `flex-1`, который должен растягиваться на всё доступное пространство. Однако родительские контейнеры не были настроены как flex-контейнеры:

- `/components/dashboard-view.tsx` (строка 585)
- `/components/tasks-view.tsx` (строка 222)
- `/components/project-detail-view.tsx` (строка 557)

Без `display: flex` на родителе, свойство `flex-1` на дочернем элементе не работает.

### Решение
Добавлен класс `flex flex-col` к родительским контейнерам:

**dashboard-view.tsx, tasks-view.tsx, project-detail-view.tsx:**
```tsx
// Было:
<div className="flex-1 overflow-hidden">

// Стало:
<div className="flex-1 flex flex-col overflow-hidden">
```

### Результат
Таблицы корректно отображаются и занимают всё доступное пространство с вертикальным скроллом.

---

## 2. Исправление проблемы с кастомными статусами

### Проблема
При отображении задач в табличном виде появлялись ошибки:
```
[TaskTable] No label found for status: custom_1762460538321
[TaskTable] No label found for status: custom_1762116722860
```

Задачи с кастомными статусами существовали, но массив `customColumns` был пуст.

### Причина
В системе polling (обновление данных каждые 3 секунды) обновлялись только задачи и проекты, но НЕ кастомные колонки. Это приводило к рассинхронизации:

1. Пользователь создает кастомную колонку
2. Создается задача с этим статусом
3. Polling обновляет список задач → задача загружается
4. Но кастомные колонки НЕ обновляются
5. Результат: задача есть, информация о колонке отсутствует

### Решение

#### 2.1. Добавлен fetchCustomColumns в polling
**Файл:** `/contexts/app-context.tsx`

```tsx
// Было:
await Promise.all([
  fetchTasks(),
  fetchProjects(),
]);

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

#### 2.2. Улучшен fallback для кастомных статусов
**Файлы:** `/components/task-table.tsx`, `/components/personal-task-table.tsx`

Вместо отображения "Кастомный статус" или ID, показывается "Загрузка..." с фиолетовым цветом:

**task-table.tsx:**
```tsx
let fallbackLabel = status;
if (status.startsWith('custom_')) {
  fallbackLabel = 'Загрузка статуса...';
}

return {
  label: fallbackLabel,
  color: 'bg-purple-100 text-purple-700',
};
```

**personal-task-table.tsx:**
```tsx
<Badge className={statusColors[task.status] || 'bg-purple-100 text-purple-700'}>
  {statusLabels[task.status] || (task.status.startsWith('custom_') ? 'Загрузка...' : task.status)}
</Badge>
```

### Результат
- Кастомные колонки автоматически синхронизируются через polling (каждые 3 секунды)
- Показывается понятное сообщение, если колонка временно не загружена
- Визуальная согласованность с кастомными колонками (фиолетовый цвет)

---

## Затронутые файлы

### Исправление табличного вида:
- `/components/dashboard-view.tsx`
- `/components/tasks-view.tsx`
- `/components/project-detail-view.tsx`

### Исправление кастомных статусов:
- `/contexts/app-context.tsx`
- `/components/task-table.tsx`
- `/components/personal-task-table.tsx`

## Дата исправления
7 ноября 2025
