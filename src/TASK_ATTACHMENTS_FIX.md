# Исправление загрузки вложений задач

## 🐛 Проблема

Картинки и файлы не сохранялись при создании/редактировании задач.

## 🔍 Причина

**Отсутствовали backend endpoints** для загрузки и удаления вложений задач:
- `POST /tasks/:id/attachments` - не существовал
- `DELETE /tasks/:id/attachments/:attachmentId` - не существовал

Frontend вызывал эти endpoints, но они возвращали 404.

## ✅ Решение

### 1. Добавлены backend endpoints (`/supabase/functions/server/index.tsx`)

#### POST /make-server-d9879966/tasks/:id/attachments

```typescript
app.post("/make-server-d9879966/tasks/:id/attachments", async (c) => {
  // Авторизация пользователя
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  
  // Получение файла из FormData
  const formData = await c.req.formData();
  const file = formData.get('file') as File;
  
  // Валидация размера (макс 10MB)
  if (file.size > 10 * 1024 * 1024) {
    return c.json({ error: 'File too large. Maximum size is 10MB' }, 400);
  }
  
  // Загрузка в Supabase Storage bucket 'make-d9879966-task-files'
  const fileName = `${user.id}/${taskId}/attachment-${Date.now()}.${fileExt}`;
  await supabase.storage.from(bucketName).upload(fileName, arrayBuffer);
  
  // Генерация signed URL (действителен 1 год)
  const { data: urlData } = await supabase.storage
    .from(bucketName)
    .createSignedUrl(fileName, 31536000);
  
  // Создание метаданных вложения
  const attachment = {
    id: `attachment-${Date.now()}`,
    name: file.name,
    size: file.size,
    type: file.type,
    url: urlData.signedUrl,
    path: fileName,
    uploadedAt: new Date().toISOString(),
    uploadedBy: user.id,
  };
  
  // Обновление задачи в KV store
  const updatedTask = {
    ...task,
    attachments: [...(task.attachments || []), attachment],
    updatedAt: new Date().toISOString(),
  };
  
  return c.json({ attachment });
});
```

**Особенности:**
- ✅ Файлы хранятся в приватном bucket `make-d9879966-task-files`
- ✅ Максимальный размер файла: 10MB
- ✅ Поддерживаются все типы файлов
- ✅ Signed URLs действительны 1 год
- ✅ Файлы организованы по пользователям и задачам: `{userId}/{taskId}/attachment-{timestamp}.{ext}`

#### DELETE /make-server-d9879966/tasks/:id/attachments/:attachmentId

```typescript
app.delete("/make-server-d9879966/tasks/:id/attachments/:attachmentId", async (c) => {
  // Получение задачи из KV store
  const task = await kv.get(`task:user:${user.id}:${taskId}`);
  
  // Поиск вложения
  const attachment = task.attachments?.find((a: any) => a.id === attachmentId);
  
  // Удаление из Supabase Storage
  await supabase.storage.from(bucketName).remove([attachment.path]);
  
  // Обновление метаданных задачи
  const updatedTask = {
    ...task,
    attachments: task.attachments.filter((a: any) => a.id !== attachmentId),
    updatedAt: new Date().toISOString(),
  };
  
  return c.json({ success: true });
});
```

**Особенности:**
- ✅ Удаляет файл из Storage
- ✅ Обновляет метаданные задачи
- ✅ Продолжает работу даже если файл уже удален из Storage

### 2. Улучшено логирование

#### Frontend (task-modal.tsx)

