/**
 * Speech Synthesis & Audio Model Player
 * Uses Web Speech API with language-appropriate pitch and speech rate,
 * offering auditory models for word repetition and syllable pacing.
 */

export class SpeechSynthesisService {
  private isSupported: boolean;

  constructor() {
    this.isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  speak(text: string, lang = 'en-US', rate = 0.85, pitch = 1.15): Promise<void> {
    return new Promise((resolve) => {
      if (!this.isSupported) {
        resolve();
        return;
      }

      window.speechSynthesis.cancel(); // Stop any pending speech

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate; // Slightly slower for pediatric auditory clarity
      utterance.pitch = pitch; // Slightly higher pitch for child-friendly warmth
      utterance.lang = lang;

      // Select best voice for language if available
      const voices = window.speechSynthesis.getVoices();
      const langPrefix = lang.split('-')[0].toLowerCase();
      const matchedVoice = voices.find(v => v.lang.toLowerCase().startsWith(langPrefix));
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);
    });
  }

  cancel(): void {
    if (this.isSupported) {
      window.speechSynthesis.cancel();
    }
  }
}
