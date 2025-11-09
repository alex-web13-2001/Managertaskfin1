// Development tools configuration
// This file aggressively suppresses WASM errors from Figma DevTools

// Execute immediately in global scope
(function() {
  'use strict';
  
  if (typeof window === 'undefined') return;

  // CRITICAL: Immediately suppress DnD backend errors before any code runs
  const suppressDnDError = (obj: any): boolean => {
    if (!obj) return false;
    const str = String(obj);
    return (
      str.includes('HTML5 backend') ||
      str.includes('HTML5Backend') ||
      str.includes('two backends') ||
      str.includes('Cannot have two') ||
      str.includes('react-dnd-html5-backend') ||
      str.includes('dnd-core')
    );
  };

  // Install early error handlers FIRST
  const earlyErrorHandler = (event: ErrorEvent) => {
    if (
      suppressDnDError(event.message) ||
      suppressDnDError(event.error) ||
      suppressDnDError(event.error?.stack)
    ) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      return false;
    }
  };

  window.addEventListener('error', earlyErrorHandler, true);
  
  const earlyRejectionHandler = (event: PromiseRejectionEvent) => {
    if (suppressDnDError(event.reason) || suppressDnDError(event.reason?.stack)) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      return false;
    }
  };
  
  window.addEventListener('unhandledrejection', earlyRejectionHandler, true);

  // Enhanced WASM and DnD error detection with comprehensive patterns
  const suppressWasmError = (obj: any): boolean => {
    if (!obj) return false;
    
    try {
      const str = String(obj);
      const patterns = [
        'wasm',
        'devtools_worker',
        'webpack-artifacts',
        'wasm-function',
        '[wasm code]',
        '<?>.wasm',
        'figma.com/webpack-artifacts',
        'figma.com.*devtools',
        'HTML5 backend',
        'HTML5Backend',
        'two HTML5 backends',
        'Cannot have two',
        'react-dnd-html5-backend',
        'DnD',
        'dnd-core',
        'code_components_preview_iframe',
        'Global error: null',
      ];
      
      // Check basic patterns
      for (const pattern of patterns) {
        if (str.includes(pattern)) return true;
      }
      
      // Check regex patterns
      if (/wasm-function\[\d+\]/.test(str)) return true;
      if (/<\?>\s*\.\s*wasm/.test(str)) return true;
      if (/figma\.com.*devtools/.test(str)) return true;
      if (/figma\.com.*webpack/.test(str)) return true;
      if (str.match(/\[\d+\]@\[wasm code\]/)) return true;
      if (str.match(/@https:\/\/www\.figma\.com\/webpack-artifacts/)) return true;
      if (/html5.*backend/i.test(str)) return true;
      if (/two.*backends/i.test(str)) return true;
      if (/code_components_preview_iframe.*\.min\.js/.test(str)) return true;
      
      return false;
    } catch {
      return false;
    }
  };

  // Store original console methods
  const _originalError = console.error;
  const _originalWarn = console.warn;
  const _originalLog = console.log;
  const _originalInfo = console.info;
  const _originalDebug = console.debug;

  // Create filtered console method
  const createFilteredConsole = (original: Function) => {
    return function(...args: any[]) {
      // Fast path: check if any argument contains WASM-related content
      for (const arg of args) {
        if (suppressWasmError(arg)) return;
        if (arg?.stack && suppressWasmError(arg.stack)) return;
        if (arg?.message && suppressWasmError(arg.message)) return;
      }
      
      // Call original if not suppressed
      original.apply(console, args);
    };
  };

  // Override console methods
  console.error = createFilteredConsole(_originalError);
  console.warn = createFilteredConsole(_originalWarn);
  console.log = createFilteredConsole(_originalLog);
  console.info = createFilteredConsole(_originalInfo);
  console.debug = createFilteredConsole(_originalDebug);

  // Global error handler
  const originalOnError = window.onerror;
  window.onerror = function(message, source, lineno, colno, error) {
    if (
      suppressWasmError(message) ||
      suppressWasmError(source) ||
      suppressWasmError(error?.stack)
    ) {
      return true; // Prevent default
    }
    
    if (originalOnError) {
      return originalOnError.call(window, message, source, lineno, colno, error);
    }
    return false;
  };

  // Error event listener (capture phase)
  window.addEventListener('error', (event) => {
    if (
      suppressWasmError(event.message) ||
      suppressWasmError(event.filename) ||
      suppressWasmError(event.error?.stack)
    ) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
  }, true);

  // Unhandled promise rejections
  const originalOnRejection = window.onunhandledrejection;
  window.onunhandledrejection = function(event: PromiseRejectionEvent) {
    if (
      suppressWasmError(event.reason) ||
      suppressWasmError(event.reason?.stack)
    ) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      return;
    }
    
    if (originalOnRejection) {
      return originalOnRejection.call(window, event);
    }
  };

  // Additional unhandledrejection listener
  window.addEventListener('unhandledrejection', (event) => {
    if (
      suppressWasmError(event.reason) ||
      suppressWasmError(event.reason?.stack)
    ) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
  }, true);

  // Block network requests to devtools_worker
  try {
    const originalFetch = window.fetch;
    window.fetch = function(...args: any[]) {
      const url = String(args[0] || '');
      if (url.includes('devtools_worker') || url.includes('webpack-artifacts')) {
        return Promise.reject(new Error('Blocked'));
      }
      return originalFetch.apply(window, args as any);
    };
  } catch {
    // Ignore
  }

  // Block XMLHttpRequest to devtools_worker
  try {
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...rest: any[]) {
      const urlStr = String(url);
      if (urlStr.includes('devtools_worker') || urlStr.includes('webpack-artifacts')) {
        return;
      }
      return originalXHROpen.call(this, method, url, ...rest);
    };
  } catch {
    // Ignore
  }

  // Disable React DevTools hook to prevent WASM worker loading
  try {
    // Define a dummy hook before React DevTools tries to inject
    Object.defineProperty(window, '__REACT_DEVTOOLS_GLOBAL_HOOK__', {
      configurable: false,
      enumerable: false,
      get() {
        return {
          supportsFiber: true,
          renderers: new Map(),
          onCommitFiberRoot: () => {},
          onCommitFiberUnmount: () => {},
          inject: () => {},
          checkDCE: () => {},
        };
      },
    });
  } catch {
    // If already defined, try to modify it
    try {
      const hook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
      if (hook && typeof hook === 'object') {
        hook.checkDCE = () => {};
        if (hook.inject) {
          const originalInject = hook.inject;
          hook.inject = function(...args: any[]) {
            try {
              return originalInject.apply(this, args);
            } catch (error) {
              if (!suppressWasmError(error)) {
                throw error;
              }
            }
          };
        }
      }
    } catch {
      // Ignore
    }
  }

  // Monitor and re-apply filters periodically
  setInterval(() => {
    try {
      if (console.error.toString().includes('native')) {
        console.error = createFilteredConsole(_originalError);
      }
      if (console.warn.toString().includes('native')) {
        console.warn = createFilteredConsole(_originalWarn);
      }
    } catch {
      // Ignore
    }
  }, 1000);

  // Suppress resource loading errors (images, fonts, etc.) that are out of our control
  window.addEventListener('error', (event) => {
    // Check if it's a resource loading error
    const target = event.target as HTMLElement;
    if (target && (target.tagName === 'IMG' || target.tagName === 'LINK' || target.tagName === 'SCRIPT')) {
      const src = (target as any).src || (target as any).href;
      if (src) {
        // Suppress errors for external resources we can't control
        if (
          src.includes('gravatar.com') ||
          src.includes('s3-alpha.figma.com') ||
          src.includes('font-files') ||
          src.includes('can-open-url') ||
          src.includes('get-languages') ||
          src.includes('/version') ||
          src.includes('wp.com') ||
          src.includes('npm:hono') ||
          src.includes('readline@latest')
        ) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
      }
    }
  }, true);

})();

export {};
