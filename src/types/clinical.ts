export interface SMARTGoal {
  id: string;
  childId: string;
  targetPhoneme: string;
  position: 'initial' | 'medial' | 'final' | 'all';
  targetAccuracy: number;
  consecutiveSessionsRequired: number;
  currentAccuracy: number;
  startDate: string;
  targetCompletionDate: string;
  status: 'active' | 'achieved' | 'stagnant' | 'paused';
  notes: string;
}

export interface ClinicianCaseloadItem {
  childId: string;
  childName: string;
  age: number;
  languages: string[];
  primaryDiagnosis: 'articulation' | 'phonological' | 'stammering' | 'apraxia' | 'mixed';
  activeGoals: SMARTGoal[];
  lastPracticeDate: string;
  practiceStreakDays: number;
  unreviewedRecordingsCount: number;
  riskAlert?: 'stagnation_3w' | 'regression_alert' | 'high_disfluency' | null;
  acceptedVariants: string[];
}

export interface GoldLabelCorrection {
  attemptId: string;
  clinicianId: string;
  originalRecognizedIPA: string;
  correctedIPA: string;
  notes: string;
  acousticAgreement: boolean;
  timestamp: string;
}

export interface TelepracticeNote {
  id: string;
  childId: string;
  authorName: string;
  authorRole: 'clinician' | 'parent';
  message: string;
  timestamp: string;
}

export interface ClinicInquiry {
  id: string;
  name: string;
  email: string;
  organization: string;
  role: string;
  languagesNeeded: string;
  message: string;
  createdAt: string;
}

export interface WeeklyIEPReport {
  reportId: string;
  childId: string;
  childName: string;
  weekEndingDate: string;
  totalPracticeMinutes: number;
  totalAttempts: number;
  overallAccuracyChange: number;
  phonemeMastery: {
    phoneme: string;
    attempts: number;
    accuracyPercent: number;
    trend: 'improving' | 'stable' | 'needs_reinforcement';
  }[];
  disfluencyTrend?: {
    avgPercentSS: number;
    trend: 'decreasing' | 'stable' | 'variable';
  };
  clinicianSummary: string;
  recommendedHomeFocus: string[];
}
