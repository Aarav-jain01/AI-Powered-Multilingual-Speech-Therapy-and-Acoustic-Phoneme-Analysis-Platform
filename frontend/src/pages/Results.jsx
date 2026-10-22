import { useState } from 'react'
import { Volume2, Save, RotateCcw } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { api, errMsg, speak } from '../api'
import { Card, Btn, Empty, Title } from '../components/ui'
import { Waveform, Spectrogram } from '../components/Charts'
const chip = { match: 'bg-teal-500/15 text-teal-300', substitution: 'bg-amber-500/15 text-amber-300', deletion: 'bg-rose-500/15 text-rose-300', insertion: 'bg-violet-500/15 text-violet-300' }
const pct = v => v == null ? 'n/a' : `${Math.round(v * 100)}%`
export default function Results({ result: r, audioUrl, go, notify, setPrefill }) {
  const [saved, setSaved] = useState(false)
  if (!r) return <Empty text="No analysis yet. Record or upload speech on the Practice page." />
  const f = r.acoustic_features, c = r.text_comparison, ph = r.phonemes
  const save = async () => { try { await api.post('/practice-sessions', r); setSaved(true); notify('Session saved.') } catch (e) { notify(errMsg(e), 'error') } }
  const again = () => { setPrefill({ language: r.language, text: r.target_text || '' }); go('/practice') }
  return <div className="space-y-6"><Title sub={`${r.duration_seconds}s recording · status: ${r.analysis_status}`}>Analysis Results</Title>
    <div className="grid gap-4 md:grid-cols-2">
      <Card><div className="text-sm text-slate-400">Target</div><div className="text-xl text-white">{r.target_text || '—'}</div></Card>
      <Card><div className="text-sm text-slate-400">Recognized transcript</div><div className="text-xl text-white">{r.recognized_text ?? '—'}</div></Card></div>
    <Card><h2 className="mb-3 font-medium text-white">Word comparison</h2>
      {c.status === 'unavailable' ? <p className="text-sm text-slate-400">Comparison unavailable (no target text or no recognition result).</p> : <>
        <div className="flex flex-wrap gap-2">{c.word_ops.map((o, i) => <span key={i} className={`rounded-lg px-2 py-1 text-sm ${chip[o.op]}`} title={o.op}>{o.target ?? '∅'}{o.op !== 'match' && <> → {o.recognized ?? '∅'}</>}</span>)}</div>
        <p className="mt-3 text-sm text-slate-400">Word error rate {pct(c.wer)} · Character error rate {pct(c.cer)} (lower is better; text mismatch, not a pronunciation grade).</p></>}</Card>
    {r.audio_quality.warnings.length > 0 && <Card className="border-amber-500/40"><h2 className="mb-2 font-medium text-amber-300">Recording quality</h2><ul className="list-disc pl-5 text-sm">{r.audio_quality.warnings.map(w => <li key={w}>{w}</li>)}</ul></Card>}
    <div className="grid gap-4 lg:grid-cols-2"><Card><h2 className="mb-2 font-medium text-white">Waveform</h2><Waveform data={f.waveform} /></Card>
      <Card><h2 className="mb-2 font-medium text-white">Mel spectrogram</h2><Spectrogram data={f.mel_spectrogram_db} /></Card></div>
    <div className="grid gap-4 lg:grid-cols-2">
      <Card><h2 className="mb-2 font-medium text-white">MFCC means</h2><div className="h-48"><ResponsiveContainer><BarChart data={f.mfcc_mean.map((v, i) => ({ n: i + 1, v }))}><XAxis dataKey="n" stroke="#64748b" /><YAxis stroke="#64748b" /><Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} /><Bar dataKey="v" fill="#8b5cf6" /></BarChart></ResponsiveContainer></div></Card>
      <Card><h2 className="mb-2 font-medium text-white">Acoustic summary</h2><dl className="grid grid-cols-2 gap-2 text-sm">
        {[['RMS energy', f.rms_mean], ['Zero-crossing rate', f.zcr_mean], ['Spectral centroid (Hz)', f.spectral_centroid_mean], ['Spectral bandwidth (Hz)', f.spectral_bandwidth_mean], ['Spectral rolloff (Hz)', f.spectral_rolloff_mean], ['Mean pitch (Hz)', f.pitch?.mean_hz ?? 'n/a']].map(([k, v]) => <div key={k}><dt className="text-slate-400">{k}</dt><dd className="text-white">{v}</dd></div>)}</dl>
        <p className="mt-3 text-xs text-slate-500">These describe the signal; they do not by themselves show correct or incorrect pronunciation.</p></Card></div>
    <Card><h2 className="mb-2 font-medium text-white">Phonemes</h2>
      {ph?.reference?.length ? <div className="space-y-2">{ph.reference.map(w => <div key={w.word} className="text-sm"><span className="mr-2 text-white">{w.word}</span><span className="font-mono text-teal-300">/{w.phonemes.join(' ')}/</span></div>)}</div> : <p className="text-sm text-slate-400">No reference phonemes for this text in the starter lexicon.</p>}
      <p className="mt-3 text-xs text-slate-500">{ph?.note || 'Phoneme timing and confidence are not available: no aligner or phoneme model is integrated yet.'}</p></Card>
    <Card><h2 className="mb-2 font-medium text-white">Feedback & practice suggestions</h2><ul className="list-disc space-y-1 pl-5 text-sm">{r.feedback.map((x, i) => <li key={i}>{x}</li>)}</ul></Card>
    <div className="flex flex-wrap items-center gap-3">
      <Btn variant="ghost" disabled={!r.target_text} onClick={() => !speak(r.target_text, r.language) && notify('No text-to-speech voice for this language in your browser.', 'error')}><Volume2 size={16} />Target audio</Btn>
      {audioUrl && <audio controls src={audioUrl} className="h-10" aria-label="Your recording" />}
      <Btn onClick={save} disabled={saved}><Save size={16} />{saved ? 'Saved' : 'Save session'}</Btn><Btn variant="ghost" onClick={again}><RotateCcw size={16} />Practice again</Btn></div></div>
}
