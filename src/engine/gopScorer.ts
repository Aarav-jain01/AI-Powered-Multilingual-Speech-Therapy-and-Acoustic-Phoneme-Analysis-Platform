/**
 * Goodness of Pronunciation (GOP) & Acoustic Scoring Engine
 * Combines VAD, spectral features, forced alignment, and classification rules
 * to produce full attempt diagnostics and non-punitive child feedback.
 */

import { PhonemeAnalysis, SpeechAttemptResult } from '../types/speech';
import { WordItem } from '../types/content';
import { VoiceActivityDetector } from './vad';
import { PitchTracker } from './pitch';
import { FormantAnalyzer } from './formants';
import { ForcedAligner } from './forcedAligner';
import { ErrorClassifier } from './errorClassifier';
import { DisfluencyDetector } from './disfluency';

export class GOPScoringEngine {
  private vad = new VoiceActivityDetector();
  private pitchTracker = new PitchTracker();
  private formantAnalyzer = new FormantAnalyzer();
  private aligner = new ForcedAligner();
  private classifier = new ErrorClassifier();
  private disfluencyDetector = new DisfluencyDetector();

  async scoreAudioAttempt(
    samples16kHz: Float32Array,
    wordItem: WordItem,
    childId: string,
    acceptedVariantsList: string[] = [],
    audioBlobUrl?: string
  ): Promise<SpeechAttemptResult> {
    const sampleRate = 16000;
    const vadSegment = this.vad.detectSpeechBounds(samples16kHz, sampleRate);

    if (!vadSegment || vadSegment.speechDurationSeconds < 0.22) {
      return {
        attemptId: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        childId,
        wordId: wordItem.id,
        targetWord: wordItem.text,
        language: wordItem.language,
        targetIPA: wordItem.ipa,
        recognizedIPA: '—',
        overallGOP: 0.45,
        confidence: 0.52,
        phonemes: [],
        disfluency: {
          detected: false,
          percentSyllablesStuttered: 0,
          prolongationsCount: 0,
          blocksCount: 0,
          repetitionsCount: 0,
          averageDurationMs: 0,
          clinicalNote: 'Low volume or brief utterance; prompt child to speak closer to microphone.',
        },
        isAcceptedVariant: false,
        childFeedback: "Let's try again together! Hold the big button and speak in your clear explorer voice.",
        encouragementStars: 1,
        recordedAudioUrl: audioBlobUrl,
        timestamp: new Date().toISOString(),
        clinicianReviewStatus: 'flagged',
      };
    }

    const speechSamples = samples16kHz.subarray(vadSegment.startSample, vadSegment.endSample);
    const spectralInfo = this.formantAnalyzer.analyzeSegment(speechSamples, sampleRate);
    const pitchTrack = this.pitchTracker.extractPitchContour(speechSamples, sampleRate);
    const disfluencyResult = this.disfluencyDetector.analyzeFluency(speechSamples, vadSegment.speechDurationSeconds);

    const targetPhonemes = wordItem.ipa.trim().split(/\s+/);
    const alignedSegments = this.aligner.align(targetPhonemes, vadSegment.speechDurationSeconds);

    const analyzedPhonemes: PhonemeAnalysis[] = [];
    const recognizedPhonemeTokens: string[] = [];
    let gopAccumulator = 0;

    for (let i = 0; i < alignedSegments.length; i++) {
      const seg = alignedSegments[i];
      const position = i === 0 ? 'initial' : i === alignedSegments.length - 1 ? 'final' : 'medial';

      let rawScore = 0.87;
      if (['r', 'ɹ'].includes(seg.phoneme) && !spectralInfo.isRhoticF3Dip) {
        rawScore = 0.44;
      } else if (['k', 'g'].includes(seg.phoneme) && spectralInfo.spectralCentroidHz > 3800) {
        rawScore = 0.48;
      } else if (['s', 'z'].includes(seg.phoneme) && spectralInfo.spectralCentroidHz < 3600) {
        rawScore = 0.52;
      }

      const classification = this.classifier.classify(
        seg.phoneme,
        position,
        rawScore,
        spectralInfo.spectralCentroidHz,
        spectralInfo.isRhoticF3Dip,
        acceptedVariantsList
      );

      analyzedPhonemes.push({
        phoneme: seg.phoneme,
        recognizedPhoneme: classification.recognizedPhoneme,
        position,
        gopScore: Math.round(rawScore * 100) / 100,
        status: classification.status,
        errorType: classification.errorType,
        startTimeMs: seg.startMs,
        endTimeMs: seg.endMs,
        formants: spectralInfo.formants,
        spectralCentroidHz: spectralInfo.spectralCentroidHz,
        pitchF0Hz: pitchTrack.meanPitchHz || 285,
        articulatoryTip: classification.articulatoryTip,
      });

      recognizedPhonemeTokens.push(classification.recognizedPhoneme);
      gopAccumulator += rawScore;
    }

    const overallGOP = analyzedPhonemes.length > 0 ? gopAccumulator / analyzedPhonemes.length : 0.82;
    const recognizedIPA = recognizedPhonemeTokens.join(' ');

    const errors = analyzedPhonemes.filter((p) => p.status === 'needs_practice');
    const acceptedVars = analyzedPhonemes.filter((p) => p.status === 'accepted_variant');

    let stars = 3;
    let feedback = 'Wonderful clear speech! Every sound landed right in place.';

    if (disfluencyResult.detected) {
      stars = 3;
      feedback = 'Great steady voice! Take a gentle breath and keep stretching your vowels smoothly.';
    } else if (errors.length > 0) {
      stars = errors.length === 1 ? 2 : 1;
      const firstError = errors[0];
      if (firstError.errorType === 'gliding') {
        feedback = 'Great effort! Curl the sides of your tongue up like a spoon for the /r/ sound.';
      } else if (firstError.errorType === 'fronting') {
        feedback = 'Nice try! Keep your tongue tip down and pop the sound gently from the back of your throat.';
      } else if (firstError.errorType === 'lisp_frontal') {
        feedback = 'Super try! Keep your tongue tucked right behind your front teeth cage.';
      } else {
        feedback = 'Awesome try! Listen to the voice model once more and give it another go.';
      }
    } else if (acceptedVars.length > 0) {
      stars = 3;
      feedback = 'Clear, natural pronunciation! Great job speaking with confidence.';
    }

    const hasLowConfidence = overallGOP < 0.65;

    return {
      attemptId: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      childId,
      wordId: wordItem.id,
      targetWord: wordItem.text,
      language: wordItem.language,
      targetIPA: wordItem.ipa,
      recognizedIPA,
      overallGOP: Math.round(overallGOP * 100) / 100,
      confidence: hasLowConfidence ? 0.72 : 0.94,
      phonemes: analyzedPhonemes,
      disfluency: disfluencyResult,
      isAcceptedVariant: acceptedVars.length > 0,
      variantExplanation: acceptedVars.length > 0 ? 'Accepted regional dialect feature' : undefined,
      childFeedback: feedback,
      encouragementStars: stars,
      recordedAudioUrl: audioBlobUrl,
      timestamp: new Date().toISOString(),
      clinicianReviewStatus: hasLowConfidence || disfluencyResult.detected ? 'flagged' : 'unreviewed',
    };
  }

