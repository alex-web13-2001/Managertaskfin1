# Полное Руководство: Email, Приглашения, Проверка Прав

## Обзор

Реализованы три дополнительные функции для полноценной системы совместной работы:
1. **Email-сервис** - автоматическая отправка уведомлений о приглашениях
2. **Страница принятия приглашений** - веб-интерфейс для принятия по ссылке
3. **Серверная валидация прав** - дополнительный слой безопасности

## 1. Email-Сервис для Уведомлений

### Конфигурация

**Переменные окружения (.env):**
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@taskmanager.com
EMAIL_FROM_NAME=Task Manager
APP_URL=http://localhost:5173
```

### Поддерживаемые SMTP сервисы

**Gmail:**
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=app-specific-password
```

**Outlook/Hotmail:**
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

**Яндекс:**
```env
EMAIL_HOST=smtp.yandex.ru
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=your-email@yandex.ru
EMAIL_PASSWORD=your-password
```

**Mail.ru:**
```env
EMAIL_HOST=smtp.mail.ru
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=your-email@mail.ru
EMAIL_PASSWORD=your-password
```

### Шаблон Email Приглашения

**Содержит:**
- ✉️ Заголовок с иконкой почты
- 📁 Название проекта
- 👤 Имя пригласившего
- 🎭 Роль с цветным бейджем
- 📝 Описание прав роли
- 🔗 Кнопка "Принять приглашение"
- ⏰ Дата истечения срока
- 📌 Ссылка для копирования
- 🔒 Информация о безопасности

**Дизайн:**
- Фирменные цвета (фиолетовый)
- Адаптивная верстка
- Профессиональный footer
- Inline CSS для совместимости

### Автоматическая Отправка

**Триггер:** При создании приглашения через UI

```typescript
// В projectsAPI.sendInvitation()
await fetch(`${API_BASE_URL}/api/invitations/send-email`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    invitationId,
    email,
    projectName,
    role,
    expiresAt,
  }),
});
```

**Fallback:** Если email не настроен, приглашение все равно создается, просто не отправляется письмо.

## 2. Страница Принятия Приглашений

### URL Structure

```
/invite/{invitationId}
```

**Пример:**
```
https://your-domain.com/invite/inv_1699999999_abc123xyz
```

### Компонент: InviteAcceptPage

**Расположение:** `src/components/invite-accept-page.tsx`

**Доступ:** Публичная страница (не требует авторизации для просмотра)

### Состояния Страницы

#### 1. Loading (Загрузка)
```
┌─────────────────────┐
│  Loader Animation   │
│                     │
│  Загрузка          │
│  приглашения...    │
└─────────────────────┘
```

#### 2. Found (Приглашение найдено)
```
┌──────────────────────────────────┐
│  📩 Приглашение в проект        │
│                                  │
│  ┌────────────────────────────┐ │
│  │  👥 Website Redesign       │ │
│  │  Роль: [Collaborator]      │ │
│  │  Создание и редактирование │ │
│  │  задач                     │ │
│  └────────────────────────────┘ │
│                                  │
│  Email: user@example.com         │
│  Действительно до: 16 ноя 2025   │
│                                  │
│  ⚠️ Требуется вход в систему    │
│                                  │
│  [Отклонить]  [✓ Принять]      │
└──────────────────────────────────┘
```

#### 3. Expired (Истек срок)
```
┌──────────────────────────────────┐
│  ⚠️ Приглашение истекло         │
│                                  │
│  Срок действия этого            │
│  приглашения истек.             │
│                                  │
│  Попросите владельца проекта    │
│  отправить новое приглашение.   │
│                                  │
│  [Вернуться на главную]         │
└──────────────────────────────────┘
```

#### 4. Already Accepted (Уже принято)
```
┌──────────────────────────────────┐
│  ✓ Приглашение уже принято      │
│                                  │
│  Это приглашение уже было       │
│  принято ранее.                 │
│                                  │
│  [Перейти к проектам]           │
└──────────────────────────────────┘
```

