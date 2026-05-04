/**
 * Global site footer — rendered on every screen via App.tsx.
 */
export default function AppFooter() {
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
