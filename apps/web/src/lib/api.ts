const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) localStorage.setItem('token', token);
      else localStorage.removeItem('token');
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
    return this.token;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: { message: 'Ошибка сети' } }));
      throw new Error(error.error?.message || 'Ошибка запроса');
    }

    return res.json();
  }

  // Auth
  register(data: { email: string; password: string; name?: string }) {
    return this.request<{ user: any; token: string; inboxId: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  login(data: { email: string; password: string }) {
    return this.request<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  me() {
    return this.request<{ user: any }>('/auth/me');
  }

  // Tasks
  getTasks(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<{ tasks: any[] }>(`/tasks${query}`);
  }

  getTodayTasks() {
    return this.request<{ tasks: any[] }>('/tasks/today');
  }

  getOverdueTasks() {
    return this.request<{ tasks: any[] }>('/tasks/overdue');
  }

  getTask(id: string) {
    return this.request<{ task: any }>(`/tasks/${id}`);
  }

  createTask(data: any) {
    return this.request<{ task: any }>('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateTask(id: string, data: any) {
    return this.request<{ task: any }>(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  deleteTask(id: string) {
    return this.request<{ success: boolean }>(`/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  completeTask(id: string) {
    return this.request<{ task: any }>(`/tasks/${id}/complete`, {
      method: 'POST',
    });
  }

  // Projects
  getProjects() {
    return this.request<{ projects: any[] }>('/projects');
  }

  createProject(data: any) {
    return this.request<{ project: any }>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Tags
  getTags() {
    return this.request<{ tags: any[] }>('/tags');
  }

  createTag(data: any) {
    return this.request<{ tag: any }>('/tags', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Habits
  getHabits() {
    return this.request<{ habits: any[] }>('/habits');
  }

  createHabit(data: any) {
    return this.request<{ habit: any }>('/habits', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  logHabit(id: string, data: any) {
    return this.request<{ log: any }>(`/habits/${id}/log`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiClient();
