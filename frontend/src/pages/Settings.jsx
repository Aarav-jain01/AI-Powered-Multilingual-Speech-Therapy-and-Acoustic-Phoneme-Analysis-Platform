import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { api, errMsg } from '../api'
import { Card, Btn, Title, LANGS } from '../components/ui'
export default function Settings({ notify }) {
  const [lang, setLang] = useState(localStorage.lang || 'en')
  const wipe = async () => { if (!confirm('Delete ALL saved practice sessions? This cannot be undone.')) return
    try { const { data } = await api.delete('/practice-sessions'); notify(`Deleted ${data.deleted} sessions.`) } catch (e) { notify(errMsg(e), 'error') } }
  return <div className="max-w-2xl space-y-6"><Title>Settings</Title>
    <Card><label className="text-sm">Default practice language<select className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-950 p-2" value={lang} onChange={e => { setLang(e.target.value); localStorage.lang = e.target.value; notify('Preference saved.') }}>{Object.entries(LANGS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label></Card>
    <Card><h2 className="font-medium text-white">Privacy</h2><p className="mt-2 text-sm text-slate-400">Audio is sent to your own local backend for analysis and is not written to disk. Saved sessions store transcripts, scores and feature summaries in a local SQLite file. Speech recognition runs locally; the model is downloaded once from Hugging Face. Browser text-to-speech is provided by your browser or OS.</p></Card>
    <Card><h2 className="font-medium text-white">Practice history</h2><Btn className="mt-3 !bg-rose-500 !text-white" onClick={wipe}><Trash2 size={16} />Delete all history</Btn></Card></div>
}
