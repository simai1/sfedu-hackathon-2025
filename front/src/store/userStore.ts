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
  linkToOrganization: (code: string) => Promise<{ success: boolean; organizationName: string }>
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
