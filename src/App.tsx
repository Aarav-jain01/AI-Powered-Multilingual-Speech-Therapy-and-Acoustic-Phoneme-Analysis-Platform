/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { AppView, Navbar } from './components/common/Navbar';
import { WorkspaceToolbar } from './components/common/WorkspaceToolbar';
import { ClinicalDisclaimer } from './components/common/ClinicalDisclaimer';
import { OnboardingModal } from './components/common/OnboardingModal';
import { DocsDrawerModal } from './components/common/DocsDrawerModal';
import { LandingWebsite } from './components/website/LandingWebsite';
import { ChildPracticeView } from './components/child/ChildPracticeView';
import { ParentDashboard } from './components/parent/ParentDashboard';
import { ClinicianPortal } from './components/clinician/ClinicianPortal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ChildProfile, ConsentRecord, PrivacyAuditEntry } from './types/patient';
import {
  ClinicInquiry,
  ClinicianCaseloadItem,
  GoldLabelCorrection,
  SMARTGoal,
  TelepracticeNote,
} from './types/clinical';
import { SpeechAttemptResult } from './types/speech';
import { WordItem } from './types/content';
import {
  INITIAL_ATTEMPTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_CASELOAD,
  INITIAL_CHILD,
  INITIAL_GOALS,
} from './data/mockInitialData';
import { WORD_BANK } from './data/wordBank';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [docsModalState, setDocsModalState] = useState<{ open: boolean; docKey: string }>({
    open: false,
    docKey: 'architecture',
  });

  const [isDark, setIsDark] = useState<boolean>(false);
  const [isDyslexicFont, setIsDyslexicFont] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  // Full-stack persistent platform state
  const [childrenList, setChildrenList] = useState<ChildProfile[]>([INITIAL_CHILD]);
  const [activeChildId, setActiveChildId] = useState<string>(INITIAL_CHILD.id);
  const [caseload, setCaseload] = useState<ClinicianCaseloadItem[]>(INITIAL_CASELOAD);
  const [attempts, setAttempts] = useState<SpeechAttemptResult[]>(INITIAL_ATTEMPTS);
  const [goals, setGoals] = useState<SMARTGoal[]>(INITIAL_GOALS);
  const [goldCorrections, setGoldCorrections] = useState<GoldLabelCorrection[]>([]);
  const [wordBank, setWordBank] = useState<WordItem[]>(WORD_BANK);
  const [auditLogs, setAuditLogs] = useState<PrivacyAuditEntry[]>(INITIAL_AUDIT_LOGS);
  const [telepracticeNotes, setTelepracticeNotes] = useState<TelepracticeNote[]>([]);
  const [inquiries, setInquiries] = useState<ClinicInquiry[]>([]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  // Hydrate from full-stack Express backend
  const fetchPlatformState = async () => {
    try {
      const res = await fetch('/api/v1/state');
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.children) && data.children.length > 0) {
        setChildrenList(data.children);
      }
      if (Array.isArray(data.caseload)) setCaseload(data.caseload);
      if (Array.isArray(data.attempts)) setAttempts(data.attempts);
      if (Array.isArray(data.goals)) setGoals(data.goals);
      if (Array.isArray(data.goldCorrections)) setGoldCorrections(data.goldCorrections);
      if (Array.isArray(data.wordBank) && data.wordBank.length > 0) setWordBank(data.wordBank);
      if (Array.isArray(data.auditLogs)) setAuditLogs(data.auditLogs);
      if (Array.isArray(data.telepracticeNotes)) setTelepracticeNotes(data.telepracticeNotes);
      if (Array.isArray(data.inquiries)) setInquiries(data.inquiries);
    } catch {
      // Offline graceful degradation: keep seeded local state
    }
  };

  useEffect(() => {
    fetchPlatformState();
  }, []);

  const handleNavigateView = (view: AppView) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: isReducedMotion ? 'auto' : 'smooth' });
  };

  const activeChild =
    childrenList.find((c) => c.id === activeChildId) || childrenList[0] || INITIAL_CHILD;

  const activeAcceptedVariants =
    caseload.find((c) => c.childId === activeChild.id)?.acceptedVariants || [
      'v_w_merger',
      'retroflex_stops',
      'code_switching_nouns',
    ];

  // Handlers wired to full-stack Express API
  const handleOnboardingCompleted = (payload: {
    child: ChildProfile;
    consent: ConsentRecord;
    caseloadEntry: ClinicianCaseloadItem;
  }) => {
    setChildrenList((prev) => [...prev, payload.child]);
    setCaseload((prev) => [...prev, payload.caseloadEntry]);
    if (payload.caseloadEntry.activeGoals?.length) {
      setGoals((prev) => [...prev, ...payload.caseloadEntry.activeGoals]);
    }
    setActiveChildId(payload.child.id);
    fetchPlatformState();
    handleNavigateView('child');
  };

  const handleAttemptCompleted = async (newAttempt: SpeechAttemptResult) => {
    setAttempts((prev) => [newAttempt, ...prev]);
    setChildrenList((prev) =>
      prev.map((c) =>
        c.id === newAttempt.childId
          ? { ...c, totalStars: c.totalStars + newAttempt.encouragementStars }
          : c
      )
    );

    try {
      await fetch('/api/v1/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAttempt),
      });
      fetchPlatformState();
    } catch {
      // Offline queue fallback
    }
  };

  const handleCommitGoldCorrection = async (correction: GoldLabelCorrection) => {
    setGoldCorrections((prev) => [correction, ...prev]);
    setAttempts((prev) =>
      prev.map((att) =>
        att.attemptId === correction.attemptId
          ? { ...att, clinicianReviewStatus: 'overridden', goldLabel: correction.correctedIPA }
          : att
      )
    );
    try {
      await fetch('/api/v1/clinician/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(correction),
      });
    } catch {
      // Offline fallback
    }
  };

  const handleUpdateAcceptedVariants = async (childId: string, variants: string[]) => {
    setCaseload((prev) =>
      prev.map((c) => (c.childId === childId ? { ...c, acceptedVariants: variants } : c))
    );
    try {
      await fetch(`/api/v1/clinician/variants/${childId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variants }),
      });
    } catch {
      // Offline fallback
    }
  };

  const handleCreateGoal = async (goal: SMARTGoal) => {
    setGoals((prev) => [...prev, goal]);
    try {
      await fetch('/api/v1/clinician/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goal),
      });
    } catch {
      // Offline fallback
    }
  };

  const handlePurgeChildData = async () => {
    setAttempts((prev) => prev.filter((a) => a.childId !== activeChild.id));
    try {
      await fetch(`/api/v1/children/${activeChild.id}/data`, {
        method: 'DELETE',
      });
      await fetchPlatformState();
    } catch {
      // Offline fallback
    }
  };

  const handleSendTelepracticeNote = async (message: string) => {
    try {
      const res = await fetch('/api/v1/telepractice/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId: activeChild.id,
          authorName: 'Guardian Account',
          authorRole: 'parent',
          message,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setTelepracticeNotes((prev) => [...prev, data.note]);
      }
    } catch {
      // Offline fallback
    }
  };

  const handleAddWord = async (word: WordItem) => {
    setWordBank((prev) => [word, ...prev]);
    try {
      await fetch('/api/v1/admin/words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(word),
      });
    } catch {
      // Offline fallback
    }
  };

  const handleResetDemoData = async () => {
    try {
      const res = await fetch('/api/v1/demo/reset', { method: 'POST' });
      if (res.ok) {
        await fetchPlatformState();
      }
    } catch {
      // Offline fallback
    }
  };

  const openDocs = (docKey = 'architecture') => {
    setDocsModalState({ open: true, docKey });
  };

  return (
    <div
      className={`min-h-screen bg-[#FAFAFA] dark:bg-[#09090B] text-zinc-950 flex flex-col transition-colors ${
        isDark ? 'dark' : ''
      } ${isDyslexicFont ? 'font-dyslexic' : ''} ${isReducedMotion ? 'motion-reduce' : ''}`}
    >
      {/* Strict 3-Zone Ink Orbit Architectural Top Bar */}
      <Navbar
        currentView={currentView}
        onSelectView={handleNavigateView}
        onPrimaryAction={() => setIsOnboardingOpen(true)}
      />

      {/* Contextual Workspace Toolbar (when inside Child, Parent, SLP, or Admin views) */}
      <WorkspaceToolbar
        currentView={currentView}
        childrenList={childrenList}
        activeChildId={activeChild.id}
        onSelectChild={setActiveChildId}
        isDyslexicFont={isDyslexicFont}
        onToggleDyslexicFont={() => setIsDyslexicFont((prev) => !prev)}
        isDark={isDark}
        onToggleDark={() => setIsDark((prev) => !prev)}
        onOpenDisclaimer={() => setIsDisclaimerOpen(true)}
        onOpenDocs={openDocs}
      />

      {/* Main Viewport */}
      <main className="flex-1">
        {currentView === 'home' && (
          <LandingWebsite
            onNavigateView={handleNavigateView}
            onOpenOnboarding={() => setIsOnboardingOpen(true)}
            onOpenDocs={openDocs}
            onOpenDisclaimer={() => setIsDisclaimerOpen(true)}
            isDark={isDark}
            onToggleDark={() => setIsDark((prev) => !prev)}
            isReducedMotion={isReducedMotion}
          />
        )}

        {currentView === 'child' && (
          <ChildPracticeView
            child={activeChild}
            wordBank={wordBank}
            onAttemptCompleted={handleAttemptCompleted}
            acceptedVariants={activeAcceptedVariants}
          />
        )}

        {currentView === 'parent' && (
          <ParentDashboard
            child={activeChild}
            attempts={attempts}
            telepracticeNotes={telepracticeNotes}
            auditLogs={auditLogs}
            onPurgeChildData={handlePurgeChildData}
            onSendTelepracticeNote={handleSendTelepracticeNote}
            onOpenOnboarding={() => setIsOnboardingOpen(true)}
          />
        )}

        {currentView === 'clinician' && (
          <ClinicianPortal
            caseload={caseload}
            recentAttempts={attempts}
            goldCorrections={goldCorrections}
            goals={goals}
            onCommitGoldCorrection={handleCommitGoldCorrection}
            onUpdateAcceptedVariants={handleUpdateAcceptedVariants}
            onCreateGoal={handleCreateGoal}
          />
        )}

        {currentView === 'admin' && (
          <AdminDashboard
            wordBank={wordBank}
            auditLogs={auditLogs}
            inquiries={inquiries}
            onAddWord={handleAddWord}
            onResetDemoData={handleResetDemoData}
            onOpenDocs={openDocs}
          />
        )}
      </main>

      {/* Modals */}
      <ClinicalDisclaimer
        isOpen={isDisclaimerOpen}
        onClose={() => setIsDisclaimerOpen(false)}
      />

      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onCompleted={handleOnboardingCompleted}
      />

      <DocsDrawerModal
        isOpen={docsModalState.open}
        initialDocKey={docsModalState.docKey}
        onClose={() => setDocsModalState((prev) => ({ ...prev, open: false }))}
      />

      {/* Architectural Grid-Framed Ink Orbit Footer */}
      <footer className="bg-white dark:bg-[#09090B] border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 transition-colors">
        <div className="max-w-7xl mx-auto border-x border-zinc-200 dark:border-zinc-800 px-6 sm:px-10 lg:px-12 pt-12 pb-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2 space-y-3">
              <div className="text-lg font-display font-extrabold text-zinc-950 dark:text-zinc-50">
                Bolo<span className="font-serif-editorial italic font-normal">Speech</span>
              </div>
              <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-sm">
                Clinically-informed, privacy-first home speech practice and telepractice monitoring for multilingual children aged 3 to 12. Practice-support platform; not a medical diagnostic device.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setIsDark((prev) => !prev)}
                  className="underline hover:text-zinc-950 dark:hover:text-zinc-100 cursor-pointer"
                >
                  {isDark ? 'Switch to Paper Light' : 'Switch to Obsidian Dark'}
                </button>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={() => setIsDyslexicFont((prev) => !prev)}
                  className="underline hover:text-zinc-950 dark:hover:text-zinc-100 cursor-pointer"
                >
                  {isDyslexicFont ? 'Disable Dyslexic Font' : 'Dyslexia-Friendly Font'}
                </button>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={() => setIsReducedMotion((prev) => !prev)}
                  className="underline hover:text-zinc-950 dark:hover:text-zinc-100 cursor-pointer"
                >
                  {isReducedMotion ? 'Standard Motion' : 'Reduced Motion'}
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="font-bold text-zinc-950 dark:text-zinc-100">Platform Workspaces</div>
              <ul className="space-y-2">
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavigateView('home')}
                    className="hover:text-zinc-950 dark:hover:text-zinc-100 cursor-pointer"
                  >
                    Website Overview &amp; Sandbox
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavigateView('child')}
                    className="hover:text-zinc-950 dark:hover:text-zinc-100 cursor-pointer"
                  >
                    Child Practice Studio
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavigateView('parent')}
                    className="hover:text-zinc-950 dark:hover:text-zinc-100 cursor-pointer"
                  >
                    Parent Care &amp; Privacy Hub
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavigateView('clinician')}
                    className="hover:text-zinc-950 dark:hover:text-zinc-100 cursor-pointer"
                  >
                    SLP Clinician Portal
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavigateView('admin')}
                    className="hover:text-zinc-950 dark:hover:text-zinc-100 cursor-pointer"
                  >
                    Governance &amp; Word CMS
                  </button>
                </li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <div className="font-bold text-zinc-950 dark:text-zinc-100">Engineering &amp; ML Docs</div>
              <ul className="space-y-2">
                <li>
                  <button
                    type="button"
                    onClick={() => openDocs('architecture')}
                    className="hover:text-zinc-950 dark:hover:text-zinc-100 cursor-pointer"
                  >
                    System Architecture
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => openDocs('ml_pipeline')}
                    className="hover:text-zinc-950 dark:hover:text-zinc-100 cursor-pointer"
                  >
                    Acoustic GOP Pipeline
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => openDocs('evaluation')}
                    className="hover:text-zinc-950 dark:hover:text-zinc-100 cursor-pointer"
                  >
                    Fairness &amp; Parity Report
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => openDocs('adding_language')}
                    className="hover:text-zinc-950 dark:hover:text-zinc-100 cursor-pointer"
                  >
                    Adding a Language Guide
                  </button>
                </li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <div className="font-bold text-zinc-950 dark:text-zinc-100">Clinical &amp; Legal</div>
              <ul className="space-y-2">
                <li>
                  <button
                    type="button"
                    onClick={() => setIsDisclaimerOpen(true)}
                    className="hover:text-zinc-950 dark:hover:text-zinc-100 cursor-pointer"
                  >
                    Non-Diagnostic Scope Notice
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => openDocs('privacy')}
                    className="hover:text-zinc-950 dark:hover:text-zinc-100 cursor-pointer"
                  >
                    DPDP Act 2023 &amp; COPPA Spec
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => openDocs('clinical_review')}
                    className="hover:text-zinc-950 dark:hover:text-zinc-100 cursor-pointer"
                  >
                    Developmental Norms Table
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setIsOnboardingOpen(true)}
                    className="hover:text-zinc-950 dark:hover:text-zinc-100 cursor-pointer"
                  >
                    Verifiable Parental Consent
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4 font-mono text-[11px] text-zinc-500">
            <span>&copy; 2026 BoloSpeech Pediatric Speech Platform · WCAG 2.2 AA Accessible</span>
            <span>English (IN / US / UK) · हिन्दी · தமிழ் · বাংলা · Español</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