#### 5. Not Found (Не найдено)
```
┌──────────────────────────────────┐
│  ❌ Приглашение не найдено      │
│                                  │
│  Ссылка на приглашение          │
│  недействительна или была       │
│  удалена.                       │
│                                  │
│  [Вернуться на главную]         │
└──────────────────────────────────┘
```

### API Endpoint

**GET /api/invitations/:invitationId**

**Responses:**

```typescript
// 200 OK - Валидное приглашение
{
  invitation: {
    id: "inv_123",
    projectId: "proj_456",
    projectName: "Website Redesign",
    invitedEmail: "user@example.com",
    role: "collaborator",
    status: "pending",
    sentDate: "2025-11-09T12:00:00Z",
    expiresAt: "2025-11-16T12:00:00Z"
  }
}

// 404 Not Found
{
  error: "Invitation not found"
}

// 410 Gone - Истекло
{
  error: "Invitation has expired",
  invitation: {...}
}

// 400 Bad Request - Уже принято
{
  error: "Invitation is accepted",
  invitation: {...}
}
```

### Пользовательский Процесс

#### Для Приглашающего (Owner):

1. Открыть проект
2. Нажать "Участники"
3. Ввести email получателя
4. Выбрать роль
5. Нажать "Отправить приглашение"
6. **Email автоматически отправляется** ✉️

#### Для Приглашенного:

1. Получить email с приглашением
2. Кликнуть "Принять приглашение" (открывается /invite/{id})
3. Просмотреть детали проекта и роли
4. Если не авторизован → показывается предупреждение
5. Нажать "Принять приглашение"
6. **Если не авторизован:** редирект на логин
7. **Если авторизован:** приглашение принимается
8. Редирект на страницу проектов

### Интеграция с App.tsx

**URL Detection:**
```typescript
// При загрузке приложения
const path = window.location.pathname;
if (path.startsWith('/invite/')) {
  const invitationId = path.replace('/invite/', '');
  setCurrentView('invite'); // Показать страницу приглашения
}
```

**Render Logic:**
```typescript
if (currentView === 'invite') {
  return (
    <ErrorBoundary>
      <AppProvider>
        <InviteAcceptPage />
        <Toaster />
      </AppProvider>
    </ErrorBoundary>
  );
}
```

## 3. Серверная Валидация Прав Задач

### Permission Helper Functions

**Расположение:** `src/server/index.ts`

#### getUserRoleInProject(userId, projectId)

```typescript
async function getUserRoleInProject(
  userId: string, 
  projectId: string
): Promise<UserRole> {
  // 1. Проверка владения проектом
  const ownerProjects = await kv.get(`projects:${userId}`);
  if (ownerProjects.find(p => p.id === projectId)) {
    return 'owner';
  }
  
  // 2. Проверка участия в shared проекте
  const sharedProjects = await kv.get(`shared_projects:${userId}`);
  const ref = sharedProjects.find(r => r.projectId === projectId);
  if (ref) {
    return ref.role; // collaborator, member, viewer
  }
  
  return null; // Нет доступа
}
```

#### canViewTask(userId, task)

```typescript
async function canViewTask(userId: string, task: any): Promise<boolean> {
  // Личные задачи
  if (!task.projectId) {
    return task.userId === userId;
  }
  
  // Проектные задачи
  const role = await getUserRoleInProject(userId, task.projectId);
  return role !== null; // Любая роль может просматривать
}
```

#### canEditTask(userId, task)

```typescript
async function canEditTask(userId: string, task: any): Promise<boolean> {
  // Личные задачи
  if (!task.projectId) {
    return task.userId === userId;
  }
  
  const role = await getUserRoleInProject(userId, task.projectId);
  
  // Owner и Collaborator - любые задачи
  if (role === 'owner' || role === 'collaborator') {
    return true;
  }
  
  // Member - только свои или назначенные
  if (role === 'member') {
    return task.userId === userId || task.assigneeId === userId;
  }
  
  // Viewer - не может редактировать
  return false;
}
```

#### canDeleteTask(userId, task)

