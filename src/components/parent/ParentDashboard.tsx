import React, { useState } from 'react';
import { ChildProfile, PrivacyAuditEntry } from '../../types/patient';
import { TelepracticeNote } from '../../types/clinical';
import { SpeechAttemptResult } from '../../types/speech';
import { INITIAL_IEP_REPORT } from '../../data/mockInitialData';
import {
  AlertTriangle,
  Bell,
  Check,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Flame,
  MessageSquare,
  Plus,
  Send,
  ShieldCheck,
  Trash2,
} from 'lucide-react';

interface ParentDashboardProps {
  child: ChildProfile;
  attempts: SpeechAttemptResult[];
  telepracticeNotes: TelepracticeNote[];
  auditLogs: PrivacyAuditEntry[];
  onPurgeChildData: () => Promise<void>;
  onSendTelepracticeNote: (message: string) => Promise<void>;
  onOpenOnboarding: () => void;
}

const REPORT_TRANSLATIONS: Record<
  'en' | 'hi' | 'ta' | 'es',
  { label: string; summary: string; focus: string[] }
> = {
  en: {
    label: 'English',
    summary:
      'Consistent 10-minute home practice is paying off. Initial /r/ tongue placement improved by +8.5% this week when using the spoon-tongue visual cue, and bilingual Hindi-English vocabulary remains confident.',
    focus: [
      'Practice 5 words starting with /r/ ("Rabbit", "Rain", "Red") after school.',
      'Play 2 rounds of Minimal Pairs ("Ring" vs "Wing") on Saturday.',
      'Continue celebrating both Hindi and English words naturally at home.',
    ],
  },
  hi: {
    label: 'हिन्दी (Hindi)',
    summary:
      'नियमित १० मिनट के घरेलू अभ्यास से शानदार प्रगति दिख रही है। जीभ को चम्मच की तरह मोड़ने वाले संकेत से शुरुआती /r/ ध्वनि में इस सप्ताह +8.5% सुधार हुआ है। हिन्दी और अंग्रेज़ी दोनों शब्दों का आत्मविश्वास बढ़िया है।',
    focus: [
      'स्कूल के बाद /r/ वाले ५ शब्दों ("Rabbit", "Rain", "Red") का अभ्यास करें।',
      'शनिवार को "Ring" और "Wing" का मिनिमल पेयर्स खेल खेलें।',
      'घर पर सहज हिन्दी-अंग्रेज़ी बोलचाल की सराहना जारी रखें।',
    ],
  },
  ta: {
    label: 'தமிழ் (Tamil)',
    summary:
      'தினசரி 10 நிமிட வீட்டுப் பயிற்சி நல்ல முன்னேற்றத்தைத் தருகிறது. நாக்கை வளைக்கும் காட்சிக்குறிப்பு மூலம் /r/ உச்சரிப்பு இந்த வாரம் +8.5% மேம்பட்டுள்ளது.',
    focus: [
      'பள்ளிக்குப் பிறகு /r/ ஒலியில் தொடங்கும் 5 சொற்களைப் பயிற்சி செய்யவும்.',
      'வார இறுதியில் "Ring" மற்றும் "Wing" ஒலி வேறுபாட்டு விளையாட்டை விளையாடவும்.',
      'இருமொழிச் சொற்களைத் தயக்கமின்றிப் பாராட்டவும்.',
    ],
  },
  es: {
    label: 'Español (Spanish)',
    summary:
      'La práctica diaria de 10 minutos en casa muestra un progreso constante. La colocación lingual del fonema /r/ mejoró un +8.5% esta semana con la guía visual anatómica.',
    focus: [
      'Practicar 5 palabras con /r/ inicial después de clases.',
      'Jugar 2 rondas de Pares Mínimos durante el fin de semana.',
      'Seguir validando el cambio natural entre idiomas en casa.',
    ],
  },
};

