import type { MinimalPairItem } from '../types/content';
import { WORD_BANK } from './wordBank';

const word = (id: string) => WORD_BANK.find((item) => item.id === id) || WORD_BANK[0];

export const MINIMAL_PAIRS: MinimalPairItem[] = [
  {
    id: 'pair-r-w',
    phonemeA: 'r',
    phonemeB: 'w',
    wordA: { ...word('word-rabbit'), text: 'rain', ipa: '/reɪn/', targetPhoneme: '/r/' },
    wordB: { ...word('word-rabbit'), text: 'wane', ipa: '/weɪn/', targetPhoneme: '/w/' },
    contrastCategory: 'gliding',
    promptInstructions: 'Listen for the tongue curl in the first word.',
  },
  {
    id: 'pair-s-t',
    phonemeA: 's',
    phonemeB: 't',
    wordA: word('word-sun'),
    wordB: { ...word('word-sun'), text: 'ton', ipa: '/tʌn/', targetPhoneme: '/t/' },
    contrastCategory: 'stopping',
    promptInstructions: 'Listen for a long airflow sound or a quick pop.',
  },
];
