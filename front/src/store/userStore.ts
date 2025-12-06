import { create } from "zustand"
import { persist } from "zustand/middleware"

export enum Role {
  ORGANIZATION = "ORGANIZATION",
  USER = "USER",
}

export interface User {
  id: string
  name: string
  email: string
  role?: Role
  organizationCode?: string | null
  organizationName?: string | null
}

interface UserStore {
  token: string | null
  user: User | null
  setUser: (data: User) => void
  setRole: (role: Role) => void
  clearUser: () => void
  setToken: (token: string | null) => void
  login: (credentials: { username: string; password: string }) => Promise<void>
  register: (userData: {
    username: string
    email: string
    password: string
    role: string
  }) => Promise<void>
  linkToOrganization: (code: string) => Promise<{ success: boolean; organizationName: string }>
}

const mapBackendRole = (role?: string): Role => {
  if (!role) return Role.USER
  const normalized = role.toLowerCase()
  if (normalized === "organization") return Role.ORGANIZATION
  return Role.USER
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setUser: (data) => set({ user: data }),
      setRole: (role: Role) =>
        set((state) => {
          if (!state.user) return state
          return { ...state, user: { ...state.user, role } }
        }),
      clearUser: () => set({ user: null, token: null }),
      setToken: (token) => {
        if (token === null) {
          set({ token: null, user: null })
        } else {
          set({ token })
        }
      },
      login: async (credentials) => {
        console.log("Logging in with:", credentials)
        // TODO: заменить на реальный API вызов
        // const response = await api.login(credentials);
        set({
          token: "fake-jwt-token",
          user: {
            id: "1",
            name: credentials.username,
            email: "user@example.com",
            role: Role.USER,
          },
        })
      },
      register: async (userData) => {
        console.log("Registering with:", userData)
        // TODO: заменить на реальный API вызов
        // const response = await api.register(userData);
        set({
          token: "fake-jwt-token",
          user: {
            id: "1",
            name: userData.username,
            email: userData.email,
            role: mapBackendRole(userData.role),
          },
        })
      },
      linkToOrganization: async (code: string) => {
        const normalizedCode = code.trim()
        if (!normalizedCode) {
          throw new Error("Код организации не может быть пустым")
        }

        const organizationName = `Организация ${normalizedCode.slice(-4)}`

        set((state) => {
          if (!state.user) return state
          return {
            ...state,
            user: {
              ...state.user,
              organizationCode: normalizedCode,
              organizationName,
            },
          }
        })

        return { success: true, organizationName }
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
)