  /**
   * Deterministic Phonetic & Code-Switch Utterance Evaluator
   * Allows testing multilingual code-switching (e.g., "pani" for "Water"),
   * gliding ("wabbit"), fronting ("tat"), lisping ("thun"), or stammering ("s-s-sun")
   * even in environments without live hardware microphone input.
   */
  evaluateUtteranceText(
    spokenUtterance: string,
    wordItem: WordItem,
    childId: string,
    acceptedVariantsList: string[] = []
  ): SpeechAttemptResult {
    const clean = spokenUtterance.trim().toLowerCase();
    const baseTarget = wordItem.text.split('(')[0].trim().toLowerCase();

    // 1. Check code-switching lexicon match (e.g., "pani" for "water")
    const codeSwitchCheck = this.classifier.checkCodeSwitchMatch(
      clean,
      baseTarget,
      wordItem.acceptedCodeSwitchAlternates || []
    );

    const targetPhonemes = wordItem.ipa.trim().split(/\s+/);
    const alignedSegments = this.aligner.align(targetPhonemes, 0.78, 80);

    // Detect simulated stammering (e.g. "s-s-sun" or "w-w-water")
    const isStammered = /^([a-z])-\1-/i.test(clean) || clean.includes('...');

    if (codeSwitchCheck.isCodeSwitch && codeSwitchCheck.matchedWord) {
      const altPhonemes: PhonemeAnalysis[] = alignedSegments.map((seg, idx) => ({
        phoneme: seg.phoneme,
        recognizedPhoneme: seg.phoneme,
        position: idx === 0 ? 'initial' : idx === alignedSegments.length - 1 ? 'final' : 'medial',
        gopScore: 0.94,
        status: 'accepted_variant',
        errorType: 'dialectal_variant',
        startTimeMs: seg.startMs,
        endTimeMs: seg.endMs,
        formants: { f1: 460, f2: 1480, f3: 2410 },
        spectralCentroidHz: 4200,
        pitchF0Hz: 295,
        articulatoryTip: `Valid home-language lexical match ("${codeSwitchCheck.matchedWord}") accepted without penalty.`,
      }));

      return {
        attemptId: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        childId,
        wordId: wordItem.id,
        targetWord: wordItem.text,
        language: wordItem.language,
        targetIPA: wordItem.ipa,
        recognizedIPA: `${codeSwitchCheck.matchedWord} (code-switch)`,
        overallGOP: 0.94,
        confidence: 0.96,
        phonemes: altPhonemes,
        disfluency: {
          detected: false,
          percentSyllablesStuttered: 0,
          prolongationsCount: 0,
          blocksCount: 0,
          repetitionsCount: 0,
          averageDurationMs: 0,
          clinicalNote: `Accepted multilingual code-switch ("${codeSwitchCheck.matchedWord}" for "${wordItem.text}").`,
        },
        isAcceptedVariant: true,
        variantExplanation: `Accepted home-language word "${codeSwitchCheck.matchedWord}"`,
        childFeedback: `Awesome job! "${codeSwitchCheck.matchedWord}" means ${baseTarget} too — your multilingual brain is super strong!`,
        encouragementStars: 3,
        timestamp: new Date().toISOString(),
        clinicianReviewStatus: 'approved',
      };
    }

    // Detect specific error patterns from utterance string
    const hasGliding = clean.startsWith('w') && ['ɹ', 'r', 'l'].includes(targetPhonemes[0]);
    const hasFronting = clean.startsWith('t') && ['k', 'g'].includes(targetPhonemes[0]);
    const hasLisp = clean.startsWith('th') && ['s', 'z'].includes(targetPhonemes[0]);
    const hasDialectVW = clean.startsWith('v') && targetPhonemes[0] === 'w' && acceptedVariantsList.includes('v_w_merger');

    const analyzedPhonemes: PhonemeAnalysis[] = alignedSegments.map((seg, idx) => {
      const pos = idx === 0 ? 'initial' : idx === alignedSegments.length - 1 ? 'final' : 'medial';
      if (idx === 0 && hasGliding) {
        return {
          phoneme: seg.phoneme,
          recognizedPhoneme: 'w',
          position: pos,
          gopScore: 0.39,
          status: 'needs_practice',
          errorType: 'gliding',
          startTimeMs: seg.startMs,
          endTimeMs: seg.endMs,
          formants: { f1: 420, f2: 1080, f3: 2860 },
          spectralCentroidHz: 1750,
          pitchF0Hz: 305,
          articulatoryTip: 'F3 stayed high (2860 Hz). Curl tongue sides against upper molars to lower F3 below 2500 Hz.',
        };
      }
      if (idx === 0 && hasFronting) {
        return {
          phoneme: seg.phoneme,
          recognizedPhoneme: 't',
          position: pos,
          gopScore: 0.44,
          status: 'needs_practice',
          errorType: 'fronting',
          startTimeMs: seg.startMs,
          endTimeMs: seg.endMs,
          formants: { f1: 480, f2: 1750, f3: 2720 },
          spectralCentroidHz: 4350,
          pitchF0Hz: 298,
          articulatoryTip: 'Velar fronting detected (/k/ -> /t/). Keep tongue tip down behind lower teeth.',
        };
      }
      if (idx === 0 && hasLisp) {
        return {
          phoneme: seg.phoneme,
          recognizedPhoneme: 'θ',
          position: pos,
          gopScore: 0.49,
          status: 'needs_practice',
          errorType: 'lisp_frontal',
          startTimeMs: seg.startMs,
          endTimeMs: seg.endMs,
          formants: { f1: 450, f2: 1620, f3: 2680 },
          spectralCentroidHz: 3150,
          pitchF0Hz: 310,
          articulatoryTip: 'Spectral centroid dropped to 3150 Hz (interdental airflow). Tuck tongue tip behind incisors.',
        };
      }
      if (idx === 0 && hasDialectVW) {
        return {
          phoneme: seg.phoneme,
          recognizedPhoneme: 'ʋ',
          position: pos,
          gopScore: 0.89,
          status: 'accepted_variant',
          errorType: 'dialectal_variant',
          startTimeMs: seg.startMs,
          endTimeMs: seg.endMs,
          formants: { f1: 430, f2: 1320, f3: 2520 },
          spectralCentroidHz: 2400,
          pitchF0Hz: 290,
          articulatoryTip: 'Accepted Indian English labiodental approximant [ʋ] realization.',
        };
      }

      return {
        phoneme: seg.phoneme,
        recognizedPhoneme: seg.phoneme,
        position: pos,
        gopScore: 0.92,
        status: 'correct',
        errorType: 'none',
        startTimeMs: seg.startMs,
        endTimeMs: seg.endMs,
        formants: { f1: 470, f2: 1560, f3: 2340 },
        spectralCentroidHz: seg.phoneme === 's' ? 6350 : 2450,
        pitchF0Hz: 292,
        articulatoryTip: 'Accurate acoustic target placement.',
      };
    });

    const overallGOP =
      analyzedPhonemes.reduce((sum, p) => sum + p.gopScore, 0) / Math.max(1, analyzedPhonemes.length);
    const hasError = analyzedPhonemes.some((p) => p.status === 'needs_practice');

    let childFeedback = 'Spot-on pronunciation! Every sound shone bright and clear.';
    if (isStammered) {
      childFeedback = 'Wonderful steady voice! You took your time and finished the whole word smoothly.';
    } else if (hasGliding) {
      childFeedback = 'Great try! Let us curl the sides of our tongue up like a spoon for the /r/ sound.';
    } else if (hasFronting) {
      childFeedback = 'Nice effort! Glue your tongue tip down low and make the sound from the back of your throat.';
    } else if (hasLisp) {
      childFeedback = 'Good whistle! Keep your tongue tucked safely inside your teeth cage for /s/.';
    } else if (hasDialectVW) {
      childFeedback = 'Clear and confident! Natural Indian English pronunciation accepted.';
    }

    return {
      attemptId: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      childId,
      wordId: wordItem.id,
      targetWord: wordItem.text,
      language: wordItem.language,
      targetIPA: wordItem.ipa,
      recognizedIPA: analyzedPhonemes.map((p) => p.recognizedPhoneme).join(' '),
      overallGOP: Math.round(overallGOP * 100) / 100,
      confidence: 0.93,
      phonemes: analyzedPhonemes,
      disfluency: {
        detected: isStammered,
        percentSyllablesStuttered: isStammered ? 8.4 : 0,
        prolongationsCount: 0,
        blocksCount: 0,
        repetitionsCount: isStammered ? 2 : 0,
        averageDurationMs: isStammered ? 410 : 0,
        clinicalNote: isStammered
          ? 'Estimate for clinician review: Initial sound repetition observed (%SS ~8.4%). Zero child penalty applied.'
          : 'Fluent rhythmic production.',
      },
      isAcceptedVariant: hasDialectVW,
      variantExplanation: hasDialectVW ? 'Accepted Indian English /v/-/w/ dialectal variant' : undefined,
      childFeedback,
      encouragementStars: isStammered ? 3 : hasError ? 2 : 3,
      timestamp: new Date().toISOString(),
      clinicianReviewStatus: hasError || isStammered ? 'flagged' : 'unreviewed',
    };
  }
}
