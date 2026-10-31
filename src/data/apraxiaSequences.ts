import type { ApraxiaSequence } from '../types/content';

export const APRAXIA_SEQUENCES: ApraxiaSequence[] = [
  {
    id: 'sequence-cv',
    title: 'Start with simple consonant-vowel movements.',
    level: 'CV',
    steps: [
      { syllable: 'ma', ipa: 'mɑ', auditoryModelText: 'Open and close your lips slowly.', visualPlacementHint: 'Press lips together, then open.' },
      { syllable: 'mi', ipa: 'mi', auditoryModelText: 'Keep the movement smooth and easy.', visualPlacementHint: 'Smile after the lip pop.' },
      { syllable: 'mu', ipa: 'mu', auditoryModelText: 'Round your lips for the vowel.', visualPlacementHint: 'Make a small round window.' },
    ],
  },
  {
    id: 'sequence-cvc',
    title: 'Connect a beginning, middle, and ending sound.',
    level: 'CVC',
    steps: [
      { syllable: 'map', ipa: 'mæp', auditoryModelText: 'Start with the lips together.', visualPlacementHint: 'Feel the first lip tap.' },
      { syllable: 'map', ipa: 'mæp', auditoryModelText: 'Stretch the middle vowel.', visualPlacementHint: 'Keep your jaw relaxed.' },
      { syllable: 'map', ipa: 'mæp', auditoryModelText: 'Finish with a gentle lip pop.', visualPlacementHint: 'Close the lips at the end.' },
    ],
  },
  {
    id: 'sequence-cvcv',
    title: 'Build a smooth two-syllable movement.',
    level: 'CVCV',
    steps: [
      { syllable: 'mama', ipa: 'mɑmɑ', auditoryModelText: 'Say the first syllable slowly.', visualPlacementHint: 'Lips together, then open.' },
      { syllable: 'mama', ipa: 'mɑmɑ', auditoryModelText: 'Keep both syllables the same.', visualPlacementHint: 'Use an even rhythm.' },
      { syllable: 'mama', ipa: 'mɑmɑ', auditoryModelText: 'Say the whole word smoothly.', visualPlacementHint: 'Link the two movements.' },
    ],
  },
];
