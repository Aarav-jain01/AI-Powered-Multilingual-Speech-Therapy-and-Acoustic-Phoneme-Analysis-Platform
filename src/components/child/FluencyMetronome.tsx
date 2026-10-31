import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Wind, Sparkles, Heart } from 'lucide-react';

export const FluencyMetronome: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(72); // Calming pediatric speech pacing
  const [beatPhase, setBeatPhase] = useState<'inhale' | 'easy_onset' | 'exhale'>('easy_onset');
  const [beatCount, setBeatCount] = useState(0);

  const audioCtxRef = useRef<AudioContext | null>(null);

  const playClick = (freq = 440) => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } catch {
      // Audio fallback
    }
  };

  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = (60 / bpm) * 1000;
    const interval = setInterval(() => {
      setBeatCount((prev) => {
        const next = (prev + 1) % 4;
        if (next === 0) setBeatPhase('inhale');
        else if (next === 1) setBeatPhase('easy_onset');
        else setBeatPhase('exhale');

        playClick(next === 0 ? 580 : 440);
        return next;
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isPlaying, bpm]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Wind className="w-5 h-5 text-sky-600" />
            <span>Fluency Pacing & Easy-Onset Metronome</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Paced rhythmic speech helps relax vocal cords and smooth out stammering/blocks.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
          <Heart className="w-4 h-4 fill-emerald-500 text-emerald-500" />
          <span>Zero-Pressure Practice</span>
        </div>
      </div>

      {/* Visual Breathing & Rhythm Orb */}
      <div className="relative h-44 bg-gradient-to-b from-sky-50 to-indigo-50/50 rounded-xl border border-sky-100 flex flex-col items-center justify-center overflow-hidden my-4">
        {/* Pulsing rhythmic sphere */}
        <div
          className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${
            beatPhase === 'inhale'
              ? 'scale-115 bg-sky-400 text-white shadow-sky-200'
              : beatPhase === 'easy_onset'
              ? 'scale-100 bg-emerald-400 text-white shadow-emerald-200'
              : 'scale-90 bg-indigo-400 text-white shadow-indigo-200'
          }`}
        >
          <div className="text-center font-display">
            <span className="text-xs font-bold uppercase tracking-wider block">
              {beatPhase === 'inhale' ? 'Breathe In' : beatPhase === 'easy_onset' ? 'Soft Start' : 'Slow Stretch'}
            </span>
            <span className="text-xl font-extrabold font-mono">
              Beat {beatCount + 1}
            </span>
          </div>
        </div>

        <p className="text-xs font-medium text-slate-600 mt-3 text-center max-w-md px-4">
          {beatPhase === 'easy_onset'
            ? 'Start your voice softly like gentle whispering steam (Easy Onset).'
            : beatPhase === 'exhale'
            ? 'Stretch out vowel sounds smoothly like a warm warm rubber band!'
            : 'Take a soft, quiet belly breath before speaking.'}
        </p>
      </div>

      {/* Metronome Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-xs transition-colors ${
              isPlaying
                ? 'bg-rose-600 text-white hover:bg-rose-700'
                : 'bg-sky-600 text-white hover:bg-sky-700'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isPlaying ? 'Pause Pacing' : 'Start Metronome'}</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-600">Tempo:</span>
          <input
            type="range"
            min="50"
            max="100"
            step="2"
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="w-32 accent-sky-600 cursor-pointer"
          />
          <span className="text-xs font-bold text-slate-800 font-mono w-14">
            {bpm} BPM
          </span>
        </div>
      </div>

      <div className="mt-4 p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-xs text-amber-900 flex items-start gap-2">
        <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p>
          <strong>Clinical Principle:</strong> Fluency practice never marks repetitions or blocks as "wrong". Disfluencies are natural; focus on relaxed breathing and light articulatory contact.
        </p>
      </div>
    </div>
  );
};
