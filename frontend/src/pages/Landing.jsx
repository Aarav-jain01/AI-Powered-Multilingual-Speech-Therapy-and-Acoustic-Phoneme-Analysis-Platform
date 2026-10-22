import { Mic, AudioLines, BarChart3, Repeat, ShieldCheck } from 'lucide-react'
import { Card, Btn } from '../components/ui'
const feats = [[Mic, 'Record or upload', 'Practise with your microphone or an existing audio file.'], [AudioLines, 'Acoustic analysis', 'Waveform, mel spectrogram, MFCCs, energy, pitch and spectral features.'],
  [BarChart3, 'Transcript comparison', 'Whisper speech recognition compared with your target using WER and CER.'], [Repeat, 'Guided practice', 'Exercise library plus suggestions based on your actual mismatches.']]
export default function Landing({ go }) {
  return <div className="space-y-12">
    <section className="py-10 text-center"><h1 className="text-4xl font-bold text-white sm:text-5xl">Multilingual speech practice with <span className="text-teal-400">acoustic insight</span></h1>
      <p className="mx-auto mt-4 max-w-2xl text-slate-400">Vocalis AI helps you practise pronunciation in English and Hindi and see what your voice looks like.</p>
      <Btn className="mt-6 px-6 py-3" onClick={() => go('/practice')}>Get Started</Btn></section>
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{feats.map(([I, t, d]) => <Card key={t}><I className="text-teal-400" /><h3 className="mt-3 font-medium text-white">{t}</h3><p className="mt-1 text-sm text-slate-400">{d}</p></Card>)}</section>
    <section><h2 className="mb-4 text-xl font-semibold text-white">How it works</h2>
      <ol className="grid gap-4 sm:grid-cols-4">{['Pick a language and target word', 'Record or upload speech', 'Analyze: recognition + acoustics', 'Review feedback and practise again'].map((s, i) => <Card key={s}><div className="text-teal-400">Step {i + 1}</div><div className="mt-1 text-sm">{s}</div></Card>)}</ol></section>
    <section><h2 className="mb-2 text-xl font-semibold text-white">Supported languages</h2>
      <p className="text-sm text-slate-400">English and Hindi: speech recognition, with reference phonemes for a small starter vocabulary. Phoneme timing and confidence are not available yet.</p></section>
    <Card className="flex gap-3 text-sm text-slate-400"><ShieldCheck className="shrink-0 text-teal-400" />Educational practice tool only. It does not diagnose speech disorders and its metrics are not clinically validated. Consult a speech-language pathologist for clinical concerns.</Card></div>
}
