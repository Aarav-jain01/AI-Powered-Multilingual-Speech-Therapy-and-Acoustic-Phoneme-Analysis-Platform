import { Activity, Clock, Languages } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useGet, fmtTime } from '../api'
import { Card, Stat, Empty, Loading, Title, LANGS } from '../components/ui'
export default function Dashboard() {
  const [p, err] = useGet('/progress'), [recent] = useGet('/practice-sessions?limit=5')
  if (err) return <Empty text={`Could not reach the backend: ${err}`} />
  if (!p) return <Loading />
  return <div className="space-y-6"><Title>Dashboard</Title>
    <div className="grid gap-4 sm:grid-cols-3"><Stat icon={Activity} label="Practice sessions" value={p.total_sessions} /><Stat icon={Clock} label="Total recorded time" value={fmtTime(p.total_practice_seconds)} /><Stat icon={Languages} label="Languages practised" value={Object.keys(p.languages).length} /></div>
    <div className="grid gap-4 lg:grid-cols-3"><Card className="lg:col-span-2"><h2 className="mb-3 font-medium text-white">Word mismatch trend (lower is better)</h2>
      {p.trend.length < 2 ? <Empty text="Save at least two sessions with target text to see a trend." /> : <div className="h-56"><ResponsiveContainer><LineChart data={p.trend.map((t, i) => ({ i: i + 1, wer: Math.round(t.wer * 100) }))}><XAxis dataKey="i" stroke="#64748b" /><YAxis stroke="#64748b" unit="%" /><Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} /><Line dataKey="wer" stroke="#2dd4bf" strokeWidth={2} /></LineChart></ResponsiveContainer></div>}</Card>
      <Card><h2 className="mb-3 font-medium text-white">By language</h2>{Object.entries(p.languages).map(([k, v]) => <div key={k} className="mb-2 text-sm"><span className="text-white">{LANGS[k] || k}</span>: {v.sessions} sessions{v.mean_wer != null && <>, mean WER {Math.round(v.mean_wer * 100)}%</>}</div>)}{!Object.keys(p.languages).length && <Empty text="No data yet." />}</Card></div>
    <div className="grid gap-4 lg:grid-cols-2"><Card><h2 className="mb-3 font-medium text-white">Frequently practised</h2>{p.frequent_words.length ? p.frequent_words.map(([w, n]) => <div key={w} className="flex justify-between text-sm"><span>{w}</span><span className="text-slate-400">{n}×</span></div>) : <Empty text="Nothing yet." />}</Card>
      <Card><h2 className="mb-3 font-medium text-white">Recent activity</h2>{recent?.length ? recent.map(s => <div key={s.session_id} className="flex justify-between text-sm"><span>{s.target_text || '(free speech)'}</span><span className="text-slate-400">{new Date(s.created_at + 'Z').toLocaleString()}</span></div>) : <Empty text="No sessions saved yet." />}</Card></div></div>
}
