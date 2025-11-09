# Исправление проблемы с выбором исполнителя Alex 2

## Проблема
1. При выборе Alex 2 как исполнителя задачи, выбор "слетает" - сначала выбирается, а потом меняется на "Не назначено"
2. Задачи, назначенные на Alex 2, не появляются в его списке задач

## Причины

### Причина 1: Циклический useEffect в task-modal.tsx
В компоненте `task-modal.tsx` был useEffect, который срабатывал при каждом рендере:

```tsx
React.useEffect(() => {
  if (projectId === 'personal' && currentUser) {
    setAssigneeId(currentUser.id);
  } else if (projectId !== 'personal' && !existingTask) {
    setAssigneeId(''); // ❌ Сбрасывает выбор при каждом изменении
  }
}, [projectId, currentUser, existingTask]);
```

Проблема: `existingTask` вычислялся заново при каждом рендере без мемоизации, что вызывало повторные срабатывания useEffect и сброс assigneeId.

**Решение**: Используем ref для отслеживания реального изменения projectId:

```tsx
const prevProjectIdRef = React.useRef(projectId);
React.useEffect(() => {
  // Только если projectId реально изменился
  if (prevProjectIdRef.current !== projectId) {
    if (projectId === 'personal' && currentUser) {
      setAssigneeId(currentUser.id);
    } else if (projectId !== 'personal' && !taskId) {
      setAssigneeId('');
    }
    prevProjectIdRef.current = projectId;
  }
}, [projectId, currentUser, taskId]);
```

### Причина 2: Несовпадение ID участников проекта

Участники проекта могут иметь два типа ID:
- **Моковые участники** (из демо-данных): используют строковые ID вроде '1', '2', '3'
- **Реальные участники** (добавленные через приглашения): используют `userId` из Supabase Auth

При фильтрации доступных участников в `task-modal.tsx`, код проверял только `member.id`, что не работало для реальных участников.

**Решение**: Проверяем оба поля - `userId` (приоритет) и `id` (fallback):

```tsx
if (selectedProject.members && Array.isArray(selectedProject.members)) {
  selectedProject.members.forEach((member: any) => {
    // Real members (added via invitation) have userId
    if (member.userId) {
      memberIds.add(member.userId);
    }
    // Legacy/mock members may only have id
    if (member.id) {
      memberIds.add(member.id);
    }
  });
}
```

### Причина 3: Backend не загружал профили реальных участников

В endpoint `/team/members`, backend собирал участников из проектов, но не загружал их профили из KV store для реальных пользователей.

**Решение**: Загружаем профиль пользователя для участников с `userId`:

```tsx
// Use userId if available (real members), fallback to id (legacy/mock members)
const memberId = member.userId || member.id;
if (memberId && !membersMap.has(memberId)) {
  // Try to get user profile from KV store for real members
  let memberData = null;
  if (member.userId) {
    memberData = await kv.get(`user:${member.userId}`);
  }
  
  membersMap.set(memberId, {
    id: memberId,
    name: memberData?.name || member.name || member.email,
    email: member.email,
    avatarUrl: memberData?.avatarUrl || member.avatar,
  });
}
```

## Тестирование

1. ✅ Пригласить нового участника (например, Alex 2) в проект
2. ✅ Создать задачу и выбрать Alex 2 как исполнителя
3. ✅ Убедиться, что выбор не сбрасывается
4. ✅ Зайти под учетной записью Alex 2
5. ✅ Проверить, что назначенные задачи видны

## Файлы изменены

- `/components/task-modal.tsx` - исправлен useEffect, добавлена поддержка userId
- `/supabase/functions/server/index.tsx` - добавлена загрузка профилей для реальных участников
