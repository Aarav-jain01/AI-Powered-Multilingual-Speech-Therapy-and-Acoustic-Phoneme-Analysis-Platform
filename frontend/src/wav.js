// Decode any browser-supported audio (WebM/Opus, MP3, ...) and re-encode as 16-bit mono WAV for the backend.
export async function toWav(blob) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)()
  const buf = await ctx.decodeAudioData(await blob.arrayBuffer()); ctx.close()
  const n = buf.length, out = new Float32Array(n)
  for (let c = 0; c < buf.numberOfChannels; c++) { const d = buf.getChannelData(c); for (let i = 0; i < n; i++) out[i] += d[i] / buf.numberOfChannels }
  const v = new DataView(new ArrayBuffer(44 + n * 2)), w = (o, s) => [...s].forEach((ch, i) => v.setUint8(o + i, ch.charCodeAt(0)))
  w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true)
  v.setUint32(24, buf.sampleRate, true); v.setUint32(28, buf.sampleRate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2, true)
  for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, out[i])) * 32767, true)
  return new Blob([v], { type: 'audio/wav' })
}
