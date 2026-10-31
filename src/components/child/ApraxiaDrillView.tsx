import React, { useState } from 'react';
import { ApraxiaSequence } from '../../types/content';
import { APRAXIA_SEQUENCES } from '../../data/apraxiaSequences';
import { SpeechSynthesisService } from '../../engine/speechSynthesis';
import { Volume2, CheckCircle2, ChevronRight, Activity, ArrowRight } from 'lucide-react';

export const ApraxiaDrillView: React.FC = () => {
  const [selectedSequenceIndex, setSelectedSequenceIndex] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const synth = new SpeechSynthesisService();
  const sequence: ApraxiaSequence = APRAXIA_SEQUENCES[selectedSequenceIndex];
  const step = sequence.steps[currentStepIndex];

  const handlePlayModel = (text: string) => {
    synth.speak(text, 'en-US', 0.75, 1.1);
  };

  const handleNextStep = () => {
    if (!completedSteps.includes(currentStepIndex)) {
      setCompletedSteps([...completedSteps, currentStepIndex]);
    }
    if (currentStepIndex < sequence.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            <span>Motor Speech Planning (Apraxia Mode)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Step-by-step syllable sequencing to strengthen brain-to-mouth coordination.
          </p>
        </div>

        {/* Level Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
          {APRAXIA_SEQUENCES.map((seq, idx) => (
            <button
              key={seq.id}
              onClick={() => {
                setSelectedSequenceIndex(idx);
                setCurrentStepIndex(0);
                setCompletedSteps([]);
              }}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors ${
                selectedSequenceIndex === idx
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {seq.level}
            </button>
          ))}
        </div>
      </div>

      <div className="text-xs font-semibold text-indigo-900 bg-indigo-50 border border-indigo-100 px-3 py-2 rounded-lg mb-4">
        {sequence.title}
      </div>

      {/* Syllable Train Step Indicator */}
      <div className="flex items-center justify-between gap-2 my-5">
        {sequence.steps.map((st, idx) => {
          const isCurrent = idx === currentStepIndex;
          const isDone = completedSteps.includes(idx);

          return (
            <div key={idx} className="flex-1 flex items-center gap-1">
              <button
                onClick={() => setCurrentStepIndex(idx)}
                className={`w-full py-3 px-2 rounded-xl border text-center transition-all ${
                  isCurrent
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-200 font-extrabold shadow-xs'
                    : isDone
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800 font-bold'
                    : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  <span className="text-base tracking-wide font-mono">{st.syllable}</span>
                  {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                </div>
                <span className="text-[10px] text-slate-400 block font-mono">/{st.ipa}/</span>
              </button>

              {idx < sequence.steps.length - 1 && (
                <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Interactive Current Step Card */}
      <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 text-center">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
          Step {currentStepIndex + 1} of {sequence.steps.length}
        </span>
        <div className="text-4xl font-extrabold text-slate-900 font-mono tracking-wider mb-2">
          {step.syllable}
        </div>
        <p className="text-sm font-semibold text-slate-700 max-w-md mx-auto mb-4">
          "{step.auditoryModelText}"
        </p>

        <div className="inline-flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-lg text-xs text-indigo-900 font-medium mb-4">
          <span className="font-bold text-indigo-700">Tactile Placement:</span>
          <span>{step.visualPlacementHint}</span>
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => handlePlayModel(step.syllable)}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-800 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Volume2 className="w-4 h-4 text-indigo-600" />
            <span>Hear Model</span>
          </button>

          <button
            onClick={handleNextStep}
            className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <span>{currentStepIndex === sequence.steps.length - 1 ? 'Complete Sequence' : 'Next Syllable'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
