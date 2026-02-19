import { type PropsWithChildren } from 'react'
import Header from '@app/components/header'
import { useAuth } from '@app/hooks/use-auth'
const Layout = ({children}: PropsWithChildren) => {
    const { user, session } = useAuth()
    
    console.log("Layout user:", user);
    console.log("Layout session:", session);
  return (
    <div className="bg-gradient-to-br from-background to-muted">
    <Header email={user?.email} />
    <main className="min-h-screen container mx-auto px-4 py-8">{children}</main>
        <footer className="border-t backdrop-blur py-12 supports-[backdrop-filter]:bg-background/60">
            <p className='container mx-auto px-4 text-center text-gray-400'>Made with love by Mihalyi</p>
        </footer>
    </div>
  )
}

export default Layout