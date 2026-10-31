/**
 * Formant Tracking & Spectral Centroid Analysis
 * Estimates F1, F2, F3 and spectral centroid to detect acoustic hallmarks
 * of speech sound errors (e.g. lack of F3 dip in /r/ gliding, sibilant spectral shifts).
 */

import { AcousticFormants } from '../types/speech';

export interface SpectralAnalysisResult {
  formants: AcousticFormants;
  spectralCentroidHz: number;
  spectralFlatness: number;
  isRhoticF3Dip: boolean;
}

export class FormantAnalyzer {
  /**
   * Fast Discrete Fourier Transform & Peak Tracking for Formants F1, F2, F3
   */
  analyzeSegment(samples: Float32Array, sampleRate = 16000): SpectralAnalysisResult {
    const N = Math.min(1024, samples.length);
    if (N < 256) {
      return {
        formants: { f1: 500, f2: 1500, f3: 2700 },
        spectralCentroidHz: 2000,
        spectralFlatness: 0.1,
        isRhoticF3Dip: false,
      };
    }

    // Apply Hanning window
    const windowed = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const w = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (N - 1)));
      windowed[i] = samples[i] * w;
    }

    // Compute magnitude spectrum
    const halfN = N / 2;
    const magnitudes = new Float32Array(halfN);
    const binHz = sampleRate / N;

    let weightedSum = 0;
    let totalMagnitude = 0;

    for (let k = 0; k < halfN; k++) {
      let real = 0;
      let imag = 0;
      for (let n = 0; n < N; n++) {
        const angle = (2 * Math.PI * k * n) / N;
        real += windowed[n] * Math.cos(angle);
        imag -= windowed[n] * Math.sin(angle);
      }
      const mag = Math.sqrt(real * real + imag * imag);
      magnitudes[k] = mag;

      const freqHz = k * binHz;
      weightedSum += freqHz * mag;
      totalMagnitude += mag;
    }

    const spectralCentroidHz = totalMagnitude > 0 ? weightedSum / totalMagnitude : 2000;

    // Smooth magnitudes to find formant envelope peaks
    const smoothed = new Float32Array(halfN);
    const kernelSize = 5;
    for (let i = 0; i < halfN; i++) {
      let sum = 0;
      let count = 0;
      for (let k = -kernelSize; k <= kernelSize; k++) {
        if (i + k >= 0 && i + k < halfN) {
          sum += magnitudes[i + k];
          count++;
        }
      }
      smoothed[i] = sum / count;
    }

    // Peak picking for F1 (300-1100 Hz), F2 (1100-2600 Hz), F3 (2400-3800 Hz)
    const findPeakInBand = (minHz: number, maxHz: number): number => {
      const minBin = Math.max(1, Math.floor(minHz / binHz));
      const maxBin = Math.min(halfN - 2, Math.floor(maxHz / binHz));
      let peakBin = minBin;
      let maxVal = -1;

      for (let b = minBin; b <= maxBin; b++) {
        if (smoothed[b] > smoothed[b - 1] && smoothed[b] > smoothed[b + 1]) {
          if (smoothed[b] > maxVal) {
            maxVal = smoothed[b];
            peakBin = b;
          }
        }
      }
      return Math.round(peakBin * binHz);
    };

    const f1 = findPeakInBand(350, 1000);
    const f2 = findPeakInBand(1100, 2400);
    const f3 = findPeakInBand(2300, 3600);

    // Pediatric rhotic check: In children, F3 drops notably close to F2 (below 2500 Hz)
    const isRhoticF3Dip = f3 < 2550 && Math.abs(f3 - f2) < 950;

    return {
      formants: {
        f1: f1 || 550,
        f2: f2 || 1650,
        f3: f3 || 2800,
      },
      spectralCentroidHz: Math.round(spectralCentroidHz),
      spectralFlatness: 0.15,
      isRhoticF3Dip,
    };
  }
}
