import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

// Supabase client for auth operations with auto-refresh
export const supabase = createSupabaseClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);

// Initialize session check
supabase.auth.getSession().then(({ data: { session } }) => {
  if (session) {
    console.log('✅ Supabase: Existing session found');
  } else {
    console.log('ℹ️ Supabase: No existing session');
  }
});

// API base URL
const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-d9879966`;

// Get auth token with retry logic
export const getAuthToken = async (): Promise<string | null> => {
  try {
    // First try to get the current session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      // Only log if it's not a "no session" error
      if (!error.message?.includes('session missing')) {
        console.error('❌ getAuthToken: Error getting session:', error);
      }
      return null;
    }
    
    if (session?.access_token) {
      console.log('✅ getAuthToken: Token found');
      return session.access_token;
    }
    
    // If no session, try to refresh (this is expected when not logged in)
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    
    if (refreshError) {
      // Only log if it's not a "session missing" error (expected when not logged in)
      if (!refreshError.message?.includes('session missing')) {
        console.error('❌ getAuthToken: Error refreshing session:', refreshError);
      }
      return null;
    }
    
    if (refreshData?.session?.access_token) {
      console.log('✅ getAuthToken: Token refreshed successfully');
      return refreshData.session.access_token;
    }
    
    // No token available - user is not logged in (expected state)
    return null;
  } catch (error) {
    console.error('❌ getAuthToken: Unexpected error:', error);
    return null;
  }
};

// ========== AUTH API ==========

export const authAPI = {
  signUp: async (email: string, password: string, name: string) => {
    try {
      // First, create user via our server endpoint
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ email, password, name }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Signup API error:', error);
        throw new Error(error.error || 'Не удалось создать аккаунт');
      }

      // Then sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Auto-login error after signup:', error);
        throw new Error('Аккаунт создан, но не удалось войти. Попробуйте войти вручную.');
      }
      
      return data;
    } catch (error: any) {
      console.error('SignUp error:', error);
      throw error;
    }
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Don't log auth errors - they're expected when credentials are wrong
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Неверный email или пароль');
      }
      throw new Error(error.message || 'Ошибка входа');
    }
    return data;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  resetPassword: async (email: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send reset email');
    }

    return response.json();
  },

  getCurrentUser: async () => {
    const token = await getAuthToken();
    if (!token) {
      // This is expected when user is not logged in - no need to warn
      return null;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.warn('⚠️ authAPI.getCurrentUser: Response not OK:', response.status);
        return null;
      }
      
      const data = await response.json();
      console.log('✅ authAPI.getCurrentUser: User data retrieved');
      return data.user;
    } catch (error) {
      console.error('❌ authAPI.getCurrentUser: Error:', error);
      return null;
    }
  },

  updateProfile: async (updates: any) => {
    const token = await getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update profile');
    }

    const data = await response.json();
    return data.user;
  },

  uploadAvatar: async (file: File) => {
    const token = await getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const formData = new FormData();
    formData.append('avatar', file);

    const response = await fetch(`${API_BASE_URL}/auth/avatar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload avatar');
    }

    const data = await response.json();
    return data.avatarUrl;
  },

  deleteAvatar: async () => {
    const token = await getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/auth/avatar`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete avatar');
    }

    return true;
  },

  onAuthStateChange: (callback: (user: any) => void) => {
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user || null);
    });
  },
};

// ========== TASKS API ==========

export const tasksAPI = {
  getAll: async () => {
    const token = await getAuthToken();
    if (!token) {
      // User is not logged in - this is expected, throw error without logging
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/tasks`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ tasksAPI.getAll: Error response:', errorText);
      let error;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { error: errorText };
      }
      throw new Error(error.error || 'Failed to fetch tasks');
    }

    const data = await response.json();
    return data.tasks;
  },

  create: async (taskData: any) => {
    const token = await getAuthToken();
    if (!token) {
      console.error('❌ tasksAPI.create: No auth token available');
      throw new Error('Не авторизован. Пожалуйста, войдите снова.');
    }

    console.log('➕ tasksAPI.create: Creating new task');

    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(taskData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ tasksAPI.create: Error response:', errorText);
      let error;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { error: errorText };
      }
      throw new Error(error.error || 'Failed to create task');
    }

    const data = await response.json();
    console.log('✅ tasksAPI.create: Task created successfully');
    return data.task;
  },

  update: async (taskId: string, updates: any) => {
    const token = await getAuthToken();
    if (!token) {
      console.error('❌ tasksAPI.update: No auth token available');
      throw new Error('Не авторизован. Пожалуйста, войдите снова.');
    }

    console.log('📝 tasksAPI.update: Updating task', taskId);

    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ tasksAPI.update: Error response:', errorText);
      let error;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { error: errorText };
      }
      throw new Error(error.error || 'Failed to update task');
    }

    const data = await response.json();
    console.log('✅ tasksAPI.update: Task updated successfully');
    return data.task;
  },

  delete: async (taskId: string) => {
    const token = await getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete task');
    }

    return true;
  },

  uploadAttachment: async (taskId: string, file: File) => {
    console.log(`📎 tasksAPI.uploadAttachment: Starting for task ${taskId}`);
    
    const token = await getAuthToken();
    if (!token) {
      console.error('❌ tasksAPI.uploadAttachment: No auth token');
      throw new Error('Не авторизован. Пожалуйста, войдите снова.');
    }

    console.log(`⬆️ tasksAPI.uploadAttachment: Uploading file ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
    
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/attachments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ tasksAPI.uploadAttachment: Error response:', errorText);
      let error;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { error: errorText };
      }
      throw new Error(error.error || 'Ошибка загрузки файла');
    }

    const data = await response.json();
    console.log(`✅ tasksAPI.uploadAttachment: File uploaded successfully, attachment ID: ${data.attachment?.id}`);
    return data.attachment;
  },

  deleteAttachment: async (taskId: string, attachmentId: string) => {
    console.log(`🗑️ tasksAPI.deleteAttachment: Deleting attachment ${attachmentId} from task ${taskId}`);
    
    const token = await getAuthToken();
    if (!token) {
      console.error('❌ tasksAPI.deleteAttachment: No auth token');
      throw new Error('Не авторизован. Пожалуйста, войдите снова.');
    }

    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/attachments/${attachmentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ tasksAPI.deleteAttachment: Error response:', errorText);
      let error;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { error: errorText };
      }
      throw new Error(error.error || 'Ошибка удаления файла');
    }

    console.log(`✅ tasksAPI.deleteAttachment: Attachment deleted successfully`);
    return true;
  },
};

// ========== PROJECTS API ==========

export const projectsAPI = {
  getAll: async () => {
    const token = await getAuthToken();
    if (!token) {
      // User is not logged in - this is expected, throw error without logging
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/projects`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ projectsAPI.getAll: Error response:', errorText);
      let error;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { error: errorText };
      }
      throw new Error(error.error || 'Failed to fetch projects');
    }

    const data = await response.json();
    return data.projects;
  },

  create: async (projectData: any) => {
    const token = await getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(projectData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create project');
    }

    const data = await response.json();
    return data.project;
  },

  update: async (projectId: string, updates: any) => {
    const token = await getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update project');
    }

    const data = await response.json();
    return data.project;
  },

  archive: async (projectId: string) => {
    const token = await getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/archive`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to archive project');
    }

    const data = await response.json();
    return data.project;
  },

  restore: async (projectId: string) => {
    const token = await getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/restore`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to restore project');
    }

    const data = await response.json();
    return data.project;
  },

  delete: async (projectId: string) => {
    const token = await getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete project');
    }

    return true;
  },

  getArchived: async () => {
    const token = await getAuthToken();
    if (!token) {
      console.warn('⚠️ projectsAPI.getArchived: No auth token, skipping request');
      return [];
    }

    const response = await fetch(`${API_BASE_URL}/projects/archived`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ projectsAPI.getArchived: Error response:', errorText);
      let error;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { error: errorText };
      }
      throw new Error(error.error || 'Failed to fetch archived projects');
    }

    const data = await response.json();
    return data.projects;
  },

  getTasks: async (projectId: string) => {
    const token = await getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/tasks`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch project tasks');
    }

    const data = await response.json();
    return data.tasks;
  },
};

// ========== INVITATIONS API ==========

export const invitationsAPI = {
  getMyInvitations: async () => {
    const token = await getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/invitations/my`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch invitations');
    }

    const data = await response.json();
    return data.invitations;
  },

  acceptInvitation: async (projectId: string, invitationId: string) => {
    const token = await getAuthToken();
    if (!token) throw new Error('Not authenticated');

    console.log(`📧 invitationsAPI.acceptInvitation: Accepting invitation ${invitationId} for project ${projectId}`);

    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/invitations/${invitationId}/accept`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ invitationsAPI.acceptInvitation: Error response:', errorText);
      let error;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { error: errorText };
      }
      throw new Error(error.error || 'Failed to accept invitation');
    }

    const data = await response.json();
    console.log('✅ invitationsAPI.acceptInvitation: Invitation accepted successfully');
    return data;
  },
};

// ========== TEAM MEMBERS API ==========

export const teamAPI = {
  getMembers: async () => {
    const token = await getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/team/members`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Ошибка загрузки участников');
    }

    const data = await response.json();
    return data.members;
  },
};

// ========== DIAGNOSTICS API ==========

export const diagnosticsAPI = {
  diagnoseProjectTasks: async (projectId: string) => {
    const token = await getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/diagnostics/project/${projectId}/tasks`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to diagnose tasks');
    }

    return await response.json();
  },

  migrateProjectTasks: async (projectId: string) => {
    const token = await getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/diagnostics/project/${projectId}/migrate-tasks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to migrate tasks');
    }

    return await response.json();
  },
};

// ========== USER SETTINGS API (Custom Columns) ==========

export const userSettingsAPI = {
  getCustomColumns: async () => {
    const token = await getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/user/settings/custom-columns`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch custom columns');
    }

    const data = await response.json();
    return data.customColumns;
  },

  saveCustomColumns: async (customColumns: Array<{ id: string; title: string; color: string }>) => {
    const token = await getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/user/settings/custom-columns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ customColumns }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save custom columns');
    }

    const data = await response.json();
    return data.customColumns;
  },
};
