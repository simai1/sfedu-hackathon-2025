import { create } from "zustand";
import { persist } from "zustand/middleware";

export enum Role {
  ORGANIZATION = "ORGANIZATION",
  STUDENT = "STUDENT",
  APPLICANT = "APPLICANT",
  ADMIN = "ADMIN",
  GRADUATE = "GRADUATE",
  STAFF = "STAFF",
}

export interface User {
  id: string;
  name: string;
  email: string;
  role?: Role;
}

interface UserStore {
  token: string | null;
  user: User | null;
  setUser: (data: User) => void;
  setRole: (role: Role) => void;
  clearUser: () => void;
  setToken: (token: string | null) => void;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  register: (userData: { username: string; email: string; password: string }) => Promise<void>;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setUser: (data) => set({ user: data }),
      setRole: (role: Role) =>
        set((state) => {
          if (!state.user) return state;
          return { ...state, user: { ...state.user, role } };
        }),
      clearUser: () => set({ user: null, token: null }),
      setToken: (token) => {
        if (token === null) {
          set({ token: null, user: null });
        } else {
          set({ token });
        }
      },
      login: async (credentials) => {
        // Simulate API call
        console.log("Logging in with:", credentials);
        // In a real app, you would make an API call here
        // const response = await api.login(credentials);
        // set({ token: response.token, user: response.user });
        set({ 
          token: "fake-jwt-token", 
          user: { 
            id: "1", 
            name: credentials.username, 
            email: "user@example.com", 
            role: Role.STUDENT
          } 
        });
      },
      register: async (userData) => {
        // Simulate API call
        console.log("Registering with:", userData);
        // In a real app, you would make an API call here
        // const response = await api.register(userData);
        // set({ token: response.token, user: response.user });
        set({ 
          token: "fake-jwt-token", 
          user: { 
            id: "1", 
            name: userData.username,
            email: userData.email, 
            role: Role.STUDENT
          } 
        });
      },
    }),
    {
      name: "user-storage",
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    }
  )
);