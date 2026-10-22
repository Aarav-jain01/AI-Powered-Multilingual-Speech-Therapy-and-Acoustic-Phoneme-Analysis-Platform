import { useState } from 'react'
import { Search } from 'lucide-react'
import { useGet } from '../api'
import { Card, Btn, Empty, Loading, Title, LANGS } from '../components/ui'
export default function Library({ go, setPrefill }) {
  const [q, setQ] = useState(''), [lang, setLang] = useState(''), [diff, setDiff] = useState('')
  const [items, err] = useGet(`/exercises?q=${encodeURIComponent(q)}&language=${lang}&difficulty=${diff}`, [q, lang, diff])
  const sel = 'rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm'
  const cats = items ? [...new Set(items.map(i => i.category))] : []
  return <div><Title sub="Words, sound-focus drills and sentences.">Practice Library</Title>
    <div className="mb-6 flex flex-wrap gap-3"><div className="relative"><Search size={16} className="absolute left-3 top-3 text-slate-500" /><input aria-label="Search" className={sel + ' pl-9'} placeholder="Search" value={q} onChange={e => setQ(e.target.value)} /></div>
      <select aria-label="Language" className={sel} value={lang} onChange={e => setLang(e.target.value)}><option value="">All languages</option>{Object.entries(LANGS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
      <select aria-label="Difficulty" className={sel} value={diff} onChange={e => setDiff(e.target.value)}><option value="">All levels</option>{['easy', 'medium', 'hard'].map(d => <option key={d}>{d}</option>)}</select></div>
    {err ? <Empty text={err} /> : !items ? <Loading /> : !items.length ? <Empty text="No exercises match." /> : cats.map(cat => <section key={cat} className="mb-6"><h2 className="mb-2 font-medium capitalize text-white">{cat.replace('-', ' ')}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{items.filter(i => i.category === cat).map(i => <Card key={i.id} className="flex items-center justify-between"><div><div className="text-lg text-white">{i.text}</div><div className="text-xs text-slate-400">{LANGS[i.language]} · {i.difficulty} · focus: {i.focus}</div></div>
        <Btn onClick={() => { setPrefill({ language: i.language, text: i.text }); go('/practice') }}>Practise</Btn></Card>)}</div></section>)}</div>
}
