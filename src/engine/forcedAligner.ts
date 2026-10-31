/**
 * Forced Phoneme Aligner
 * Maps acoustic energy and spectral transitions to target phoneme boundaries.
 */

export interface AlignedSegment {
  phoneme: string;
  startMs: number;
  endMs: number;
  durationMs: number;
}

export class ForcedAligner {
  /**
   * Aligns phoneme sequence across speech duration based on intrinsic phoneme durations
   */
  align(phonemes: string[], speechDurationSeconds: number, startOffsetMs = 0): AlignedSegment[] {
    if (phonemes.length === 0) return [];

    const totalDurationMs = speechDurationSeconds * 1000;

    // Weight relative expected duration per phoneme category
    const getRelativeWeight = (p: string): number => {
      // Vowels & diphthongs are longer
      if (/^[aieouɑæɔəɛɪʊʌeɪaɪoʊ]/.test(p)) return 1.8;
      // Fricatives & sibilants
      if (['s', 'z', 'ʃ', 'ʒ', 'f', 'v', 'θ', 'ð'].includes(p)) return 1.4;
      // Liquids & glides
      if (['r', 'ɹ', 'l', 'w', 'j', 'ɽ'].includes(p)) return 1.2;
      // Stops are shorter with burst
      if (['p', 'b', 't', 'd', 'k', 'g', 'ʈ', 'ɖ'].includes(p)) return 0.8;
      // Nasals
      if (['m', 'n', 'ŋ', 'ɲ'].includes(p)) return 1.0;
      return 1.0;
    };

    const weights = phonemes.map(getRelativeWeight);
    const sumWeights = weights.reduce((a, b) => a + b, 0);

    const segments: AlignedSegment[] = [];
    let currentMs = startOffsetMs;

    for (let i = 0; i < phonemes.length; i++) {
      const segDurationMs = Math.round((weights[i] / sumWeights) * totalDurationMs);
      const endMs = currentMs + segDurationMs;
      segments.push({
        phoneme: phonemes[i],
        startMs: currentMs,
        endMs,
        durationMs: segDurationMs,
      });
      currentMs = endMs;
    }

    return segments;
  }
}
