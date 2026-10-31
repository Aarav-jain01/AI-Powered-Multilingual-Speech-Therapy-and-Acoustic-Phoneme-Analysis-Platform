import React from 'react';
import { PhonemeMetadata } from '../../types/content';
import { PHONEME_INVENTORY } from '../../data/phonemeInventory';

interface ArticulatoryVisualizerProps {
  targetPhoneme: string;
  articulatoryTip?: string;
  className?: string;
}

export const ArticulatoryVisualizer: React.FC<ArticulatoryVisualizerProps> = ({
  targetPhoneme,
  articulatoryTip,
  className = '',
}) => {
  const meta: PhonemeMetadata = PHONEME_INVENTORY[targetPhoneme] || {
    ipa: targetPhoneme,
    name: 'Target Sound',
    placeOfArticulation: 'alveolar',
    mannerOfArticulation: 'stop',
    voiced: true,
    typicalAcquisitionAge: 4,
    articulatoryPlacementDescription: 'Focus on clear tongue and lip placement.',
    cueType: 'visual',
    tactileCueText: 'Listen closely and place your tongue gently.',
    mouthGraphicSvgType: 'open_vowel',
  };

  // Determine tongue curve path in sagittal vocal tract based on articulatory type
  const renderTongueShape = () => {
    switch (meta.mouthGraphicSvgType) {
      case 'rhotic_curl':
        // Retroflex curled back tongue tip
        return (
          <g>
            {/* Tongue body curving backward toward hard palate */}
            <path
              d="M 75 160 C 85 145, 105 130, 130 115 C 145 105, 150 92, 138 85 C 128 78, 118 95, 110 112 C 95 130, 75 148, 70 160 Z"
              fill="#fda4af"
              stroke="#e11d48"
              strokeWidth="2.5"
            />
            {/* Motion arrow indicating curl direction */}
            <path
              d="M 120 120 Q 140 100 135 90"
              fill="none"
              stroke="#0284c7"
              strokeWidth="3"
              strokeDasharray="4 2"
              markerEnd="url(#arrow)"
            />
            <text x="145" y="80" className="text-[10px] font-bold fill-sky-700">Tongue curls back</text>
          </g>
        );

      case 'alveolar_touch':
        // Tongue tip touching bumpy ridge behind top teeth (for /s/, /l/, /t/)
        return (
          <g>
            <path
              d="M 75 160 C 90 145, 115 135, 140 120 C 158 105, 168 85, 166 75 C 160 74, 150 82, 138 98 C 115 125, 90 145, 70 160 Z"
              fill="#fda4af"
              stroke="#e11d48"
              strokeWidth="2.5"
            />
            {/* Airflow arrow whistling over tip */}
            <path
              d="M 152 70 Q 165 72 185 75"
              fill="none"
              stroke="#0284c7"
              strokeWidth="2.5"
              strokeDasharray="3 2"
            />
            <text x="130" y="60" className="text-[10px] font-bold fill-emerald-700">Tip near ridge</text>
          </g>
        );

      case 'velar_back':
        // Back of tongue elevated against soft palate (for /k/, /g/)
        return (
          <g>
            <path
              d="M 75 160 C 85 140, 95 105, 110 82 C 122 70, 132 75, 130 92 C 125 115, 105 138, 70 160 Z"
              fill="#fda4af"
              stroke="#e11d48"
              strokeWidth="2.5"
            />
            <circle cx="118" cy="78" r="6" fill="#f59e0b" opacity="0.6" />
            <text x="75" y="70" className="text-[10px] font-bold fill-amber-700">Back throat closure</text>
          </g>
        );

      case 'interdental_tongue':
        // Tongue tip peeking between upper and lower incisors (/θ/)
        return (
          <g>
            <path
              d="M 75 160 C 100 145, 135 125, 165 105 C 182 92, 195 85, 192 80 C 180 78, 165 88, 145 105 C 110 135, 90 150, 70 160 Z"
              fill="#fda4af"
              stroke="#e11d48"
              strokeWidth="2.5"
            />
            <text x="155" y="72" className="text-[10px] font-bold fill-indigo-700">Peeks between teeth</text>
          </g>
        );

      case 'bilabial_closure':
      default:
        // Lips closed together (/p/, /b/, /m/)
        return (
          <g>
            <path
              d="M 75 160 C 95 150, 125 140, 150 130 C 160 120, 160 110, 145 110 C 125 120, 105 140, 70 160 Z"
              fill="#fda4af"
              stroke="#e11d48"
              strokeWidth="2.5"
            />
            <circle cx="185" cy="85" r="7" fill="#ef4444" opacity="0.5" />
            <text x="145" y="110" className="text-[10px] font-bold fill-rose-700">Lips press firmly</text>
          </g>
        );
    }
  };

  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-4 shadow-xs ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mouth & Tongue Map</span>
          <span className="text-sm font-extrabold text-sky-700 font-mono">/{meta.ipa}/</span>
        </div>
        <span className="text-xs text-slate-500 font-medium">
          {meta.placeOfArticulation} · {meta.mannerOfArticulation}
        </span>
      </div>

      {/* Sagittal Cross-Section Anatomical Diagram */}
      <div className="relative w-full aspect-16/10 bg-slate-50/80 rounded-lg border border-slate-100 flex items-center justify-center overflow-hidden">
        <svg
          viewBox="0 0 240 180"
          className="w-full h-full max-h-56"
          aria-label={`Articulatory anatomy diagram showing mouth placement for phoneme /${meta.ipa}/`}
        >
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-angle">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#0284c7" />
            </marker>
          </defs>

          {/* Hard Palate & Upper Jaw Contour */}
          <path
            d="M 60 40 C 90 40, 120 48, 145 60 C 160 68, 172 75, 175 80"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Upper Incisor (Tooth) */}
          <rect x="172" y="74" width="7" height="14" rx="2" fill="#ffffff" stroke="#64748b" strokeWidth="1.5" />

          {/* Lower Incisor (Tooth) */}
          <rect x="168" y="96" width="7" height="14" rx="2" fill="#ffffff" stroke="#64748b" strokeWidth="1.5" />

          {/* Lips (Upper & Lower) */}
          <path
            d="M 175 70 C 190 70, 195 78, 185 85"
            fill="none"
            stroke="#f43f5e"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M 170 115 C 190 115, 195 105, 185 96"
            fill="none"
            stroke="#f43f5e"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Soft Palate / Velum */}
          <path
            d="M 60 40 C 80 50, 95 62, 105 75"
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Tongue placement according to sound */}
          {renderTongueShape()}

          {/* Vocal cords (Pharynx) */}
          <path
            d="M 65 170 L 65 130 C 65 110, 60 90, 55 70"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2.5"
          />
        </svg>

        {/* Anatomical Reference Labels */}
        <div className="absolute top-2 left-2 text-[10px] text-slate-500 font-medium">
          Roof of mouth (Palate)
        </div>
        <div className="absolute bottom-2 right-2 text-[10px] text-slate-500 font-medium">
          Teeth & Lips
        </div>
      </div>

      {/* Child-Friendly Tactile / Visual Cue */}
      <div className="mt-3 p-2.5 bg-sky-50/70 border border-sky-100 rounded-lg">
        <div className="flex items-center gap-1.5 text-xs font-bold text-sky-900 mb-0.5">
          <span>Kid Secret Cue:</span>
        </div>
        <p className="text-xs text-sky-800 leading-relaxed font-medium">
          {articulatoryTip || meta.tactileCueText}
        </p>
      </div>
    </div>
  );
};