export const ParentDashboard: React.FC<ParentDashboardProps> = ({
  child,
  attempts,
  telepracticeNotes,
  auditLogs,
  onPurgeChildData,
  onSendTelepracticeNote,
  onOpenOnboarding,
}) => {
  const [activeTab, setActiveTab] = useState<'progress' | 'report' | 'guide' | 'messages' | 'privacy'>('progress');
  const [reportLang, setReportLang] = useState<'en' | 'hi' | 'ta' | 'es'>('en');
  const [reminderTime, setReminderTime] = useState('17:30');
  const [reminderChannel, setReminderChannel] = useState<'whatsapp' | 'email' | 'push'>('whatsapp');
  const [reminderSaved, setReminderSaved] = useState(false);

  const [noteDraft, setNoteDraft] = useState('');
  const [isPurging, setIsPurging] = useState(false);
  const [purgeComplete, setPurgeComplete] = useState(false);

  const childAttempts = attempts.filter((a) => a.childId === child.id);
  const childNotes = telepracticeNotes.filter((n) => n.childId === child.id);

  const avgAccuracy =
    childAttempts.length > 0
      ? Math.round(
          (childAttempts.reduce((acc, a) => acc + a.overallGOP, 0) / childAttempts.length) * 100
        )
      : 0;

  const weeklyTrend = [
    { day: 'Mon', mins: 8, acc: 62 },
    { day: 'Tue', mins: 10, acc: 66 },
    { day: 'Wed', mins: 0, acc: 66 },
    { day: 'Thu', mins: 10, acc: 71 },
    { day: 'Fri', mins: 12, acc: 74 },
    { day: 'Sat', mins: 8, acc: avgAccuracy || 78 },
  ];

  const handleDownloadCSV = () => {
    const header = 'AttemptID,Timestamp,Word,Language,TargetIPA,RecognizedIPA,GOPPercent,AcceptedVariant\n';
    const rows = childAttempts
      .map(
        (a) =>
          `${a.attemptId},${a.timestamp},"${a.targetWord}",${a.language},"${a.targetIPA}","${a.recognizedIPA}",${Math.round(
            a.overallGOP * 100
          )},${a.isAcceptedVariant}`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${child.name.replace(/\s+/g, '_')}_speech_progress.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExecutePurge = async () => {
    setIsPurging(true);
    await onPurgeChildData();
    setIsPurging(false);
    setPurgeComplete(true);
  };

  const handlePostNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteDraft.trim()) return;
    await onSendTelepracticeNote(noteDraft.trim());
    setNoteDraft('');
  };

  const translatedReport = REPORT_TRANSLATIONS[reportLang];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Summary */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-xl font-display font-extrabold text-slate-900">
            Parent Care Hub · {child.name}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>Age {child.ageYears}</span>
            <span aria-hidden="true">·</span>
            <span>Languages: {child.homeLanguages.join(' + ')}</span>
            <span aria-hidden="true">·</span>
            <span>Consent ID: {child.consentId}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-600" />
            <div>
              <span className="text-slate-400 block">Weekly Time</span>
              <span className="font-mono font-bold tabular-nums text-slate-900">48 mins</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            <div>
              <span className="text-slate-400 block">Streak</span>
              <span className="font-mono font-bold tabular-nums text-slate-900">{child.streakDays} days</span>
            </div>
          </div>

          <button
            onClick={onOpenOnboarding}
            className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Sibling Profile</span>
          </button>
        </div>
      </div>

      {/* Functional Segmented Tab Bar */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-xl max-w-fit">
        {[
          { id: 'progress', label: 'Mastery & Trends' },
          { id: 'report', label: 'Weekly Report (Translated)' },
          { id: 'guide', label: 'Home Practice & Reminders' },
          { id: 'messages', label: `SLP Notes (${childNotes.length})` },
          { id: 'privacy', label: 'Privacy & Data Erasure' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: MASTERY & TRENDS */}
      {activeTab === 'progress' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Sound Mastery Status */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">Phoneme Mastery Breakdown</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Clinical mastery criterion: 80% accuracy sustained across 3 consecutive sessions.
                </p>
              </div>

              <div className="divide-y divide-slate-100">
                {[
                  { sound: '/ʈ/ Retroflex Stop', status: 'Mastered', pct: 92, note: 'Hindi & Indian English target' },
                  { sound: '/s/ Alveolar Fricative', status: 'Mastered', pct: 86, note: 'Teeth-cage placement steady' },
                  { sound: '/ɹ/ Initial Rhotic R', status: 'In Progress', pct: 68, note: '+8.5% this week · Spoon-tongue cue' },
                  { sound: '/θ/ Interdental TH', status: 'Not Yet Started', pct: 42, note: 'Expected acquisition age: 6;0 yrs' },
                ].map((row, idx) => (
                  <div key={idx} className="py-3.5 first:pt-0 last:pb-0 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono font-bold text-slate-900">{row.sound}</span>
                        <span className="text-slate-400 mx-2">·</span>
                        <span className="text-slate-500">{row.note}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`font-semibold ${
                            row.status === 'Mastered'
                              ? 'text-emerald-700'
                              : row.status === 'In Progress'
                              ? 'text-sky-700'
                              : 'text-slate-500'
                          }`}
                        >
                          {row.status}
                        </span>
                        <span className="font-mono font-bold tabular-nums text-slate-900 w-10 text-right">
                          {row.pct}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          row.pct >= 80 ? 'bg-emerald-600' : row.pct >= 60 ? 'bg-sky-600' : 'bg-slate-400'
                        }`}
                        style={{ width: `${row.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly Trend Bars */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between space-y-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">6-Day Practice & Accuracy Trend</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daily GOP phoneme score progression ({childAttempts.length} recorded attempts)
                </p>
              </div>

              <div className="grid grid-cols-6 gap-3 items-end h-40 pt-4 border-b border-slate-200">
                {weeklyTrend.map((d) => (
                  <div key={d.day} className="flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[11px] font-mono tabular-nums text-slate-600">
                      {d.mins > 0 ? `${d.acc}%` : '—'}
                    </span>
                    <div
                      className={`w-full rounded-t-md transition-all ${
                        d.mins > 0 ? 'bg-sky-600' : 'bg-slate-200'
                      }`}
                      style={{ height: `${Math.max(12, d.acc)}%` }}
                    />
                    <span className="text-xs font-medium text-slate-500 pb-2">{d.day}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Current mean GOP accuracy: <strong className="font-mono tabular-nums text-slate-900">{avgAccuracy}%</strong></span>
                <button
                  onClick={handleDownloadCSV}
                  className="font-semibold text-sky-700 hover:text-sky-900 inline-flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>
          </div>

          {/* Attempt Log Table with Empty State */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Recorded Practice Attempts</h3>
                <p className="text-xs text-slate-500">
                  Phoneme-level diagnostics shared with {child.name}’s assigned clinician.
                </p>
              </div>
            </div>

            {childAttempts.length === 0 ? (
              <div className="py-10 text-center space-y-2 border border-dashed border-slate-200 rounded-xl">
                <p className="text-sm font-semibold text-slate-800">
                  No stored speech recordings for {child.name}
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {purgeComplete
                    ? 'All voice buffers and derived phonetic records have been cryptographically purged.'
                    : 'Practice a word in the Child Studio to view phoneme-by-phoneme progress here.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-500 font-semibold border-b border-slate-200">
                      <th className="pb-3 pr-4">Stimulus Word</th>
                      <th className="pb-3 pr-4">Target IPA</th>
                      <th className="pb-3 pr-4">Recognized</th>
                      <th className="pb-3 pr-4 text-right">GOP Score</th>
                      <th className="pb-3 pr-4">Outcome</th>
                      <th className="pb-3 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {childAttempts.map((att) => (
                      <tr key={att.attemptId} className="hover:bg-slate-50/70">
                        <td className="py-3 pr-4 font-semibold text-slate-900">{att.targetWord}</td>
                        <td className="py-3 pr-4 font-mono">/{att.targetIPA}/</td>
                        <td className="py-3 pr-4 font-mono text-sky-700">{att.recognizedIPA}</td>
                        <td className="py-3 pr-4 text-right font-mono tabular-nums font-semibold">
                          {Math.round(att.overallGOP * 100)}%
                        </td>
                        <td className="py-3 pr-4">
                          {att.isAcceptedVariant ? (
                            <span className="text-sky-700 font-semibold">Accepted Multilingual Variant</span>
                          ) : att.overallGOP >= 0.78 ? (
                            <span className="text-emerald-700 font-semibold">Accurate Production</span>
                          ) : (
                            <span className="text-amber-700 font-semibold">Needs Placement Cue</span>
                          )}
                        </td>
                        <td className="py-3 text-right font-mono tabular-nums text-slate-400">
                          {new Date(att.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: TRANSLATED WEEKLY REPORT */}
      {activeTab === 'report' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-sky-600" />
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Plain-Language Weekly Family Report · {INITIAL_IEP_REPORT.weekEndingDate}
                </h2>
                <p className="text-xs text-slate-500">
                  Translated automatically into your preferred home language
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={reportLang}
                onChange={(e) => setReportLang(e.target.value as typeof reportLang)}
                className="px-3 py-2 text-xs font-semibold border border-slate-300 rounded-lg bg-white"
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="ta">தமிழ் (Tamil)</option>
                <option value="es">Español (Spanish)</option>
              </select>

              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Print / Save PDF</span>
              </button>
            </div>
          </div>

          <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
            <div>
              <h3 className="text-xs font-bold text-slate-900 mb-1">Weekly Summary ({translatedReport.label})</h3>
              <p>{translatedReport.summary}</p>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-900 mb-1.5">Recommended Home Focus</h3>
              <ul className="space-y-1.5 text-xs">
                {translatedReport.focus.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: HOME PRACTICE GUIDE & REMINDERS */}
      {activeTab === 'guide' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900">How to Model Sounds at Home</h2>
            <div className="divide-y divide-slate-100 text-xs text-slate-700 space-y-4">
              <div className="pt-2">
                <div className="font-bold text-slate-900 mb-1">1. Modeling Rhotic /r/ Without Tension</div>
                <p className="leading-relaxed">
                  Show your child how to curl the sides of their tongue upward so they gently touch the upper back molars—like holding a tiny spoon—rather than rounding the lips into a /w/ shape.
                </p>
              </div>
              <div className="pt-4">
                <div className="font-bold text-slate-900 mb-1">2. Honoring Bilingual Code-Switching</div>
                <p className="leading-relaxed">
                  When practicing picture cards, never tell your child they are wrong for naming an object in Hindi, Tamil, Bengali, or Spanish. Affirm their home word warmly, then playfully model the target word.
                </p>
              </div>
              <div className="pt-4">
                <div className="font-bold text-slate-900 mb-1">3. Supporting Fluent, Unhurried Speech</div>
                <p className="leading-relaxed">
                  If your child repeats syllables or blocks, pause calmly, maintain relaxed eye contact, and slow your own speaking rate rather than instructing them to &ldquo;slow down.&rdquo;
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-sky-600" />
              <h2 className="text-base font-bold text-slate-900">Daily Practice Reminder</h2>
            </div>
            <p className="text-xs text-slate-500">
              Schedule a gentle 10-minute practice nudge via WhatsApp webhook, email, or browser notification.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Preferred Local Time</label>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Delivery Channel</label>
                <select
                  value={reminderChannel}
                  onChange={(e) => setReminderChannel(e.target.value as typeof reminderChannel)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="whatsapp">WhatsApp Family Webhook</option>
                  <option value="email">Guardian Email</option>
                  <option value="push">Device Push Reminder</option>
                </select>
              </div>

              <button
                onClick={() => {
                  setReminderSaved(true);
                  setTimeout(() => setReminderSaved(false), 2500);
                }}
                className="w-full py-2.5 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {reminderSaved ? 'Schedule Saved!' : 'Save Practice Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TELEPRACTICE MESSAGE THREAD */}
      {activeTab === 'messages' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 max-w-3xl">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-sky-600" />
            <h2 className="text-base font-bold text-slate-900">
              Secure Care Thread with Dr. Neha Rao, CCC-SLP
            </h2>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {childNotes.length === 0 ? (
              <p className="text-xs text-slate-500">No messages yet for {child.name}. Send a note to your SLP below.</p>
            ) : (
              childNotes.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 rounded-xl border text-xs space-y-1 ${
                    n.authorRole === 'clinician'
                      ? 'bg-sky-50/50 border-sky-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="font-bold text-slate-900">{n.authorName}</span>
                    <span className="font-mono tabular-nums">
                      {new Date(n.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{n.message}</p>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handlePostNote} className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <input
              type="text"
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder="Write an update or question for Dr. Neha Rao..."
              className="flex-1 px-3.5 py-2.5 text-xs border border-slate-300 rounded-lg focus:border-sky-600 focus:outline-hidden"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-sky-600 text-white text-xs font-semibold rounded-lg hover:bg-sky-700 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 5: PRIVACY & CRYPTOGRAPHIC ERASURE */}
      {activeTab === 'privacy' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Verifiable Parental Consent & Voice Data Governance
              </h2>
              <p className="text-xs text-slate-500">
                Compliant by design with India’s DPDP Act 2023 (Section 9), US COPPA, and GDPR-K
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
              <div className="text-slate-500 font-medium">Parental Consent Status</div>
              <div className="font-bold text-emerald-800">Verified · Active</div>
              <div className="text-slate-500">Zero ads or third-party behavioral tracking</div>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
              <div className="text-slate-500 font-medium">Raw Voice Retention</div>
              <div className="font-bold text-slate-900 font-mono tabular-nums">30-Day Rolling Window</div>
              <div className="text-slate-500">Unpinned audio auto-purges on schedule</div>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
              <div className="text-slate-500 font-medium">Encryption Standard</div>
              <div className="font-bold text-slate-900 font-mono">AES-256 + TLS 1.3</div>
              <div className="text-slate-500">Short-lived signed audio URIs</div>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-rose-200 bg-rose-50/50 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-rose-950">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Delete My Child’s Data (Irreversible Hard-Purge)</span>
            </div>
            <p className="text-xs text-rose-900 leading-relaxed max-w-2xl">
              Executing this command immediately purges all stored speech audio recordings, forced phoneme alignment JSONs, and GOP attempt logs for {child.name} from the server database and writes a hashed erasure receipt to the audit log.
            </p>

            {purgeComplete ? (
              <div className="p-3 bg-white rounded-lg border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>All audio recordings and derived phoneme telemetry for {child.name} have been permanently purged.</span>
              </div>
            ) : (
              <button
                onClick={handleExecutePurge}
                disabled={isPurging}
                className="px-4 py-2.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isPurging ? 'Purging Records...' : `Purge All Audio & Derived Data for ${child.name}`}</span>
              </button>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-800">Immutable Privacy & Consent Audit Trail</h3>
            <div className="rounded-xl border border-slate-200 bg-slate-50 divide-y divide-slate-200/70 text-xs font-mono">
              {auditLogs.slice(0, 8).map((log) => (
                <div key={log.id} className="px-4 py-2.5 flex flex-wrap items-center gap-3 text-slate-600">
                  <span className="text-slate-400 tabular-nums">{log.timestamp.slice(0, 19)}</span>
                  <span className="font-bold text-slate-900">{log.action}</span>
                  <span className="font-sans text-slate-700">{log.details}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