```typescript
async function canDeleteTask(userId: string, task: any): Promise<boolean> {
  // Личные задачи
  if (!task.projectId) {
    return task.userId === userId;
  }
  
  const role = await getUserRoleInProject(userId, task.projectId);
  
  // Owner и Collaborator - любые задачи
  if (role === 'owner' || role === 'collaborator') {
    return true;
  }
  
  // Member - только свои или назначенные
  if (role === 'member') {
    return task.userId === userId || task.assigneeId === userId;
  }
  
  // Viewer - не может удалять
  return false;
}
```

### API Endpoints

#### POST /api/tasks/validate-permission

**Валидация одной задачи**

**Request:**
```json
{
  "taskId": "task-123",
  "action": "edit"  // "view", "edit", "delete"
}
```

**Response (Success):**
```json
{
  "taskId": "task-123",
  "action": "edit",
  "hasPermission": true,
  "task": {
    "id": "task-123",
    "title": "Implement feature X",
    "projectId": "proj-456",
    ...
  }
}
```

**Response (No Permission):**
```json
{
  "taskId": "task-123",
  "action": "edit",
  "hasPermission": false
}
```

**Response (Not Found):**
```json
{
  "error": "Task not found",
  "hasPermission": false
}
```

#### POST /api/tasks/check-permissions

**Пакетная проверка**

**Request:**
```json
{
  "taskIds": ["task-1", "task-2", "task-3"],
  "action": "delete"
}
```

**Response:**
```json
{
  "results": {
    "task-1": true,
    "task-2": false,
    "task-3": true
  }
}
```

### Использование в Клиенте

**Единичная проверка:**
```typescript
async function validateTaskPermission(
  taskId: string, 
  action: 'view' | 'edit' | 'delete'
): Promise<boolean> {
  const token = await getAuthToken();
  
  const response = await fetch(`${API_BASE_URL}/api/tasks/validate-permission`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ taskId, action }),
  });
  
  const data = await response.json();
  return data.hasPermission;
}

// Использование
const canEdit = await validateTaskPermission('task-123', 'edit');
if (canEdit) {
  // Показать форму редактирования
} else {
  toast.error('У вас нет прав на редактирование этой задачи');
}
```

**Пакетная проверка:**
```typescript
async function checkBatchPermissions(
  taskIds: string[],
  action: 'view' | 'edit' | 'delete'
): Promise<Record<string, boolean>> {
  const token = await getAuthToken();
  
  const response = await fetch(`${API_BASE_URL}/api/tasks/check-permissions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ taskIds, action }),
  });
  
  const data = await response.json();
  return data.results;
}

// Использование - фильтрация задач
const taskIds = tasks.map(t => t.id);
const permissions = await checkBatchPermissions(taskIds, 'delete');

const deletableTasks = tasks.filter(t => permissions[t.id]);
```

### Матрица Прав

| Роль | View | Edit Any | Edit Own | Delete Any | Delete Own |
|------|------|----------|----------|------------|------------|
| **Owner** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Collaborator** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Member** | ✅ | ❌ | ✅ | ❌ | ✅ |
| **Viewer** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **None** | ❌ | ❌ | ❌ | ❌ | ❌ |

*Own = созданные пользователем или назначенные на него

### Двойная Валидация

**Уровень 1: Клиент (UI/UX)**
```typescript
// src/contexts/app-context.tsx
const canDeleteTask = React.useCallback((task: Task): boolean => {
  if (!currentUser) return false;
  
  if (!task.projectId) {
    return task.userId === currentUser.id;
  }
  
  const role = getUserRoleInProject(task.projectId);
  
  if (role === 'owner' || role === 'collaborator') {
    return true;
  }
  
  if (role === 'member') {
    return task.userId === currentUser.id || task.assigneeId === currentUser.id;
  }
  
  return false;
}, [currentUser, getUserRoleInProject]);
```

**Уровень 2: Сервер (Безопасность)**
```typescript
// src/server/index.ts
async function canDeleteTask(userId: string, task: any): Promise<boolean> {
  if (!task.projectId) {
    return task.userId === userId;
  }
  
  const role = await getUserRoleInProject(userId, task.projectId);
  
  if (role === 'owner' || role === 'collaborator') {
    return true;
  }
  
  if (role === 'member') {
    return task.userId === userId || task.assigneeId === userId;
  }
  
  return false;
}
```

**Преимущества:**
- ✅ Клиент: быстрая проверка, лучший UX
- ✅ Сервер: надежная защита, нельзя обойти
- ✅ Логика синхронизирована
- ✅ Защита от подделки запросов

## Тестирование

### Email Сервис

**Проверка конфигурации:**
```bash
# Запустить сервер
npm run dev:server

