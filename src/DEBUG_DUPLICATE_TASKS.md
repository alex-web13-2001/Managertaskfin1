# Отладка дублирования задач - Скрипты для консоли

## Проверка текущего состояния

### 1. Проверить количество дубликатов

```javascript
// В консоли браузера (F12):
const token = localStorage.getItem('access_token');
const projectId = 'uqkxalfunqgshqiuimkf'; // Замените на ваш projectId

fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d9879966/tasks/cleanup-duplicates`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }
}).then(r => r.json()).then(data => {
  console.log('📊 Результат очистки:', data);
  if (data.totalCleaned > 0) {
    console.log('✅ Удалено дубликатов:', data.totalCleaned);
    console.log('📁 Затронуто проектов:', data.cleanedProjects);
  } else {
    console.log('✅ Дубликаты не найдены - всё в порядке!');
  }
});
```

### 2. Проверить конкретную задачу

```javascript
// Найти задачу по названию
const tasks = JSON.parse(sessionStorage.getItem('tasks') || '[]');
const taskName = 'Попробуйте перетащить задачу'; // Замените на название задачи

const task = tasks.find(t => t.title.includes(taskName));
console.log('🔍 Найденная задача:', task);
console.log('  ID:', task?.id);
console.log('  Status:', task?.status);
console.log('  ProjectId:', task?.projectId || 'личная задача');
console.log('  UpdatedAt:', task?.updatedAt);
```

### 3. Мониторинг обновлений в реальном времени

```javascript
// Отслеживать все обновления задач
let originalFetch = window.fetch;
window.fetch = function(...args) {
  if (args[0].includes('/tasks/')) {
    console.log('🌐 API запрос:', args[0], args[1]?.method || 'GET');
  }
  return originalFetch.apply(this, args).then(response => {
    if (args[0].includes('/tasks/')) {
      response.clone().json().then(data => {
        console.log('📥 API ответ:', data);
      });
    }
    return response;
  });
};
console.log('✅ Мониторинг API включен');
```

### 4. Проверить структуру ключей в базе

Это можно сделать только на сервере, но вы можете проверить логи при загрузке:

```javascript
// Проверить логи в консоли при обновлении страницы
// Ищите строки типа:
// ✅ Задачи загружены из базы: X
// ⚠️ Removed N duplicate tasks
```

## Тестирование DnD

### Подготовка:

```javascript
// 1. Включить подробное логирование
localStorage.setItem('debug_dnd', 'true');

// 2. Перезагрузить страницу
location.reload();
```

### Тест:

1. Откройте консоль (F12)
2. Перетащите задачу между колонками
3. Проверьте логи:

```
🔄 Updating task {taskId} with key: task:project:{projectId}:{taskId}
✅ Task updated successfully
✅ Задачи загружены из базы: X
```

### Проверка после polling:

```javascript
// Проверить что задача осталась в новом статусе после 3-5 секунд
setTimeout(() => {
  const tasks = JSON.parse(sessionStorage.getItem('tasks') || '[]');
  const task = tasks.find(t => t.id === 'YOUR_TASK_ID'); // Замените на ID задачи
  console.log('📋 Статус задачи через 5 секунд:', task?.status);
}, 5000);
```

## Симуляция проблемы (для отладки)

### Создать тестовый дубликат:

```javascript
// ⚠️ ТОЛЬКО ДЛЯ ОТЛАДКИ - создаёт искусственный дубликат
const token = localStorage.getItem('access_token');
const projectId = 'uqkxalfunqgshqiuimkf';

// Создать задачу в проекте
const testProjectId = 'YOUR_PROJECT_ID'; // Замените на ID проекта
fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d9879966/tasks`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    title: 'Тестовая задача для проверки дубликатов',
    description: 'Эта задача создана для тестирования',
    status: 'todo',
    priority: 'medium',
    projectId: testProjectId,
  })
}).then(r => r.json()).then(data => {
  console.log('✅ Создана тестовая задача:', data.task);
  console.log('📝 ID:', data.task.id);
  console.log('🔑 Ключ должен быть: task:project:' + testProjectId + ':' + data.task.id);
});
```

## Полная диагностика

```javascript
// Комплексная проверка системы
async function fullDiagnostics() {
  const token = localStorage.getItem('access_token');
  const projectId = 'uqkxalfunqgshqiuimkf';
  
  console.log('🔍 ===== ПОЛНАЯ ДИАГНОСТИКА =====');
  
  // 1. Проверить авторизацию
  console.log('1️⃣ Токен авторизации:', token ? '✅ Есть' : '❌ Нет');
  
  // 2. Загрузить задачи
  console.log('2️⃣ Загрузка задач...');
  const tasksResponse = await fetch(
    `https://${projectId}.supabase.co/functions/v1/make-server-d9879966/tasks`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  const tasksData = await tasksResponse.json();
  console.log('  Всего задач:', tasksData.tasks?.length || 0);
  
  const personalTasks = tasksData.tasks?.filter(t => !t.projectId) || [];
  const projectTasks = tasksData.tasks?.filter(t => t.projectId) || [];
  console.log('  Личные:', personalTasks.length);
  console.log('  Проектные:', projectTasks.length);
  
  // 3. Группировать по проектам
  const byProject = {};
  projectTasks.forEach(t => {
    byProject[t.projectId] = (byProject[t.projectId] || 0) + 1;
  });
  console.log('  По проектам:', byProject);
  
  // 4. Проверить дубликаты
  console.log('3️⃣ Проверка дубликатов...');
  const cleanupResponse = await fetch(
    `https://${projectId}.supabase.co/functions/v1/make-server-d9879966/tasks/cleanup-duplicates`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      }
    }
  );
  const cleanupData = await cleanupResponse.json();
  console.log('  Результат:', cleanupData);
  
  // 5. Проверить ID задач на уникальность
  console.log('4️⃣ Проверка уникальности ID...');
  const ids = tasksData.tasks?.map(t => t.id) || [];
  const uniqueIds = new Set(ids);
  if (ids.length !== uniqueIds.size) {
    console.log('  ⚠️ Найдены дублирующиеся ID:', ids.length - uniqueIds.size);
  } else {
    console.log('  ✅ Все ID уникальны');
  }
  
  console.log('🏁 ===== ДИАГНОСТИКА ЗАВЕРШЕНА =====');
}

// Запустить
fullDiagnostics();
```

## Проверка после исправления

После запуска cleanup должно быть:

```
✅ Задачи загружены из базы: X
📊 Распределение задач:
  личные: Y
  проектные: Z
  поПроектам: {...}
```

И **НЕ** должно быть:
```
⚠️ Дубликаты задач удалены: X -> Y  ← это значит были дубликаты
⚠️ Removed N duplicate tasks          ← это тоже
```

## Мониторинг в продакшене

Для постоянного мониторинга можно добавить в localStorage:

```javascript
// Включить детальное логирование
localStorage.setItem('debug_mode', 'true');
localStorage.setItem('log_api_calls', 'true');
localStorage.setItem('log_state_updates', 'true');

// Отключить
localStorage.removeItem('debug_mode');
localStorage.removeItem('log_api_calls');
localStorage.removeItem('log_state_updates');
```

## Отключение polling (для тестирования)

```javascript
// Временно отключить polling чтобы увидеть чистое DnD без помех
localStorage.setItem('disable_polling', 'true');
location.reload();

// Включить обратно
localStorage.removeItem('disable_polling');
location.reload();
```
