import { Link } from 'react-router-dom'
import { useTheme } from '../context/theme-provider'
import { Moon, Sun } from 'lucide-react';
import { signOut } from '@/lib/auth';

type HeaderProps = {
  email?: string
}

const Header = ({ email }: HeaderProps) => {
    const {theme, setTheme} = useTheme();
    const isDark = theme === "dark";

    return (
    <header className='sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur py-2 supports-[backdrop-filter]:bg-background/60'>
      <div className='container mx-auto flex h-16 items-center justify-between px-4'>
        <Link to="/">
          <img className="h-14" src={theme === "dark" ? "/logo.png" : "/logo2.png"} alt="Klimate Logo" />
        </Link>

        {/* search */}
        {/* TODO: abstract theme toggle component */}
        <div className='flex items-center gap-4'>

        <div 
          className={` cursor-pointer transition-transform duration-500
            ${isDark ? "rotate-90" : "rotate-0"}
          `}
          onClick={() => setTheme(isDark ? "light" : "dark")}
        >
          {isDark ?
            (<Sun className="size-6 text-amber-500 rotate-0 transition-all"/>) :
            (<Moon className="size-6 text-amber-500 rotate-0 transition-all"/>)
          }
        </div>
        <div className="flex items-center">
          {email && (
            <>
            <span className="ml-4 text-sm font-medium text-gray-700 dark:text-gray-300">
              {email}
            </span>
            <Link to="/login" onClick={() => {signOut()}} className="ml-6 text-sm text-red-600 hover:underline">
              Sign Out
            </Link>
            </>

          )}
        </div>
        </div>
      </div>
    </header>
  )
}

export default Header
 
