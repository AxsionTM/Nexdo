import { create } from 'zustand';
import { api } from '@/lib/api';

interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  dueDate?: string | null;
  projectId?: string | null;
  parentId?: string | null;
  tags?: any[];
  checklist?: any[];
  children?: Task[];
  project?: any;
  isAllDay?: boolean;
  completedAt?: string | null;
  _count?: { children: number };
}

interface TasksState {
  tasks: Task[];
  todayTasks: Task[];
  overdueTasks: Task[];
  isLoading: boolean;
  selectedTaskId: string | null;
  currentView: string;
  currentProjectId: string | null;

  fetchTasks: (params?: Record<string, string>) => Promise<void>;
  fetchToday: () => Promise<void>;
  fetchOverdue: () => Promise<void>;
  createTask: (data: any) => Promise<Task>;
  updateTask: (id: string, data: any) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  setSelectedTask: (id: string | null) => void;
  setCurrentView: (view: string) => void;
  setCurrentProject: (id: string | null) => void;
  refreshCurrentView: () => Promise<void>;
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  todayTasks: [],
  overdueTasks: [],
  isLoading: false,
  selectedTaskId: null,
  currentView: 'today',
  currentProjectId: null,

  fetchTasks: async (params) => {
    set({ isLoading: true });
    try {
      const { tasks } = await api.getTasks(params);
      set({ tasks, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchToday: async () => {
    set({ isLoading: true });
    try {
      const { tasks } = await api.getTodayTasks();
      set({ todayTasks: tasks, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchOverdue: async () => {
    try {
      const { tasks } = await api.getOverdueTasks();
      set({ overdueTasks: tasks });
    } catch {}
  },

  refreshCurrentView: async () => {
    const { currentView, currentProjectId, fetchToday, fetchOverdue, fetchTasks } = get();
    if (currentView === 'today') {
      await fetchToday();
      await fetchOverdue();
    } else if (currentView === 'overdue') {
      await fetchOverdue();
    } else if (currentView === 'project' && currentProjectId) {
      await fetchTasks({ projectId: currentProjectId });
    } else if (currentView === 'tomorrow') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const start = new Date(tomorrow);
      start.setHours(0, 0, 0, 0);
      const end = new Date(tomorrow);
      end.setHours(23, 59, 59, 999);
      await fetchTasks({
        dueAfter: start.toISOString(),
        dueBefore: end.toISOString(),
      });
    } else if (currentView === 'week') {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setDate(end.getDate() + 7);
      end.setHours(23, 59, 59, 999);
      await fetchTasks({
        dueAfter: start.toISOString(),
        dueBefore: end.toISOString(),
      });
    } else {
      await fetchTasks();
    }
  },

  createTask: async (data) => {
    const { task } = await api.createTask(data);
    await get().refreshCurrentView();
    return task;
  },

  updateTask: async (id, data) => {
    await api.updateTask(id, data);
    await get().refreshCurrentView();
  },

  completeTask: async (id) => {
    await api.completeTask(id);
    await get().refreshCurrentView();
  },

  deleteTask: async (id) => {
    await api.deleteTask(id);
    const { selectedTaskId } = get();
    if (selectedTaskId === id) {
      set({ selectedTaskId: null });
    }
    await get().refreshCurrentView();
  },

  setSelectedTask: (id) => set({ selectedTaskId: id }),
  setCurrentView: (view) => set({ currentView: view, selectedTaskId: null }),
  setCurrentProject: (id) => set({ currentProjectId: id }),
}));
