import React, { useState } from 'react';
import { MINIMAL_PAIRS } from '../../data/minimalPairs';
import { SpeechSynthesisService } from '../../engine/speechSynthesis';
import { Volume2, Sparkles, Check, HelpCircle } from 'lucide-react';

export const MinimalPairsGame: React.FC = () => {
  const [selectedPairIndex, setSelectedPairIndex] = useState(0);
  const [targetWordChoice, setTargetWordChoice] = useState<'A' | 'B'>('A');
  const [userChoice, setUserChoice] = useState<'A' | 'B' | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const synth = new SpeechSynthesisService();
  const pair = MINIMAL_PAIRS[selectedPairIndex];

  const handlePlayChallenge = () => {
    const word = targetWordChoice === 'A' ? pair.wordA.text : pair.wordB.text;
    synth.speak(word, 'en-US', 0.8, 1.1);
  };

  const handleChoose = (choice: 'A' | 'B') => {
    setUserChoice(choice);
    if (choice === targetWordChoice) {
      setFeedback('You heard it! Your ears are super sharp!');
    } else {
      setFeedback('Nice try! Listen to how the tongue changes between the two words.');
    }
  };

  const handleNextChallenge = () => {
    const nextChoice: 'A' | 'B' = Math.random() > 0.5 ? 'A' : 'B';
    setTargetWordChoice(nextChoice);
    setUserChoice(null);
    setFeedback(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span>Minimal Pairs Contrast Game</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Train your ears to spot the tiny difference between two similar sounds!
          </p>
        </div>

        {/* Pair selector */}
        <select
          value={selectedPairIndex}
          onChange={(e) => {
            setSelectedPairIndex(Number(e.target.value));
            setUserChoice(null);
            setFeedback(null);
          }}
          className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
        >
          {MINIMAL_PAIRS.map((p, idx) => (
            <option key={p.id} value={idx}>
              {p.wordA.text} vs {p.wordB.text} (/{p.phonemeA}/ vs /{p.phonemeB}/)
            </option>
          ))}
        </select>
      </div>

      <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/60 mb-5 text-xs text-amber-900 font-medium flex items-center gap-2">
        <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
        <span>{pair.promptInstructions}</span>
      </div>

      {/* Challenge Button */}
      <div className="text-center py-4 bg-slate-50 rounded-xl border border-slate-200 mb-6">
        <button
          onClick={handlePlayChallenge}
          className="px-6 py-3 bg-sky-600 text-white rounded-xl text-sm font-bold hover:bg-sky-700 transition-colors inline-flex items-center gap-2 shadow-xs"
        >
          <Volume2 className="w-5 h-5" />
          <span>Press to Listen to Mystery Word</span>
        </button>
        <span className="text-xs text-slate-400 block mt-2">Which word did you hear?</span>
      </div>

      {/* Two Contrast Choices */}
      <div className="grid grid-cols-2 gap-4">
        {/* Choice A */}
        <button
          onClick={() => handleChoose('A')}
          className={`p-6 rounded-2xl border-2 text-center transition-all ${
            userChoice === 'A'
              ? userChoice === targetWordChoice
                ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-md ring-2 ring-emerald-200'
                : 'border-amber-400 bg-amber-50 text-amber-900'
              : 'border-slate-200 bg-white hover:border-sky-300 hover:bg-sky-50/50'
          }`}
        >
          <div className="text-2xl font-extrabold text-slate-900 mb-1">{pair.wordA.text}</div>
          <div className="text-xs font-mono text-slate-500 font-semibold mb-2">/{pair.wordA.ipa}/</div>
          <div className="text-xs font-medium text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md inline-block">
            Sound: /{pair.phonemeA}/
          </div>
          {userChoice === 'A' && userChoice === targetWordChoice && (
            <div className="mt-3 flex items-center justify-center gap-1 text-xs font-bold text-emerald-700">
              <Check className="w-4 h-4" /> Got it!
            </div>
          )}
        </button>

        {/* Choice B */}
        <button
          onClick={() => handleChoose('B')}
          className={`p-6 rounded-2xl border-2 text-center transition-all ${
            userChoice === 'B'
              ? userChoice === targetWordChoice
                ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-md ring-2 ring-emerald-200'
                : 'border-amber-400 bg-amber-50 text-amber-900'
              : 'border-slate-200 bg-white hover:border-sky-300 hover:bg-sky-50/50'
          }`}
        >
          <div className="text-2xl font-extrabold text-slate-900 mb-1">{pair.wordB.text}</div>
          <div className="text-xs font-mono text-slate-500 font-semibold mb-2">/{pair.wordB.ipa}/</div>
          <div className="text-xs font-medium text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md inline-block">
            Sound: /{pair.phonemeB}/
          </div>
          {userChoice === 'B' && userChoice === targetWordChoice && (
            <div className="mt-3 flex items-center justify-center gap-1 text-xs font-bold text-emerald-700">
              <Check className="w-4 h-4" /> Got it!
            </div>
          )}
        </button>
      </div>

      {feedback && (
        <div className="mt-5 text-center">
          <p className="text-sm font-bold text-slate-800 mb-3">{feedback}</p>
          <button
            onClick={handleNextChallenge}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            Play Next Round
          </button>
        </div>
      )}
    </div>
  );
};
