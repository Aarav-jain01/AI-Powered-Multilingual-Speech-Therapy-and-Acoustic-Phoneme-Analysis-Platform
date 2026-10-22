import { Loader2 } from 'lucide-react'
export const Card = ({ children, className = '' }) => <div className={`rounded-2xl border border-slate-800 bg-slate-900/60 p-5 ${className}`}>{children}</div>
export const Btn = ({ children, variant = 'primary', className = '', ...p }) => (
  <button {...p} className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 disabled:cursor-not-allowed disabled:opacity-50 ${variant === 'primary' ? 'bg-teal-500 text-slate-950 hover:bg-teal-400' : 'border border-slate-700 text-slate-200 hover:bg-slate-800'} ${className}`}>{children}</button>)
export const Stat = ({ icon: I, label, value }) => (
  <Card><div className="flex items-center gap-3"><div className="rounded-xl bg-teal-500/10 p-2 text-teal-400"><I size={20} /></div>
    <div><div className="text-2xl font-semibold text-white">{value}</div><div className="text-sm text-slate-400">{label}</div></div></div></Card>)
export const Empty = ({ text }) => <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">{text}</div>
export const Loading = ({ text = 'Loading…' }) => <div className="flex items-center gap-2 p-6 text-slate-400" role="status"><Loader2 className="animate-spin" size={18} />{text}</div>
export const Title = ({ children, sub }) => <div className="mb-6"><h1 className="text-2xl font-semibold text-white">{children}</h1>{sub && <p className="mt-1 text-sm text-slate-400">{sub}</p>}</div>
export const LANGS = { en: 'English', hi: 'Hindi' }
