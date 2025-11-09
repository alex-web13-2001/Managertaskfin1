# Исправление проблемы "No access token found"

## Что было исправлено

### Проблема
Компонент `project-members-modal.tsx` пытался получить токен авторизации из `localStorage.getItem('access_token')`, но этот ключ никогда не устанавливался. Токен авторизации хранится в Supabase сессии, а не в localStorage.

### Решение
Заменили все обращения к `localStorage.getItem('access_token')` на использование функции `getAuthToken()` из `utils/supabase/client.tsx`, которая правильно получает токен из Supabase сессии.

## Изменённые функции

В файле `/components/project-members-modal.tsx`:

1. **fetchMembers()** - получение списка участников проекта
2. **fetchInvitations()** - получение списка приглашений
3. **handleInvite()** - отправка нового приглашения
4. **handleResendInvite()** - повторная отправка приглашения
5. **handleRevokeInvite()** - отзыв приглашения
6. **handleChangeRole()** - изменение роли участника
7. **handleDeleteMember()** - удаление участника

## Как работает авторизация

### Правильный способ получения токена:

```typescript
import { getAuthToken } from '../utils/supabase/client';

const accessToken = await getAuthToken();
if (!accessToken) {
  toast.error('Необходима авторизация');
  return;
}
```

### Что делает getAuthToken():

```typescript
export const getAuthToken = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
};
```

Эта функция:
1. Получает текущую сессию из Supabase
2. Извлекает access_token из сессии
3. Возвращает токен или null, если сессия не активна

## Проверка работы

### 1. Проверьте сессию в консоли:

```javascript
// Получить экземпляр Supabase клиента
import { supabase } from './utils/supabase/client';

// Проверить сессию
const { data: { session } } = await supabase.auth.getSession();
console.log('Active session:', session);
console.log('User:', session?.user);
console.log('Access token:', session?.access_token);
```

### 2. Если сессия отсутствует:

- Выполните выход из системы
- Войдите заново
- Проверьте сессию снова

### 3. Проверьте работу приглашений:

1. Войдите в систему
2. Откройте проект
3. Нажмите "Участники"
4. Попробуйте отправить приглашение
5. Проверьте консоль на наличие ошибок

## Единая система авторизации

Все API запросы в приложении теперь используют единую систему получения токена:

### Tasks API (`utils/supabase/client.tsx`):
- `tasksAPI.getAll()`
- `tasksAPI.create()`
- `tasksAPI.update()`
- `tasksAPI.delete()`

### Projects API (`utils/supabase/client.tsx`):
- `projectsAPI.getAll()`
- `projectsAPI.create()`
- `projectsAPI.update()`
- `projectsAPI.delete()`
- `projectsAPI.getTasks()`

### Project Members (теперь исправлено):
- Все операции в `project-members-modal.tsx`

## Почему это важно

1. **Безопасность**: Токены хранятся в защищённом хранилище Supabase, а не в открытом localStorage
2. **Консистентность**: Все части приложения используют один метод получения токена
3. **Автоматическое обновление**: Supabase автоматически обновляет токены при истечении срока действия
4. **Централизованное управление**: При выходе из системы все токены автоматически удаляются

## Дополнительные улучшения

### Добавлена валидация токена:

Во всех функциях теперь проверяется наличие токена перед выполнением запроса:

```typescript
const accessToken = await getAuthToken();

if (!accessToken) {
  toast.error('Необходима авторизация');
  return;
}
```

### Улучшены сообщения об ошибках:

- "Необходима авторизация" - если токен отсутствует
- "Необходима авторизация. Пожалуйста, войдите в систему заново." - для важных операций

## Тестирование

### Сценарий 1: Отправка приглашения

1. Войдите в систему
2. Откройте проект
3. Нажмите "Участники"
4. Введите email: `test@example.com`
5. Выберите роль: "Участник"
6. Нажмите "Пригласить"

**Ожидаемый результат**: Приглашение отправлено, появляется в списке

### Сценарий 2: Работа после истечения сессии

1. Войдите в систему
2. Подождите истечения сессии (или выйдите в другой вкладке)
3. Попробуйте отправить приглашение

**Ожидаемый результат**: Сообщение "Необходима авторизация"

### Сценарий 3: Повторный вход

1. После ошибки авторизации
2. Обновите страницу
3. Войдите заново
4. Попробуйте отправить приглашение

**Ожидаемый результат**: Приглашение успешно отправлено

## Мониторинг в консоли

При отправке приглашения в консоли должны появиться следующие логи:

```
Sending invitation for: test@example.com role: member
Invitation response status: 200
Invitation created: { invitation: {...} }
```

Если появляется "No access token found", проверьте:
1. Активна ли сессия пользователя
2. Выполнен ли вход в систему
3. Не истёк ли срок действия токена
