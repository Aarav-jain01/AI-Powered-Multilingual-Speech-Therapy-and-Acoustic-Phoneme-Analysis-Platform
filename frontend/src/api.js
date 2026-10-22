import axios from 'axios'
import { useEffect, useState } from 'react'
export const api = axios.create({ baseURL: '/api', timeout: 180000 })
export const errMsg = (e) => e.response?.data?.detail || e.message || 'Something went wrong'
export function useGet(path, deps = []) {
  const [data, setData] = useState(null), [error, setError] = useState(null)
  useEffect(() => { setData(null); setError(null); api.get(path).then(r => setData(r.data)).catch(e => setError(errMsg(e))) }, deps)
  return [data, error]
}
// Real browser TTS; returns false when no voice for the language is installed.
export function speak(text, lang) {
  const s = window.speechSynthesis
  if (!s || !s.getVoices().some(v => v.lang.toLowerCase().startsWith(lang))) return false
  const u = new SpeechSynthesisUtterance(text); u.lang = lang === 'hi' ? 'hi-IN' : 'en-US'
  s.cancel(); s.speak(u); return true
}
export const fmtTime = (s) => s >= 60 ? `${Math.floor(s / 60)}m ${Math.round(s % 60)}s` : `${Math.round(s)}s`
