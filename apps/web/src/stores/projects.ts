import { create } from 'zustand';
import { api } from '@/lib/api';

interface Project {
  id: string;
  name: string;
  color: string;
  icon?: string;
  isInbox: boolean;
  role: string;
  taskCount?: number;
  sections?: any[];
}

interface ProjectsState {
  projects: Project[];
  isLoading: boolean;
  fetchProjects: () => Promise<void>;
  createProject: (data: any) => Promise<Project>;
}

export const useProjectsStore = create<ProjectsState>((set) => ({
  projects: [],
  isLoading: false,

  fetchProjects: async () => {
    set({ isLoading: true });
    try {
      const { projects } = await api.getProjects();
      set({ projects, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  createProject: async (data) => {
    const { project } = await api.createProject(data);
    set((state) => ({ projects: [...state.projects, project] }));
    return project;
  },
}));
