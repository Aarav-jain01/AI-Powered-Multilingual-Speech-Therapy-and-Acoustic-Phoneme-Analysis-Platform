import React, { useState } from 'react';
import { ClinicianCaseloadItem, GoldLabelCorrection, SMARTGoal } from '../../types/clinical';
import { SpeechAttemptResult } from '../../types/speech';
import { SpeechSynthesisService } from '../../engine/speechSynthesis';
import {
  AlertTriangle,
  Check,
  Download,
  Edit3,
  Play,
  Plus,
} from 'lucide-react';

interface ClinicianPortalProps {
  caseload: ClinicianCaseloadItem[];
  recentAttempts: SpeechAttemptResult[];
  goldCorrections: GoldLabelCorrection[];
  goals: SMARTGoal[];
  onCommitGoldCorrection: (correction: GoldLabelCorrection) => Promise<void>;
  onUpdateAcceptedVariants: (childId: string, variants: string[]) => Promise<void>;
  onCreateGoal: (goal: SMARTGoal) => Promise<void>;
}

export const ClinicianPortal: React.FC<ClinicianPortalProps> = ({
  caseload,
  recentAttempts,
  goldCorrections,
  goals,
  onCommitGoldCorrection,
  onUpdateAcceptedVariants,
  onCreateGoal,
}) => {
  const [selectedChildId, setSelectedChildId] = useState<string>(caseload[0]?.childId || 'child_aarav_01');
  const [queueFilter, setQueueFilter] = useState<'all' | 'flagged' | 'overridden'>('all');
  const [selectedAttemptId, setSelectedAttemptId] = useState<string>(recentAttempts[0]?.attemptId || '');
  const [activePhonemeIdx, setActivePhonemeIdx] = useState<number>(0);

  const [overrideIPA, setOverrideIPA] = useState('');
  const [correctionNotes, setCorrectionNotes] = useState('');
  const [savedBanner, setSavedBanner] = useState(false);

  const [customVariantInput, setCustomVariantInput] = useState('');
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [newTargetPhoneme, setNewTargetPhoneme] = useState('ɹ');
  const [newPosition, setNewPosition] = useState<'initial' | 'medial' | 'final' | 'all'>('initial');
  const [newTargetAccuracy, setNewTargetAccuracy] = useState(80);
  const [newGoalNotes, setNewGoalNotes] = useState('');

  const synth = new SpeechSynthesisService();

  const selectedChild = caseload.find((c) => c.childId === selectedChildId) || caseload[0];
  const filteredAttempts = recentAttempts.filter((a) => {
    if (queueFilter === 'flagged') return a.clinicianReviewStatus === 'flagged';
    if (queueFilter === 'overridden') return a.clinicianReviewStatus === 'overridden';
    return true;
  });

  const selectedAttempt =
    filteredAttempts.find((a) => a.attemptId === selectedAttemptId) ||
    filteredAttempts[0] ||
    recentAttempts[0] ||
    null;

  const childGoals = goals.filter((g) => g.childId === selectedChild?.childId);

  const handlePlayRecording = () => {
    if (!selectedAttempt) return;
    if (selectedAttempt.recordedAudioUrl) {
      const audio = new Audio(selectedAttempt.recordedAudioUrl);
      audio.play().catch(() => {
        synth.speak(selectedAttempt.targetWord, 'en-IN', 0.8, 1.2);
      });
    } else {
      synth.speak(selectedAttempt.targetWord, 'en-IN', 0.8, 1.2);
    }
  };

  const handleCommitOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAttempt) return;

    await onCommitGoldCorrection({
      attemptId: selectedAttempt.attemptId,
      clinicianId: 'slp_dr_neha_rao',
      originalRecognizedIPA: selectedAttempt.recognizedIPA,
      correctedIPA: overrideIPA.trim() || selectedAttempt.targetIPA,
      notes: correctionNotes.trim() || 'SLP verified acoustic phoneme segmentation.',
      acousticAgreement: false,
      timestamp: new Date().toISOString(),
    });

    setOverrideIPA('');
    setCorrectionNotes('');
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 2500);
  };

  const handleToggleVariant = async (variantKey: string) => {
    if (!selectedChild) return;
    const current = selectedChild.acceptedVariants;
    const next = current.includes(variantKey)
      ? current.filter((v) => v !== variantKey)
      : [...current, variantKey];
    await onUpdateAcceptedVariants(selectedChild.childId, next);
  };

  const handleAddCustomVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChild || !customVariantInput.trim()) return;
    const key = customVariantInput.trim().toLowerCase().replace(/\s+/g, '_');
    if (!selectedChild.acceptedVariants.includes(key)) {
      await onUpdateAcceptedVariants(selectedChild.childId, [...selectedChild.acceptedVariants, key]);
    }
    setCustomVariantInput('');
  };

  const handleSubmitGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChild) return;
    const goal: SMARTGoal = {
      id: `goal_${Date.now().toString(36)}`,
      childId: selectedChild.childId,
      targetPhoneme: newTargetPhoneme,
      position: newPosition,
      targetAccuracy: newTargetAccuracy,
      consecutiveSessionsRequired: 3,
      currentAccuracy: 52,
      startDate: new Date().toISOString().slice(0, 10),
      targetCompletionDate: '2026-12-15',
      status: 'active',
      notes: newGoalNotes.trim() || `Achieve ${newTargetAccuracy}% accuracy for /${newTargetPhoneme}/ (${newPosition}) across 3 consecutive sessions.`,
    };
    await onCreateGoal(goal);
    setNewGoalNotes('');
    setShowGoalModal(false);
  };

  const handleExportIEP = () => {
    if (!selectedChild) return;
    const csvHeader = 'ChildName,Age,Diagnosis,GoalPhoneme,Position,CurrentAccuracy,TargetAccuracy,Status\n';
    const csvRows = childGoals
      .map(
        (g) =>
          `"${selectedChild.childName}",${selectedChild.age},${selectedChild.primaryDiagnosis},"/${g.targetPhoneme}/",${g.position},${g.currentAccuracy}%,${g.targetAccuracy}%,${g.status}`
      )
      .join('\n');
    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IEP_Goals_${selectedChild.childName.replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Clinician Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-display font-extrabold text-slate-900">
            SLP Clinical Review Portal · Dr. Neha Rao, CCC-SLP
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
            <span>RCI License #A8912</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{caseload.length} active pediatric patients</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{goldCorrections.length} gold labels committed</span>
          </div>
        </div>

        <button
          onClick={handleExportIEP}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 inline-flex items-center gap-1.5 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export IEP Documentation (CSV)</span>
        </button>
      </div>

      {/* Caseload Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {caseload.map((patient) => {
          const isSelected = patient.childId === selectedChild?.childId;
          return (
            <button
              key={patient.childId}
              onClick={() => setSelectedChildId(patient.childId)}
              className={`p-4 rounded-xl border text-left transition-colors cursor-pointer ${
                isSelected
                  ? 'border-sky-600 bg-sky-50/40'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">{patient.childName}</span>
                <span className="text-xs font-mono tabular-nums text-slate-500">Age {patient.age}</span>
              </div>
              <div className="text-xs text-slate-600 mt-1">
                {patient.languages.join(' + ')} · <span className="capitalize">{patient.primaryDiagnosis}</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-3 mt-3 border-t border-slate-100">
                <span className="font-mono tabular-nums text-slate-500">
                  {patient.unreviewedRecordingsCount} flagged
                </span>
                {patient.riskAlert ? (
                  <span className="font-semibold text-amber-700 inline-flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>
                      {patient.riskAlert === 'stagnation_3w' ? '3-Week Stagnation' : 'High %SS Fluency'}
                    </span>
                  </span>
                ) : (
                  <span className="font-semibold text-emerald-700 inline-flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>On Track</span>
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Queue + Synchronized Waveform & Phoneme Alignment + Gold Label Override */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Synchronized Phoneme Alignment & Override Queue
                </h2>
                <p className="text-xs text-slate-500">
                  Select any recorded clip to inspect acoustic segments and override AI labels.
                </p>
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                {(['all', 'flagged', 'overridden'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setQueueFilter(f)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md capitalize cursor-pointer ${
                      queueFilter === f ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Recording Selector Strip */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {filteredAttempts.map((att) => {
                const active = att.attemptId === selectedAttempt?.attemptId;
                return (
                  <button
                    key={att.attemptId}
                    onClick={() => {
                      setSelectedAttemptId(att.attemptId);
                      setActivePhonemeIdx(0);
                    }}
                    className={`px-3 py-2 rounded-lg border text-left text-xs shrink-0 cursor-pointer ${
                      active
                        ? 'border-sky-600 bg-sky-50 text-slate-900 font-semibold'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block">{att.targetWord}</span>
                    <span className="font-mono text-[11px] text-slate-400">
                      GOP {Math.round(att.overallGOP * 100)}% · {att.clinicianReviewStatus}
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedAttempt ? (
              <>
                {/* Synchronized Waveform + Phoneme Overlay Dark Console */}
                <div className="p-5 bg-slate-950 rounded-xl border border-slate-800 text-white space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="text-xs text-slate-400">Stimulus: </span>
                      <strong className="text-sm font-bold">{selectedAttempt.targetWord}</strong>
                      <span className="text-slate-600 mx-2">·</span>
                      <span className="font-mono text-xs text-sky-400">
                        Target /{selectedAttempt.targetIPA}/ &rarr; AI /{selectedAttempt.recognizedIPA}/
                      </span>
                    </div>

                    <button
                      onClick={handlePlayRecording}
                      className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Play Audio</span>
                    </button>
                  </div>

                  {/* Simulated Waveform Envelope + Alignment Markers */}
                  <div className="h-16 flex items-center gap-1 px-2 bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
                    {Array.from({ length: 48 }).map((_, barIdx) => {
                      const heightPct = 20 + Math.abs(Math.sin(barIdx * 0.42)) * 70;
                      return (
                        <div
                          key={barIdx}
                          className="flex-1 bg-sky-400/75 rounded-xs"
                          style={{ height: `${heightPct}%` }}
                        />
                      );
                    })}
                  </div>

                  {/* Interactive Phoneme Alignment Segments */}
                  {selectedAttempt.phonemes.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {selectedAttempt.phonemes.map((ph, idx) => {
                        const isFocused = idx === activePhonemeIdx;
                        return (
                          <button
                            key={idx}
                            onClick={() => setActivePhonemeIdx(idx)}
                            className={`p-2.5 rounded-lg border text-center cursor-pointer transition-colors ${
                              ph.status === 'correct'
                                ? 'border-emerald-500/60 bg-emerald-950/40 text-emerald-300'
                                : ph.status === 'accepted_variant'
                                ? 'border-sky-500/60 bg-sky-950/40 text-sky-300'
                                : 'border-amber-500/60 bg-amber-950/40 text-amber-300'
                            } ${isFocused ? 'ring-2 ring-white' : ''}`}
                          >
                            <div className="font-mono text-base font-bold">/{ph.phoneme}/</div>
                            <div className="font-mono text-[11px] tabular-nums text-slate-300">
                              GOP {Math.round(ph.gopScore * 100)}%
                            </div>
                            <div className="font-mono text-[10px] tabular-nums text-slate-400">
                              {ph.startTimeMs}–{ph.endTimeMs}ms
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {selectedAttempt.phonemes[activePhonemeIdx] && (
                    <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300 font-mono">
                      <span>
                        Segment /{selectedAttempt.phonemes[activePhonemeIdx].phoneme}/ · F1{' '}
                        {selectedAttempt.phonemes[activePhonemeIdx].formants?.f1 || 440}Hz · F2{' '}
                        {selectedAttempt.phonemes[activePhonemeIdx].formants?.f2 || 1450}Hz · F3{' '}
                        {selectedAttempt.phonemes[activePhonemeIdx].formants?.f3 || 2480}Hz
                      </span>
                      <span className="text-sky-300 font-sans">
                        {selectedAttempt.disfluency.detected
                          ? `Estimate %SS: ${selectedAttempt.disfluency.percentSyllablesStuttered}%`
                          : selectedAttempt.phonemes[activePhonemeIdx].articulatoryTip || 'Clear segment'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Human-in-the-Loop Override Form */}
                <form
                  onSubmit={handleCommitOverride}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <Edit3 className="w-4 h-4 text-sky-600" />
                    <span>Override AI Label & Commit to Gold Retraining Set</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Gold IPA Transcription
                      </label>
                      <input
                        type="text"
                        value={overrideIPA}
                        onChange={(e) => setOverrideIPA(e.target.value)}
                        placeholder={selectedAttempt.goldLabel || selectedAttempt.targetIPA}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        SLP Clinical Observation
                      </label>
                      <input
                        type="text"
                        value={correctionNotes}
                        onChange={(e) => setCorrectionNotes(e.target.value)}
                        placeholder="e.g. Retroflex curl accurate despite background noise"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    {savedBanner ? (
                      <span className="text-xs font-semibold text-emerald-700 inline-flex items-center gap-1">
                        <Check className="w-4 h-4" />
                        <span>Gold label saved to retraining flywheel!</span>
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">
                        Current Gold Label:{' '}
                        <strong className="font-mono text-slate-800">
                          {selectedAttempt.goldLabel || 'Unverified'}
                        </strong>
                      </span>
                    )}

                    <button
                      type="submit"
                      className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 cursor-pointer"
                    >
                      Save Gold Label
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <p className="text-xs text-slate-500 py-8 text-center">
                No recordings match the selected filter.
              </p>
            )}
          </div>

          {/* Committed Gold-Label Retraining Log */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">
              Committed Gold-Label Retraining Queue ({goldCorrections.length})
            </h3>
            <div className="divide-y divide-slate-100 text-xs">
              {goldCorrections.slice(0, 5).map((gc, i) => (
                <div key={i} className="py-2.5 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-mono text-slate-500">/{gc.originalRecognizedIPA}/</span>
                    <span className="mx-2 text-slate-400">&rarr;</span>
                    <span className="font-mono font-bold text-emerald-700">/{gc.correctedIPA}/</span>
                    <span className="mx-2 text-slate-300">·</span>
                    <span className="text-slate-600">{gc.notes}</span>
                  </div>
                  <span className="font-mono tabular-nums text-slate-400">
                    {gc.timestamp.slice(0, 10)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Per-Child Accepted Variants + SMART Goals */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Per-Child Accepted Variants ({selectedChild?.childName})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Prevent false rejections on dialectal features and bilingual nouns.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              {[
                { key: 'v_w_merger', title: 'Indian English /v/–/w/ Approximant [ʋ]' },
                { key: 'retroflex_stops', title: 'Indic Retroflex /ʈ/, /ɖ/ Realizations' },
                { key: 'code_switching_nouns', title: 'Home-Language Noun Code-Switching' },
                { key: 'spanish_r_tap', title: 'Spanish Alveolar Tap /ɾ/ in Borrowed Words' },
              ].map((rule) => (
                <label
                  key={rule.key}
                  className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(selectedChild?.acceptedVariants.includes(rule.key))}
                    onChange={() => handleToggleVariant(rule.key)}
                    className="accent-sky-600"
                  />
                  <span className="font-medium text-slate-800">{rule.title}</span>
                </label>
              ))}
            </div>

            {/* Add custom child-specific variant */}
            <form onSubmit={handleAddCustomVariant} className="flex items-center gap-2 pt-2">
              <input
                type="text"
                value={customVariantInput}
                onChange={(e) => setCustomVariantInput(e.target.value)}
                placeholder="Add custom rule (e.g. dental_t)"
                className="flex-1 px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                Add Rule
              </button>
            </form>
          </div>

          {/* SMART Therapy Goals */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Assigned SMART Goals</h2>
                <p className="text-xs text-slate-500">Drives adaptive stimulus difficulty</p>
              </div>
              <button
                onClick={() => setShowGoalModal(true)}
                className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 rounded-lg text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Goal</span>
              </button>
            </div>

            {childGoals.length === 0 ? (
              <p className="text-xs text-slate-500">
                No SMART goals assigned yet for {selectedChild?.childName}. Click &ldquo;New Goal&rdquo; to assign a phoneme target.
              </p>
            ) : (
              <div className="space-y-3">
                {childGoals.map((g) => (
                  <div key={g.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-900">
                        /{g.targetPhoneme}/ · {g.position}
                      </span>
                      <span className="font-mono tabular-nums font-semibold text-slate-700">
                        {g.currentAccuracy}% / {g.targetAccuracy}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sky-600 rounded-full"
                        style={{ width: `${Math.min(100, (g.currentAccuracy / g.targetAccuracy) * 100)}%` }}
                      />
                    </div>
                    <p className="text-slate-600 leading-relaxed">{g.notes}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create SMART Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <form
            onSubmit={handleSubmitGoal}
            className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4"
          >
            <h3 className="text-base font-bold text-slate-900">
              Assign SMART Goal for {selectedChild?.childName}
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Phoneme</label>
                <select
                  value={newTargetPhoneme}
                  onChange={(e) => setNewTargetPhoneme(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono bg-white"
                >
                  <option value="ɹ">/ɹ/ Rhotic R</option>
                  <option value="s">/s/ Alveolar S</option>
                  <option value="l">/l/ Liquid L</option>
                  <option value="ʈ">/ʈ/ Retroflex T</option>
                  <option value="k">/k/ Velar K</option>
                  <option value="θ">/θ/ Interdental TH</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Word Position</label>
                <select
                  value={newPosition}
                  onChange={(e) => setNewPosition(e.target.value as typeof newPosition)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="initial">Initial</option>
                  <option value="medial">Medial</option>
                  <option value="final">Final</option>
                  <option value="all">All Positions</option>
                </select>
              </div>
            </div>

            <div className="text-xs">
              <label className="block font-semibold text-slate-700 mb-1">
                Mastery Criterion (% over 3 sessions)
              </label>
              <input
                type="number"
                min={60}
                max={95}
                value={newTargetAccuracy}
                onChange={(e) => setNewTargetAccuracy(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono tabular-nums"
              />
            </div>

            <div className="text-xs">
              <label className="block font-semibold text-slate-700 mb-1">Clinical Cueing Notes</label>
              <input
                type="text"
                value={newGoalNotes}
                onChange={(e) => setNewGoalNotes(e.target.value)}
                placeholder="e.g. Cue tactile spoon tongue before recording"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowGoalModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-sky-600 text-white rounded-lg text-xs font-semibold hover:bg-sky-700 cursor-pointer"
              >
                Assign Goal
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