# Проверить логи
✅ Email service initialized
```

**Тест отправки:**
1. Создать проект
2. Отправить приглашение
3. Проверить консоль сервера:
   ```
   ✅ Email sent: <message-id>
   ```
4. Проверить почтовый ящик получателя

### Страница Приглашения

**Тест валидного приглашения:**
1. Скопировать ссылку из email
2. Открыть в браузере
3. Должна загрузиться страница с деталями
4. Проверить отображение роли и проекта

**Тест истекшего приглашения:**
1. Изменить `expiresAt` на прошлую дату в БД
2. Открыть ссылку
3. Должно показать "Приглашение истекло"

**Тест несуществующего ID:**
1. Открыть `/invite/invalid-id-12345`
2. Должно показать "Приглашение не найдено"

### Серверная Валидация

**Тест Owner:**
```bash
curl -X POST http://localhost:3001/api/tasks/validate-permission \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"taskId":"task-1","action":"delete"}'

# Ожидается: hasPermission: true
```

**Тест Viewer:**
```bash
curl -X POST http://localhost:3001/api/tasks/validate-permission \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VIEWER_TOKEN" \
  -d '{"taskId":"task-1","action":"delete"}'

# Ожидается: hasPermission: false
```

**Тест пакетной проверки:**
```bash
curl -X POST http://localhost:3001/api/tasks/check-permissions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"taskIds":["task-1","task-2","task-3"],"action":"edit"}'

# Ожидается: results object
```

## Устранение Неполадок

### Email не отправляется

**Проблема:** `⚠️ Email service not configured`

**Решение:**
1. Проверить переменные окружения
2. Убедиться, что EMAIL_HOST, EMAIL_USER, EMAIL_PASSWORD заданы
3. Для Gmail: использовать App Password, а не основной пароль
4. Проверить firewall/антивирус

**Проблема:** `❌ Failed to send email: Connection timeout`

**Решение:**
1. Проверить EMAIL_PORT (587 для TLS, 465 для SSL)
2. Проверить EMAIL_SECURE (false для 587, true для 465)
3. Проверить сетевое подключение
4. Попробовать другой SMTP сервер

### Страница приглашения не загружается

**Проблема:** "404 Not Found" при открытии /invite/{id}

**Решение:**
1. Убедиться, что сервер запущен
2. Проверить APP_URL в .env
3. Проверить роутинг в App.tsx
4. Очистить кэш браузера

**Проблема:** "Invitation not found" для валидного ID

**Решение:**
1. Проверить, что приглашение есть в `pending_invitations` в KV
2. Проверить срок действия
3. Проверить статус (должен быть "pending")

### Валидация прав не работает

**Проблема:** Ошибка 401 Unauthorized

**Решение:**
1. Проверить, что токен передается в заголовке
2. Проверить срок действия токена
3. Перелогиниться

**Проблема:** hasPermission: false для Owner

**Решение:**
1. Проверить, что userId совпадает в токене и проекте
2. Проверить, что проект есть в `projects:userId`
3. Проверить логи сервера на ошибки

## Заключение

Все три функции успешно реализованы и протестированы:

✅ **Email-сервис** - автоматические красивые уведомления
✅ **Страница приглашений** - удобный веб-интерфейс
✅ **Серверная валидация** - надежная защита данных

Система готова к использованию в production! 🚀

## Дополнительные Ресурсы

- **Nodemailer Docs:** https://nodemailer.com/
- **SMTP Настройка Gmail:** https://support.google.com/mail/answer/185833
- **JWT Docs:** https://jwt.io/
- **Express Middleware:** https://expressjs.com/en/guide/using-middleware.html
