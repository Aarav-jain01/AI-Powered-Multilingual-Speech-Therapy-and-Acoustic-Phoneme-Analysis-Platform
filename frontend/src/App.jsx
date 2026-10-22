import { useEffect, useState } from 'react'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Practice from './pages/Practice'
import Results from './pages/Results'
import Library from './pages/Library'
import Progress from './pages/Progress'
import Settings from './pages/Settings'
const routes = { '/': Landing, '/dashboard': Dashboard, '/practice': Practice, '/results': Results, '/library': Library, '/progress': Progress, '/settings': Settings }
export default function App() {
  const [route, setRoute] = useState(location.hash.slice(1) || '/')
  const [result, setResult] = useState(null), [audioUrl, setAudioUrl] = useState(null), [prefill, setPrefill] = useState(null), [toast, setToast] = useState(null)
  useEffect(() => { const f = () => setRoute(location.hash.slice(1) || '/'); addEventListener('hashchange', f); return () => removeEventListener('hashchange', f) }, [])
  const notify = (msg, type = 'ok') => { setToast({ msg, type }); setTimeout(() => setToast(null), 4500) }
  const ctx = { result, setResult, audioUrl, setAudioUrl, prefill, setPrefill, notify, go: (r) => { location.hash = r } }
  const Page = routes[route] || Landing
  return <Layout route={route}><Page {...ctx} />
    {toast && <div role="status" className={`fixed bottom-4 right-4 max-w-sm rounded-xl px-4 py-3 text-sm shadow-lg ${toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-teal-500 text-slate-950'}`}>{toast.msg}</div>}</Layout>
}
