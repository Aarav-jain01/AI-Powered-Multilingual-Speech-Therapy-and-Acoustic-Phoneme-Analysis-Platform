export type ExerciseType = 
  | 'word_repetition'
  | 'minimal_pairs'
  | 'picture_naming'
  | 'sentence_repetition'
  | 'tongue_twister'
  | 'syllable_stretch'
  | 'fluency_metronome'
  | 'apraxia_drill';

export interface PhonemeMetadata {
  ipa: string;
  name: string;
  placeOfArticulation: 'bilabial' | 'labiodental' | 'dental' | 'alveolar' | 'postalveolar' | 'retroflex' | 'palatal' | 'velar' | 'glottal';
  mannerOfArticulation: 'stop' | 'fricative' | 'affricate' | 'nasal' | 'liquid' | 'glide' | 'vowel';
  voiced: boolean;
  aspirated?: boolean;
  retroflex?: boolean;
  typicalAcquisitionAge: number; // in years
  articulatoryPlacementDescription: string;
  cueType: 'auditory' | 'visual' | 'tactile';
  tactileCueText: string;
  mouthGraphicSvgType: 'open_vowel' | 'rhotic_curl' | 'alveolar_touch' | 'interdental_tongue' | 'bilabial_closure' | 'velar_back';
}

export interface WordItem {
  id: string;
  text: string;
  language: string; // e.g. "en_US", "en_IN", "hi_IN", "ta_IN", "es_ES"
  ipa: string;
  targetPhoneme: string;
  targetPosition: 'initial' | 'medial' | 'final';
  syllableCount: number;
  syllableShape: 'CV' | 'CVC' | 'CVCV' | 'CCVC' | 'CVCC' | 'CVCVC' | 'CVCVCVC' | 'CVCCV' | string;
  difficultyTier: 1 | 2 | 3 | 4 | 5;
  iconName: string;
  imageUrl?: string;
  acceptedCodeSwitchAlternates?: string[]; // e.g. "water" accepts "pani", "milk" accepts "doodh"
  phonologicalContrastPairId?: string;
}

export interface MinimalPairItem {
  id: string;
  phonemeA: string;
  phonemeB: string;
  wordA: WordItem;
  wordB: WordItem;
  contrastCategory: 'voicing' | 'fronting_backing' | 'gliding' | 'stopping';
  promptInstructions: string;
}

export interface ApraxiaSequence {
  id: string;
  title: string;
  level: 'CV' | 'CVC' | 'CVCV';
  steps: {
    syllable: string;
    ipa: string;
    auditoryModelText: string;
    visualPlacementHint: string;
  }[];
}
