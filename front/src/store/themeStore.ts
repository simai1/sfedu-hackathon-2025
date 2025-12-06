import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ThemeStore {
  isDarkMode: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
  applyThemeToElement: (element: HTMLElement | null) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      isDarkMode: true,
      toggleTheme: () => {
        set((state) => {
          const newTheme = !state.isDarkMode;
          return { isDarkMode: newTheme };
        });
      },
      setTheme: (isDark: boolean) => {
        set({ isDarkMode: isDark });
      },
      applyThemeToElement: (element: HTMLElement | null) => {
        if (!element) return;
        const { isDarkMode } = get();
        if (isDarkMode) {
          element.classList.add("dark");
        } else {
          element.classList.remove("dark");
        }
      },
    }),
    {
      name: "theme-storage",
    }
  )
);

