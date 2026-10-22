import { useEffect, useRef } from 'react'
export function Waveform({ data }) {
  const max = Math.max(...data, 1e-6)
  return <svg viewBox={`0 0 ${data.length} 100`} preserveAspectRatio="none" className="h-24 w-full" role="img" aria-label="Audio waveform">
    {data.map((v, i) => { const h = Math.max((v / max) * 96, 1); return <rect key={i} x={i} y={50 - h / 2} width="0.75" height={h} className="fill-teal-400" /> })}</svg>
}
export function Spectrogram({ data }) {
  const ref = useRef()
  useEffect(() => {
    const h = data.length, w = data[0].length, c = ref.current; c.width = w; c.height = h
    const g = c.getContext('2d'), img = g.createImageData(w, h)
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const t = Math.min(1, Math.max(0, (data[h - 1 - y][x] + 80) / 80)), i = (y * w + x) * 4
      img.data[i] = 15 + 240 * t * t; img.data[i + 1] = 10 + 200 * t ** 1.5; img.data[i + 2] = 70 + 150 * Math.sin(Math.PI * t); img.data[i + 3] = 255
    }
    g.putImageData(img, 0, 0)
  }, [data])
  return <canvas ref={ref} className="h-48 w-full rounded-lg" role="img" aria-label="Mel spectrogram, time on x axis, frequency on y axis" />
}
export function LiveWave({ analyser, active }) {
  const ref = useRef()
  useEffect(() => {
    if (!active || !analyser) return
    const c = ref.current, g = c.getContext('2d'), buf = new Uint8Array(analyser.fftSize); let raf
    const draw = () => {
      analyser.getByteTimeDomainData(buf); g.clearRect(0, 0, c.width, c.height); g.strokeStyle = '#2dd4bf'; g.beginPath()
      buf.forEach((v, i) => { const x = (i / buf.length) * c.width, y = (v / 255) * c.height; i ? g.lineTo(x, y) : g.moveTo(x, y) }); g.stroke()
      raf = requestAnimationFrame(draw)
    }
    draw(); return () => cancelAnimationFrame(raf)
  }, [analyser, active])
  return <canvas ref={ref} width="600" height="80" className="h-20 w-full rounded-lg bg-slate-950" aria-hidden="true" />
}
