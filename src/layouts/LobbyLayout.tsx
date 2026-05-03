import type { ReactNode } from 'react'

export default function LobbyLayout({ children }: { children: ReactNode }) {
  return (
    <div className="lobby-bg min-h-screen flex flex-col" dir="rtl">
      <Header />
      <main className="flex-1 flex flex-col items-center px-5 md:px-10 pt-8 pb-6 gap-8">
        {children}
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  )
}

function Header() {
  return (
    <header className="flex items-center justify-between px-5 md:px-10 py-4 bg-white/70 backdrop-blur-sm border-b border-outline/30">
      <div className="flex items-center gap-2">
        <span className="text-lg text-on-surface-variant">⏱</span>
        <span className="text-lg text-on-surface-variant">🔔</span>
      </div>
      <span className="text-lg font-extrabold text-primary hidden md:block">Do You Know Me</span>
      <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-on-surface-variant">
        <a href="#" className="hover:text-primary transition-colors">אודות</a>
        <a href="#" className="hover:text-primary transition-colors">איך משחקים</a>
        <a href="#" className="hover:text-primary transition-colors">תנאי שימוש</a>
      </nav>
      <button className="btn-primary px-4 py-2 rounded-full text-sm font-bold">צור משחק</button>
    </header>
  )
}

function Footer() {
  return (
    <footer className="flex items-center justify-between px-5 md:px-10 py-3 border-t border-outline/20 bg-white/50 text-xs text-on-surface-variant">
      <span>© 2025 Do You Know Me</span>
      <div className="flex gap-4">
        <a href="#" className="hover:text-primary">פרטיות</a>
        <a href="#" className="hover:text-primary">תנאים</a>
        <a href="#" className="hover:text-primary">צור קשר</a>
      </div>
    </footer>
  )
}

function MobileBottomNav() {
  return (
    <nav className="md:hidden flex items-center justify-around px-5 py-3 bg-white/80 backdrop-blur-sm border-t border-outline/20">
      <button className="p-2 text-on-surface-variant text-lg">🏆</button>
      <div className="bg-primary rounded-full px-5 py-2">
        <span className="text-white text-lg">🏠</span>
      </div>
      <button className="p-2 text-on-surface-variant text-lg">⚙️</button>
    </nav>
  )
}