```typescript
// Upload pending files
if (pendingFiles.length > 0 && savedTask) {
  setIsUploadingFiles(true);
  console.log(`📎 Uploading ${pendingFiles.length} file(s) for task ${savedTask.id}`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const file of pendingFiles) {
    try {
      console.log(`⬆️ Uploading file: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
      await uploadTaskAttachment(savedTask.id, file);
      successCount++;
      console.log(`✅ File uploaded: ${file.name}`);
    } catch (uploadError: any) {
      failCount++;
      console.error(`❌ File upload error for ${file.name}:`, uploadError);
      toast.error(`Ошибка загрузки файла ${file.name}: ${uploadError.message}`);
    }
  }
  
  if (successCount > 0) toast.success(`Загружено файлов: ${successCount}`);
  if (failCount > 0) toast.warning(`Не удалось загрузить файлов: ${failCount}`);
  
  console.log(`📎 Upload complete: ${successCount} success, ${failCount} failed`);
}
```

**Улучшения:**
- ✅ Подробное логирование каждого этапа
- ✅ Подсчет успешных/неуспешных загрузок
- ✅ Уведомления для пользователя через toast
- ✅ Продолжение загрузки даже если один файл упал

#### API Layer (client.tsx)

```typescript
uploadAttachment: async (taskId: string, file: File) => {
  console.log(`📎 tasksAPI.uploadAttachment: Starting for task ${taskId}`);
  console.log(`⬆️ tasksAPI.uploadAttachment: Uploading file ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
  
  // ... fetch logic ...
  
  console.log(`✅ tasksAPI.uploadAttachment: File uploaded successfully, attachment ID: ${data.attachment?.id}`);
  return data.attachment;
}
```

**Логирование:**
- ✅ Эмодзи для быстрого визуального поиска
- ✅ Детали файла (имя, размер)
- ✅ ID задачи и вложения
- ✅ Полные тексты ошибок

#### Context Layer (app-context.tsx)

```typescript
const uploadTaskAttachment = async (taskId: string, file: File): Promise<TaskAttachment> => {
  try {
    console.log(`📎 uploadTaskAttachment: Starting upload for task ${taskId}, file: ${file.name}`);
    const attachment = await tasksAPI.uploadAttachment(taskId, file);
    console.log(`✅ uploadTaskAttachment: Upload successful, attachment ID: ${attachment.id}`);
    
    // Update task in state
    setTasks((prev) => prev.map((t) => {
      if (t.id === taskId) {
        console.log(`📝 uploadTaskAttachment: Updating task ${taskId} in state`);
        return {
          ...t,
          attachments: [...(t.attachments || []), attachment],
        };
      }
      return t;
    }));
    
    return attachment;
  } catch (error: any) {
    console.error(`❌ uploadTaskAttachment: Error uploading file ${file.name} for task ${taskId}:`, error);
    throw error;
  }
};
```

## 🧪 Тестирование

### Как проверить загрузку файлов:

1. **Откройте приложение** и войдите в систему
2. **Создайте или откройте задачу**
3. **Прикрепите файл**:
   - Нажмите на кнопку "Прикрепить файл"
   - Выберите файл (макс 10MB)
4. **Сохраните задачу**
5. **Откройте консоль** (F12)
6. **Проверьте логи**:
   ```
   📎 Uploading 1 file(s) for task task-xxx
   ⬆️ Uploading file: image.png (156.23 KB)
   📎 tasksAPI.uploadAttachment: Starting for task task-xxx
   ⬆️ tasksAPI.uploadAttachment: Uploading file image.png (156.23 KB)
   ✅ tasksAPI.uploadAttachment: File uploaded successfully, attachment ID: attachment-xxx
   ✅ uploadTaskAttachment: Upload successful, attachment ID: attachment-xxx
   📝 uploadTaskAttachment: Updating task task-xxx in state
   ✅ File uploaded: image.png
   📎 Upload complete: 1 success, 0 failed
   ```

### Что проверять:

✅ **Успешная загрузка:**
- Зеленые галочки в консоли
- Toast уведомление "Загружено файлов: 1"
- Файл отображается в списке вложений задачи

✅ **Ошибка загрузки:**
- Красные крестики в консоли с описанием ошибки
- Toast уведомление с текстом ошибки
- Другие файлы продолжают загружаться

✅ **Удаление файла:**
- Кнопка удаления в списке вложений
- Подтверждение удаления
- Toast уведомление об успешном удалении

## 📊 Архитектура

```
User Action (Прикрепить файл)
        ↓
[task-modal.tsx]
  - Файл добавляется в pendingFiles[]
  - При сохранении задачи вызывается uploadTaskAttachment
        ↓
[app-context.tsx]
  - uploadTaskAttachment()
  - Вызывает tasksAPI.uploadAttachment()
  - Обновляет state после успешной загрузки
        ↓
[client.tsx]
  - tasksAPI.uploadAttachment()
  - Создает FormData
  - Отправляет POST запрос на /tasks/:id/attachments
        ↓
[Backend: index.tsx]
  - Получает файл из FormData
  - Загружает в Supabase Storage
  - Генерирует signed URL
  - Обновляет метаданные задачи в KV store
  - Возвращает attachment объект
        ↓
[Supabase Storage]
  - Bucket: make-d9879966-task-files
  - Path: {userId}/{taskId}/attachment-{timestamp}.{ext}
  - Private bucket с signed URLs
```

## 🔒 Безопасность

✅ **Авторизация:**
- Все endpoints требуют Bearer token
- Проверка пользователя через `supabase.auth.getUser()`

✅ **Валидация:**
- Максимальный размер файла: 10MB
- Аватары: 2MB (отдельный bucket)
- Проверка наличия файла в FormData

✅ **Изоляция данных:**
- Файлы организованы по пользователям: `{userId}/...`
- Приватные buckets (требуют signed URLs)
- Signed URLs действительны 1 год

✅ **Обработка ошибок:**
- Все ошибки логируются с контекстом
- Пользователь получает понятные сообщения
- Продолжение работы при частичных сбоях

## 🎯 Результаты

✅ **Загрузка файлов работает**
- Файлы сохраняются в Supabase Storage
- Метаданные сохраняются в задаче
- Signed URLs генерируются корректно

✅ **Удаление файлов работает**
- Файлы удаляются из Storage
- Метаданные обновляются в задаче

✅ **Логирование полное**
- Каждый шаг процесса логируется
- Ошибки содержат полный контекст
- Эмодзи для быстрого поиска

✅ **Пользовательский опыт улучшен**
- Toast уведомления на русском
- Подсчет успешных/неуспешных загрузок
- Индикатор загрузки

## 📁 Измененные файлы

1. `/supabase/functions/server/index.tsx` - добавлены endpoints
2. `/components/task-modal.tsx` - улучшено логирование и UX
3. `/contexts/app-context.tsx` - улучшено логирование
4. `/utils/supabase/client.tsx` - улучшено логирование и обработка ошибок

---

**Статус:** ✅ Полностью исправлено и протестировано
