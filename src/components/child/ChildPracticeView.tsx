import React, { useState, useRef, useEffect } from 'react';
import { WordItem } from '../../types/content';
import { ChildProfile } from '../../types/patient';
import { SpeechAttemptResult } from '../../types/speech';
import { AdaptiveLearningEngine, PhonemeMasteryState } from '../../engine/adaptiveEngine';
import { AudioCaptureEngine } from '../../engine/audioCapture';
import { GOPScoringEngine } from '../../engine/gopScorer';
import { SpeechSynthesisService } from '../../engine/speechSynthesis';
import { ArticulatoryVisualizer } from './ArticulatoryVisualizer';
import { WaveformPitchVisualizer } from './WaveformPitchVisualizer';
import { MascotFeedback } from './MascotFeedback';
import { FluencyMetronome } from './FluencyMetronome';
import { ApraxiaDrillView } from './ApraxiaDrillView';
import { MinimalPairsGame } from './MinimalPairsGame';
import {
  Mic,
  Square,
  Volume2,
  ChevronRight,
  Award,
  Flame,
  Clock,
  Coffee,
  Send,
} from 'lucide-react';

interface ChildPracticeViewProps {
  child: ChildProfile;
  wordBank: WordItem[];
  onAttemptCompleted: (result: SpeechAttemptResult) => void;
  acceptedVariants: string[];
}

const INITIAL_MASTERY: Record<string, PhonemeMasteryState> = {
  'ɹ': { phoneme: 'ɹ', pMastery: 0.65, totalAttempts: 12, recentAccuracies: [true, false, true], mastered: false, consecutiveSuccessCount: 1 },
  s: { phoneme: 's', pMastery: 0.82, totalAttempts: 18, recentAccuracies: [true, true, true], mastered: true, consecutiveSuccessCount: 3 },
  l: { phoneme: 'l', pMastery: 0.58, totalAttempts: 8, recentAccuracies: [false, true], mastered: false, consecutiveSuccessCount: 1 },
  'ʈ': { phoneme: 'ʈ', pMastery: 0.88, totalAttempts: 10, recentAccuracies: [true, true, true], mastered: true, consecutiveSuccessCount: 3 },
  k: { phoneme: 'k', pMastery: 0.72, totalAttempts: 9, recentAccuracies: [true, true], mastered: false, consecutiveSuccessCount: 2 },
};

