import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Archive, Moon, Sun } from "lucide-react"
import { Link } from "react-router-dom"
import { Button } from "../components/ui/button"
import { useTheme } from "../hooks/useTheme"
import { Theme } from "../contexts/ThemeProvider"
import { THEME_CONSTANTS } from "@/constants/ThemeProvider"

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-10 flex p-4 gap-5 justify-between items-center border-b border-slate-200 dark:bg-slate-950 bg-white ">
      <h2 className="text-lg flex items-center gap-3 px-5">
        <Archive className="w-5 h-5" />
        Job Planet
      </h2>
      <section className="flex gap-3 items-center px-4 ">
        <ThemeToggleButton />
        <div className="hidden md:flex">
          <NavItem label="Job Listings" to="/jobs" />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild className="flex md:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="data-[state=open]:bg-slate-100 dark:data-[state=open]:bg-slate-800"
            >
              <span>Menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Link to="/jobs" className="cursor-pointer">
                Job Listings
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </section>
    </nav>
  )
}

function ThemeToggleButton() {
  const { setTheme } = useTheme()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="data-[state=open]:bg-slate-100 dark:data-[state=open]:bg-slate-800"
        >
          <Sun className=" absolute h-5 w-5 scale-100 dark:scale-0 transition-transform" />
          <Moon className="  h-5 w-5 scale-0 dark:scale-100 transition-transform" />
          <span className="sr-only">Toggle Theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {THEME_CONSTANTS.map((theme: Theme) => (
          <DropdownMenuItem
            className="capitalize"
            key={theme}
            onClick={() => setTheme(theme)}
          >
            {theme}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

type NavItemProps = {
  to: string
  label: string
}

function NavItem({ to, label }: NavItemProps) {
  return (
    <Button asChild variant="ghost">
      <Link to={to}>{label}</Link>
    </Button>
  )
}

export default Navbar
