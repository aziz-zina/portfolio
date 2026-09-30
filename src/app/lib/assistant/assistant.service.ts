import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { SpotifyService } from '../spotify/spotify.service';
import type { EmbedderRequest, EmbedderResponse } from './embedder.types';
import { FALLBACK, KNOWLEDGE, STARTERS, type KnowledgeEntry } from './knowledge';
import { SpeechService } from './speech.service';

/**
 * The portfolio assistant: semantic search over a hand-written knowledge base,
 * entirely in the browser.
 *
 * On first use the knowledge base's phrasings are embedded (in a worker) and
 * the vectors cached in localStorage; each question is then embedded and
 * matched against them by cosine similarity. Answers are pre-written, so the
 * assistant can't invent facts; below a confidence threshold it says so and
 * offers suggestions instead.
 */

export interface Suggestion {
  id: string;
  label: string;
}

export interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  link?: { label: string; href: string };
  suggestions?: Suggestion[];
}

/** 'loading' = the model is still downloading; 'thinking' = matching a question. */
export type AssistantPhase = 'idle' | 'loading' | 'thinking';

/** Cosine similarity needed to answer outright, and to offer "did you mean". */
const ANSWER_AT = 0.55;
const SUGGEST_AT = 0.38;
const MAX_QUESTION = 300;

/** Bump when the model or quantisation changes: cached vectors are tied to it. */
const INDEX_VERSION = 'minilm-l6-v2-q8@1';
const INDEX_STORAGE_KEY = 'assistant-index';
const VOICE_STORAGE_KEY = 'assistant-voice';

interface Index {
  dims: number;
  vectors: Float32Array;
  /** For each vector, the KNOWLEDGE entry it belongs to. */
  owners: number[];
}

@Injectable({ providedIn: 'root' })
export class AssistantService {
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly speech = inject(SpeechService);
  private readonly spotify = inject(SpotifyService);

  readonly open = signal(false);
  readonly messages = signal<ChatMessage[]>([]);
  readonly phase = signal<AssistantPhase>('idle');
  /** Model download progress, 0–1. */
  readonly progress = signal(0);
  readonly modelReady = signal(false);
  readonly voiceReplies = signal(this.readVoicePreference());

  readonly starters: Suggestion[] = STARTERS.map((id) => this.suggestion(id)).filter((s) => s !== null);

  private worker: Worker | null = null;
  private readonly pending = new Map<number, { resolve: (v: Float32Array) => void; reject: (e: Error) => void }>();
  private requestId = 0;
  private messageId = 0;
  private index: Promise<Index> | null = null;

  toggle() {
    if (this.open()) this.close();
    else this.open.set(true);
  }

  close() {
    this.open.set(false);
    this.speech.stopListening();
    this.speech.stopSpeaking();
  }

  setVoiceReplies(on: boolean) {
    this.voiceReplies.set(on);
    if (!on) this.speech.stopSpeaking();
    try {
      localStorage.setItem(VOICE_STORAGE_KEY, on ? '1' : '0');
    } catch {
      // Storage can be blocked; the choice still applies for this visit
    }
  }

  /** Start downloading the model and indexing the knowledge base. Safe to call repeatedly. */
  warmUp(): Promise<Index> {
    if (!this.browser) return Promise.reject(new Error('Not in a browser'));
    this.index ??= this.buildIndex().catch((error: unknown) => {
      this.index = null;
      throw error;
    });
    return this.index;
  }

  /** Answer a free-form question. */
  async ask(raw: string) {
    const question = raw.trim().slice(0, MAX_QUESTION);
    if (!question || this.phase() !== 'idle') return;

    this.push({ role: 'user', text: question });
    this.speech.stopSpeaking();
    this.phase.set(this.modelReady() ? 'thinking' : 'loading');

    try {
      const index = await this.warmUp();
      this.phase.set('thinking');
      const query = await this.embed([question]);
      this.reply(this.match(index, query));
    } catch {
      this.push({
        role: 'assistant',
        text: "I couldn't load my model — you might be offline. Try again in a moment, or pick a topic:",
        suggestions: this.starters,
      });
    } finally {
      this.phase.set('idle');
    }
  }

  /** Answer a suggestion chip directly — no matching needed. */
  askEntry(id: string) {
    const entry = KNOWLEDGE.find((e) => e.id === id);
    if (!entry || this.phase() !== 'idle') return;
    this.push({ role: 'user', text: entry.questions[0] });
    this.reply({ entry });
  }

  // ── Matching ──────────────────────────────────────────────────────

  private match(index: Index, query: Float32Array): { entry?: KnowledgeEntry; nearby?: KnowledgeEntry[] } {
    const best = new Float32Array(KNOWLEDGE.length).fill(-1);
    for (let v = 0; v < index.owners.length; v++) {
      let dot = 0;
      const offset = v * index.dims;
      for (let d = 0; d < index.dims; d++) dot += index.vectors[offset + d] * query[d];
      const owner = index.owners[v];
      if (dot > best[owner]) best[owner] = dot;
    }

    const ranked = KNOWLEDGE.map((entry, i) => ({ entry, score: best[i] })).sort((a, b) => b.score - a.score);
    if (ranked[0].score >= ANSWER_AT) return { entry: ranked[0].entry };
    if (ranked[0].score >= SUGGEST_AT) return { nearby: ranked.slice(0, 3).map((r) => r.entry) };
    return {};
  }

