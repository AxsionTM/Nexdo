import { create } from "zustand";

import { api } from "@/lib/api";

interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;

  startDate?: string | null;
  dueDate?: string | null;

  projectId?: string | null;
  parentId?: string | null;

  tags?: any[];
  checklist?: any[];
  children?: Task[];

  project?: any;

  isAllDay?: boolean;

  completedAt?: string | null;
  isDeleted?: boolean;

  _count?: { children: number };
}

export type DisplayMode = "list" | "kanban" | "calendar" | "matrix";

interface TasksState {
  tasks: Task[];
  todayTasks: Task[];
  overdueTasks: Task[];

  isLoading: boolean;

  selectedTaskId: string | null;

  currentView: string;
  currentProjectId: string | null;

  displayMode: DisplayMode;

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

  setDisplayMode: (mode: DisplayMode) => void;

  refreshCurrentView: () => Promise<void>;
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  todayTasks: [],
  overdueTasks: [],

  isLoading: false,

  selectedTaskId: null,

  currentView: "today",

  currentProjectId: null,

  displayMode: "list",

  fetchTasks: async (params) => {
    set({ isLoading: true });

    try {
      const query = { ...params };

      if (!query.includeCompleted) {
        // keep default
      }

      const { tasks } = await api.getTasks(query);

      set({
        tasks,
        isLoading: false,
      });
    } catch {
      set({
        isLoading: false,
      });
    }
  },

  fetchToday: async () => {
    set({ isLoading: true });

    try {
      const { tasks } = await api.getTodayTasks();

      set({
        todayTasks: tasks,
        isLoading: false,
      });
    } catch {
      set({
        isLoading: false,
      });
    }
  },

  fetchOverdue: async () => {
    try {
      const { tasks } = await api.getOverdueTasks();

      set({
        overdueTasks: tasks,
      });
    } catch {}
  },

  refreshCurrentView: async () => {
    const {
      currentView,
      currentProjectId,
      displayMode,
      fetchToday,
      fetchOverdue,
      fetchTasks,
    } = get();

    const includeCompleted =
      displayMode === "kanban" ||
      displayMode === "calendar" ||
      displayMode === "matrix"
        ? "true"
        : undefined;

    // Calendar always shows all open tasks for the month (not only today)
    if (displayMode === "calendar") {
      await fetchTasks({
        includeCompleted: "true",
      });

      return;
    }

    if (currentView === "today") {
      await fetchToday();

      const { todayTasks } = get();

      set({
        tasks: todayTasks,
      });
    } else if (currentView === "overdue") {
      await fetchOverdue();

      const { overdueTasks } = get();

      set({
        tasks: overdueTasks,
      });
    } else if (currentView === "inbox") {
      await fetchTasks({
        inbox: "true",
        includeCompleted: "false",
      });
    } else if (currentView === "project" && currentProjectId) {
      await fetchTasks({
        projectId: currentProjectId,
        includeCompleted: includeCompleted || "false",
      });
    } else if (currentView === "tomorrow") {
      const tomorrow = new Date();

      tomorrow.setDate(tomorrow.getDate() + 1);

      const start = new Date(tomorrow);

      start.setHours(0, 0, 0, 0);

      const end = new Date(tomorrow);

      end.setHours(23, 59, 59, 999);

      await fetchTasks({
        dueAfter: start.toISOString(),
        dueBefore: end.toISOString(),
        includeCompleted: includeCompleted || "false",
      });
    } else if (currentView === "week") {
      const start = new Date();

      start.setHours(0, 0, 0, 0);

      const end = new Date();

      end.setDate(end.getDate() + 7);

      end.setHours(23, 59, 59, 999);

      await fetchTasks({
        dueAfter: start.toISOString(),
        dueBefore: end.toISOString(),
        includeCompleted: "true",
      });
    } else {
      await fetchTasks({
        includeCompleted: includeCompleted || "false",
      });
    }
  },

  createTask: async (data) => {
    const { task } = await api.createTask(data);

    // Update the visible UI immediately. The server refresh happens in the
    // background so creating a task does not feel like the app is frozen.
    set((state) => {
      const addIfMissing = (items: Task[]) =>
        items.some((item) => item.id === task.id)
          ? items
          : [task, ...items];

      return {
        tasks: addIfMissing(state.tasks),
        todayTasks: addIfMissing(state.todayTasks),
      };
    });

    void get().refreshCurrentView();
    return task;
  },

  updateTask: async (id, data) => {
    const { task } = await api.updateTask(id, data);

    set((state) => ({
      tasks: state.tasks.map((item) => item.id === id ? { ...item, ...task } : item),
      todayTasks: state.todayTasks.map((item) => item.id === id ? { ...item, ...task } : item),
      overdueTasks: state.overdueTasks.map((item) => item.id === id ? { ...item, ...task } : item),
    }));

    void get().refreshCurrentView();
  },

  completeTask: async (id) => {
    const { task } = await api.completeTask(id);
    const completed = task || { id, status: 'COMPLETED' };

    set((state) => ({
      tasks: state.tasks.map((item) => item.id === id ? { ...item, ...completed } : item),
      todayTasks: state.todayTasks.map((item) => item.id === id ? { ...item, ...completed } : item),
      overdueTasks: state.overdueTasks.filter((item) => item.id !== id),
    }));

    void get().refreshCurrentView();
  },

  deleteTask: async (id) => {
    await api.deleteTask(id);

    const { selectedTaskId } = get();

    set((state) => ({
      tasks: state.tasks.filter((item) => item.id !== id),
      todayTasks: state.todayTasks.filter((item) => item.id !== id),
      overdueTasks: state.overdueTasks.filter((item) => item.id !== id),
      selectedTaskId: selectedTaskId === id ? null : selectedTaskId,
    }));

    void get().refreshCurrentView();
  },

  setSelectedTask: (id) =>
    set({
      selectedTaskId: id,
    }),

  setCurrentView: (view) =>
    set({
      currentView: view,
      selectedTaskId: null,
    }),

  setCurrentProject: (id) =>
    set({
      currentProjectId: id,
    }),

  setDisplayMode: (mode) => {
    set({
      displayMode: mode,
    });

    setTimeout(() => get().refreshCurrentView(), 0);
  },
}));
