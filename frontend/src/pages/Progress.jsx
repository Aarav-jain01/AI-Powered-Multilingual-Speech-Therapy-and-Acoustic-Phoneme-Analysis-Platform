import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useGet, fmtTime } from '../api'
import { Card, Empty, Loading, Title, LANGS } from '../components/ui'
export default function Progress({ go, setResult }) {
  const [lang, setLang] = useState('')
  const [rows, err] = useGet(`/practice-sessions?limit=200&language=${lang}`, [lang]), [p] = useGet('/progress')
  const open = async (id) => { const r = await fetch(`/api/practice-sessions/${id}`).then(x => x.json()); setResult(r); go('/results') }
  const trend = (rows || []).filter(r => r.wer != null).reverse().map((r, i) => ({ i: i + 1, wer: Math.round(r.wer * 100) }))
  return <div className="space-y-6"><Title sub="Review saved sessions.">Progress</Title>
    <select aria-label="Language filter" className="rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm" value={lang} onChange={e => setLang(e.target.value)}><option value="">All languages</option>{Object.entries(LANGS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
    {p && <Card className="text-sm text-slate-400"><b className="text-slate-200">Score definition:</b> {p.score_definition}</Card>}
    {err ? <Empty text={err} /> : !rows ? <Loading /> : <>
      <Card><h2 className="mb-3 font-medium text-white">Word error rate over time</h2>{trend.length < 2 ? <Empty text="Need at least two sessions with target text." /> : <div className="h-56"><ResponsiveContainer><LineChart data={trend}><XAxis dataKey="i" stroke="#64748b" /><YAxis stroke="#64748b" unit="%" /><Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} /><Line dataKey="wer" stroke="#8b5cf6" strokeWidth={2} /></LineChart></ResponsiveContainer></div>}</Card>
      <Card className="overflow-x-auto"><h2 className="mb-3 font-medium text-white">Session history</h2>{!rows.length ? <Empty text="No saved sessions." /> :
        <table className="w-full text-left text-sm"><thead className="text-slate-400"><tr><th className="p-2">Date</th><th>Lang</th><th>Target</th><th>Recognized</th><th>Length</th><th>WER</th><th /></tr></thead>
          <tbody>{rows.map(r => <tr key={r.session_id} className="border-t border-slate-800"><td className="p-2">{new Date(r.created_at + 'Z').toLocaleString()}</td><td>{r.language}</td><td>{r.target_text}</td><td>{r.recognized_text}</td><td>{fmtTime(r.duration_seconds)}</td><td>{r.wer == null ? 'n/a' : Math.round(r.wer * 100) + '%'}</td><td><button className="text-teal-300 hover:underline" onClick={() => open(r.session_id)}>Details</button></td></tr>)}</tbody></table>}</Card></>}</div>
}