  private reply({ entry, nearby }: { entry?: KnowledgeEntry; nearby?: KnowledgeEntry[] }) {
    let message: Omit<ChatMessage, 'id'>;
    if (entry) {
      const text = typeof entry.answer === 'function' ? entry.answer({ nowPlaying: this.spotify.nowPlaying() }) : entry.answer;
      message = {
        role: 'assistant',
        text,
        link: entry.link,
        suggestions: (entry.followUps ?? []).map((id) => this.suggestion(id)).filter((s) => s !== null),
      };
    } else if (nearby) {
      message = {
        role: 'assistant',
        text: "I'm not quite sure what you mean. Did you want to know one of these?",
        suggestions: nearby.map((e) => ({ id: e.id, label: e.questions[0] })),
      };
    } else {
      message = { role: 'assistant', text: FALLBACK, suggestions: this.starters };
    }

    this.push(message);
    if (this.voiceReplies()) void this.speech.speak(toSpeech(message.text));
  }

  private suggestion(id: string): Suggestion | null {
    const entry = KNOWLEDGE.find((e) => e.id === id);
    return entry ? { id, label: entry.questions[0] } : null;
  }

  private push(message: Omit<ChatMessage, 'id'>) {
    this.messages.update((list) => [...list, { ...message, id: ++this.messageId }]);
  }

  // ── Index ─────────────────────────────────────────────────────────

  private async buildIndex(): Promise<Index> {
    const texts = KNOWLEDGE.flatMap((e) => e.questions);
    const owners = KNOWLEDGE.flatMap((e, i) => e.questions.map(() => i));
    const key = `${INDEX_VERSION}:${hash(texts.join('\n'))}`;

    const cached = this.readIndex(key, owners);
    if (cached) {
      // Vectors are ready; load the model in the background for the first question
      this.embed(['warm up']).catch(() => undefined);
      return cached;
    }

    const vectors = await this.embed(texts);
    const index = { dims: vectors.length / texts.length, vectors, owners };
    this.writeIndex(key, index);
    return index;
  }

  private readIndex(key: string, owners: number[]): Index | null {
    try {
      const raw = localStorage.getItem(INDEX_STORAGE_KEY);
      if (!raw) return null;
      const stored = JSON.parse(raw) as { key: string; dims: number; data: string };
      if (stored.key !== key) return null;
      // Stored as 8-bit to keep it small; plenty of precision for ranking
      const bytes = Int8Array.from(atob(stored.data), (c) => (c.charCodeAt(0) << 24) >> 24);
      if (bytes.length !== owners.length * stored.dims) return null;
      return { dims: stored.dims, vectors: Float32Array.from(bytes, (b) => b / 127), owners };
    } catch {
      return null;
    }
  }

  private writeIndex(key: string, index: Index) {
    try {
      const bytes = Int8Array.from(index.vectors, (v) => Math.max(-127, Math.min(127, Math.round(v * 127))));
      let binary = '';
      for (const b of bytes) binary += String.fromCharCode(b & 0xff);
      localStorage.setItem(INDEX_STORAGE_KEY, JSON.stringify({ key, dims: index.dims, data: btoa(binary) }));
    } catch {
      // Storage full or blocked: the index is rebuilt next visit
    }
  }

  // ── Worker ────────────────────────────────────────────────────────

  private embed(texts: string[]): Promise<Float32Array> {
    const worker = this.ensureWorker();
    const id = ++this.requestId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      worker.postMessage({ id, texts } satisfies EmbedderRequest);
    });
  }

  private ensureWorker(): Worker {
    if (this.worker) return this.worker;
    const worker = new Worker('/assistant/embedder.worker.js', { type: 'module' });
    worker.addEventListener('message', (event: MessageEvent<EmbedderResponse>) => {
      const message = event.data;
      if (message.type === 'progress') {
        this.progress.set(message.progress);
        return;
      }
      const request = this.pending.get(message.id);
      this.pending.delete(message.id);
      if (message.type === 'result') {
        this.modelReady.set(true);
        this.progress.set(1);
        request?.resolve(message.data);
      } else {
        request?.reject(new Error(message.message));
      }
    });
    worker.addEventListener('error', () => {
      for (const request of this.pending.values()) request.reject(new Error('Embedding worker failed'));
      this.pending.clear();
      this.worker = null;
    });
    this.worker = worker;
    return worker;
  }

  private readVoicePreference(): boolean {
    if (!this.browser) return true;
    try {
      return localStorage.getItem(VOICE_STORAGE_KEY) !== '0';
    } catch {
      return true;
    }
  }
}

/** FNV-1a, to notice when the knowledge base's phrasings change. */
function hash(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16);
}

/** Bullet lists read better aloud as sentences. */
function toSpeech(text: string): string {
  return text
    .split('\n')
    .map((line) => line.replace(/^•\s*/, '').trim())
    .filter(Boolean)
    .map((line) => (/[.!?:]$/.test(line) ? line : `${line}.`))
    .join(' ')
    .replace(/\s—\s/g, ', ');
}
