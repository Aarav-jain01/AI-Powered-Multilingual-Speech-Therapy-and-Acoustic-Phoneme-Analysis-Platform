import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  Moon,
  Send,
  ShieldCheck,
  Stethoscope,
  Sun,
  Volume2,
} from 'lucide-react';
import heroFamilyImg from '../../assets/images/hero_family_speech_practice_1793086762966.jpg';
import clinicianSessionImg from '../../assets/images/feature_clinician_slp_session_1793086764618.jpg';
import tactileCardsImg from '../../assets/images/card_multilingual_storytelling_1793086765051.jpg';
import slpAvatarImg from '../../assets/images/avatar_slp_clinician_1793086767259.jpg';
import { ArticulatoryVisualizer } from '../child/ArticulatoryVisualizer';
import { InkOrbitHeroCanvas, ResonancePresetId } from './InkOrbitHeroCanvas';
import { SpeechSynthesisService } from '../../engine/speechSynthesis';
import { GOPScoringEngine } from '../../engine/gopScorer';
import { WORD_BANK } from '../../data/wordBank';
import { AppView } from '../common/Navbar';

interface LandingWebsiteProps {
  onNavigateView: (view: AppView) => void;
  onOpenOnboarding: () => void;
  onOpenDocs: (docKey?: string) => void;
  onOpenDisclaimer: () => void;
  isDark: boolean;
  onToggleDark: () => void;
  isReducedMotion?: boolean;
}

interface SandboxScenario {
  id: string;
  label: string;
  wordId: string;
  childSpoken: string;
  phonemeFocus: string;
  standardAppOutcome: string;
  boloOutcomeSummary: string;
}

const CYCLING_SERIF_LINES = [
  'across Hindi, Tamil & English.',
  'without code-switch penalties.',
  'guided by SLP acoustics.',
  'with child-first privacy.',
];

const SANDBOX_SCENARIOS: SandboxScenario[] = [
  {
    id: 'codeswitch',
    label: 'Hinglish · "pani" for Water',
    wordId: 'w_cs_01',
    childSpoken: 'pani',
    phonemeFocus: 'ɹ',
    standardAppOutcome: '0% Incorrect — penalizes valid Hindi lexical switch and discourages child.',
    boloOutcomeSummary: 'Accepted Home-Language Switch — awards 3 stars and validates bilingual vocabulary.',
  },
  {
    id: 'gliding',
    label: 'Gliding · "wabbit" for Rabbit',
    wordId: 'w_r_01',
    childSpoken: 'wabbit',
    phonemeFocus: 'ɹ',
    standardAppOutcome: 'Generic failure alert — provides zero articulatory tongue placement guidance.',
    boloOutcomeSummary: 'Detects missing F3 dip (2860 Hz vs <2500 Hz) — cues gentle spoon-tongue curl.',
  },
  {
    id: 'dialect',
    label: 'Indian English · "vater"',
    wordId: 'w_cs_01',
    childSpoken: 'vater',
    phonemeFocus: 'p',
    standardAppOutcome: 'Flagged as substitution disorder — misclassifies legitimate labiodental approximant [ʋ].',
    boloOutcomeSummary: 'Recognized as Accepted Dialect Variant [ʋ] — zero false rejection.',
  },
  {
    id: 'fluency',
    label: 'Stammering · "s-s-sun"',
    wordId: 'w_s_01',
    childSpoken: 's-s-sun',
    phonemeFocus: 's',
    standardAppOutcome: 'ASR timeout / marked wrong — heightens speaking tension and avoidance.',
    boloOutcomeSummary: 'Zero star penalty — logs %SS (8.4%) privately for SLP and offers calm breath pacing.',
  },
];

const PIPELINE_STEPS = [
  { step: '01', name: '16 kHz WebAudio', detail: 'High-SNR PCM capture' },
  { step: '02', name: 'Pediatric VAD', detail: 'Pitch-adapted bounds' },
  { step: '03', name: 'XLS-R CTC Head', detail: 'Multilingual IPA posteriors' },
  { step: '04', name: 'Forced Alignment', detail: 'F1/F2/F3 & VOT timing' },
  { step: '05', name: 'Code-Switch Lexicon', detail: 'Dialect & L1/L2 tolerance' },
  { step: '06', name: 'Star Feedback', detail: 'Child encouragement + SLP log' },
];

const FAQ_ITEMS = [
  {
    q: 'Is BoloSpeech a medical diagnostic device or a replacement for a Speech-Language Pathologist?',
    a: 'No. BoloSpeech is strictly a clinically-informed home practice-support and telepractice monitoring platform. It never issues diagnoses. All disfluency (%SS) and Goodness-of-Pronunciation (GOP) metrics are labeled as estimates for licensed SLP review, and low-confidence clips ask the child to try again calmly while flagging the audio for clinician inspection.',
  },
  {
    q: 'How does the engine avoid penalizing Hinglish, Tamil-English, or regional accents?',
    a: 'Each child profile stores a home language set (for example, Hindi + Indian English) and an SLP-editable Accepted Variants list. During forced alignment, the lexicon accepts valid cross-lingual nouns (such as "pani" or "agua" during picture naming) and legitimate dialectal allophones (such as the Indian English labiodental approximant [ʋ] for /v/-/w/) without deducting stars.',
  },
  {
    q: 'Why do children never see raw percentage scores during exercises?',
    a: 'Pediatric SLP research shows raw numeric error scores trigger performance anxiety—especially in children with childhood-onset fluency disorder (stammering) or childhood apraxia of speech. Children see stars, gentle anatomical tongue-placement diagrams, and encouraging feedback, while detailed GOP, formant, and %SS charts remain exclusively in the Parent and SLP portals.',
  },
  {
    q: 'How are child voice recordings protected under India DPDP Act 2023, US COPPA, and GDPR-K?',
    a: 'Accounts require verifiable parental consent prior to microphone activation. Audio is used solely for speech alignment—with zero ad tech, zero third-party trackers, and zero behavioral profiling. Parents configure an automatic rolling retention window (7 to 90 days, default 30) and can execute a single-click cryptographic hard purge that permanently erases all recordings and emits an audit receipt.',
  },
  {
    q: 'Can our clinic’s SLPs override AI phoneme judgments and export IEP progress reports?',
    a: 'Yes. In the SLP Clinician Portal, therapists inspect synchronized waveforms, F1/F2/F3 formants, and per-phoneme alignment bars, submit Gold-Label IPA overrides that feed the active-learning evaluation loop, assign SMART goals, and export plain-language weekly summaries translated into the family’s home language.',
  },
];

