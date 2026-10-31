/**
 * YIN Pitch (F0) Extraction Algorithm
 * Tailored for pediatric speech acoustics with pitch range 150 Hz - 500 Hz.
 */

export interface PitchTrackResult {
  f0Array: (number | null)[]; // Pitch in Hz or null for unvoiced frames
  meanPitchHz: number | null;
  minPitchHz: number | null;
  maxPitchHz: number | null;
  voicedFraction: number; // 0.0 - 1.0
}

export class PitchTracker {
  private minPitchHz = 140; // Pediatric low limit
  private maxPitchHz = 550; // Pediatric high limit
  private yinThreshold = 0.15;

  extractPitchContour(samples: Float32Array, sampleRate = 16000): PitchTrackResult {
    const frameSize = Math.floor(sampleRate * 0.030); // 30ms window
    const hopSize = Math.floor(sampleRate * 0.015);   // 15ms hop
    const numFrames = Math.floor((samples.length - frameSize) / hopSize);

    const f0Values: (number | null)[] = [];
    const voicedPitches: number[] = [];

    const minLag = Math.floor(sampleRate / this.maxPitchHz);
    const maxLag = Math.floor(sampleRate / this.minPitchHz);

    for (let f = 0; f < numFrames; f++) {
      const frameStart = f * hopSize;
      const frame = samples.subarray(frameStart, frameStart + frameSize);

      // Check frame energy
      let energy = 0;
      for (let i = 0; i < frame.length; i++) energy += frame[i] * frame[i];
      if (energy < 0.005) {
        f0Values.push(null);
        continue;
      }

      // 1. Difference function
      const diff = new Float32Array(maxLag);
      for (let tau = 0; tau < maxLag; tau++) {
        let sum = 0;
        for (let i = 0; i < frameSize - maxLag; i++) {
          const delta = frame[i] - frame[i + tau];
          sum += delta * delta;
        }
        diff[tau] = sum;
      }

      // 2. Cumulative mean normalized difference
      const cmndf = new Float32Array(maxLag);
      cmndf[0] = 1;
      let runningSum = 0;
      for (let tau = 1; tau < maxLag; tau++) {
        runningSum += diff[tau];
        cmndf[tau] = runningSum > 0 ? (diff[tau] * tau) / runningSum : 1;
      }

      // 3. Absolute threshold search
      let period = -1;
      for (let tau = minLag; tau < maxLag; tau++) {
        if (cmndf[tau] < this.yinThreshold) {
          while (tau + 1 < maxLag && cmndf[tau + 1] < cmndf[tau]) {
            tau++;
          }
          period = tau;
          break;
        }
      }

      if (period > 0) {
        // Parabolic interpolation for sub-sample precision
        const s0 = cmndf[period - 1] || cmndf[period];
        const s1 = cmndf[period];
        const s2 = cmndf[period + 1] || cmndf[period];
        const shift = (s2 - s0) / (2 * (2 * s1 - s2 - s0) || 1e-6);
        const refinedPeriod = period + Math.max(-0.5, Math.min(0.5, shift));
        const pitch = sampleRate / refinedPeriod;

        if (pitch >= this.minPitchHz && pitch <= this.maxPitchHz) {
          f0Values.push(pitch);
          voicedPitches.push(pitch);
        } else {
          f0Values.push(null);
        }
      } else {
        f0Values.push(null);
      }
    }

    const voicedFraction = numFrames > 0 ? voicedPitches.length / numFrames : 0;
    const meanPitchHz = voicedPitches.length > 0 ? voicedPitches.reduce((a, b) => a + b, 0) / voicedPitches.length : null;
    const minPitchHz = voicedPitches.length > 0 ? Math.min(...voicedPitches) : null;
    const maxPitchHz = voicedPitches.length > 0 ? Math.max(...voicedPitches) : null;

    return {
      f0Array: f0Values,
      meanPitchHz: meanPitchHz ? Math.round(meanPitchHz) : null,
      minPitchHz: minPitchHz ? Math.round(minPitchHz) : null,
      maxPitchHz: maxPitchHz ? Math.round(maxPitchHz) : null,
      voicedFraction: Math.round(voicedFraction * 100) / 100,
    };
  }
}
