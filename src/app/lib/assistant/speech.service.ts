import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';

/**
 * Voice in and voice out, using the browser's Web Speech API — no server.
 *
 * Recognition is available in Chrome, Edge and Safari (not Firefox); Chrome
 * sends the audio to Google for transcription. Synthesis works everywhere.
 * Both degrade gracefully: the assistant always accepts typed questions.
 */

// The recognition API isn't in TypeScript's DOM types; this is the part we use.
interface RecognitionAlternative {
  transcript: string;
}
interface RecognitionResult {
  isFinal: boolean;
  0: RecognitionAlternative;
}
interface RecognitionEvent {
  resultIndex: number;
  results: ArrayLike<RecognitionResult>;
}
interface Recognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type RecognitionConstructor = new () => Recognition;

export type SpeechError = 'mic-blocked' | 'no-mic' | 'network' | null;

/**
 * A calm, low British butler — think Alfred. Browsers only offer the voices the
 * visitor's system has, so this is a best-first list per platform:
 * Edge's neural UK voices, Chrome's Google UK male, then macOS/iOS and Windows.
 */
const PREFERRED_VOICES = [
  /(ryan|thomas).*natural.*united kingdom/i, // Edge (neural)
  /(ryan|thomas|alfie|oliver|elliot|noah|ethan).*united kingdom/i, // Other Microsoft UK male voices
  /google uk english male/i, // Chrome
  /arthur/i, // macOS / iOS (en-GB)
  /daniel/i, // macOS / iOS (en-GB)
  /george/i, // Windows (en-GB)
];

/** UK voices known to be female, skipped when falling back to "any British voice". */
const FEMALE_UK = /hazel|sonia|libby|maisie|abbi|bella|hollie|olivia|kate|serena|martha|stephanie|susan|female/i;

/** When no British voice exists (e.g. Firefox on a US-voiced Windows), at least keep it male. */
const MALE_ENGLISH = /guy|ryan|david|mark|alex|fred|tom|aaron|james|arthur|daniel|george|male/i;

/** Slower and a touch lower than default: unhurried and composed. */
const RATE = 0.9;
const PITCH = 0.85;

@Injectable({ providedIn: 'root' })
export class SpeechService {
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly Recognition: RecognitionConstructor | null = this.browser
    ? ((window as unknown as { SpeechRecognition?: RecognitionConstructor }).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: RecognitionConstructor }).webkitSpeechRecognition ??
      null)
    : null;

  readonly canListen = this.Recognition !== null;
  readonly canSpeak = this.browser && 'speechSynthesis' in window;

  readonly listening = signal(false);
  /** Live transcript while listening. */
  readonly transcript = signal('');
  readonly speaking = signal(false);
  readonly error = signal<SpeechError>(null);

  /** Time of the last spoken word boundary, so visuals can pulse with the voice. */
  lastBoundary = 0;

  private recognition: Recognition | null = null;
  private voice: SpeechSynthesisVoice | null = null;

  constructor() {
    if (this.canSpeak) {
      this.pickVoice();
      speechSynthesis.addEventListener('voiceschanged', () => this.pickVoice());
    }
  }

  /** Listens for one utterance; resolves with what was said ('' if nothing). */
  listen(lang = 'en-US'): Promise<string> {
    if (!this.Recognition) return Promise.resolve('');
    this.stopSpeaking();
    this.recognition?.abort();

    return new Promise((resolve) => {
      const recognition = new this.Recognition!();
      this.recognition = recognition;
      recognition.lang = lang;
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.maxAlternatives = 1;

      let finalText = '';
      this.transcript.set('');
      this.error.set(null);

      recognition.onstart = () => this.listening.set(true);
      recognition.onresult = (event) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) finalText += result[0].transcript;
          else interim += result[0].transcript;
        }
        this.transcript.set((finalText + interim).trim());
      };
      recognition.onerror = (event) => {
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') this.error.set('mic-blocked');
        else if (event.error === 'audio-capture') this.error.set('no-mic');
        else if (event.error === 'network') this.error.set('network');
      };
      recognition.onend = () => {
        this.listening.set(false);
        if (this.recognition === recognition) this.recognition = null;
        resolve((finalText || this.transcript()).trim());
      };

      try {
        recognition.start();
      } catch {
        this.listening.set(false);
        resolve('');
      }
    });
  }

  /** Stop listening and keep what was heard so far. */
  stopListening() {
    this.recognition?.stop();
  }

  /** Reads text aloud; resolves when it finishes (or is interrupted). */
  speak(text: string): Promise<void> {
    if (!this.canSpeak || !text) return Promise.resolve();
    this.stopSpeaking();

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      if (this.voice) utterance.voice = this.voice;
      utterance.lang = this.voice?.lang ?? 'en-GB';
      utterance.rate = RATE;
      utterance.pitch = PITCH;
      utterance.onstart = () => {
        this.speaking.set(true);
        this.lastBoundary = performance.now();
      };
      utterance.onboundary = () => (this.lastBoundary = performance.now());
      const done = () => {
        this.speaking.set(false);
        resolve();
      };
      utterance.onend = done;
      utterance.onerror = done;
      speechSynthesis.speak(utterance);
    });
  }

  stopSpeaking() {
    if (!this.canSpeak) return;
    speechSynthesis.cancel();
    this.speaking.set(false);
  }

  private pickVoice() {
    const english = speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('en'));
    const british = english.filter((v) => /en[-_]gb/i.test(v.lang));
    for (const pattern of PREFERRED_VOICES) {
      const match = british.find((v) => pattern.test(v.name)) ?? english.find((v) => pattern.test(v.name) && /united kingdom|uk/i.test(v.name));
      if (match) {
        this.voice = match;
        return;
      }
    }
    // Any British voice that isn't known to be female, then any male English voice, then anything English
    this.voice =
      british.find((v) => !FEMALE_UK.test(v.name)) ??
      english.find((v) => MALE_ENGLISH.test(v.name) && !/female/i.test(v.name)) ??
      british[0] ??
      english[0] ??
      null;
  }
}
