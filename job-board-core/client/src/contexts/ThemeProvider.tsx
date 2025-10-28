import { createContext, ReactNode } from "react"
import { useLocalStorage } from "../hooks/useLocalStorage"
import { THEME_CONSTANTS } from "@/constants/ThemeProvider"

export type Theme = (typeof THEME_CONSTANTS)[number]

type ThemeContext = {
  theme: Theme
  isDark: boolean
  setTheme: (theme: Theme) => void
}

export const Context = createContext<ThemeContext | null>(null)
type ThemeProviderProps = {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useLocalStorage<Theme>("THEME", "system")
  function changeTheme(theme: Theme) {
    const isDark =
      theme == "dark" ||
      (theme == "system" && matchMedia("prefer-color-scheme:dark").matches)
    document.documentElement.classList.toggle("dark", isDark)
    setTheme(theme)
  }

  return (
    <Context.Provider
      value={{
        theme,
        isDark: document.documentElement.classList.contains("dark"),
        setTheme: changeTheme,
      }}
    >
      {children}
    </Context.Provider>
  )
}
