/**
 * Voice Activity Detection (VAD)
 * Analyzes audio frames using short-term energy RMS and Zero-Crossing Rate (ZCR)
 * to detect pediatric speech boundaries and reject background silence/snips.
 */

export interface VADSegment {
  startSample: number;
  endSample: number;
  startTimeSeconds: number;
  endTimeSeconds: number;
  speechDurationSeconds: number;
}

export class VoiceActivityDetector {
  private energyThreshold = 0.012; // Energy threshold calibrated for pediatric mic input
  private zcrThreshold = 0.08;

  detectSpeechBounds(samples: Float32Array, sampleRate = 16000): VADSegment | null {
    const frameSize = Math.floor(sampleRate * 0.025); // 25ms window
    const hopSize = Math.floor(sampleRate * 0.010);   // 10ms step
    const numFrames = Math.floor((samples.length - frameSize) / hopSize);

    if (numFrames <= 0) return null;

    const frameActive: boolean[] = [];

    for (let f = 0; f < numFrames; f++) {
      const start = f * hopSize;
      let sumSq = 0;
      let zcrCount = 0;

      for (let i = 0; i < frameSize; i++) {
        const val = samples[start + i];
        sumSq += val * val;
        if (i > 0 && ((samples[start + i] >= 0 && samples[start + i - 1] < 0) ||
                      (samples[start + i] < 0 && samples[start + i - 1] >= 0))) {
          zcrCount++;
        }
      }

      const rms = Math.sqrt(sumSq / frameSize);
      const zcr = zcrCount / frameSize;
      const isSpeech = rms > this.energyThreshold || (rms > this.energyThreshold * 0.6 && zcr > this.zcrThreshold);
      frameActive.push(isSpeech);
    }

    // Find first and last speech frame with small hang-over window
    let firstSpeechFrame = -1;
    let lastSpeechFrame = -1;

    for (let f = 0; f < frameActive.length; f++) {
      if (frameActive[f]) {
        if (firstSpeechFrame === -1) firstSpeechFrame = f;
        lastSpeechFrame = f;
      }
    }

    if (firstSpeechFrame === -1 || lastSpeechFrame <= firstSpeechFrame) {
      return null;
    }

    const startSample = Math.max(0, firstSpeechFrame * hopSize - Math.floor(sampleRate * 0.05));
    const endSample = Math.min(samples.length, (lastSpeechFrame + 1) * hopSize + Math.floor(sampleRate * 0.05));

    return {
      startSample,
      endSample,
      startTimeSeconds: startSample / sampleRate,
      endTimeSeconds: endSample / sampleRate,
      speechDurationSeconds: (endSample - startSample) / sampleRate,
    };
  }
}
