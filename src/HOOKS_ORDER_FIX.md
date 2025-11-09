# Исправление ошибки порядка React хуков

## Проблема

React выдавал ошибку:
```
Warning: React has detected a change in the order of Hooks called by App.
```

## Причина

Хуки `handleProjectClick`, `handleBackToProjects` и `renderView` были объявлены **ПОСЛЕ** условных возвратов `if (!isAuthenticated)`. Это нарушает [Правила хуков React](https://react.dev/reference/rules/rules-of-hooks).

### ❌ Неправильно (до исправления):

```tsx
function App() {
  const [state, setState] = useState();
  
  useEffect(() => { ... }, []);
  
  const handleLogin = useCallback(() => { ... }, []);
  const handleLogout = useCallback(() => { ... }, []);
  
  // ❌ Ранний возврат ДО объявления всех хуков
  if (!isAuthenticated) {
    return <AuthScreen />;
  }
  
  // ❌ Эти хуки иногда вызываются, иногда нет
  const handleProjectClick = useCallback(() => { ... }, []);
  const renderView = useCallback(() => { ... }, []);
  
  return <MainApp />;
}
```

### ✅ Правильно (после исправления):

```tsx
function App() {
  // 1. Все useState в начале
  const [state, setState] = useState();
  
  // 2. Все useEffect
  useEffect(() => { ... }, []);
  
  // 3. Все useCallback/useMemo
  const handleLogin = useCallback(() => { ... }, []);
  const handleLogout = useCallback(() => { ... }, []);
  const handleProjectClick = useCallback(() => { ... }, []);
  const handleBackToProjects = useCallback(() => { ... }, []);
  const renderView = useCallback(() => { ... }, []);
  
  // 4. ✅ Ранние возвраты ПОСЛЕ всех хуков
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  if (!isAuthenticated) {
    return <AuthScreen />;
  }
  
  return <MainApp />;
}
```

## Правила хуков React

1. **Всегда вызывайте хуки на верхнем уровне** - не внутри циклов, условий или вложенных функций
2. **Всегда вызывайте хуки в одном и том же порядке** - React полагается на порядок вызова хуков
3. **Вызывайте хуки только из React функций** - компонентов или пользовательских хуков

## Порядок хуков в App.tsx (правильный)

```
1. useState (isAuthenticated)
2. useState (isLoading)
3. useState (currentView)
4. useState (isCreateTaskOpen)
5. useState (currentProject)
6. useState (selectedProjectId)
7. useEffect (global error handler)
8. useEffect (auth check)
9. useCallback (handleLogin)
10. useCallback (handleLogout)
11. useCallback (handleProjectClick)
12. useCallback (handleBackToProjects)
13. useCallback (renderView)

[Затем идут условные возвраты]
```

## Результат

✅ Ошибка "change in the order of Hooks" устранена
✅ Все хуки вызываются в правильном порядке при каждом рендере
✅ Приложение работает стабильно без предупреждений React

## Дополнительные оптимизации

1. **Фильтрация WASM ошибок Figma** - внутренние ошибки devtools больше не показываются
2. **Защита от утечек памяти** - все подписки и таймауты очищаются
3. **Error Boundary** - глобальный перехват ошибок React
4. **Ограничение данных** - максимум 1000 задач и 500 проектов для оптимизации

## Ссылки

- [React Docs: Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks)
- [React Docs: useCallback](https://react.dev/reference/react/useCallback)
- [React Docs: useEffect](https://react.dev/reference/react/useEffect)