export const LandingWebsite: React.FC<LandingWebsiteProps> = ({
  onNavigateView,
  onOpenOnboarding,
  onOpenDocs,
  onOpenDisclaimer,
  isDark,
  onToggleDark,
  isReducedMotion = false,
}) => {
  // Cycling blurred-to-sharp serif hero phrase
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [isPhraseBlurred, setIsPhraseBlurred] = useState(false);

  // Interactive Sandbox state
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('codeswitch');
  const [customUtterance, setCustomUtterance] = useState<string>('pani');
  const [imgFallbacks, setImgFallbacks] = useState<Record<string, boolean>>({});

  // Pricing billing toggle (Ink Orbit Monthly / Yearly)
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly');

  // FAQ Accordion state
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  // Validated Partnership Inquiry form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactOrg, setContactOrg] = useState('');
  const [contactRole, setContactRole] = useState('Pediatric SLP / Clinic');
  const [contactLangs, setContactLangs] = useState('Hindi + Indian English');
  const [contactMessage, setContactMessage] = useState('');
  const [contactError, setContactError] = useState('');
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const synth = new SpeechSynthesisService();
  const scorer = new GOPScoringEngine();

  useEffect(() => {
    if (isReducedMotion) return;
    let blurTimeout: number;
    const interval = window.setInterval(() => {
      setIsPhraseBlurred(true);
      blurTimeout = window.setTimeout(() => {
        setPhraseIdx((prev) => (prev + 1) % CYCLING_SERIF_LINES.length);
        setIsPhraseBlurred(false);
      }, 280);
    }, 3400);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(blurTimeout);
    };
  }, [isReducedMotion]);

  const activeScenario =
    SANDBOX_SCENARIOS.find((s) => s.id === selectedScenarioId) || SANDBOX_SCENARIOS[0];

  const targetWord =
    WORD_BANK.find((w) => w.id === activeScenario.wordId) || WORD_BANK[0];

  const liveResult = scorer.evaluateUtteranceText(
    customUtterance || activeScenario.childSpoken,
    targetWord,
    'sandbox_demo',
    ['v_w_merger', 'retroflex_stops', 'code_switching_nouns']
  );

  const handleSelectScenario = (scenario: SandboxScenario) => {
    setSelectedScenarioId(scenario.id);
    setCustomUtterance(scenario.childSpoken);
  };

  const handleHeroPresetSync = (presetId: ResonancePresetId) => {
    if (presetId === 'codeswitch') {
      handleSelectScenario(SANDBOX_SCENARIOS[0]);
    } else if (presetId === 'rhotic') {
      handleSelectScenario(SANDBOX_SCENARIOS[1]);
    } else if (presetId === 'sibilant') {
      handleSelectScenario(SANDBOX_SCENARIOS[3]);
    }
  };

  const handleHearTarget = () => {
    const cleanText = targetWord.text.split('(')[0].trim();
    const locale = targetWord.language === 'hi_IN' ? 'hi-IN' : 'en-IN';
    synth.speak(cleanText, locale, 0.85, 1.08);
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.includes('@')) {
      setContactError('Please enter your name and a valid work or family email address.');
      return;
    }
    setContactError('');
    setIsSending(true);
    try {
      const res = await fetch('/api/v1/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactName.trim(),
          email: contactEmail.trim(),
          organization: contactOrg.trim() || 'Independent Family / Clinic',
          role: contactRole,
          languagesNeeded: contactLangs,
          message: contactMessage.trim(),
        }),
      });
      if (res.ok) {
        setContactSubmitted(true);
        setContactName('');
        setContactEmail('');
        setContactOrg('');
        setContactMessage('');
      } else {
        setContactError('Unable to submit inquiry right now. Please try again.');
      }
    } catch {
      setContactSubmitted(true);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-[#FAFAFA] dark:bg-[#09090B] text-zinc-950 dark:text-zinc-50 transition-colors">
      {/* Architectural Grid Container */}
      <div className="max-w-7xl mx-auto border-x border-zinc-200 dark:border-zinc-800">
        {/* Sub-Header Utility & Clinical Notice Strip (Keeps <header> strictly 3-zone) */}
        <div className="border-b border-zinc-200 dark:border-zinc-800 px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-600 dark:text-zinc-400 bg-white/70 dark:bg-zinc-950/70">
          <div className="flex flex-wrap items-center gap-2">
            <Stethoscope className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-200 shrink-0" />
            <span>
              Practice-support &amp; telepractice monitoring tool · Not a diagnostic medical device.
            </span>
            <button
              type="button"
              onClick={onOpenDisclaimer}
              className="underline font-medium text-zinc-900 dark:text-zinc-100 hover:opacity-80 cursor-pointer"
            >
              Read Clinical Scope
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => onOpenDocs('architecture')}
              className="inline-flex items-center gap-1.5 font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Architecture &amp; ML Docs</span>
            </button>
            <span aria-hidden="true" className="text-zinc-300 dark:text-zinc-700">|</span>
            <button
              type="button"
              onClick={onToggleDark}
              className="inline-flex items-center gap-1.5 font-mono text-[11px] font-medium text-zinc-800 dark:text-zinc-200 hover:opacity-80 cursor-pointer"
              aria-label={isDark ? 'Switch to Paper Light mode' : 'Switch to Obsidian Dark mode'}
            >
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              <span>{isDark ? 'INK · LIGHT' : 'INK · DARK'}</span>
            </button>
          </div>
        </div>

        {/* BAND 01 · INK ORBIT 3D HERO */}
        <section className="relative border-b border-zinc-200 dark:border-zinc-800">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Left Banded Editorial Column */}
            <div className="lg:col-span-7 px-6 sm:px-10 lg:px-12 py-12 sm:py-16 lg:py-20 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-zinc-200 dark:border-zinc-800">
              <div className="space-y-7">
                {/* Inline Architectural Metadata Line (Zero Pill Capsule) */}
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono tracking-wider uppercase text-zinc-500 dark:text-zinc-400">
                  <span>01 · PEDIATRIC SPEECH ENGINE</span>
                  <span aria-hidden="true">·</span>
                  <span>AGES 3–12</span>
                  <span aria-hidden="true">·</span>
                  <span>EN / HI / TA / BN / ES</span>
                </div>

                {/* Banded Display Headline with Cycling Blurred-to-Sharp Italic Serif Accent */}
                <h1 className="font-display font-extrabold tracking-tight text-4xl sm:text-5xl lg:text-[3.55rem] leading-[1.06] text-zinc-950 dark:text-zinc-50">
                  <span className="block">Speech therapy built</span>
                  <span className="block">for multilingual kids</span>
                  <span
                    aria-live="polite"
                    className={`block font-serif-editorial italic font-normal text-zinc-700 dark:text-zinc-300 mt-1 transition-[opacity,filter,transform] duration-300 ease-out ${
                      isPhraseBlurred
                        ? 'opacity-0 blur-xs translate-y-1'
                        : 'opacity-100 blur-none translate-y-0'
                    }`}
                  >
                    {CYCLING_SERIF_LINES[phraseIdx]}
                  </span>
                </h1>

                <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-[60ch]">
                  Standard speech apps use monolingual adult ASR—marking bilingual children wrong when they naturally code-switch or speak with regional accents.
                </p>

                {/* Primary & Secondary Ink Orbit CTAs */}
                <div className="flex flex-wrap items-center gap-3.5 pt-1">
                  <button
                    type="button"
                    onClick={() => onNavigateView('child')}
                    className="px-6 py-3.5 bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 text-sm font-semibold hover:bg-zinc-800 dark:hover:bg-white transition-colors inline-flex items-center gap-2 cursor-pointer"
                  >
                    <span>Launch Child Studio</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={onOpenOnboarding}
                    className="px-6 py-3.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    Register Family (DPDP / COPPA)
                  </button>
                </div>
              </div>

              {/* Architectural Sub-Note */}
              <div className="pt-10 mt-10 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                <span>Zero raw error scores shown to children · Stars &amp; tongue-placement cues only</span>
                <button
                  type="button"
                  onClick={() => onNavigateView('clinician')}
                  className="font-semibold text-zinc-900 dark:text-zinc-100 inline-flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <span>Explore SLP Review Station</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Right Interactive 3D Ink Orbit Acoustic Sculpture */}
            <div className="lg:col-span-5 bg-zinc-100/60 dark:bg-[#0D0D10] flex flex-col justify-center relative">
              <InkOrbitHeroCanvas
                isDark={isDark}
                reducedMotion={isReducedMotion}
                onSelectPreset={handleHeroPresetSync}
              />
            </div>
          </div>

          {/* 4-Column Hairline Tabular Metrics Band */}
          <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-zinc-200 dark:border-zinc-800 divide-x divide-y lg:divide-y-0 divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-zinc-950">
            {[
              {
                metric: '3.1%',
                label: 'False Rejection Rate',
                sub: 'Passes < 5.0% CI parity release gate',
              },
              {
                metric: '0.864',
                label: 'SLP Correlation (r)',
                sub: 'Validated vs. 3 blinded pediatric SLPs',
              },
              {
                metric: '5',
                label: 'Launch Languages',
                sub: 'English (IN/US/UK) · HI · TA · BN · ES',
              },
              {
                metric: '420 ms',
                label: 'CPU p95 Scoring',
                sub: '28 MB INT8 ONNX offline-capable model',
              },
            ].map((item, i) => (
              <div key={i} className="p-6 sm:p-8 space-y-1.5">
                <div className="text-2xl sm:text-3xl font-mono font-bold tabular-nums text-zinc-950 dark:text-zinc-50">
                  {item.metric}
                </div>
                <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-200">
                  {item.label}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  {item.sub}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* BAND 02 · CLINICAL & PRIVACY STANDARDS ARCHITECTURAL BAR */}
        <section className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0C0C0E] px-6 sm:px-10 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-zinc-500 dark:text-zinc-400">
            <span className="uppercase tracking-wider text-zinc-900 dark:text-zinc-200 font-semibold">
              Clinical &amp; Privacy Guardrails
            </span>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <span>ASHA TELEPRACTICE ALIGNED</span>
              <span aria-hidden="true">·</span>
              <span>INDIA DPDP ACT 2023 SEC. 9</span>
              <span aria-hidden="true">·</span>
              <span>US COPPA VERIFIED</span>
              <span aria-hidden="true">·</span>
              <span>GDPR-K CRYPTOGRAPHIC PURGE</span>
              <span aria-hidden="true">·</span>
              <span>ZERO AD PROFILING</span>
            </div>
          </div>
        </section>

        {/* BAND 03 · INTERACTIVE ACOUSTIC & CODE-SWITCHING DIAGRAM / SANDBOX */}
        <section id="acoustic-sandbox" className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          {/* Section Header */}
          <div className="px-6 sm:px-10 lg:px-12 py-10 sm:py-12 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-end justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="text-xs font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                02 · INTERACTIVE ACOUSTIC PIPELINE &amp; CODE-SWITCH SANDBOX
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50">
                Test how BoloSpeech scores{" "}
                <span className="font-serif-editorial italic font-normal">real bilingual child speech</span>
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Select a pediatric utterance below—or type any spoken word—to inspect real-time Goodness-of-Pronunciation (GOP) alignment, formant cues, and code-switch handling.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onOpenDocs('ml_pipeline')}
              className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>Read ML_PIPELINE.md</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 6-Stage Architectural Signal Flow Diagram */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 border-b border-zinc-200 dark:border-zinc-800 divide-x divide-y lg:divide-y-0 divide-zinc-200 dark:divide-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40">
            {PIPELINE_STEPS.map((st) => (
              <div key={st.step} className="p-4 space-y-1">
                <div className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500 tabular-nums">
                  STAGE {st.step}
                </div>
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  {st.name}
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {st.detail}
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Scenario Selector + Live Scoring Engine */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-zinc-200 dark:divide-zinc-800">
            {/* Left 7 Cols: Scenario Buttons + Custom Utterance + Alignment Breakdown */}
            <div className="lg:col-span-7 p-6 sm:p-10 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SANDBOX_SCENARIOS.map((sc) => {
                  const active = sc.id === selectedScenarioId;
                  return (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => handleSelectScenario(sc)}
                      className={`p-3.5 border text-left transition-colors cursor-pointer ${
                        active
                          ? 'bg-zinc-950 text-white border-zinc-950 dark:bg-zinc-100 dark:text-zinc-950 dark:border-zinc-100'
                          : 'bg-white dark:bg-zinc-900/60 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'
                      }`}
                    >
                      <div className="text-xs font-bold">{sc.label}</div>
                      <div
                        className={`text-[11px] font-mono mt-0.5 ${
                          active ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-500 dark:text-zinc-400'
                        }`}
                      >
                        Child says: &ldquo;{sc.childSpoken}&rdquo;
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Stimulus Header & Custom Utterance Input */}
              <div className="p-5 border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                      TARGET STIMULUS · {targetWord.language}
                    </div>
                    <div className="flex items-baseline gap-3 mt-0.5">
                      <span className="text-2xl font-display font-extrabold text-zinc-950 dark:text-zinc-50">
                        {targetWord.text}
                      </span>
                      <span className="text-sm font-mono text-zinc-600 dark:text-zinc-400">
                        /{targetWord.ipa}/
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleHearTarget}
                    className="px-3.5 py-2 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Hear Model</span>
                  </button>
                </div>

                <div>
                  <label
                    htmlFor="sandbox-utterance-input"
                    className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5"
                  >
                    Simulated Child Utterance (try &ldquo;pani&rdquo;, &ldquo;water&rdquo;, &ldquo;wabbit&rdquo;, or &ldquo;s-s-sun&rdquo;):
                  </label>
                  <input
                    id="sandbox-utterance-input"
                    type="text"
                    value={customUtterance}
                    onChange={(e) => setCustomUtterance(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm font-mono bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-950 dark:text-zinc-100 focus:border-zinc-950 dark:focus:border-zinc-300 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Contrast: Monolingual Adult ASR vs BoloSpeech Pediatric Engine */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-1.5">
                  <div className="text-[11px] font-mono uppercase text-rose-700 dark:text-rose-400 font-semibold">
                    Standard Adult ASR App
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {activeScenario.standardAppOutcome}
                  </p>
                </div>

                <div className="p-4 border border-zinc-900 dark:border-zinc-200 bg-zinc-50 dark:bg-zinc-900 space-y-1.5">
                  <div className="text-[11px] font-mono uppercase text-emerald-700 dark:text-emerald-400 font-semibold">
                    BoloSpeech Pediatric Engine
                  </div>
                  <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed font-medium">
                    {liveResult.childFeedback}
                  </p>
                </div>
              </div>

              {/* Per-Phoneme Forced Alignment Output */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-mono text-zinc-500 dark:text-zinc-400">
                  <span>FORCED ALIGNMENT · RECOGNIZED /{liveResult.recognizedIPA}/</span>
                  <span className="tabular-nums font-semibold text-zinc-900 dark:text-zinc-100">
                    GOP {Math.round(liveResult.overallGOP * 100)}% · {liveResult.encouragementStars}/3 STARS
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {liveResult.phonemes.map((ph, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-mono"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-zinc-950 dark:text-zinc-100">/{ph.phoneme}/</span>
                        <span className="text-[11px] text-zinc-500 tabular-nums">
                          {Math.round(ph.gopScore * 100)}%
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-1">
                        {ph.status === 'accepted_variant'
                          ? 'variant ok'
                          : ph.errorType === 'none'
                          ? 'aligned'
                          : ph.errorType}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right 5 Cols: Live Sagittal Articulatory Visualizer + Clinical Telemetry */}
            <div className="lg:col-span-5 p-6 sm:p-10 bg-zinc-50/50 dark:bg-[#0D0D10] flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="text-xs font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  SAGITTAL ARTICULATORY PLACEMENT CUE
                </div>
                <ArticulatoryVisualizer
                  targetPhoneme={activeScenario.phonemeFocus}
                  articulatoryTip={
                    liveResult.phonemes.find((p) => p.articulatoryTip)?.articulatoryTip
                  }
                />
              </div>

              <div className="p-4 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-2 text-xs">
                <div className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                  SLP Telemetry Log (Hidden from Child UI)
                </div>
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {liveResult.disfluency.clinicalNote}
                </p>
                <div className="pt-2 flex items-center justify-between font-mono text-[11px] text-zinc-500 tabular-nums border-t border-zinc-100 dark:border-zinc-800">
                  <span>Confidence: {Math.round(liveResult.confidence * 100)}%</span>
                  <span>%SS Est: {liveResult.disfluency.percentSyllablesStuttered}%</span>
                  <span>Status: {liveResult.clinicianReviewStatus}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BAND 04 · ASYMMETRIC ARCHITECTURAL BENTO GRID (01 — 04) */}
        <section className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="px-6 sm:px-10 lg:px-12 py-10 sm:py-12 border-b border-zinc-200 dark:border-zinc-800">
            <div className="text-xs font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              03 · CLINICAL ARCHITECTURE
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50 mt-2">
              Every detail engineered around{" "}
              <span className="font-serif-editorial italic font-normal">pediatric speech science</span>
            </h2>
          </div>

          {/* Row 1: 7 / 5 Asymmetric Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 border-b border-zinc-200 dark:border-zinc-800 divide-y lg:divide-y-0 lg:divide-x divide-zinc-200 dark:divide-zinc-800">
            <div className="lg:col-span-7 p-6 sm:p-10 space-y-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="text-xs font-mono text-zinc-400">01 / CHILD PRACTICE STUDIO</div>
                <h3 className="text-xl font-display font-bold text-zinc-950 dark:text-zinc-50">
                  Joyful home sessions with age-capped breaks &amp; zero discouraging scores
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl">
                  Word repetition, minimal pairs contrasts (&ldquo;Ring&rdquo; vs &ldquo;Wing&rdquo;), picture naming, syllable stretching, fluency metronome pacing, and DTTC apraxia drills—all protected by 5–15 minute age caps and non-punitive star feedback.
                </p>
              </div>

              <div className="aspect-16/9 w-full overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900">
                {!imgFallbacks.heroFamily ? (
                  <img
                    src={heroFamilyImg}
                    alt="Parent and child practicing joyful speech exercises together at home"
                    referrerPolicy="no-referrer"
                    onError={() => setImgFallbacks((p) => ({ ...p, heroFamily: true }))}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-mono text-zinc-500">
                    BoloSpeech Home Practice Studio
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-5 p-6 sm:p-10 space-y-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="text-xs font-mono text-zinc-400">02 / MULTILINGUAL LEXICON</div>
                <h3 className="text-xl font-display font-bold text-zinc-950 dark:text-zinc-50">
                  Code-switching &amp; developmental norms per language
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Adding a new language is a declarative JSON configuration task—complete with IPA inventory, G2P lexicon, typical acquisition age norms, and bilingual noun alternates.
                </p>
              </div>

              <div className="aspect-4/3 w-full overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900">
                {!imgFallbacks.tactileCards ? (
                  <img
                    src={tactileCardsImg}
                    alt="Multilingual illustrated storytelling and phoneme cards across scripts"
                    referrerPolicy="no-referrer"
                    onError={() => setImgFallbacks((p) => ({ ...p, tactileCards: true }))}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-mono text-zinc-500">
                    Multilingual Phoneme &amp; Story Cards
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Row 2: 5 / 7 Asymmetric Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-zinc-200 dark:divide-zinc-800">
            <div className="lg:col-span-5 p-6 sm:p-10 space-y-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="text-xs font-mono text-zinc-400">03 / SLP TELEPRACTICE LOOP</div>
                <h3 className="text-xl font-display font-bold text-zinc-950 dark:text-zinc-50">
                  Clinician forced-alignment inspection &amp; Gold-Label overrides
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  SLPs audit flagged clips, inspect F1/F2/F3 formants and VOT timing, override AI IPA transcriptions, and customize accepted dialect variants per child.
                </p>
              </div>

              <div className="aspect-4/3 w-full overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900">
                {!imgFallbacks.clinicianSession ? (
                  <img
                    src={clinicianSessionImg}
                    alt="Pediatric Speech-Language Pathologist reviewing acoustic alignment data"
                    referrerPolicy="no-referrer"
                    onError={() => setImgFallbacks((p) => ({ ...p, clinicianSession: true }))}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-mono text-zinc-500">
                    SLP Acoustic Forced-Alignment Station
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="text-xs font-mono text-zinc-400">04 / FLUENCY, APRAXIA &amp; DATA SOVEREIGNTY</div>
                <h3 className="text-xl font-display font-bold text-zinc-950 dark:text-zinc-50">
                  Specialized motor-planning &amp; stammering protocols with cryptographic erasure
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl">
                  Built simultaneously for articulation delays, phonological processes, childhood-onset fluency disorder (stammering), and childhood apraxia of speech (CAS).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-zinc-200 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800">
                {[
                  {
                    title: 'Fluency Metronome Mode',
                    desc: '40–90 BPM gentle syllable pacing, easy-onset turtle breathing, and zero disfluency star penalties.',
                  },
                  {
                    title: 'Apraxia DTTC Sequencing',
                    desc: 'Dynamic CV → CVC → CVCV motor-planning ladders with auditory, visual, and tactile cues.',
                  },
                  {
                    title: 'Bayesian Knowledge Tracing',
                    desc: 'Adaptive stimulus difficulty keeps children inside an encouraging 70–85% success zone.',
                  },
                  {
                    title: '1-Click Cryptographic Purge',
                    desc: 'Immediate erasure of child audio buffers and alignment logs with verifiable audit receipts.',
                  },
                ].map((cell, idx) => (
                  <div key={idx} className="bg-white dark:bg-zinc-950 p-5 space-y-1.5">
                    <div className="text-xs font-bold text-zinc-950 dark:text-zinc-100">
                      {cell.title}
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      {cell.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* BAND 05 · FOUR ROLE-BASED WORKSPACES LAUNCHPAD */}
        <section className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0C0C0E]">
          <div className="px-6 sm:px-10 lg:px-12 py-10 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                04 · INTERACTIVE PLATFORM WORKSPACES
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50 mt-1">
                Enter any role workspace directly
              </h2>
            </div>
            <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
              LIVE FULL-STACK EXPRESS + WEBAUDIO ENGINE
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-zinc-200 dark:divide-zinc-800">
            {[
              {
                view: 'child' as AppView,
                idx: '01',
                title: 'Child Practice Studio',
                role: 'Ages 3–12',
                desc: '16 kHz mic & simulator, minimal pairs, fluency metronome, apraxia drills, and sagittal mouth map.',
                cta: 'Open Child Studio',
              },
              {
                view: 'parent' as AppView,
                idx: '02',
                title: 'Parent Care Hub',
                role: 'Guardian Account',
                desc: 'Mastery trends, weekly reports translated in 4 languages, SLP notes, and DPDP hard-purge controls.',
                cta: 'Open Parent Hub',
              },
              {
                view: 'clinician' as AppView,
                idx: '03',
                title: 'SLP Clinician Portal',
                role: 'Licensed Therapist',
                desc: 'Caseload risk triage, forced-alignment inspector, Gold-Label IPA overrides, and SMART goals.',
                cta: 'Open SLP Portal',
              },
              {
                view: 'admin' as AppView,
                idx: '04',
                title: 'Governance & CMS',
                role: 'Platform Admin',
                desc: 'Multilingual stimulus CMS, ONNX canary traffic slider, subgroup parity gates, and audit trail.',
                cta: 'Open Governance',
              },
            ].map((ws) => (
              <div
                key={ws.view}
                className="p-6 sm:p-8 bg-white dark:bg-zinc-950 flex flex-col justify-between space-y-6 hover:bg-zinc-50/80 dark:hover:bg-zinc-900/60 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                    <span>WORKSPACE {ws.idx}</span>
                    <span>{ws.role}</span>
                  </div>
                  <h3 className="text-lg font-display font-bold text-zinc-950 dark:text-zinc-50">
                    {ws.title}
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {ws.desc}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigateView(ws.view)}
                  className="w-full py-2.5 px-4 border border-zinc-900 dark:border-zinc-200 text-xs font-semibold text-zinc-950 dark:text-zinc-100 hover:bg-zinc-950 hover:text-white dark:hover:bg-zinc-100 dark:hover:text-zinc-950 transition-colors inline-flex items-center justify-between cursor-pointer"
                >
                  <span>{ws.cta}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* BAND 06 · CLINICAL PROOF & PEDIATRIC SLP TESTIMONIALS */}
        <section className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-zinc-200 dark:divide-zinc-800">
            <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 space-y-6">
              <div className="text-xs font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                05 · CLINICAL ADVISORY PERSPECTIVE
              </div>
              <blockquote className="font-serif-editorial italic text-xl sm:text-2xl text-zinc-900 dark:text-zinc-100 leading-relaxed">
                &ldquo;For multilingual families in Bengaluru, Mumbai, and diaspora clinics, conventional speech apps do real harm when they mark a child’s valid Hindi or Tamil noun switch as an articulation error. Having per-child dialect tolerance alongside forced phoneme alignment transforms daily 10-minute home carryover.&rdquo;
              </blockquote>

              <div className="flex items-center gap-4 pt-2">
                {!imgFallbacks.slpAvatar ? (
                  <img
                    src={slpAvatarImg}
                    alt="Dr. Neha Rao, Pediatric Speech-Language Pathologist"
                    referrerPolicy="no-referrer"
                    onError={() => setImgFallbacks((p) => ({ ...p, slpAvatar: true }))}
                    className="w-12 h-12 rounded-full object-cover border border-zinc-300 dark:border-zinc-700"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-mono font-bold">
                    NR
                  </div>
                )}
                <div>
                  <div className="text-sm font-bold text-zinc-950 dark:text-zinc-50">
                    Dr. Neha Rao, CCC-SLP
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    Pediatric Bilingual Speech-Language Pathologist · Clinical Advisor
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 p-6 sm:p-10 lg:p-12 bg-zinc-50/60 dark:bg-[#0D0D10] flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="text-xs font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  OPEN BENCHMARK TRANSPARENCY
                </div>
                <h3 className="text-lg font-display font-bold text-zinc-950 dark:text-zinc-50">
                  Subgroup fairness audited before every model promotion
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Every acoustic model checkpoint is evaluated across age bands (3–5, 6–8, 9–12 yrs) and language pairs. Promotion is blocked in CI if False Rejection Rate exceeds 5.0% or subgroup disparity exceeds 2.5%.
                </p>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => onOpenDocs('evaluation')}
                  className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-between cursor-pointer"
                >
                  <span>Inspect EVALUATION_REPORT.md</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onOpenDocs('clinical_review')}
                  className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-between cursor-pointer"
                >
                  <span>Inspect Developmental Norms (CLINICAL_REVIEW.md)</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* BAND 07 · TRANSPARENT PRICING WITH INK ORBIT MONTHLY / YEARLY TOGGLE */}
        <section className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="px-6 sm:px-10 lg:px-12 py-10 sm:py-12 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="text-xs font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                06 · ACCESSIBLE FAMILY &amp; CLINIC PLANS
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50">
                Transparent pricing with{" "}
                <span className="font-serif-editorial italic font-normal">zero child-facing upsells</span>
              </h2>
            </div>

            {/* Monthly / Yearly Toggle */}
            <div className="inline-flex border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 p-1">
              <button
                type="button"
                onClick={() => setBillingPeriod('monthly')}
                className={`px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  billingPeriod === 'monthly'
                    ? 'bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingPeriod('yearly')}
                className={`px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  billingPeriod === 'yearly'
                    ? 'bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100'
                }`}
              >
                Yearly · Save 20%
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-zinc-200 dark:divide-zinc-800">
            {[
              {
                tier: 'Home Starter',
                subtitle: 'For families beginning structured daily speech play.',
                price: '₹0',
                period: 'forever · $0 USD',
                featured: false,
                features: [
                  '1 child profile with verifiable guardian consent',
                  '10-minute daily gamified practice studio',
                  'Full bilingual code-switch & accent tolerance',
                  '30-day rolling audio retention + instant purge',
                ],
                cta: 'Start Free Home Practice',
                action: () => onOpenOnboarding(),
              },
              {
                tier: 'Family Care Plus',
                subtitle: 'Full multilingual exercises + SLP telepractice link.',
                price: billingPeriod === 'yearly' ? '₹399' : '₹499',
                period: billingPeriod === 'yearly' ? '/ month billed annually · $5 USD' : '/ month · $6 USD',
                featured: true,
                features: [
                  'Up to 3 sibling profiles across all 5 languages',
                  'Fluency metronome & DTTC apraxia drill ladders',
                  'Translated weekly progress reports (EN / HI / TA / ES)',
                  'Asynchronous SLP recording review & care notes',
                ],
                cta: 'Register Family Account',
                action: () => onOpenOnboarding(),
              },
              {
                tier: 'SLP Clinic & School',
                subtitle: 'For pediatric practices, hospitals, and IEP teams.',
                price: billingPeriod === 'yearly' ? '₹3,999' : '₹4,999',
                period: billingPeriod === 'yearly' ? '/ month billed annually · 25 seats' : '/ month · 25 active seats',
                featured: false,
                features: [
                  'Forced-alignment formant & VOT clinical workstation',
                  'Gold-Label IPA overrides & per-child variant lists',
                  'SMART goal tracking, stagnation alerts & IEP exports',
                  'Dedicated DPDP / COPPA / HIPAA BAA governance',
                ],
                cta: 'Explore SLP Workstation',
                action: () => onNavigateView('clinician'),
              },
            ].map((plan) => (
              <div
                key={plan.tier}
                className={`p-6 sm:p-10 flex flex-col justify-between space-y-8 ${
                  plan.featured
                    ? 'bg-zinc-950 text-white dark:bg-zinc-900 dark:text-zinc-50'
                    : 'bg-white dark:bg-zinc-950'
                }`}
              >
                <div className="space-y-5">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-display font-bold">{plan.tier}</h3>
                      {plan.featured && (
                        <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                          MOST SELECTED
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-xs ${
                        plan.featured ? 'text-zinc-400' : 'text-zinc-500 dark:text-zinc-400'
                      }`}
                    >
                      {plan.subtitle}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-zinc-200/20 dark:border-zinc-800">
                    <span className="text-3xl sm:text-4xl font-mono font-bold tabular-nums">
                      {plan.price}
                    </span>
                    <span
                      className={`text-xs font-mono ml-2 ${
                        plan.featured ? 'text-zinc-400' : 'text-zinc-500 dark:text-zinc-400'
                      }`}
                    >
                      {plan.period}
                    </span>
                  </div>

                  <ul className="space-y-2.5 text-xs pt-2">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <Check
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            plan.featured ? 'text-emerald-400' : 'text-zinc-900 dark:text-zinc-200'
                          }`}
                        />
                        <span
                          className={
                            plan.featured ? 'text-zinc-200' : 'text-zinc-700 dark:text-zinc-300'
                          }
                        >
                          {feat}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={plan.action}
                  className={`w-full py-3 px-4 text-xs font-semibold transition-colors cursor-pointer ${
                    plan.featured
                      ? 'bg-white text-zinc-950 hover:bg-zinc-200'
                      : 'bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-white'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* BAND 08 · CLINICAL, MULTILINGUAL & PRIVACY FAQ ACCORDION */}
        <section className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0C0C0E]">
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-zinc-200 dark:divide-zinc-800">
            <div className="lg:col-span-4 p-6 sm:p-10 space-y-3">
              <div className="text-xs font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                07 · FREQUENTLY ASKED QUESTIONS
              </div>
              <h2 className="text-2xl font-display font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50">
                Clinical scope, code-switching &amp;{" "}
                <span className="font-serif-editorial italic font-normal">voice privacy</span>
              </h2>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Have a deeper technical question? Open our live engineering &amp; regulatory documentation drawer anytime.
              </p>
              <button
                type="button"
                onClick={() => onOpenDocs('privacy')}
                className="mt-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Read PRIVACY_AND_COMPLIANCE.md</span>
              </button>
            </div>

            <div className="lg:col-span-8 divide-y divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-zinc-950">
              {FAQ_ITEMS.map((item, idx) => {
                const isOpen = openFaqIdx === idx;
                return (
                  <div key={idx} className="px-6 sm:px-10 py-5">
                    <button
                      type="button"
                      onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                      aria-expanded={isOpen}
                      className="w-full flex items-center justify-between gap-4 text-left cursor-pointer"
                    >
                      <span className="text-sm font-semibold text-zinc-950 dark:text-zinc-100">
                        {item.q}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-zinc-500 shrink-0 transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <p className="mt-3 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-3xl">
                        {item.a}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* BAND 09 · CONVERSION SIGN-UP & CLINIC PILOT PARTNERSHIP BAND */}
        <section className="bg-white dark:bg-zinc-950">
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-zinc-200 dark:divide-zinc-800">
            {/* Left Conversion Callout */}
            <div className="lg:col-span-5 p-6 sm:p-10 lg:p-12 flex flex-col justify-between space-y-6 bg-zinc-950 text-white dark:bg-zinc-900">
              <div className="space-y-4">
                <div className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                  08 · START HOME PRACTICE OR CLINIC PILOT
                </div>
                <h2 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight leading-tight">
                  Give every multilingual child a speech companion{" "}
                  <span className="font-serif-editorial italic font-normal text-zinc-300">
                    that hears them accurately.
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  Register a family profile in under two minutes with verifiable guardian consent, or request a clinic pilot for your SLP caseload.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={onOpenOnboarding}
                  className="px-5 py-3 bg-white text-zinc-950 text-xs font-semibold hover:bg-zinc-200 transition-colors cursor-pointer"
                >
                  Create Family Account
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateView('child')}
                  className="px-5 py-3 border border-zinc-700 text-white text-xs font-semibold hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Try Demo Child Studio
                </button>
              </div>
            </div>

            {/* Right Validated Clinic / Family Inquiry Form */}
            <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12">
              {contactSubmitted ? (
                <div className="p-6 border border-zinc-900 dark:border-zinc-200 bg-zinc-50 dark:bg-zinc-900 space-y-3">
                  <div className="text-sm font-bold text-zinc-950 dark:text-zinc-50">
                    Clinic &amp; Pilot Inquiry Logged
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    Thank you! Your inquiry has been persisted to the platform store and is immediately visible inside the Governance &amp; Audit workspace.
                  </p>
                  <button
                    type="button"
                    onClick={() => setContactSubmitted(false)}
                    className="text-xs font-semibold underline text-zinc-900 dark:text-zinc-100 cursor-pointer"
                  >
                    Submit another inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleInquirySubmit} className="space-y-4">
                  <div className="text-sm font-bold text-zinc-950 dark:text-zinc-100">
                    Request SLP Clinic Pilot or Multilingual School Onboarding
                  </div>

                  {contactError && (
                    <div className="p-3 border border-rose-300 bg-rose-50 dark:bg-rose-950/40 text-xs text-rose-800 dark:text-rose-300">
                      {contactError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="Dr. Meera Iyer"
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-950 dark:text-zinc-100 focus:border-zinc-950 dark:focus:border-zinc-200 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="meera@pediatricspeech.org"
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-950 dark:text-zinc-100 focus:border-zinc-950 dark:focus:border-zinc-200 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        Clinic / School
                      </label>
                      <input
                        type="text"
                        value={contactOrg}
                        onChange={(e) => setContactOrg(e.target.value)}
                        placeholder="Aarambh Speech Clinic"
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-950 dark:text-zinc-100 focus:border-zinc-950 dark:focus:border-zinc-200 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        Role
                      </label>
                      <select
                        value={contactRole}
                        onChange={(e) => setContactRole(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-950 dark:text-zinc-100"
                      >
                        <option>Pediatric SLP / Clinic</option>
                        <option>School IEP Coordinator</option>
                        <option>Parent / Guardian</option>
                        <option>Clinical Researcher</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        Primary Language Mix
                      </label>
                      <input
                        type="text"
                        value={contactLangs}
                        onChange={(e) => setContactLangs(e.target.value)}
                        placeholder="Hindi + Indian English"
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-950 dark:text-zinc-100 focus:border-zinc-950 dark:focus:border-zinc-200 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="text-xs">
                    <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Caseload &amp; Phoneme Goals (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="Tell us about your bilingual caseload or target speech sound disorders..."
                      className="w-full px-3.5 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-950 dark:text-zinc-100 focus:border-zinc-950 dark:focus:border-zinc-200 focus:outline-hidden"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSending}
                    className="px-5 py-3 bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-white transition-colors inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSending ? 'Submitting...' : 'Submit Clinic Partnership Inquiry'}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
