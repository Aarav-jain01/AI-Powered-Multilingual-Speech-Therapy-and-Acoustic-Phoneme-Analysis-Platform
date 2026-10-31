export interface ConsentRecord {
  consentId: string;
  guardianName: string;
  guardianEmail: string;
  dpdpConsentVerified: boolean;
  coppaConsentVerified: boolean;
  gdprConsentVerified: boolean;
  researchOptIn: boolean;
  audioRetentionDays: number; // default 30 days
  consentTimestamp: string;
  ipHash: string;
}

export interface ChildProfile {
  id: string;
  name: string;
  dateOfBirth: string; // YYYY-MM-DD
  ageYears: number;
  homeLanguages: string[]; // e.g. ["en_IN", "hi_IN"]
  primaryPracticeLanguage: string;
  accentProfile: 'indian_english' | 'us_english' | 'uk_english' | 'general';
  assignedClinicianId?: string;
  consentId: string;
  avatarId: string;
  streakDays: number;
  totalStars: number;
  sessionTimeCapMinutes: number; // 5 - 15 minutes by age
  dyslexiaFontEnabled: boolean;
  reducedMotionEnabled: boolean;
}

export interface PrivacyAuditEntry {
  id: string;
  action: 'consent_granted' | 'audio_recorded' | 'audio_purged' | 'child_data_deleted' | 'export_requested';
  timestamp: string;
  details: string;
  actorRole: 'parent' | 'clinician' | 'system';
}
