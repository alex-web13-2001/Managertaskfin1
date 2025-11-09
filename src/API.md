# 📡 T24 API Documentation

Полная документация API для T24 Task Manager.

**Base URL:** `https://{projectId}.supabase.co/functions/v1/make-server-d9879966`

---

## 🔐 Аутентификация

Большинство endpoints требуют авторизации через JWT токен в заголовке:

```http
Authorization: Bearer {access_token}
```

Для публичных endpoints (signup, login) используйте anon key:

```http
Authorization: Bearer {public_anon_key}
```

---

## 📚 Endpoints

### Health Check

#### `GET /health`

Проверка работоспособности сервера.

**Auth:** Не требуется

**Response:**
```json
{
  "status": "ok"
}
```

---

## 👤 Authentication

### Регистрация

#### `POST /signup`

Создание нового пользователя.

**Auth:** Public (anon key)

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "Иван Иванов"
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "Иван Иванов"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "User already exists"
}
```

---

### Получение профиля

#### `GET /profile`

Получить информацию о текущем пользователе.

**Auth:** Required (access token)

**Response (200):**
```json
{
  "success": true,
  "profile": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "Иван Иванов",
    "avatar_url": "https://...supabase.co/.../avatar.jpg"
  }
}
```

---

### Обновление профиля

#### `PUT /profile`

Обновить данные пользователя.

**Auth:** Required

**Request Body:**
```json
{
  "name": "Пётр Петров",
  "email": "new@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "profile": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "new@example.com",
    "name": "Пётр Петров"
  }
}
```

---

## 📋 Tasks

### Получить все задачи

#### `GET /tasks`

Получить все задачи пользователя (личные + из проектов с учетом прав доступа).

**Auth:** Required

**Query Parameters:**
- `project_id` (optional) - фильтр по проекту
- `status` (optional) - фильтр по статусу
- `priority` (optional) - фильтр по приоритету
- `assignee_id` (optional) - фильтр по исполнителю

**Response (200):**
```json
{
  "success": true,
  "tasks": [
    {
      "id": "task-uuid-1",
      "title": "Создать макеты главной страницы",
      "description": "Разработать 3 варианта дизайна",
      "status": "в работе",
      "priority": "высокий",
      "project_id": "project-uuid-1",
      "assignee_id": "user-uuid-1",
      "created_by": "user-uuid-1",
      "due_date": "2025-11-15",
      "category_id": "category-uuid-1",
      "attachments": [
        {
          "id": "attach-uuid-1",
          "name": "mockup.fig",
          "url": "https://...supabase.co/.../mockup.fig",
          "size": 1024000,
          "uploaded_at": "2025-11-07T10:00:00Z"
        }
      ],
      "comments": [
        {
          "id": "comment-uuid-1",
          "text": "Отличная работа!",
          "created_by": "user-uuid-2",
          "created_at": "2025-11-07T11:00:00Z"
        }
      ],
      "created_at": "2025-11-01T10:00:00Z",
      "updated_at": "2025-11-07T10:00:00Z"
    }
  ]
}
```

---

### Создать задачу

#### `POST /tasks`

Создать новую задачу.

**Auth:** Required

**Request Body:**
```json
{
  "title": "Новая задача",
  "description": "Описание задачи",
  "status": "к выполнению",
  "priority": "средний",
  "project_id": "project-uuid-1",
  "assignee_id": "user-uuid-1",
  "due_date": "2025-11-20",
  "category_id": "category-uuid-1"
}
```

**Поля:**
- `title` (required) - название задачи
- `description` (optional) - описание
- `status` (optional, default: "к выполнению") - статус
- `priority` (optional, default: "средний") - приоритет
- `project_id` (optional) - ID проекта (если null - личная задача)
- `assignee_id` (optional) - ID исполнителя
- `due_date` (optional) - срок выполнения (ISO date)
- `category_id` (optional) - ID категории

**Response (200):**
```json
{
  "success": true,
  "task": {
    "id": "new-task-uuid",
    "title": "Новая задача",
    ...
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Title is required"
}
```

**Error Response (403):**
```json
{
  "success": false,
  "error": "Insufficient permissions"
}
```

---

### Обновить задачу

#### `PUT /tasks/:id`

Обновить существующую задачу.

**Auth:** Required

**URL Parameters:**
- `id` - ID задачи

**Request Body:**
```json
{
  "title": "Обновленное название",
  "status": "выполнено",
  "priority": "высокий"
}
```

**Response (200):**
```json
{
  "success": true,
  "task": {
    "id": "task-uuid-1",
    "title": "Обновленное название",
    ...
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "Task not found"
}
```

---

### Удалить задачу

#### `DELETE /tasks/:id`

Удалить задачу.

**Auth:** Required

**URL Parameters:**
- `id` - ID задачи

**Response (200):**
```json
{
  "success": true
}
```

---

### Добавить комментарий

#### `POST /tasks/:id/comments`

Добавить комментарий к задаче.

**Auth:** Required

**Request Body:**
```json
{
  "text": "Отличная работа!"
}
```

**Response (200):**
```json
{
  "success": true,
  "comment": {
    "id": "comment-uuid",
    "text": "Отличная работа!",
    "created_by": "user-uuid-1",
    "created_at": "2025-11-07T12:00:00Z"
  }
}
```

---

## 📁 Projects

### Получить все проекты

#### `GET /projects`

Получить все проекты пользователя.

**Auth:** Required

**Response (200):**
```json
{
  "success": true,
  "projects": [
    {
      "id": "project-uuid-1",
      "name": "Редизайн сайта",
      "description": "Полный редизайн корпоративного сайта",
      "color": "purple",
      "owner_id": "user-uuid-1",
      "members": [
        {
          "user_id": "user-uuid-1",
          "email": "user@example.com",
          "name": "Иван Иванов",
          "role": "owner"
        },
        {
          "user_id": "user-uuid-2",
          "email": "designer@example.com",
          "name": "Мария Дизайнер",
          "role": "collaborator"
        }
      ],
      "task_count": 12,
      "archived": false,
      "created_at": "2025-11-01T10:00:00Z",
      "updated_at": "2025-11-07T10:00:00Z"
    }
  ]
}
```

---

### Создать проект

#### `POST /projects`

Создать новый проект.

**Auth:** Required

**Request Body:**
```json
{
  "name": "Новый проект",
  "description": "Описание проекта",
  "color": "purple"
}
```

**Поля:**
- `name` (required) - название проекта
- `description` (optional) - описание
- `color` (optional, default: "purple") - цвет (purple, green, orange, pink)

**Response (200):**
```json
{
  "success": true,
  "project": {
    "id": "new-project-uuid",
    "name": "Новый проект",
    ...
  }
}
```

---

### Обновить проект

#### `PUT /projects/:id`

Обновить проект.

**Auth:** Required (owner или collaborator)

**URL Parameters:**
- `id` - ID проекта

**Request Body:**
```json
{
  "name": "Обновленное название",
  "description": "Новое описание",
  "color": "green"
}
```

**Response (200):**
```json
{
  "success": true,
  "project": {
    "id": "project-uuid-1",
    ...
  }
}
```

**Error Response (403):**
```json
{
  "success": false,
  "error": "Only owner and collaborators can edit projects"
}
```

---

### Удалить проект

#### `DELETE /projects/:id`

Удалить проект.

**Auth:** Required (только owner)

**URL Parameters:**
- `id` - ID проекта

**Response (200):**
```json
{
  "success": true
}
```

**Error Response (403):**
```json
{
  "success": false,
  "error": "Only the project owner can delete it"
}
```

---

### Архивировать проект

#### `POST /projects/:id/archive`

Переместить проект в архив.

**Auth:** Required (owner или collaborator)

**Response (200):**
```json
{
  "success": true,
  "project": {
    "id": "project-uuid-1",
    "archived": true,
    ...
  }
}
```

---

### Разархивировать проект

#### `POST /projects/:id/unarchive`

Восстановить проект из архива.

**Auth:** Required (owner или collaborator)

**Response (200):**
```json
{
  "success": true,
  "project": {
    "id": "project-uuid-1",
    "archived": false,
    ...
  }
}
```

---

## 🎨 Custom Columns

### Получить кастомные колонки

#### `GET /custom-columns/:projectId`

Получить настройки Kanban колонок для проекта.

**Auth:** Required

**URL Parameters:**
- `projectId` - ID проекта

**Response (200):**
```json
{
  "success": true,
  "columns": [
    {
      "id": "backlog",
      "name": "Бэклог",
      "color": "#9333ea"
    },
    {
      "id": "in_progress",
      "name": "В работе",
      "color": "#3b82f6"
    },
    {
      "id": "review",
      "name": "На проверке",
      "color": "#f59e0b"
    },
    {
      "id": "done",
      "name": "Готово",
      "color": "#10b981"
    }
  ]
}
```

---

### Сохранить кастомные колонки

#### `POST /custom-columns/:projectId`

Сохранить настройки Kanban колонок.

**Auth:** Required (owner или collaborator)

**Request Body:**
```json
{
  "columns": [
    {
      "id": "backlog",
      "name": "Бэклог",
      "color": "#9333ea"
    },
    {
      "id": "in_progress",
      "name": "В работе",
      "color": "#3b82f6"
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "columns": [...]
}
```

---

## 👥 Invitations

### Пригласить участника

#### `POST /invitations`

Пригласить пользователя в проект.

**Auth:** Required (только owner)

**Request Body:**
```json
{
  "project_id": "project-uuid-1",
  "email": "newmember@example.com",
  "role": "member"
}
```

**Роли:**
- `owner` - владелец (только один)
- `collaborator` - участник с правами
- `member` - участник
- `viewer` - наблюдатель

**Response (200):**
```json
{
  "success": true,
  "invitation": {
    "id": "invitation-uuid",
    "project_id": "project-uuid-1",
    "email": "newmember@example.com",
    "role": "member",
    "status": "pending",
    "created_at": "2025-11-07T10:00:00Z"
  }
}
```

**Error Response (403):**
```json
{
  "success": false,
  "error": "Only project owner can invite members"
}
```

---

### Получить приглашения

#### `GET /invitations`

Получить все приглашения текущего пользователя.

**Auth:** Required

**Response (200):**
```json
{
  "success": true,
  "invitations": [
    {
      "id": "invitation-uuid",
      "project": {
        "id": "project-uuid-1",
        "name": "Редизайн сайта"
      },
      "role": "member",
      "invited_by": {
        "id": "user-uuid-1",
        "name": "Иван Иванов"
      },
      "status": "pending",
      "created_at": "2025-11-07T10:00:00Z"
    }
  ]
}
```

---

### Принять приглашение

#### `POST /invitations/:id/accept`

Принять приглашение в проект.

**Auth:** Required

**URL Parameters:**
- `id` - ID приглашения

**Response (200):**
```json
{
  "success": true,
  "invitation": {
    "id": "invitation-uuid",
    "status": "accepted",
    ...
  }
}
```

---

### Отклонить приглашение

#### `POST /invitations/:id/decline`

Отклонить приглашение в проект.

**Auth:** Required

**Response (200):**
```json
{
  "success": true,
  "invitation": {
    "id": "invitation-uuid",
    "status": "declined",
    ...
  }
}
```

---

### Удалить участника

#### `DELETE /projects/:projectId/members/:userId`

Удалить участника из проекта.

**Auth:** Required (только owner)

**URL Parameters:**
- `projectId` - ID проекта
- `userId` - ID пользователя для удаления

**Response (200):**
```json
{
  "success": true
}
```

---

## 🗂 Categories

### Получить категории

#### `GET /categories`

Получить все категории пользователя.

**Auth:** Required

**Response (200):**
```json
{
  "success": true,
  "categories": [
    {
      "id": "category-uuid-1",
      "name": "Разработка",
      "color": "#3b82f6",
      "icon": "Code",
      "user_id": "user-uuid-1",
      "created_at": "2025-11-01T10:00:00Z"
    }
  ]
}
```

---

### Создать категорию

#### `POST /categories`

Создать новую категорию.

**Auth:** Required

**Request Body:**
```json
{
  "name": "Дизайн",
  "color": "#ec4899",
  "icon": "Palette"
}
```

**Response (200):**
```json
{
  "success": true,
  "category": {
    "id": "new-category-uuid",
    "name": "Дизайн",
    "color": "#ec4899",
    "icon": "Palette",
    ...
  }
}
```

---

### Обновить категорию

#### `PUT /categories/:id`

Обновить категорию.

**Auth:** Required

**Response (200):**
```json
{
  "success": true,
  "category": {...}
}
```

---

### Удалить категорию

#### `DELETE /categories/:id`

Удалить категорию.

**Auth:** Required

**Response (200):**
```json
{
  "success": true
}
```

---

## 📎 File Upload

### Загрузить вложение

#### `POST /upload-attachment`

Загрузить файл как вложение к задаче.

**Auth:** Required

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file` - файл для загрузки
- `taskId` - ID задачи

**Response (200):**
```json
{
  "success": true,
  "attachment": {
    "id": "attachment-uuid",
    "name": "document.pdf",
    "url": "https://...supabase.co/.../document.pdf",
    "size": 1024000,
    "uploaded_at": "2025-11-07T10:00:00Z"
  }
}
```

**Ограничения:**
- Максимальный размер файла: 50MB
- Разрешенные типы: все

---

### Загрузить аватар

#### `POST /upload-avatar`

Загрузить аватар пользователя.

**Auth:** Required

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file` - изображение

**Response (200):**
```json
{
  "success": true,
  "avatar_url": "https://...supabase.co/.../avatar.jpg"
}
```

**Ограничения:**
- Максимальный размер: 5MB
- Разрешенные типы: image/jpeg, image/png, image/webp

---

## ❌ Error Responses

Все ошибки возвращаются в едином формате:

```json
{
  "success": false,
  "error": "Error message"
}
```

### HTTP Status Codes

- `200` - Success
- `400` - Bad Request (некорректные данные)
- `401` - Unauthorized (не авторизован)
- `403` - Forbidden (недостаточно прав)
- `404` - Not Found (ресурс не найден)
- `500` - Internal Server Error

---

## 🔄 Rate Limits

Текущие лимиты Supabase (бесплатный план):

- **Edge Functions:** 500,000 invocations/месяц
- **Storage:** 1GB
- **Database:** 500MB
- **Auth:** Unlimited users

---

## 📝 Примеры использования

### Создание задачи с вложением

```javascript
// 1. Создать задачу
const response = await fetch(`${baseUrl}/tasks`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Новая задача',
    description: 'С файлом',
    status: 'к выполнению'
  })
});

const { task } = await response.json();

// 2. Загрузить вложение
const formData = new FormData();
formData.append('file', file);
formData.append('taskId', task.id);

await fetch(`${baseUrl}/upload-attachment`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  },
  body: formData
});
```

### Приглашение участника

```javascript
// 1. Отправить приглашение
const response = await fetch(`${baseUrl}/invitations`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    project_id: 'project-uuid',
    email: 'member@example.com',
    role: 'member'
  })
});

// 2. Участник принимает (с его токеном)
await fetch(`${baseUrl}/invitations/${invitationId}/accept`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${memberAccessToken}`
  }
});
```

---

## 🔗 Useful Links

- [Supabase Docs](https://supabase.com/docs)
- [Hono Docs](https://hono.dev)
- [GitHub Repository](https://github.com/yourusername/t24-task-manager)

---

**Последнее обновление:** 7 ноября 2025
