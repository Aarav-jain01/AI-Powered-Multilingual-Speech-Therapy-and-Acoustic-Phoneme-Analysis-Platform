/**
 * Phonological Error Classifier & Code-Switching Rule Engine
 * Identifies developmental speech error patterns, dialectal variants,
 * and valid multilingual code-switching alternations.
 */

import { ErrorClassification, PhonemePosition } from '../types/speech';

export interface ClassificationResult {
  errorType: ErrorClassification;
  status: 'correct' | 'near_match' | 'needs_practice' | 'accepted_variant';
  recognizedPhoneme: string;
  articulatoryTip: string;
}

export class ErrorClassifier {
  /**
   * Evaluates the acoustic evidence for a target phoneme against common pediatric substitution rules.
   */
  classify(
    targetPhoneme: string,
    position: PhonemePosition,
    gopScore: number,
    spectralCentroidHz: number,
    isRhoticF3Dip: boolean,
    acceptedVariantsList: string[] = []
  ): ClassificationResult {
    // 1. High GOP score -> Accurate production
    if (gopScore >= 0.78) {
      return {
        errorType: 'none',
        status: 'correct',
        recognizedPhoneme: targetPhoneme,
        articulatoryTip: 'Great placement and clear sound!',
      };
    }

    // 2. Rhotic /r/ or /ɹ/ Error Check (Gliding /r/ -> /w/)
    if (['r', 'ɹ', 'ɾ'].includes(targetPhoneme)) {
      if (!isRhoticF3Dip) {
        // Without F3 dip, child is gliding to [w] or open vowel
        return {
          errorType: 'gliding',
          status: 'needs_practice',
          recognizedPhoneme: 'w',
          articulatoryTip: 'Remember to curl the sides of your tongue up toward your back molars!',
        };
      }
    }

    // 3. Velar Stops /k/, /g/ Error Check (Velar Fronting /k/ -> /t/)
    if (['k', 'g'].includes(targetPhoneme)) {
      if (spectralCentroidHz > 3800) {
        // High frequency energy indicates alveolar touch instead of velar back closure
        const sub = targetPhoneme === 'k' ? 't' : 'd';
        return {
          errorType: 'fronting',
          status: 'needs_practice',
          recognizedPhoneme: sub,
          articulatoryTip: 'Keep your tongue tip down and use the back of your tongue to make a cough sound!',
        };
      }
    }

    // 4. Sibilant Fricative /s/, /z/ Error Check (Stopping or Lisping)
    if (['s', 'z'].includes(targetPhoneme)) {
      if (spectralCentroidHz < 3600) {
        // Frontal lisp pushes tongue between teeth (/θ/) or postalveolar (/ʃ/)
        return {
          errorType: 'lisp_frontal',
          status: 'needs_practice',
          recognizedPhoneme: 'θ',
          articulatoryTip: 'Keep your tongue inside your tooth cage so the air whistles right through!',
        };
      }
    }

    // 5. Dialectal & Regional Variants Check
    // e.g. /v/ <-> /w/ merger in Indian English
    if (
      (targetPhoneme === 'w' || targetPhoneme === 'v') &&
      acceptedVariantsList.includes('v_w_merger')
    ) {
      return {
        errorType: 'dialectal_variant',
        status: 'accepted_variant',
        recognizedPhoneme: targetPhoneme === 'w' ? 'v' : 'w',
        articulatoryTip: 'Recognized as an accepted regional dialect pronunciation.',
      };
    }

    // e.g. Retroflex stop /ʈ/ for alveolar /t/ in Indian English
    if (targetPhoneme === 't' && acceptedVariantsList.includes('retroflex_stops')) {
      return {
        errorType: 'dialectal_variant',
        status: 'accepted_variant',
        recognizedPhoneme: 'ʈ',
        articulatoryTip: 'Recognized as an accepted retroflex variant.',
      };
    }

    // 6. General near match vs substitution
    if (gopScore >= 0.60) {
      return {
        errorType: 'distortion',
        status: 'near_match',
        recognizedPhoneme: targetPhoneme,
        articulatoryTip: 'Very close! Try speaking a little louder and clearer.',
      };
    }

    return {
      errorType: 'substitution',
      status: 'needs_practice',
      recognizedPhoneme: '?',
      articulatoryTip: 'Let us listen to the audio model together and try again.',
    };
  }

  /**
   * Code-switching validator:
   * Checks whether the child used an alternate valid lexical item from their language mix.
   */
  checkCodeSwitchMatch(
    spokenText: string,
    targetWord: string,
    acceptedAlternates: string[] = []
  ): { isCodeSwitch: boolean; matchedWord?: string } {
    const cleanSpoken = spokenText.trim().toLowerCase();
    const cleanTarget = targetWord.trim().toLowerCase();

    if (cleanSpoken === cleanTarget) {
      return { isCodeSwitch: false };
    }

    for (const alt of acceptedAlternates) {
      if (cleanSpoken === alt.toLowerCase()) {
        return {
          isCodeSwitch: true,
          matchedWord: alt,
        };
      }
    }

    return { isCodeSwitch: false };
  }
}
