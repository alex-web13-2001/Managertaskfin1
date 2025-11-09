import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Create a patched version of HTML5Backend that doesn't throw on duplicate setup
// This is necessary because React Strict Mode and HMR can cause multiple mounts
const createPatchedBackend = () => {
  let backendInstance: any = null;
  
  return (manager: any, context: any, options: any) => {
    // If we already have a backend instance, return it
    if (backendInstance) {
      return backendInstance;
    }
    
    try {
      // Try to create the backend normally
      backendInstance = HTML5Backend(manager, context, options);
      return backendInstance;
    } catch (error: any) {
      // If it fails due to duplicate backend, suppress the error and return a mock
      if (error?.message?.includes('HTML5 backend') || error?.message?.includes('two backends')) {
        console.log('[DnD] Suppressing duplicate backend error');
        // Return the existing backend or a minimal mock
        return backendInstance || {
          setup: () => {},
          teardown: () => {},
          connectDragSource: () => () => {},
          connectDragPreview: () => () => {},
          connectDropTarget: () => () => {},
        };
      }
      throw error;
    }
  };
};

const patchedBackend = createPatchedBackend();

export const DndProviderWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Suppress errors globally during DnD setup
  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const message = event.message || '';
      const errorStr = String(event.error || '');
      
      if (
        message.includes('HTML5 backend') ||
        message.includes('two backends') ||
        message.includes('Cannot have two') ||
        errorStr.includes('HTML5 backend') ||
        errorStr.includes('two backends')
      ) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        return false;
      }
    };

    window.addEventListener('error', handleError, true);
    return () => window.removeEventListener('error', handleError, true);
  }, []);

  return (
    <DndProvider backend={patchedBackend}>
      {children}
    </DndProvider>
  );
};
