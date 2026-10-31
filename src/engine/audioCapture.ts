/**
 * Web Audio API Capture & Resampling Engine
 * Captures microphone stream, routes to AnalyserNode for real-time 60fps visuals,
 * and encodes to standard 16 kHz 16-bit mono PCM.
 */

export class AudioCaptureEngine {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private capturedChunks: Float32Array[] = [];
  private isRecording = false;

  async requestPermissionAndInit(): Promise<boolean> {
    try {
      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: false, // Keep raw acoustics for formant extraction
          autoGainControl: true,
        },
      });

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioContext = new AudioCtx();
      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);

      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 1024;
      this.analyserNode.smoothingTimeConstant = 0.8;

      this.sourceNode.connect(this.analyserNode);
      return true;
    } catch (err) {
      console.warn('Microphone permission or AudioContext init failed:', err);
      return false;
    }
  }

  getAnalyser(): AnalyserNode | null {
    return this.analyserNode;
  }

  getSampleRate(): number {
    return this.audioContext?.sampleRate || 44100;
  }

  startRecording(): void {
    if (!this.audioContext || !this.sourceNode) {
      throw new Error('AudioContext not initialized');
    }

    this.capturedChunks = [];
    this.isRecording = true;

    // Use bufferSize 4096 for stable continuous capture
    this.processorNode = this.audioContext.createScriptProcessor(4096, 1, 1);
    this.processorNode.onaudioprocess = (e) => {
      if (!this.isRecording) return;
      const inputData = e.inputBuffer.getChannelData(0);
      this.capturedChunks.push(new Float32Array(inputData));
    };

    this.sourceNode.connect(this.processorNode);
    this.processorNode.connect(this.audioContext.destination);
  }

  async stopRecording(): Promise<{
    samples16kHz: Float32Array;
    durationSeconds: number;
    wavBlob: Blob;
  }> {
    this.isRecording = false;

    if (this.processorNode && this.sourceNode) {
      this.sourceNode.disconnect(this.processorNode);
      this.processorNode.disconnect();
      this.processorNode = null;
    }

    // Merge chunks
    const totalLength = this.capturedChunks.reduce((acc, curr) => acc + curr.length, 0);
    const merged = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of this.capturedChunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }

    const originalSampleRate = this.audioContext ? this.audioContext.sampleRate : 44100;
    const targetSampleRate = 16000;
    const samples16kHz = this.resampleTo16kHz(merged, originalSampleRate, targetSampleRate);
    const durationSeconds = samples16kHz.length / targetSampleRate;
    const wavBlob = this.encodeWAV(samples16kHz, targetSampleRate);

    return {
      samples16kHz,
      durationSeconds,
      wavBlob,
    };
  }

  private resampleTo16kHz(audioData: Float32Array, originalRate: number, targetRate = 16000): Float32Array {
    if (originalRate === targetRate) return audioData;
    const ratio = originalRate / targetRate;
    const newLength = Math.round(audioData.length / ratio);
    const result = new Float32Array(newLength);

    for (let i = 0; i < newLength; i++) {
      const position = i * ratio;
      const index = Math.floor(position);
      const frac = position - index;

      const s0 = audioData[index] || 0;
      const s1 = audioData[index + 1] || s0;
      result[i] = s0 + frac * (s1 - s0); // Linear interpolation
    }
    return result;
  }

  private encodeWAV(samples: Float32Array, sampleRate: number): Blob {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    const writeString = (view: DataView, offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    /* RIFF identifier */
    writeString(view, 0, 'RIFF');
    /* file length */
    view.setUint32(4, 36 + samples.length * 2, true);
    /* RIFF type */
    writeString(view, 8, 'WAVE');
    /* format chunk identifier */
    writeString(view, 12, 'fmt ');
    /* format chunk length */
    view.setUint32(16, 16, true);
    /* sample format (raw) */
    view.setUint16(20, 1, true);
    /* channel count */
    view.setUint16(22, 1, true);
    /* sample rate */
    view.setUint32(24, sampleRate, true);
    /* byte rate (sample rate * block align) */
    view.setUint32(28, sampleRate * 2, true);
    /* block align (channel count * bytes per sample) */
    view.setUint16(32, 2, true);
    /* bits per sample */
    view.setUint16(34, 16, true);
    /* data chunk identifier */
    writeString(view, 36, 'data');
    /* data chunk length */
    view.setUint32(40, samples.length * 2, true);

    // Float32 to Int16 PCM
    let offset = 44;
    for (let i = 0; i < samples.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }

    return new Blob([buffer], { type: 'audio/wav' });
  }

  dispose(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
}
