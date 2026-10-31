import type { WeeklyIEPReport } from '../types/clinical';
import type { ClinicianCaseloadItem, SMARTGoal } from '../types/clinical';
import type { ConsentRecord, ChildProfile, PrivacyAuditEntry } from '../types/patient';
import type { SpeechAttemptResult } from '../types/speech';

export const INITIAL_CHILD: ChildProfile = {
  id: 'child-aarav-01',
  name: 'Aarav Sharma',
  dateOfBirth: '2019-04-15',
  ageYears: 7,
  homeLanguages: ['en_IN', 'hi_IN'],
  primaryPracticeLanguage: 'en_IN',
  accentProfile: 'indian_english',
  assignedClinicianId: 'slp_dr_neha_rao',
  consentId: 'csnt_dpdp_8921a',
  avatarId: 'parrot_companion',
  streakDays: 5,
  totalStars: 42,
  sessionTimeCapMinutes: 12,
  dyslexiaFontEnabled: false,
  reducedMotionEnabled: false,
};

export const INITIAL_CONSENT: ConsentRecord = {
  consentId: 'csnt_dpdp_8921a',
  guardianName: 'Priya Sharma',
  guardianEmail: 'priya@example.com',
  dpdpConsentVerified: true,
  coppaConsentVerified: true,
  gdprConsentVerified: true,
  researchOptIn: false,
  audioRetentionDays: 30,
  consentTimestamp: '2026-10-01T10:00:00.000Z',
  ipHash: 'demo-ip-hash',
};

const INITIAL_GOAL: SMARTGoal = {
  id: 'goal-aarav-r',
  childId: INITIAL_CHILD.id,
  targetPhoneme: '/r/',
  position: 'initial',
  targetAccuracy: 80,
  consecutiveSessionsRequired: 3,
  currentAccuracy: 72,
  startDate: '2026-09-15',
  targetCompletionDate: '2026-11-15',
  status: 'active',
  notes: 'Use visual tongue-placement cue before each attempt.',
};

export const INITIAL_GOALS: SMARTGoal[] = [INITIAL_GOAL];

export const INITIAL_CASELOAD: ClinicianCaseloadItem[] = [
  {
    childId: INITIAL_CHILD.id,
    childName: INITIAL_CHILD.name,
    age: INITIAL_CHILD.ageYears,
    languages: INITIAL_CHILD.homeLanguages,
    primaryDiagnosis: 'articulation',
    activeGoals: INITIAL_GOALS,
    lastPracticeDate: '2026-10-27',
    practiceStreakDays: INITIAL_CHILD.streakDays,
    unreviewedRecordingsCount: 2,
    riskAlert: null,
    acceptedVariants: ['/ɻ/'],
  },
];

export const INITIAL_ATTEMPTS: SpeechAttemptResult[] = [];

export const INITIAL_AUDIT_LOGS: PrivacyAuditEntry[] = [
  {
    id: 'audit-consent-01',
    action: 'consent_granted',
    timestamp: INITIAL_CONSENT.consentTimestamp,
    details: 'Guardian consent verified for practice features.',
    actorRole: 'parent',
  },
];

export const INITIAL_IEP_REPORT: WeeklyIEPReport = {
  reportId: 'iep-aarav-2026-10-27',
  childId: INITIAL_CHILD.id,
  childName: INITIAL_CHILD.name,
  weekEndingDate: '2026-10-27',
  totalPracticeMinutes: 34,
  totalAttempts: 18,
  overallAccuracyChange: 6,
  phonemeMastery: [
    {
      phoneme: '/r/',
      attempts: 18,
      accuracyPercent: 72,
      trend: 'improving',
    },
  ],
  disfluencyTrend: {
    avgPercentSS: 3,
    trend: 'decreasing',
  },
  clinicianSummary: 'Aarav is building consistency with initial /r/ and responds well to visual cues.',
  recommendedHomeFocus: ['Keep practice short and positive.', 'Model the /r/ sound before each turn.'],
};
