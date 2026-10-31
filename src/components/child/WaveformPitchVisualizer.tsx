import React, { useEffect, useRef } from 'react';
import { Mic, Volume2 } from 'lucide-react';

interface WaveformPitchVisualizerProps {
  analyserNode: AnalyserNode | null;
  isRecording: boolean;
  meanPitchHz?: number | null;
  className?: string;
}

export const WaveformPitchVisualizer: React.FC<WaveformPitchVisualizerProps> = ({
  analyserNode,
  isRecording,
  meanPitchHz,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let bufferLength = 512;
    let dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animFrameIdRef.current = requestAnimationFrame(render);

      const width = canvas.width;
      const height = canvas.height;

      // Clear canvas
      ctx.fillStyle = '#0f172a'; // Deep slate background
      ctx.fillRect(0, 0, width, height);

      // Draw subtle grid lines
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.moveTo(0, height / 4);
      ctx.lineTo(width, height / 4);
      ctx.moveTo(0, (3 * height) / 4);
      ctx.lineTo(width, (3 * height) / 4);
      ctx.stroke();

      if (analyserNode && isRecording) {
        bufferLength = analyserNode.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        analyserNode.getByteTimeDomainData(dataArray);

        // Draw live oscilloscope waveform
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#38bdf8'; // Sky blue
        ctx.beginPath();

        const sliceWidth = (width * 1.0) / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.stroke();
      } else {
        // Calm resting sine wave animation when idle
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#475569';
        ctx.beginPath();
        const t = Date.now() / 600;
        for (let x = 0; x < width; x += 3) {
          const y = height / 2 + Math.sin(x * 0.03 + t) * 6;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    };

    render();

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [analyserNode, isRecording]);

  return (
    <div className={`bg-slate-900 rounded-xl p-4 text-white shadow-xs border border-slate-800 ${className}`}>
      <div className="flex items-center justify-between mb-2 text-xs">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-rose-500' : 'bg-slate-600'}`} />
          <span className="font-semibold text-slate-300">
            {isRecording ? 'Listening to your voice...' : 'Acoustic Sound Wave'}
          </span>
        </div>

        {meanPitchHz && meanPitchHz > 0 ? (
          <div className="flex items-center gap-1.5 font-mono text-sky-400 font-semibold tabular-nums">
            <Volume2 className="w-3.5 h-3.5" />
            <span>F0: {meanPitchHz} Hz</span>
          </div>
        ) : (
          <span className="text-slate-500 text-[11px] font-mono">Pediatric 16 kHz</span>
        )}
      </div>

      <div className="relative rounded-lg overflow-hidden border border-slate-800">
        <canvas
          ref={canvasRef}
          width={600}
          height={140}
          className="w-full h-28 block"
        />

        {isRecording && (
          <div className="absolute bottom-2 left-3 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-950/85 text-[11px] text-sky-300 font-medium">
            <Mic className="w-3 h-3 text-rose-400" />
            <span>Mic Active</span>
          </div>
        )}
      </div>
    </div>
  );
};
