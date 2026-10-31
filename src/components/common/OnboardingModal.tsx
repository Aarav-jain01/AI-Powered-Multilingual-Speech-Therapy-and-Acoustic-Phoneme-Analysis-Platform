import React, { useState } from 'react';
import { ShieldCheck, Check, ChevronRight, X } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../../data/languages';
import { ChildProfile, ConsentRecord } from '../../types/patient';
import { ClinicianCaseloadItem } from '../../types/clinical';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleted: (payload: {
    child: ChildProfile;
    consent: ConsentRecord;
    caseloadEntry: ClinicianCaseloadItem;
  }) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onCompleted,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [guardianName, setGuardianName] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [consentVerified, setConsentVerified] = useState(false);
  const [nonDiagnosticAck, setNonDiagnosticAck] = useState(false);
  const [researchOptIn, setResearchOptIn] = useState(false);
  const [retentionDays, setRetentionDays] = useState(30);

  const [childName, setChildName] = useState('');
  const [ageYears, setAgeYears] = useState(5);
  const [selectedLangs, setSelectedLangs] = useState<string[]>(['hi_IN', 'en_IN']);
  const [accentProfile, setAccentProfile] = useState<'indian_english' | 'us_english' | 'uk_english' | 'general'>('indian_english');
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState<'articulation' | 'phonological' | 'stammering' | 'apraxia'>('articulation');
  const [sessionCap, setSessionCap] = useState(10);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const toggleLanguage = (code: string) => {
    setSelectedLangs((prev) =>
      prev.includes(code)
        ? prev.length > 1
          ? prev.filter((l) => l !== code)
          : prev
        : [...prev, code]
    );
  };

  const handleNextStep1 = () => {
    if (!guardianName.trim() || !guardianEmail.includes('@')) {
      setErrorMsg('Please enter your full name and a valid email address.');
      return;
    }
    setErrorMsg('');
    setStep(2);
  };

  const handleNextStep2 = () => {
    if (!consentVerified || !nonDiagnosticAck) {
      setErrorMsg('Both verifiable parental consent and clinical scope acknowledgment are required.');
      return;
    }
    setErrorMsg('');
    setStep(3);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childName.trim()) {
      setErrorMsg('Please enter your child’s first name.');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/v1/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guardianName: guardianName.trim(),
          guardianEmail: guardianEmail.trim(),
          researchOptIn,
          audioRetentionDays: retentionDays,
          childName: childName.trim(),
          ageYears,
          homeLanguages: selectedLangs,
          primaryPracticeLanguage: selectedLangs[0] || 'en_IN',
          accentProfile,
          primaryDiagnosis,
          sessionTimeCapMinutes: sessionCap,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create profile');
      }
      const data = await response.json();
      onCompleted(data);
      onClose();
    } catch {
      setErrorMsg('Could not save child profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
      <div
        className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
      >
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <p className="text-xs font-medium text-slate-500">
              Step {step} of 3 · Family Registration & Consent
            </p>
            <h2 id="onboarding-title" className="text-xl font-bold text-slate-900 mt-1">
              {step === 1 && 'Parent or Guardian Account'}
              {step === 2 && 'Verifiable Parental Consent (DPDP & COPPA)'}
              {step === 3 && 'Multilingual Child Speech Profile'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
            aria-label="Close registration modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator Bar */}
        <div className="grid grid-cols-3 gap-2 my-5">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-colors ${
                s <= step ? 'bg-sky-600' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-medium text-rose-800">
            {errorMsg}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Parent / Legal Guardian Full Name
              </label>
              <input
                type="text"
                value={guardianName}
                onChange={(e) => setGuardianName(e.target.value)}
                placeholder="e.g. Ananya Krishnan"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:border-sky-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Parent Email (for Weekly Reports & Consent Receipt)
              </label>
              <input
                type="email"
                value={guardianEmail}
                onChange={(e) => setGuardianEmail(e.target.value)}
                placeholder="ananya@family.in"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:border-sky-600 focus:outline-hidden"
              />
            </div>

            <p className="text-xs text-slate-500 leading-relaxed pt-1">
              Children never log in directly or see advertisements, external links, or raw clinical scores. Accounts are strictly managed by a verified parent or guardian.
            </p>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleNextStep1}
                className="px-5 py-2.5 bg-sky-600 text-white text-xs font-semibold rounded-lg hover:bg-sky-700 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <span>Continue to Consent</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs text-slate-700 leading-relaxed">
              <div className="flex items-center gap-2 font-semibold text-slate-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Child Voice Biometric & Data Minimization Guarantee</span>
              </div>
              <p>
                Under India’s DPDP Act 2023 (Section 9), US COPPA, and GDPR-K, child speech recordings are processed exclusively to compute phoneme alignment and practice feedback. Zero behavioral profiling or ad targeting is performed, and you may purge all recordings irreversibly at any time.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Automatic Raw Audio Retention Window: <span className="font-mono">{retentionDays} days</span>
              </label>
              <input
                type="range"
                min={7}
                max={90}
                step={7}
                value={retentionDays}
                onChange={(e) => setRetentionDays(Number(e.target.value))}
                className="w-full accent-sky-600 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>7 days</span>
                <span>30 days (Recommended)</span>
                <span>90 days</span>
              </div>
            </div>

            <label className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
              <input
                type="checkbox"
                checked={consentVerified}
                onChange={(e) => setConsentVerified(e.target.checked)}
                className="mt-0.5 accent-sky-600"
              />
              <span className="text-xs text-slate-700 leading-relaxed">
                I verify that I am the parent or legal guardian and grant explicit consent for microphone audio processing under DPDP Act 2023 & COPPA.
              </span>
            </label>

            <label className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
              <input
                type="checkbox"
                checked={nonDiagnosticAck}
                onChange={(e) => setNonDiagnosticAck(e.target.checked)}
                className="mt-0.5 accent-sky-600"
              />
              <span className="text-xs text-slate-700 leading-relaxed">
                I understand BoloSpeech is a home-practice support tool, not a medical diagnostic device or substitute for a licensed Speech-Language Pathologist.
              </span>
            </label>

            <label className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
              <input
                type="checkbox"
                checked={researchOptIn}
                onChange={(e) => setResearchOptIn(e.target.checked)}
                className="mt-0.5 accent-sky-600"
              />
              <span className="text-xs text-slate-600 leading-relaxed">
                Optional: Allow de-identified SLP-reviewed clips to help improve multilingual pediatric speech accuracy.
              </span>
            </label>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleNextStep2}
                className="px-5 py-2.5 bg-sky-600 text-white text-xs font-semibold rounded-lg hover:bg-sky-700 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <span>Configure Child Profile</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Child’s Name
                </label>
                <input
                  type="text"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  placeholder="e.g. Kabir Krishnan"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:border-sky-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Age (3–12 yrs)
                </label>
                <input
                  type="number"
                  min={3}
                  max={12}
                  value={ageYears}
                  onChange={(e) => setAgeYears(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg font-mono tabular-nums"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Home Language Mix (Code-Switch Set)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const active = selectedLangs.includes(lang.code);
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => toggleLanguage(lang.code)}
                      className={`px-3 py-2 rounded-lg border text-left text-xs font-medium transition-colors flex items-center justify-between ${
                        active
                          ? 'border-sky-600 bg-sky-50 text-sky-900 font-semibold'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">{lang.name}</span>
                      {active && <Check className="w-3.5 h-3.5 text-sky-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Primary Therapy Focus
                </label>
                <select
                  value={primaryDiagnosis}
                  onChange={(e) => setPrimaryDiagnosis(e.target.value as 'articulation' | 'phonological' | 'stammering' | 'apraxia')}
                  className="w-full px-3 py-2 text-xs font-medium border border-slate-300 rounded-lg bg-white"
                >
                  <option value="articulation">Articulation (/r/, /s/, /l/, retroflex)</option>
                  <option value="phonological">Phonological Contrast (Minimal Pairs)</option>
                  <option value="stammering">Fluency & Stammering (Paced Speech)</option>
                  <option value="apraxia">Childhood Apraxia (Motor CV-CVC)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Accent Baseline & Daily Cap
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={accentProfile}
                    onChange={(e) => setAccentProfile(e.target.value as 'indian_english' | 'us_english' | 'uk_english' | 'general')}
                    className="flex-1 px-2.5 py-2 text-xs font-medium border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="indian_english">Indian English</option>
                    <option value="us_english">US English</option>
                    <option value="uk_english">UK English</option>
                    <option value="general">Multilingual General</option>
                  </select>
                  <select
                    value={sessionCap}
                    onChange={(e) => setSessionCap(Number(e.target.value))}
                    className="w-24 px-2 py-2 text-xs font-mono border border-slate-300 rounded-lg bg-white"
                  >
                    <option value={5}>5 min</option>
                    <option value={10}>10 min</option>
                    <option value={15}>15 min</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap disabled:opacity-50"
              >
                {isSubmitting ? 'Saving Profile...' : 'Complete Setup & Start Practice'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
