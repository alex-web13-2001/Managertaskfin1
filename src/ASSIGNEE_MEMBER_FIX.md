# Исправление: Сброс выбора исполнителя с ролью "member"

## Проблема

При редактировании существующей задачи выбор участника проекта с ролью "member" в качестве исполнителя сразу сбрасывался обратно на "Не назначено". При создании новой задачи эта проблема не возникала.

## Причина

Проблема заключалась в логике вычисления `availableMembers` в компоненте `task-modal.tsx`:

1. **Фильтрация по teamMembers**: Код сначала собирал ID всех участников проекта в Set `memberIds`, затем фильтровал массив `teamMembers`:
   ```javascript
   const uniqueMembers = teamMembers.filter(member => memberIds.has(member.id));
   ```

2. **Отсутствие участника в teamMembers**: Когда участник принимал приглашение в проект, он добавлялся в `project.members`, но не всегда сразу попадал в глобальный массив `teamMembers` (который загружается через `teamAPI.getMembers()`).

3. **Потеря данных при фильтрации**: Даже если `assigneeId` добавлялся в `memberIds`, при фильтрации `teamMembers` участник не попадал в `availableMembers`, если его не было в `teamMembers`.

4. **Сброс значения в Select**: React Select компонент не находил выбранное значение `assigneeId` в списке `availableMembers` и автоматически сбрасывал его на "unassigned".

## Решение

Изменена логика построения `availableMembers` в `/components/task-modal.tsx`:

### До исправления:
```javascript
const uniqueMembers = teamMembers.filter(member => memberIds.has(member.id));
```

### После исправления:
```javascript
// Build a map of all available members
const membersMap = new Map();

// Add members from teamMembers
// Add project owner...
// Add project members...

// CRITICAL FIX: If a member is in project.members but not in teamMembers,
// create a temporary member object from project.members data
if (selectedProject.members && Array.isArray(selectedProject.members)) {
  selectedProject.members.forEach((member: any) => {
    const memberId = member.userId || member.id;
    if (memberId && !membersMap.has(memberId)) {
      membersMap.set(memberId, {
        id: memberId,
        name: member.name || member.email,
        email: member.email,
        avatarUrl: member.avatar || member.avatarUrl,
      });
    }
  });
}
```

## Ключевые изменения

1. **Использование Map вместо фильтрации**: Вместо фильтрации `teamMembers`, теперь строится `Map` всех доступных участников.

2. **Создание временных объектов**: Если участник есть в `project.members`, но отсутствует в `teamMembers`, создается временный объект участника с данными из `project.members`.

3. **Приоритет данных**: 
   - Сначала добавляются участники из `teamMembers` (у них полные профили)
   - Затем добавляются недостающие участники из `project.members` (создаются временные объекты)
   - В конце проверяется текущий `assigneeId` и `existingTask.assigneeId`

4. **Сохранение всех данных**: Теперь все участники проекта всегда присутствуют в `availableMembers`, независимо от того, загружены ли они в `teamMembers`.

## Результат

✅ Теперь при редактировании задачи можно выбрать любого участника проекта в качестве исполнителя, включая участников с ролью "member"
✅ Выбор исполнителя не сбрасывается при перерендере компонента
✅ Работает как для создания новых задач, так и для редактирования существующих

## Проверка

Для проверки исправления:
1. Создайте проект и пригласите участника с ролью "member"
2. Участник должен принять приглашение
3. Создайте задачу в проекте
4. Откройте задачу на редактирование
5. Выберите участника с ролью "member" в качестве исполнителя
6. ✅ Выбор должен сохраниться
7. Закройте и снова откройте задачу
8. ✅ Исполнитель должен остаться назначенным
