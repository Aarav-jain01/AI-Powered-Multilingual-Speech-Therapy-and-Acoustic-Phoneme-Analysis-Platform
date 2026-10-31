import React, { useState } from 'react';
import { WordItem } from '../../types/content';
import { PrivacyAuditEntry } from '../../types/patient';
import { ClinicInquiry } from '../../types/clinical';
import { SUPPORTED_LANGUAGES } from '../../data/languages';
import { BookOpen, CheckCircle2, Plus, RotateCcw, Search } from 'lucide-react';

interface AdminDashboardProps {
  wordBank: WordItem[];
  auditLogs: PrivacyAuditEntry[];
  inquiries: ClinicInquiry[];
  onAddWord: (word: WordItem) => Promise<void>;
  onResetDemoData: () => Promise<void>;
  onOpenDocs: (docKey?: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  wordBank,
  auditLogs,
  inquiries,
  onAddWord,
  onResetDemoData,
  onOpenDocs,
}) => {
  const [activeTab, setActiveTab] = useState<'cms' | 'models' | 'gates' | 'audit'>('cms');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Add stimulus word modal state
  const [showAddWord, setShowAddWord] = useState(false);
  const [wordText, setWordText] = useState('');
  const [wordLang, setWordLang] = useState('hi_IN');
  const [wordIPA, setWordIPA] = useState('');
  const [wordPhoneme, setWordPhoneme] = useState('ɹ');
  const [wordPos, setWordPos] = useState<'initial' | 'medial' | 'final'>('initial');
  const [wordShape, setWordShape] = useState('CVCV');
  const [wordAlts, setWordAlts] = useState('');

  // Model rollout state
  const [activeModelVersion, setActiveModelVersion] = useState<'v2.1' | 'v2.0'>('v2.1');
  const [canaryRolloutPct, setCanaryRolloutPct] = useState(15);

  const displayedWords = wordBank.filter((w) => {
    const matchesLang = selectedLanguage === 'all' || w.language === selectedLanguage;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      w.text.toLowerCase().includes(q) ||
      w.ipa.toLowerCase().includes(q) ||
      (w.acceptedCodeSwitchAlternates || []).some((a) => a.toLowerCase().includes(q));
    return matchesLang && matchesSearch;
  });

  const handleCreateWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wordText.trim() || !wordIPA.trim()) return;
    const alternates = wordAlts
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const newItem: WordItem = {
      id: `w_cms_${Date.now().toString(36)}`,
      text: wordText.trim(),
      language: wordLang,
      ipa: wordIPA.trim(),
      targetPhoneme: wordPhoneme,
      targetPosition: wordPos,
      syllableCount: Math.max(1, wordShape.replace(/[^V]/gi, '').length),
      syllableShape: wordShape.trim() || 'CVC',
      difficultyTier: 2,
      iconName: 'Sparkles',
      acceptedCodeSwitchAlternates: alternates,
    };

    await onAddWord(newItem);
    setWordText('');
    setWordIPA('');
    setWordAlts('');
    setShowAddWord(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-display font-extrabold text-slate-900">
            Governance, Multilingual CMS & Model Registry
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
            <span className="font-mono tabular-nums">{wordBank.length} stimulus items</span>
            <span aria-hidden="true">·</span>
            <span>5 launch languages</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-700 font-semibold inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>CI Release Gates Passing</span>
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onOpenDocs('release_gates')}
            className="px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-sky-600" />
            <span>View release_gates.yaml</span>
          </button>

          <button
            onClick={onResetDemoData}
            className="px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Seed Data</span>
          </button>
        </div>
      </div>

      {/* Segmented Tab Controls */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-xl max-w-fit">
        {[
          { id: 'cms', label: 'Multilingual Word CMS' },
          { id: 'models', label: 'Acoustic Model Registry' },
          { id: 'gates', label: 'Fairness & Parity Gates' },
          { id: 'audit', label: `Audit & Inquiries (${auditLogs.length + inquiries.length})` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as typeof activeTab)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === t.id
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: CMS */}
      {activeTab === 'cms' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[260px]">
              <div className="relative flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search word, IPA, or code-switch..."
                  className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-sky-600 focus:outline-hidden"
                />
              </div>

              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="px-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-700"
              >
                <option value="all">All Launch Languages</option>
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name} ({l.nativeName})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowAddWord(true)}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Stimulus Word</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-500 font-semibold border-b border-slate-200">
                  <th className="pb-3 pr-4">Stimulus Word</th>
                  <th className="pb-3 pr-4">Locale</th>
                  <th className="pb-3 pr-4">Target</th>
                  <th className="pb-3 pr-4">IPA Transcription</th>
                  <th className="pb-3 pr-4">Syllable Shape</th>
                  <th className="pb-3 pr-4">Accepted Code-Switch Alternates</th>
                  <th className="pb-3 text-right">Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {displayedWords.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className="py-3 pr-4 font-semibold text-slate-900">{item.text}</td>
                    <td className="py-3 pr-4 font-mono text-slate-600">{item.language}</td>
                    <td className="py-3 pr-4 font-mono font-bold text-sky-700">/{item.targetPhoneme}/</td>
                    <td className="py-3 pr-4 font-mono text-slate-600">/{item.ipa}/</td>
                    <td className="py-3 pr-4 font-mono text-slate-500">{item.syllableShape}</td>
                    <td className="py-3 pr-4 text-slate-600">
                      {item.acceptedCodeSwitchAlternates?.join(' · ') || '—'}
                    </td>
                    <td className="py-3 text-right font-mono tabular-nums text-slate-600">
                      Tier {item.difficultyTier}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: MODEL REGISTRY */}
      {activeTab === 'models' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Multilingual CTC Acoustic Model Registry</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              XLS-R 300M + INT8 ONNX quantized on-device variant adapted for child vocal tracts.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-sm text-slate-900">
                    bolo-acoustic-xlsr-child-v2.1
                  </span>
                  <span className="text-xs font-semibold text-emerald-700">
                    {activeModelVersion === 'v2.1' ? `Primary Production (${100 - canaryRolloutPct}%)` : 'Standby'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-mono tabular-nums">
                  PER: 8.4% · False Rejection: 3.1% · GOP-SLP r = 0.864 · CPU p95: 420ms
                </p>
              </div>

              <button
                onClick={() => setActiveModelVersion('v2.1')}
                disabled={activeModelVersion === 'v2.1'}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white disabled:opacity-40 cursor-pointer"
              >
                {activeModelVersion === 'v2.1' ? 'Active Default' : 'Promote v2.1'}
              </button>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="font-mono font-bold text-sm text-slate-900">
                    bolo-onnx-int8-mobile-v2.2-canary
                  </span>
                  <span className="text-xs text-sky-700 font-semibold ml-3">
                    Low-Bandwidth / Offline Quantized Canary ({canaryRolloutPct}%)
                  </span>
                </div>
                <span className="font-mono text-xs tabular-nums text-slate-500">
                  28 MB ONNX · 290ms mid-range Android 4G
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <label className="font-semibold text-slate-700 whitespace-nowrap">
                  Canary Traffic Allocation:
                </label>
                <input
                  type="range"
                  min={0}
                  max={50}
                  step={5}
                  value={canaryRolloutPct}
                  onChange={(e) => setCanaryRolloutPct(Number(e.target.value))}
                  className="w-48 accent-sky-600 cursor-pointer"
                />
                <span className="font-mono font-bold tabular-nums text-slate-900">
                  {canaryRolloutPct}%
                </span>
              </div>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-white flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="font-mono font-bold text-sm text-slate-900">
                  bolo-acoustic-xlsr-child-v2.0
                </span>
                <p className="text-xs text-slate-500 font-mono tabular-nums">
                  PER: 9.8% · False Rejection: 4.4% · Instant Rollback Target
                </p>
              </div>
              <button
                onClick={() => setActiveModelVersion('v2.0')}
                disabled={activeModelVersion === 'v2.0'}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                {activeModelVersion === 'v2.0' ? 'Rolled Back Active' : 'Rollback to v2.0'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FAIRNESS & PARITY GATES */}
      {activeTab === 'gates' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Release Gate Verification & Subgroup Parity Table
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Model promotion is automatically blocked in CI if False Rejection Rate &gt; 5.0% or subgroup disparity &gt; 2.5%.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-500 font-semibold border-b border-slate-200">
                  <th className="pb-3 pr-4">Cohort Dimension</th>
                  <th className="pb-3 pr-4">Subgroup</th>
                  <th className="pb-3 pr-4 text-right">Utterances (N)</th>
                  <th className="pb-3 pr-4 text-right">PER (%)</th>
                  <th className="pb-3 pr-4 text-right">False Rejection (%)</th>
                  <th className="pb-3 pr-4 text-right">Parity Delta</th>
                  <th className="pb-3 text-right">Gate Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-mono tabular-nums">
                {[
                  { dim: 'Age Band', group: '3–5 years', n: 720, per: '10.2%', frr: '4.2%', delta: '+1.1%' },
                  { dim: 'Age Band', group: '6–8 years', n: 940, per: '7.9%', frr: '2.8%', delta: 'Baseline' },
                  { dim: 'Age Band', group: '9–12 years', n: 740, per: '7.1%', frr: '2.3%', delta: '-0.5%' },
                  { dim: 'Language', group: 'Indian English', n: 600, per: '8.2%', frr: '3.0%', delta: '+0.3%' },
                  { dim: 'Language', group: 'Hindi', n: 520, per: '8.6%', frr: '3.3%', delta: '+0.6%' },
                  { dim: 'Language', group: 'Tamil', n: 380, per: '9.1%', frr: '3.6%', delta: '+0.9%' },
                  { dim: 'Language', group: 'Spanish', n: 400, per: '8.3%', frr: '3.1%', delta: '+0.4%' },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70">
                    <td className="py-3 pr-4 font-sans font-semibold text-slate-900">{row.dim}</td>
                    <td className="py-3 pr-4 font-sans">{row.group}</td>
                    <td className="py-3 pr-4 text-right">{row.n}</td>
                    <td className="py-3 pr-4 text-right">{row.per}</td>
                    <td className="py-3 pr-4 text-right font-bold text-slate-900">{row.frr}</td>
                    <td className="py-3 pr-4 text-right">{row.delta}</td>
                    <td className="py-3 text-right font-sans font-semibold text-emerald-700">PASS</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOGS & PARTNERSHIP INQUIRIES */}
      {activeTab === 'audit' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900">Consent & Data Erasure Audit Log</h2>
            <div className="divide-y divide-slate-100 text-xs">
              {auditLogs.map((entry) => (
                <div key={entry.id} className="py-3 space-y-1">
                  <div className="flex items-center justify-between font-mono text-slate-500">
                    <span className="font-bold text-slate-900">{entry.action}</span>
                    <span className="tabular-nums">{entry.timestamp.slice(0, 19)}</span>
                  </div>
                  <p className="text-slate-600">{entry.details}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900">
              Clinic & School Pilot Inquiries ({inquiries.length})
            </h2>
            {inquiries.length === 0 ? (
              <p className="text-xs text-slate-500">
                Inquiries submitted via the Overview website partnership form appear here in real time.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 text-xs space-y-3">
                {inquiries.map((inq) => (
                  <div key={inq.id} className="pt-3 first:pt-0 space-y-1">
                    <div className="font-bold text-slate-900">
                      {inq.name} · {inq.organization}
                    </div>
                    <div className="text-slate-500">
                      {inq.email} · {inq.languagesNeeded}
                    </div>
                    {inq.message && <p className="text-slate-700">{inq.message}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Stimulus Word Modal */}
      {showAddWord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <form
            onSubmit={handleCreateWord}
            className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4"
          >
            <h3 className="text-base font-bold text-slate-900">Add Multilingual Stimulus Word</h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Word Text *</label>
                <input
                  type="text"
                  value={wordText}
                  onChange={(e) => setWordText(e.target.value)}
                  placeholder="e.g. Aam (Mango)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Language</label>
                <select
                  value={wordLang}
                  onChange={(e) => setWordLang(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">IPA String *</label>
                <input
                  type="text"
                  value={wordIPA}
                  onChange={(e) => setWordIPA(e.target.value)}
                  placeholder="ɑ m"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phoneme</label>
                <select
                  value={wordPhoneme}
                  onChange={(e) => setWordPhoneme(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono bg-white"
                >
                  <option value="ɹ">/ɹ/</option>
                  <option value="s">/s/</option>
                  <option value="l">/l/</option>
                  <option value="ʈ">/ʈ/</option>
                  <option value="k">/k/</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Position</label>
                <select
                  value={wordPos}
                  onChange={(e) => setWordPos(e.target.value as typeof wordPos)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="initial">Initial</option>
                  <option value="medial">Medial</option>
                  <option value="final">Final</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Syllable Shape</label>
                <input
                  type="text"
                  value={wordShape}
                  onChange={(e) => setWordShape(e.target.value)}
                  placeholder="CVC"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Code-Switch Alternates</label>
                <input
                  type="text"
                  value={wordAlts}
                  onChange={(e) => setWordAlts(e.target.value)}
                  placeholder="mango, maambazham"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddWord(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 cursor-pointer"
              >
                Save to Word Bank
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
