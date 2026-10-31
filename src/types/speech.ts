export type PhonemePosition = 'initial' | 'medial' | 'final';

export type ErrorClassification = 
  | 'none'
  | 'substitution'
  | 'omission'
  | 'distortion'
  | 'addition'
  | 'gliding'              // e.g. /r/ -> /w/ or /l/ -> /j/
  | 'fronting'             // e.g. /k/ -> /t/ or /g/ -> /d/
  | 'stopping'             // e.g. /s/ -> /t/
  | 'lisp_frontal'         // interdental tongue protrusion
  | 'lisp_lateral'         // lateral air emission
  | 'voicing_confusion'    // e.g. /p/ -> /b/
  | 'cluster_reduction'    // e.g. /st/ -> /t/
  | 'final_consonant_drop' // omission at word-end
  | 'dialectal_variant';   // accepted regional / code-switch feature (not an error)

export interface AcousticFormants {
  f1: number;
  f2: number;
  f3: number;
}

export interface PhonemeAnalysis {
  phoneme: string;             // Target IPA symbol
  recognizedPhoneme: string;   // Recognized IPA symbol
  position: PhonemePosition;
  gopScore: number;            // 0.0 - 1.0 Goodness of Pronunciation
  status: 'correct' | 'near_match' | 'needs_practice' | 'accepted_variant';
  errorType: ErrorClassification;
  startTimeMs: number;
  endTimeMs: number;
  formants?: AcousticFormants;
  spectralCentroidHz?: number;
  pitchF0Hz?: number;
  articulatoryTip?: string;
}

export interface DisfluencyMetrics {
  detected: boolean;
  percentSyllablesStuttered: number; // %SS
  prolongationsCount: number;
  blocksCount: number;
  repetitionsCount: number;
  averageDurationMs: number;
  clinicalNote: string;
}

export interface SpeechAttemptResult {
  attemptId: string;
  childId: string;
  wordId: string;
  targetWord: string;
  language: string;
  targetIPA: string;
  recognizedIPA: string;
  overallGOP: number;
  confidence: number;
  phonemes: PhonemeAnalysis[];
  disfluency: DisfluencyMetrics;
  isAcceptedVariant: boolean;
  variantExplanation?: string;
  childFeedback: string;
  encouragementStars: number; // 1 to 3 stars (always positive encouragement)
  recordedAudioUrl?: string;
  timestamp: string;
  clinicianReviewStatus: 'unreviewed' | 'approved' | 'overridden' | 'flagged';
  goldLabel?: string;
}

export interface RealtimeAcousticFrame {
  timestamp: number;
  energyRMS: number;
  f0Hz: number | null;
  spectralCentroid: number;
  isVoiceActive: boolean;
}
