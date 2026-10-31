/**
 * Disfluency & Stammering Detection Engine
 * Detects sound prolongations, articulatory blocks, and syllable repetitions,
 * calculating an estimated %SS (Percent Syllables Stuttered) for clinician review.
 */

import { DisfluencyMetrics } from '../types/speech';

export class DisfluencyDetector {
  /**
   * Analyzes speech segment for temporal and spectral hallmarks of disfluency.
   */
  analyzeFluency(samples: Float32Array, durationSeconds: number, sampleRate = 16000): DisfluencyMetrics {
    const frameSize = Math.floor(sampleRate * 0.025); // 25ms
    const hopSize = Math.floor(sampleRate * 0.010);   // 10ms
    const numFrames = Math.floor((samples.length - frameSize) / hopSize);

    if (numFrames < 20 || durationSeconds < 0.4) {
      return {
        detected: false,
        percentSyllablesStuttered: 0.0,
        prolongationsCount: 0,
        blocksCount: 0,
        repetitionsCount: 0,
        averageDurationMs: 0,
        clinicalNote: 'Utterance within standard fluent tempo.',
      };
    }

    // Energy envelope
    const energies = new Float32Array(numFrames);
    for (let f = 0; f < numFrames; f++) {
      let sum = 0;
      const start = f * hopSize;
      for (let i = 0; i < frameSize; i++) {
        const v = samples[start + i];
        sum += v * v;
      }
      energies[f] = Math.sqrt(sum / frameSize);
    }

    // 1. Detect Prolongations: Unusually long steady-state energy without phoneme shift (>550ms, i.e., >55 consecutive frames)
    let steadyRun = 0;
    let prolongationsCount = 0;
    const meanEnergy = energies.reduce((a, b) => a + b, 0) / numFrames;

    for (let f = 1; f < numFrames; f++) {
      const delta = Math.abs(energies[f] - energies[f - 1]);
      if (energies[f] > meanEnergy * 0.8 && delta < 0.003) {
        steadyRun++;
        if (steadyRun === 55) {
          prolongationsCount++;
        }
      } else {
        steadyRun = 0;
      }
    }

    // 2. Detect Blocks: Sudden energy collapse between active voiced bursts (>300ms, i.e., 30 frames of near-zero energy followed by steep rise)
    let silenceRun = 0;
    let blocksCount = 0;
    for (let f = 5; f < numFrames - 5; f++) {
      if (energies[f] < 0.003) {
        silenceRun++;
      } else {
        if (silenceRun >= 28 && energies[f] > 0.035) {
          blocksCount++;
        }
        silenceRun = 0;
      }
    }

    // 3. Detect Repetitions: Repeating pulses in quick succession (150ms-250ms interval)
    let repetitionsCount = 0;
    let pulseCount = 0;
    for (let f = 2; f < numFrames - 2; f++) {
      if (energies[f] > 0.025 && energies[f] > energies[f - 1] && energies[f] > energies[f + 1]) {
        pulseCount++;
      }
    }
    if (pulseCount >= 4 && durationSeconds < 1.2) {
      repetitionsCount = Math.floor(pulseCount / 2);
    }

    const totalDisfluentEvents = prolongationsCount + blocksCount + repetitionsCount;
    const estimatedTotalSyllables = Math.max(1, Math.round(durationSeconds * 2.8)); // Standard pediatric speech rate ~2.8 syl/sec
    const percentSS = Math.min(100, Math.round(((totalDisfluentEvents * 1.0) / estimatedTotalSyllables) * 100 * 10) / 10);

    const isDetected = totalDisfluentEvents > 0 || percentSS >= 3.0;

    let clinicalNote = 'Speech fluent with rhythmic articulation.';
    if (isDetected) {
      clinicalNote = `Clinician Note: Estimated %SS is ${percentSS}%. Observed ${prolongationsCount} prolongation(s), ${blocksCount} block(s). Paced metronome practice recommended.`;
    }

    return {
      detected: isDetected,
      percentSyllablesStuttered: percentSS,
      prolongationsCount,
      blocksCount,
      repetitionsCount,
      averageDurationMs: totalDisfluentEvents > 0 ? Math.round(durationSeconds * 1000 / (totalDisfluentEvents + 1)) : 0,
      clinicalNote,
    };
  }
}
