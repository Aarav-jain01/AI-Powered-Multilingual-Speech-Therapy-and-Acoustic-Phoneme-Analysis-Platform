import { Activity, LayoutDashboard, Mic, BookOpen, TrendingUp, Settings } from 'lucide-react'
const links = [['/dashboard', 'Dashboard', LayoutDashboard], ['/practice', 'Practice', Mic], ['/library', 'Library', BookOpen], ['/progress', 'Progress', TrendingUp], ['/settings', 'Settings', Settings]]
export default function Layout({ route, children }) {
  return <div className="min-h-screen">
    <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <a href="#/" className="flex items-center gap-2 font-semibold text-white"><Activity className="text-teal-400" size={22} />Vocalis AI</a>
        <nav className="flex flex-1 gap-1 overflow-x-auto" aria-label="Main">
          {links.map(([to, label, I]) => <a key={to} href={'#' + to} aria-current={route === to ? 'page' : undefined}
            className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition hover:bg-slate-800 ${route === to ? 'bg-slate-800 text-teal-300' : 'text-slate-400'}`}><I size={16} />{label}</a>)}
        </nav></div></header>
    <main className="mx-auto max-w-6xl px-4 py-8">{children}</main></div>
}
