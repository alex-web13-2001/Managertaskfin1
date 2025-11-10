# 🚀 Quick Deployment Fix - Nginx Configuration

## ⚡ TL;DR - Быстрое решение

### Проблема
Backend получает запросы БЕЗ `/api` префикса → 404 ошибки

### Решение (3 команды)
```bash
# 1. Откройте конфигурацию Nginx
sudo nano /etc/nginx/sites-available/taskmanager

# 2. Найдите и исправьте блок location /api/:
#    БЫЛО:
#    location /api/ {
#        proxy_pass http://127.0.0.1:3001/api/;
#    }
#
#    СТАЛО:
#    location /api/ {
#        proxy_pass http://127.0.0.1:3001;
#    }

# 3. Проверьте и перезагрузите
sudo nginx -t && sudo systemctl reload nginx
```

### Проверка
```bash
# Должен вернуть {"status":"ok"}
curl https://kanban.24task.ru/api/health
```

---

## 📋 Пошаговая инструкция

### Шаг 1: Проверьте backend напрямую
```bash
curl http://localhost:3001/api/health
```
**Ожидается:** `{"status":"ok","timestamp":"..."}`

Если НЕ работает → проблема в backend:
```bash
pm2 status
pm2 logs taskmanager-api
```

### Шаг 2: Проверьте Nginx конфигурацию
```bash
cat /etc/nginx/sites-enabled/taskmanager | grep -A 10 "location /api"
```

**Правильная конфигурация:**
```nginx
location /api/ {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

**⚠️ ВАЖНО:** 
- `proxy_pass http://127.0.0.1:3001;` - БЕЗ пути после порта
- НЕ должно быть: `http://127.0.0.1:3001/` или `http://127.0.0.1:3001/api/`

### Шаг 3: Примените изменения
```bash
# Откройте файл
sudo nano /etc/nginx/sites-available/taskmanager

# Найдите строку:
# proxy_pass http://127.0.0.1:3001/api/;
# Или:
# proxy_pass http://127.0.0.1:3001/;

# Замените на:
# proxy_pass http://127.0.0.1:3001;

# Сохраните (Ctrl+O, Enter, Ctrl+X)

# Проверьте синтаксис
sudo nginx -t

# Если OK, перезагрузите
sudo systemctl reload nginx
```

### Шаг 4: Проверьте результат
```bash
# Health check
curl https://kanban.24task.ru/api/health
# Ожидается: {"status":"ok"}

# Auth endpoint
curl -X POST https://kanban.24task.ru/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'
# Ожидается: HTTP 400/401 с JSON ошибкой (это нормально для неверных данных)
# НЕ должно быть: HTTP 404
```

---

## 🔍 Диагностика

### Симптом 1: 404 Not Found
```bash
curl -i https://kanban.24task.ru/api/auth/signin
# HTTP/1.1 404 Not Found
```

**Причина:** Nginx не передает `/api` префикс в backend

**Решение:** Измените `proxy_pass` на `http://127.0.0.1:3001` (без пути)

### Симптом 2: 502 Bad Gateway
```bash
curl -i https://kanban.24task.ru/api/health
# HTTP/1.1 502 Bad Gateway
```

**Причина:** Backend не работает

**Решение:**
```bash
pm2 status
pm2 restart taskmanager-api
```

### Симптом 3: Connection refused
```bash
curl https://kanban.24task.ru/api/health
# curl: (7) Failed to connect
```

**Причина:** Nginx не запущен или SSL проблема

**Решение:**
```bash
sudo systemctl status nginx
sudo systemctl start nginx
```

---

## 📊 Автоматическая проверка

Используйте скрипт проверки:
```bash
cd /var/www/taskmanager
./verify-deployment.sh
```

Скрипт проверит:
- ✅ Backend health check (прямой)
- ✅ Backend API endpoints (прямой)
- ✅ Nginx proxy к /api/health
- ✅ Nginx proxy к /api/auth/signin
- ✅ PM2 процесс статус
- ✅ Порт 3001 listening
- ✅ Nginx конфигурация

---

## 📚 Дополнительная документация

- **NGINX_FIX_GUIDE_RU.md** - Подробное руководство с объяснениями
- **PRODUCTION_DEPLOYMENT.md** - Полная инструкция по развертыванию
- **verify-deployment.sh** - Скрипт автоматической проверки

---

## 🆘 Быстрая помощь

### Проблема все еще есть?

1. **Проверьте логи backend:**
   ```bash
   pm2 logs taskmanager-api --lines 100
   ```
   Ищите: `POST /auth/signin` (без `/api`) - это плохо!
   Должно быть: `POST /api/auth/signin` - это хорошо!

2. **Проверьте логи Nginx:**
   ```bash
   sudo tail -f /var/log/nginx/taskmanager_error.log
   ```

3. **Перезапустите все:**
   ```bash
   pm2 restart taskmanager-api
   sudo systemctl reload nginx
   ```

4. **Проверьте переменные окружения:**
   ```bash
   cat /var/www/taskmanager/.env | grep API
   ```

---

## ✅ Чеклист успешного развертывания

- [ ] Backend работает напрямую: `curl http://localhost:3001/api/health` → 200 OK
- [ ] PM2 процесс online: `pm2 status` → status: online
- [ ] Nginx синтаксис OK: `sudo nginx -t` → test is successful
- [ ] Nginx перезагружен: `sudo systemctl reload nginx`
- [ ] Health check работает: `curl https://kanban.24task.ru/api/health` → 200 OK
- [ ] Auth endpoint работает: `curl -X POST https://kanban.24task.ru/api/auth/signin` → 400/401 (не 404!)
- [ ] Логи backend показывают правильные пути: `pm2 logs` → `/api/auth/signin`

---

**Версия:** 1.0  
**Обновлено:** 2025-11-10  
**Статус:** ✅ Готово к использованию
