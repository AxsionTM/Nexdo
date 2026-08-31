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

  createTask: async (data) => {
    const { task } = await api.createTask(data);
    const { currentView, fetchToday, fetchTasks, currentProjectId } = get();
    if (currentView === 'today') await fetchToday();
    else if (currentProjectId) await fetchTasks({ projectId: currentProjectId });
    else await fetchTasks();
    return task;
  },

  updateTask: async (id, data) => {
    await api.updateTask(id, data);
    const { currentView, fetchToday, fetchTasks, currentProjectId } = get();
    if (currentView === 'today') await fetchToday();
    else if (currentProjectId) await fetchTasks({ projectId: currentProjectId });
    else await fetchTasks();
  },

  completeTask: async (id) => {
    await api.completeTask(id);
    const { currentView, fetchToday, fetchTasks, currentProjectId } = get();
    if (currentView === 'today') await fetchToday();
    else if (currentProjectId) await fetchTasks({ projectId: currentProjectId });
    else await fetchTasks();
  },

  deleteTask: async (id) => {
    await api.deleteTask(id);
    const { currentView, fetchToday, fetchTasks, currentProjectId } = get();
    if (currentView === 'today') await fetchToday();
    else if (currentProjectId) await fetchTasks({ projectId: currentProjectId });
    else await fetchTasks();
  },

  setSelectedTask: (id) => set({ selectedTaskId: id }),
  setCurrentView: (view) => set({ currentView: view }),
  setCurrentProject: (id) => set({ currentProjectId: id }),
}));
