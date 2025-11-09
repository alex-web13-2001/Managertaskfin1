# 🚀 Руководство по развертыванию T24

Полная инструкция по развертыванию приложения T24 Task Manager.

---

## 📋 Содержание

1. [Подготовка](#подготовка)
2. [Настройка Supabase](#настройка-supabase)
3. [Деплой Edge Functions](#деплой-edge-functions)
4. [Деплой Frontend](#деплой-frontend)
5. [Проверка работоспособности](#проверка-работоспособности)
6. [Troubleshooting](#troubleshooting)

---

## 1️⃣ Подготовка

### Требования

- Node.js 18+
- npm или yarn
- Git
- Аккаунт Supabase
- Аккаунт Vercel/Netlify (для frontend)

### Клонирование репозитория

```bash
git clone https://github.com/yourusername/t24-task-manager.git
cd t24-task-manager
npm install
```

---

## 2️⃣ Настройка Supabase

### Шаг 1: Создание проекта

1. Перейдите на [supabase.com](https://supabase.com)
2. Нажмите "New Project"
3. Заполните:
   - **Name**: T24 Task Manager
   - **Database Password**: создайте надежный пароль
   - **Region**: выберите ближайший регион
4. Нажмите "Create new project"
5. Дождитесь завершения (2-3 минуты)

### Шаг 2: Настройка базы данных

1. Откройте SQL Editor в вашем проекте
2. Скопируйте и выполните следующий SQL:

```sql
-- Создание таблицы KV Store
CREATE TABLE IF NOT EXISTS kv_store_d9879966 (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индекс для быстрого поиска по префиксу
CREATE INDEX IF NOT EXISTS idx_kv_store_key_prefix 
ON kv_store_d9879966 (key text_pattern_ops);

-- Включаем Row Level Security
ALTER TABLE kv_store_d9879966 ENABLE ROW LEVEL SECURITY;

-- Политика доступа для Service Role
CREATE POLICY "Service role has full access" 
ON kv_store_d9879966 
FOR ALL 
USING (true) 
WITH CHECK (true);
```

### Шаг 3: Настройка Authentication

1. Перейдите в **Authentication** → **Providers**
2. Убедитесь, что **Email** провайдер включен
3. Перейдите в **Authentication** → **Settings**
4. В секции **Auth Confirmation**:
   - Отключите "Enable email confirmations" (для прототипа)
5. В секции **Site URL**:
   - Development: `http://localhost:5173`
   - Production: `https://your-app.vercel.app`
6. В секции **Redirect URLs** добавьте:
   - `http://localhost:5173/**`
   - `https://your-app.vercel.app/**`

### Шаг 4: Настройка Storage

Storage buckets создаются автоматически при первом запуске сервера, но вы можете создать их вручную:

1. Перейдите в **Storage**
2. Создайте бакет `make-d9879966-task-attachments`:
   - Public: **No** (приватный)
   - File size limit: 50MB
3. Создайте бакет `make-d9879966-avatars`:
   - Public: **No** (приватный)
   - File size limit: 5MB

### Шаг 5: Получение ключей API

1. Перейдите в **Settings** → **API**
2. Скопируйте следующие значения:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGc...`
   - **service_role key**: `eyJhbGc...` (держите в секрете!)

---

## 3️⃣ Деплой Edge Functions

### Шаг 1: Установка Supabase CLI

```bash
# macOS/Linux (с Homebrew)
brew install supabase/tap/supabase

# Windows (с Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Или через npm
npm install -g supabase
```

### Шаг 2: Логин в Supabase

```bash
supabase login
```

Откроется браузер для авторизации.

### Шаг 3: Связывание проекта

```bash
supabase link --project-ref your-project-ref
```

**Project ref** можно найти в настройках проекта (Settings → General → Reference ID)

### Шаг 4: Настройка переменных окружения для функций

```bash
# URL вашего проекта
supabase secrets set SUPABASE_URL=https://xxxxx.supabase.co

# Service Role Key (из шага 2.5)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### Шаг 5: Деплой функций

```bash
supabase functions deploy server
```

Должно появиться сообщение:
```
✓ Deployed function server
URL: https://xxxxx.supabase.co/functions/v1/server
```

### Шаг 6: Проверка работы функций

```bash
# Проверка health endpoint
curl https://xxxxx.supabase.co/functions/v1/make-server-d9879966/health
```

Должно вернуть: `{"status":"ok"}`

---

## 4️⃣ Деплой Frontend

### Вариант A: Vercel (рекомендуется)

#### 1. Установка Vercel CLI

```bash
npm i -g vercel
```

#### 2. Логин

```bash
vercel login
```

#### 3. Первый деплой

```bash
vercel
```

Следуйте инструкциям:
- Set up and deploy? **Y**
- Which scope? Выберите ваш аккаунт
- Link to existing project? **N**
- Project name? **t24-task-manager**
- In which directory is your code located? **./**
- Want to modify settings? **N**

#### 4. Настройка переменных окружения

В Vercel Dashboard:

1. Откройте проект **t24-task-manager**
2. Перейдите в **Settings** → **Environment Variables**
3. Добавьте:
   - `VITE_SUPABASE_URL` = `https://xxxxx.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = ваш anon key

#### 5. Production деплой

```bash
vercel --prod
```

Ваше приложение будет доступно по адресу: `https://t24-task-manager.vercel.app`

### Вариант B: Netlify

#### 1. Установка Netlify CLI

```bash
npm i -g netlify-cli
```

#### 2. Логин

```bash
netlify login
```

#### 3. Инициализация

```bash
netlify init
```

Следуйте инструкциям:
- Create & configure a new site
- Team: выберите ваш team
- Site name: **t24-task-manager**
- Build command: **npm run build**
- Publish directory: **dist**

#### 4. Настройка переменных окружения

```bash
netlify env:set VITE_SUPABASE_URL "https://xxxxx.supabase.co"
netlify env:set VITE_SUPABASE_ANON_KEY "your-anon-key"
```

#### 5. Production деплой

```bash
netlify deploy --prod
```

---

## 5️⃣ Проверка работоспособности

### Чек-лист после деплоя

- [ ] **Frontend загружается** - откройте ваш production URL
- [ ] **Регистрация работает** - создайте новый аккаунт
- [ ] **Логин работает** - войдите с созданными credentials
- [ ] **Демо данные создаются** - проверьте наличие категорий и проектов
- [ ] **Создание задачи работает** - создайте новую задачу
- [ ] **Kanban доска работает** - перетащите задачу между колонками
- [ ] **Табличный вид работает** - переключитесь на табличный вид
- [ ] **Загрузка файлов работает** - прикрепите файл к задаче
- [ ] **Загрузка аватара работает** - загрузите аватар в профиле
- [ ] **Приглашения работают** - пригласите участника в проект

### Тестовые данные

После регистрации должны автоматически создаться:

**Категории:**
- 🔧 Разработка (синий)
- 🎨 Дизайн (розовый)
- 📢 Маркетинг (зеленый)

**Проекты:**
- Редизайн корпоративного сайта
- Разработка мобильного приложения

**Задачи:**
- Несколько задач с разными статусами и приоритетами

---

## 6️⃣ Troubleshooting

### Проблема: "Failed to fetch" при запросах к API

**Решение:**
1. Проверьте CORS настройки в Edge Function
2. Убедитесь, что функция задеплоена: `supabase functions list`
3. Проверьте логи: `supabase functions logs server`

### Проблема: Ошибка аутентификации

**Решение:**
1. Проверьте переменные окружения:
   ```bash
   supabase secrets list
   ```
2. Убедитесь, что Site URL настроен корректно в Supabase Auth Settings
3. Проверьте срок действия токенов (по умолчанию 1 час)

### Проблема: Storage ошибки при загрузке файлов

**Решение:**
1. Убедитесь, что buckets созданы:
   ```bash
   supabase storage list-buckets
   ```
2. Если нет, сервер создаст их автоматически при первом запросе
3. Проверьте права доступа к Storage в Supabase Dashboard

### Проблема: Данные не синхронизируются

**Решение:**
1. Откройте DevTools → Console
2. Проверьте наличие ошибок в запросах
3. Polling работает каждые 3 секунды - подождите немного
4. Проверьте Network tab - должны быть регулярные запросы к `/tasks`, `/projects`, `/custom-columns`

### Проблема: Edge Function не деплоится

**Решение:**
```bash
# Проверьте версию CLI
supabase --version

# Обновите до последней версии
npm update -g supabase

# Повторите деплой с флагом verbose
supabase functions deploy server --debug
```

### Проблема: "Module not found" в Edge Function

**Решение:**
- Edge Functions используют Deno, не Node.js
- Используйте импорты с префиксами: `npm:`, `jsr:`, `node:`
- Пример: `import { Hono } from 'npm:hono'`

### Получение помощи

**Логи Edge Functions:**
```bash
supabase functions logs server
```

**Realtime логи:**
```bash
supabase functions logs server --tail
```

**Проверка статуса Supabase:**
- [status.supabase.com](https://status.supabase.com)

---

## 🔄 Обновление деплоя

### Frontend

```bash
# Vercel
vercel --prod

# Netlify
netlify deploy --prod
```

### Backend (Edge Functions)

```bash
supabase functions deploy server
```

---

## 📊 Мониторинг

### Vercel Analytics

1. Перейдите в Vercel Dashboard
2. Откройте проект
3. Перейдите в **Analytics**
4. Включите **Web Analytics**

### Supabase Dashboard

1. **Database** → **Database** - использование базы данных
2. **Storage** → используемое пространство
3. **Auth** → количество пользователей
4. **Edge Functions** → количество invocations и ошибок

---

## 🎉 Готово!

Ваше приложение T24 Task Manager успешно развернуто и готово к использованию!

**Production URLs:**
- Frontend: `https://your-app.vercel.app`
- Backend: `https://xxxxx.supabase.co/functions/v1/make-server-d9879966`
- Supabase Dashboard: `https://app.supabase.com/project/xxxxx`

Не забудьте:
- ⭐ Поставить звезду на GitHub
- 📝 Обновить README с вашими production URLs
- 🔐 Сохранить все ключи в безопасном месте
- 📧 Настроить email notifications (опционально)

---

**Нужна помощь?** Создайте [issue на GitHub](https://github.com/yourusername/t24-task-manager/issues)