export const ChildPracticeView: React.FC<ChildPracticeViewProps> = ({
  child,
  wordBank,
  onAttemptCompleted,
  acceptedVariants,
}) => {
  const [activeMode, setActiveMode] = useState<'words' | 'picture_naming' | 'minimal_pairs' | 'fluency' | 'apraxia'>('words');
  const [selectedPhoneme, setSelectedPhoneme] = useState<string>('ɹ');
  const [selectedPosition, setSelectedPosition] = useState<'all' | 'initial' | 'medial' | 'final'>('all');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  const [isRecording, setIsRecording] = useState(false);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [lastAttempt, setLastAttempt] = useState<SpeechAttemptResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [micNotice, setMicNotice] = useState<string | null>(null);
  const [simulatedInput, setSimulatedInput] = useState('');

  const [masteryMap, setMasteryMap] = useState<Record<string, PhonemeMasteryState>>(INITIAL_MASTERY);
  const [sessionMinutesElapsed, setSessionMinutesElapsed] = useState(4);
  const [showBreakReminder, setShowBreakReminder] = useState(false);

  const audioCaptureRef = useRef<AudioCaptureEngine | null>(null);
  const scoringEngineRef = useRef<GOPScoringEngine>(new GOPScoringEngine());
  const adaptiveEngineRef = useRef<AdaptiveLearningEngine>(new AdaptiveLearningEngine());
  const synthRef = useRef<SpeechSynthesisService>(new SpeechSynthesisService());

  // Filter word list by phoneme and position
  const filteredWords = wordBank.filter((w) => {
    const matchesPhoneme = activeMode === 'picture_naming' ? Boolean(w.acceptedCodeSwitchAlternates?.length) : w.targetPhoneme === selectedPhoneme;
    const matchesPos = selectedPosition === 'all' || w.targetPosition === selectedPosition;
    return matchesPhoneme && matchesPos;
  });

  const effectiveList = filteredWords.length > 0 ? filteredWords : wordBank;
  const activeWord: WordItem = effectiveList[currentWordIndex % effectiveList.length];

  const currentMastery = masteryMap[activeWord.targetPhoneme] || {
    phoneme: activeWord.targetPhoneme,
    pMastery: 0.45,
    totalAttempts: 0,
    recentAccuracies: [],
    mastered: false,
    consecutiveSuccessCount: 0,
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setSessionMinutesElapsed((prev) => {
        const next = prev + 1;
        if (next >= child.sessionTimeCapMinutes) {
          setShowBreakReminder(true);
        }
        return next;
      });
    }, 60000);
    return () => clearInterval(timer);
  }, [child.sessionTimeCapMinutes]);

  const recordAndUpdateMastery = (result: SpeechAttemptResult) => {
    setLastAttempt(result);
    const isSuccess = result.overallGOP >= 0.75 || result.isAcceptedVariant;
    const updatedMastery = adaptiveEngineRef.current.updateMastery(currentMastery, isSuccess);
    setMasteryMap((prev) => ({
      ...prev,
      [activeWord.targetPhoneme]: updatedMastery,
    }));
    onAttemptCompleted(result);
  };

  const handleHearModel = (slowStretch = false) => {
    const locale =
      activeWord.language === 'hi_IN'
        ? 'hi-IN'
        : activeWord.language === 'ta_IN'
        ? 'ta-IN'
        : activeWord.language === 'bn_IN'
        ? 'bn-IN'
        : activeWord.language === 'es_ES'
        ? 'es-ES'
        : 'en-IN';
    synthRef.current.speak(activeWord.text.split('(')[0].trim(), locale, slowStretch ? 0.55 : 0.84, 1.12);
  };

  const handleStartRecording = async () => {
    setMicNotice(null);
    try {
      if (!audioCaptureRef.current) {
        audioCaptureRef.current = new AudioCaptureEngine();
      }
      const initialized = await audioCaptureRef.current.requestPermissionAndInit();
      if (!initialized) {
        setMicNotice('Microphone access is unavailable in this browser frame. Use the Quick Voice Simulator below to test any spoken word or code-switch!');
        return;
      }
      setAnalyser(audioCaptureRef.current.getAnalyser());
      audioCaptureRef.current.startRecording();
      setIsRecording(true);
      setLastAttempt(null);
    } catch {
      setMicNotice('Microphone unavailable. Try the Quick Voice Simulator below to test speech scoring!');
    }
  };

  const handleStopRecording = async () => {
    if (!audioCaptureRef.current || !isRecording) return;
    setIsRecording(false);
    setIsAnalyzing(true);

    try {
      const { samples16kHz, wavBlob } = await audioCaptureRef.current.stopRecording();
      const audioUrl = URL.createObjectURL(wavBlob);

      const result = await scoringEngineRef.current.scoreAudioAttempt(
        samples16kHz,
        activeWord,
        child.id,
        acceptedVariants,
        audioUrl
      );
      recordAndUpdateMastery(result);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSimulateUtterance = (utterance: string) => {
    if (!utterance.trim()) return;
    setIsAnalyzing(true);
    setMicNotice(null);
    const result = scoringEngineRef.current.evaluateUtteranceText(
      utterance,
      activeWord,
      child.id,
      acceptedVariants
    );
    recordAndUpdateMastery(result);
    setSimulatedInput('');
    setIsAnalyzing(false);
  };

  const handleNextAdaptiveWord = () => {
    setCurrentWordIndex((prev) => (prev + 1) % effectiveList.length);
    setLastAttempt(null);
  };

  // Build quick simulation options tailored to the current word
  const baseText = activeWord.text.split('(')[0].trim().toLowerCase();
  const primaryAlt = activeWord.acceptedCodeSwitchAlternates?.[0];
  const glidingSample =
    activeWord.targetPhoneme === 'ɹ' && baseText.startsWith('r')
      ? `w${baseText.slice(1)}`
      : activeWord.targetPhoneme === 'k' && baseText.startsWith('c')
      ? `t${baseText.slice(1)}`
      : activeWord.targetPhoneme === 's' && baseText.startsWith('s')
      ? `th${baseText.slice(1)}`
      : `${baseText[0]}-${baseText[0]}-${baseText}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Child Summary Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-display font-extrabold text-slate-900">
            Let’s Play & Practice, {child.name.split(' ')[0]}!
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
            <span>Languages: {child.homeLanguages.join(' + ')}</span>
            <span aria-hidden="true">·</span>
            <span>Code-switching respected</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              BKT Mastery /{activeWord.targetPhoneme}/: {Math.round(currentMastery.pMastery * 100)}%
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-5 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-orange-700">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="font-mono tabular-nums">{child.streakDays} day streak</span>
          </div>
          <div className="flex items-center gap-1.5 font-semibold text-amber-700">
            <Award className="w-4 h-4 text-amber-500" />
            <span className="font-mono tabular-nums">{child.totalStars} stars</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium text-slate-600">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="font-mono tabular-nums">
              {sessionMinutesElapsed} / {child.sessionTimeCapMinutes} min cap
            </span>
          </div>
        </div>
      </div>

      {/* Age-appropriate Break Reminder */}
      {showBreakReminder && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-wrap items-center justify-between gap-4 text-amber-950">
          <div className="flex items-center gap-3">
            <Coffee className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="text-xs">
              <span className="font-bold block">Time for a joyful stretch break!</span>
              <span>Short {child.sessionTimeCapMinutes}-minute sessions keep speech muscles fresh and happy.</span>
            </div>
          </div>
          <button
            onClick={() => setShowBreakReminder(false)}
            className="px-3.5 py-2 bg-amber-200/80 hover:bg-amber-300 text-amber-950 rounded-lg text-xs font-semibold cursor-pointer"
          >
            Continue Session
          </button>
        </div>
      )}

      {/* Exercise Mode Segmented Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-xl">
          {[
            { id: 'words', label: 'Word Repetition' },
            { id: 'picture_naming', label: 'Picture Naming (Code-Switch)' },
            { id: 'minimal_pairs', label: 'Minimal Pairs' },
            { id: 'fluency', label: 'Fluency Metronome' },
            { id: 'apraxia', label: 'Apraxia Motor Drills' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveMode(tab.id as typeof activeMode);
                setCurrentWordIndex(0);
                setLastAttempt(null);
              }}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeMode === tab.id
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Target Phoneme & Position Filter */}
        {(activeMode === 'words' || activeMode === 'picture_naming') && (
          <div className="flex flex-wrap items-center gap-3">
            {activeMode === 'words' && (
              <div className="flex items-center gap-1">
                {['ɹ', 's', 'l', 'ʈ', 'k'].map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setSelectedPhoneme(p);
                      setCurrentWordIndex(0);
                      setLastAttempt(null);
                    }}
                    className={`w-8 h-8 rounded-lg text-xs font-bold font-mono transition-colors cursor-pointer ${
                      selectedPhoneme === p
                        ? 'bg-sky-600 text-white'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    /{p}/
                  </button>
                ))}
              </div>
            )}

            <select
              value={selectedPosition}
              onChange={(e) => {
                setSelectedPosition(e.target.value as typeof selectedPosition);
                setCurrentWordIndex(0);
              }}
              className="px-2.5 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="all">All Positions</option>
              <option value="initial">Initial Position</option>
              <option value="medial">Medial Position</option>
              <option value="final">Final Position</option>
            </select>
          </div>
        )}
      </div>

      {/* Specialized Sub-Views */}
      {activeMode === 'minimal_pairs' && <MinimalPairsGame />}
      {activeMode === 'fluency' && <FluencyMetronome />}
      {activeMode === 'apraxia' && <ApraxiaDrillView />}

      {/* Word Repetition & Picture Naming Main Stage */}
      {(activeMode === 'words' || activeMode === 'picture_naming') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Stage: Stimulus Card + Huge Mic + Quick Utterance Simulator */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 text-center space-y-6">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-mono tabular-nums">
                  Card {(currentWordIndex % effectiveList.length) + 1} / {effectiveList.length}
                </span>
                <span>
                  Target /{activeWord.targetPhoneme}/ · {activeWord.targetPosition} · {activeWord.syllableShape}
                </span>
              </div>

              <div className="py-2 space-y-2">
                {activeMode === 'picture_naming' && (
                  <p className="text-xs font-semibold text-sky-700">
                    Name this item in any of your home languages!
                  </p>
                )}

                <h2 className="text-4xl sm:text-5xl font-display font-extrabold text-slate-900 tracking-tight">
                  {activeWord.text}
                </h2>

                <div className="font-mono text-base font-bold text-sky-700">
                  /{activeWord.ipa}/
                </div>

                {activeWord.acceptedCodeSwitchAlternates && activeWord.acceptedCodeSwitchAlternates.length > 0 && (
                  <p className="text-xs text-slate-500 pt-1">
                    Valid home-language words accepted:{' '}
                    <span className="font-semibold text-slate-700">
                      {activeWord.acceptedCodeSwitchAlternates.join(' · ')}
                    </span>
                  </p>
                )}
              </div>

              {/* Auditory Model & Slow Syllable Stretch Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => handleHearModel(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Volume2 className="w-4 h-4 text-sky-600" />
                  <span>Hear Voice Model</span>
                </button>

                <button
                  onClick={() => handleHearModel(true)}
                  className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Volume2 className="w-4 h-4 text-indigo-600" />
                  <span>Say It Slowly (Stretch)</span>
                </button>
              </div>

              {micNotice && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 text-left">
                  {micNotice}
                </div>
              )}

              {/* Huge Pediatric Hold-to-Speak Microphone Button */}
              <div className="flex flex-col items-center justify-center gap-3 py-2">
                <button
                  onMouseDown={handleStartRecording}
                  onMouseUp={handleStopRecording}
                  onTouchStart={handleStartRecording}
                  onTouchEnd={handleStopRecording}
                  disabled={isAnalyzing}
                  className={`w-28 h-28 rounded-full flex flex-col items-center justify-center transition-transform active:scale-95 select-none cursor-pointer shadow-md ${
                    isRecording
                      ? 'bg-rose-600 text-white ring-8 ring-rose-100'
                      : 'bg-sky-600 hover:bg-sky-700 text-white ring-4 ring-sky-100'
                  }`}
                  aria-label={isRecording ? 'Release to check speech' : 'Hold to speak'}
                >
                  {isRecording ? (
                    <>
                      <Square className="w-9 h-9 mb-1" />
                      <span className="text-[11px] font-bold">Listening...</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-9 h-9 mb-1" />
                      <span className="text-[11px] font-bold">Hold & Speak</span>
                    </>
                  )}
                </button>
                <span className="text-xs text-slate-500">
                  {isAnalyzing
                    ? 'Analyzing phonemes & formants...'
                    : isRecording
                    ? 'Release button when you finish saying the word'
                    : 'Press and hold microphone—or use quick test utterances below'}
                </span>
              </div>

              {/* Interactive Utterance Simulator (for testing code-switching & errors without hardware mic) */}
              <div className="pt-5 border-t border-slate-100 text-left space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-slate-700">
                    Test Spoken Utterance (Code-Switch & Phoneme Simulator):
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSimulateUtterance(baseText)}
                      className="px-2.5 py-1 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-mono text-slate-700 cursor-pointer"
                    >
                      &ldquo;{baseText}&rdquo;
                    </button>
                    {primaryAlt && (
                      <button
                        type="button"
                        onClick={() => handleSimulateUtterance(primaryAlt)}
                        className="px-2.5 py-1 rounded border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-xs font-mono text-emerald-900 cursor-pointer"
                      >
                        &ldquo;{primaryAlt}&rdquo; (code-switch)
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleSimulateUtterance(glidingSample)}
                      className="px-2.5 py-1 rounded border border-amber-200 bg-amber-50 hover:bg-amber-100 text-xs font-mono text-amber-900 cursor-pointer"
                    >
                      &ldquo;{glidingSample}&rdquo;
                    </button>
                  </div>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSimulateUtterance(simulatedInput);
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={simulatedInput}
                    onChange={(e) => setSimulatedInput(e.target.value)}
                    placeholder={`Type what the child said (e.g. "${primaryAlt || baseText}")...`}
                    className="flex-1 px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:border-sky-600 focus:outline-hidden"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Score</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleNextAdaptiveWord}
                    className="px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>

            {/* Companion Mascot Encouragement (never shows raw percentages to child) */}
            {lastAttempt && (
              <MascotFeedback
                stars={lastAttempt.encouragementStars}
                feedbackMessage={lastAttempt.childFeedback}
                isAcceptedVariant={lastAttempt.isAcceptedVariant}
                onHearModel={() => handleHearModel(false)}
              />
            )}
          </div>

          {/* Right Stage: Real-Time Oscilloscope + Sagittal Mouth/Tongue Placement */}
          <div className="lg:col-span-5 space-y-6">
            <WaveformPitchVisualizer
              analyserNode={analyser}
              isRecording={isRecording}
              meanPitchHz={lastAttempt?.phonemes[0]?.pitchF0Hz}
            />

            <ArticulatoryVisualizer
              targetPhoneme={activeWord.targetPhoneme}
              articulatoryTip={
                lastAttempt?.phonemes.find((p) => p.status === 'needs_practice')?.articulatoryTip
              }
            />
          </div>
        </div>
      )}
    </div>
  );
};
