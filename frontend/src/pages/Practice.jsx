import { useEffect, useRef, useState } from 'react'
import { Mic, Square, Play, RotateCcw, Upload, Volume2, Loader2 } from 'lucide-react'
import { api, errMsg, speak, useGet } from '../api'
import { toWav } from '../wav'
import { Card, Btn, Title, LANGS } from '../components/ui'
import { LiveWave } from '../components/Charts'
export default function Practice({ notify, go, setResult, setAudioUrl, prefill }) {
  const [lang, setLang] = useState(prefill?.language || localStorage.lang || 'en')
  const [text, setText] = useState(prefill?.text || '')
  const [blob, setBlob] = useState(null), [rec, setRec] = useState(false), [secs, setSecs] = useState(0), [busy, setBusy] = useState(false), [analyser, setAnalyser] = useState(null)
  const mr = useRef(), timer = useRef(), ac = useRef(), fileIn = useRef()
  const [sugg] = useGet(`/exercises?language=${lang}`, [lang])
  useEffect(() => () => { clearInterval(timer.current); ac.current?.close() }, [])
  const start = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true }), chunks = []
      const r = new MediaRecorder(s); mr.current = r
      r.ondataavailable = e => chunks.push(e.data)
      r.onstop = () => { setBlob(new Blob(chunks, { type: r.mimeType })); s.getTracks().forEach(t => t.stop()); ac.current?.close(); setAnalyser(null) }
      ac.current = new AudioContext(); const a = ac.current.createAnalyser(); ac.current.createMediaStreamSource(s).connect(a); setAnalyser(a)
      r.start(); setBlob(null); setSecs(0); setRec(true); timer.current = setInterval(() => setSecs(x => x + 1), 1000)
    } catch { notify('Microphone unavailable or permission denied.', 'error') }
  }
  const stop = () => { mr.current?.stop(); clearInterval(timer.current); setRec(false) }
  const analyze = async () => {
    setBusy(true)
    try {
      const wav = await toWav(blob).catch(() => blob)
      const fd = new FormData(); fd.append('language', lang); fd.append('target_text', text.trim()); fd.append('file', wav, 'speech.wav')
      const { data } = await api.post('/analyze-audio', fd)
      setResult(data); setAudioUrl(URL.createObjectURL(wav)); go('/results')
    } catch (e) { notify(errMsg(e), 'error') } finally { setBusy(false) }
  }
  const url = blob && URL.createObjectURL(blob)
  return <div><Title sub="Choose a target, then record or upload.">Speech Practice</Title>
    <div className="grid gap-6 lg:grid-cols-3"><div className="space-y-4 lg:col-span-2">
      <Card className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="text-sm">Language<select className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2" value={lang} onChange={e => setLang(e.target.value)}>{Object.entries(LANGS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
          <label className="text-sm sm:col-span-2">Target word or sentence<input className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2" value={text} onChange={e => setText(e.target.value)} placeholder="e.g. rabbit (optional)" /></label></div>
        <Btn variant="ghost" disabled={!text} onClick={() => !speak(text, lang) && notify(`No ${LANGS[lang]} text-to-speech voice is installed in this browser.`, 'error')}><Volume2 size={16} />Hear target</Btn></Card>
      <Card className="space-y-4">
        <LiveWave analyser={analyser} active={rec} />
        <div className="flex flex-wrap items-center gap-3">
          {!rec ? <Btn onClick={start} disabled={busy}>{blob ? <RotateCcw size={16} /> : <Mic size={16} />}{blob ? 'Record again' : 'Record'}</Btn> : <Btn onClick={stop} className="!bg-rose-500"><Square size={16} />Stop</Btn>}
          <span className="font-mono text-sm tabular-nums">{String(Math.floor(secs / 60)).padStart(2, '0')}:{String(secs % 60).padStart(2, '0')}</span>
          <Btn variant="ghost" onClick={() => fileIn.current.click()} disabled={rec || busy}><Upload size={16} />Upload audio</Btn>
          <input ref={fileIn} type="file" accept="audio/*" hidden onChange={e => { setBlob(e.target.files[0] || null); e.target.value = '' }} /></div>
        {blob && !rec && <audio controls src={url} className="h-10" />}
        <Btn className="w-full py-3" disabled={!blob || rec || busy} onClick={analyze}>{busy ? <><Loader2 className="animate-spin" size={16} />Analyzing… (first run downloads the model)</> : <><Play size={16} />Analyze Speech</>}</Btn></Card></div>
      <Card><h2 className="mb-3 font-medium text-white">Suggested words</h2><div className="flex flex-wrap gap-2">
        {(sugg || []).map(s => <button key={s.id} onClick={() => setText(s.text)} className="rounded-full border border-slate-700 px-3 py-1 text-sm hover:border-teal-400 hover:text-teal-300">{s.text}</button>)}</div></Card></div></div>
}
