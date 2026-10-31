/**
 * Adaptive Learning Engine (Bayesian Knowledge Tracing & Clinical Hierarchy)
 * Determines next stimulus based on child's estimated mastery of target phonemes.
 */

import { WordItem } from '../types/content';

export interface BKTParameters {
  pL0: number; // Prior probability of mastery (initial)
  pT: number;  // Probability of learning on opportunity
  pS: number;  // Probability of slip (mastered but made mistake)
  pG: number;  // Probability of guess (not mastered but got right)
}

export interface PhonemeMasteryState {
  phoneme: string;
  pMastery: number; // 0.0 to 1.0
  totalAttempts: number;
  recentAccuracies: boolean[]; // Last N attempts
  mastered: boolean;
  consecutiveSuccessCount: number;
}

export class AdaptiveLearningEngine {
  private defaultBKT: BKTParameters = {
    pL0: 0.15,
    pT: 0.12,
    pS: 0.08,
    pG: 0.15,
  };

  private masteryThreshold = 0.80; // 80% mastery criterion
  private consecutiveRequired = 3;

  /**
   * Update mastery state following an attempt using BKT update formulas
   */
  updateMastery(
    currentState: PhonemeMasteryState,
    isCorrect: boolean,
    params: BKTParameters = this.defaultBKT
  ): PhonemeMasteryState {
    const prevL = currentState.pMastery;

    // 1. Posterior probability given observation
    let pLGivenObs: number;
    if (isCorrect) {
      const numerator = prevL * (1 - params.pS);
      const denominator = prevL * (1 - params.pS) + (1 - prevL) * params.pG;
      pLGivenObs = numerator / (denominator || 1e-6);
    } else {
      const numerator = prevL * params.pS;
      const denominator = prevL * params.pS + (1 - prevL) * (1 - params.pG);
      pLGivenObs = numerator / (denominator || 1e-6);
    }

    // 2. Incorporate transition (learning probability)
    const newL = pLGivenObs + (1 - pLGivenObs) * params.pT;

    const recent = [...currentState.recentAccuracies, isCorrect].slice(-10);
    const newConsecutive = isCorrect ? currentState.consecutiveSuccessCount + 1 : 0;
    const isMastered = newL >= this.masteryThreshold && newConsecutive >= this.consecutiveRequired;

    return {
      phoneme: currentState.phoneme,
      pMastery: Math.min(0.99, Math.max(0.01, Math.round(newL * 1000) / 1000)),
      totalAttempts: currentState.totalAttempts + 1,
      recentAccuracies: recent,
      mastered: isMastered,
      consecutiveSuccessCount: newConsecutive,
    };
  }

  /**
   * Selects next optimal word to balance confidence (mixing mastered items)
   * and clinical challenge on active target sounds.
   */
  selectNextStimulus(
    availableWords: WordItem[],
    targetPhoneme: string,
    masteryState: PhonemeMasteryState
  ): WordItem {
    const candidateWords = availableWords.filter(w => w.targetPhoneme === targetPhoneme);
    if (candidateWords.length === 0) {
      return availableWords[Math.floor(Math.random() * availableWords.length)];
    }

    // Determine target difficulty tier
    let targetTier: 1 | 2 | 3 | 4 | 5 = 1;
    if (masteryState.pMastery > 0.70) targetTier = 4;
    else if (masteryState.pMastery > 0.50) targetTier = 3;
    else if (masteryState.pMastery > 0.30) targetTier = 2;
    else targetTier = 1;

    // Spaced repetition: 20% of time give an easier mastered stimulus for positive reinforcement
    const giveConfidenceBoost = Math.random() < 0.20 && targetTier > 1;
    const effectiveTier = giveConfidenceBoost ? ((targetTier - 1) as 1 | 2 | 3 | 4 | 5) : targetTier;

    const tierMatched = candidateWords.filter(w => w.difficultyTier === effectiveTier);
    if (tierMatched.length > 0) {
      return tierMatched[Math.floor(Math.random() * tierMatched.length)];
    }

    return candidateWords[Math.floor(Math.random() * candidateWords.length)];
  }
}
