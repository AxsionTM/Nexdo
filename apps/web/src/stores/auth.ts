import { create } from 'zustand';
import { api, ApiError } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl?: string | null;
  theme?: string;
  locale?: string;
  birthday?: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password) => {
    const { user, token } = await api.login({ email, password });
    api.setToken(token);
    set({ user, token, isAuthenticated: true, isLoading: false });
  },

  register: async (email, password, name) => {
    const { user, token } = await api.register({ email, password, name });
    api.setToken(token);
    set({ user, token, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    api.setToken(null);
    set({ user: null, token: null, isAuthenticated: false });
  },

  setUser: (user) => set({ user }),

  checkAuth: async () => {
    const token = api.getToken();
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    try {
      const { user } = await api.me();
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (err) {
      // A refresh must not log the user out just because the API is
      // temporarily restarting or the network is unavailable.
      if (err instanceof ApiError && (err.status === 401 || err.status === 404)) {
        api.setToken(null);
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      } else {
        set((state) => ({
          token,
          isAuthenticated: true,
          isLoading: false,
          user: state.user,
        }));
      }
    }
  },
}));
