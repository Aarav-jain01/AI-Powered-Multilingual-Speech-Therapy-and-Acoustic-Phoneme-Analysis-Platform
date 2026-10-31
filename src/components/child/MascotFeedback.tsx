import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Star, Sparkles, Volume2 } from 'lucide-react';

interface MascotFeedbackProps {
  stars: number;
  feedbackMessage: string;
  isAcceptedVariant?: boolean;
  onHearModel?: () => void;
  className?: string;
}

export const MascotFeedback: React.FC<MascotFeedbackProps> = ({
  stars,
  feedbackMessage,
  isAcceptedVariant,
  onHearModel,
  className = '',
}) => {
  useEffect(() => {
    if (stars === 3) {
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#38bdf8', '#818cf8', '#f59e0b', '#10b981'],
        disableForReducedMotion: true,
      });
    }
  }, [stars]);

  return (
    <div className={`bg-gradient-to-br from-amber-50 to-sky-50 rounded-2xl border border-amber-200/60 p-5 shadow-xs ${className}`}>
      <div className="flex items-start gap-4">
        {/* Animated Friendly Mascot "Boloo the Parrot" */}
        <div className="relative shrink-0">
          <div className="w-16 h-16 rounded-2xl bg-white border-2 border-sky-300 shadow-sm flex items-center justify-center overflow-hidden">
            <svg viewBox="0 0 100 100" className="w-14 h-14">
              {/* Parrot Body */}
              <circle cx="50" cy="55" r="32" fill="#0284c7" />
              {/* Belly */}
              <circle cx="48" cy="62" r="22" fill="#38bdf8" />
              {/* Head */}
              <circle cx="50" cy="38" r="24" fill="#0284c7" />
              {/* Beak */}
              <polygon points="56,36 78,42 56,48" fill="#f59e0b" />
              {/* Eye White & Pupil */}
              <circle cx="45" cy="34" r="8" fill="#ffffff" />
              <circle cx="47" cy="34" r="4.5" fill="#0f172a" />
              <circle cx="49" cy="32" r="1.5" fill="#ffffff" />
              {/* Wing */}
              <path d="M 24 55 Q 16 75 38 78 Q 30 65 24 55" fill="#0369a1" />
              {/* Crest Feathers */}
              <path d="M 44 18 Q 48 8 52 18" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
              <path d="M 50 18 Q 56 6 60 18" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </div>
          <span className="absolute -bottom-1.5 -right-1 px-1.5 py-0.5 bg-sky-600 text-[10px] font-extrabold text-white rounded-md uppercase">
            Boloo
          </span>
        </div>

        {/* Feedback text & stars */}
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-1.5">
            {[1, 2, 3].map((starIdx) => (
              <Star
                key={starIdx}
                className={`w-5 h-5 transition-transform duration-300 ${
                  starIdx <= stars
                    ? 'text-amber-400 fill-amber-400 scale-110'
                    : 'text-slate-300 fill-slate-100'
                }`}
              />
            ))}
            {isAcceptedVariant && (
              <span className="text-[11px] font-semibold text-sky-700 bg-sky-100/80 px-2 py-0.5 rounded-md ml-2">
                Accepted Dialect Variant
              </span>
            )}
          </div>

          <p className="text-sm font-semibold text-slate-800 leading-snug">
            {feedbackMessage}
          </p>

          {onHearModel && (
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={onHearModel}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <Volume2 className="w-3.5 h-3.5 text-sky-600" />
                <span>Hear Boloo say it</span>
              </button>
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Keep practicing, you are doing awesome!
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
