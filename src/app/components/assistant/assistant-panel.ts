import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  afterRenderEffect,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowUp,
  lucideArrowUpRight,
  lucideMic,
  lucideMicOff,
  lucideSquare,
  lucideVolume2,
  lucideVolumeX,
  lucideX,
} from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmVoiceOrbImports } from '@spartan-ng/helm/voice-orb';
import { AssistantService } from '../../lib/assistant/assistant.service';
import { SpeechService } from '../../lib/assistant/speech.service';
import { SmoothScrollService } from '../../lib/scroll/smooth-scroll.service';

/**
 * The assistant's chat panel. Loaded on demand (the launcher @defers it), so
 * the orb's WebGL and the chat UI cost nothing until someone opens it.
 */
@Component({
  selector: 'app-assistant-panel',
  imports: [NgIcon, HlmButtonImports, HlmInputImports, HlmVoiceOrbImports],
  providers: [
    provideIcons({
      lucideArrowUp,
      lucideArrowUpRight,
      lucideMic,
      lucideMicOff,
      lucideSquare,
      lucideVolume2,
      lucideVolumeX,
      lucideX,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(keydown.escape)': 'assistant.close()',
  },
  templateUrl: './assistant-panel.html',
})
export class AssistantPanel {
  protected readonly assistant = inject(AssistantService);
  protected readonly speech = inject(SpeechService);
  private readonly router = inject(Router);
  private readonly smoothScroll = inject(SmoothScrollService);

  private readonly scroller = viewChild.required<ElementRef<HTMLElement>>('scroller');
  private readonly field = viewChild.required<ElementRef<HTMLInputElement>>('field');

  protected readonly draft = signal('');
  /** Drives the orb while the answer is read aloud (synthesized audio can't be analysed). */
  protected readonly speakLevel = signal(0);

  protected readonly busy = computed(() => this.assistant.phase() !== 'idle' || this.speech.listening());
  protected readonly lastAssistant = computed(() => {
    const list = this.assistant.messages();
    for (let i = list.length - 1; i >= 0; i--) if (list[i].role === 'assistant') return list[i].id;
    return -1;
  });

  protected readonly status = computed(() => {
    const phase = this.assistant.phase();
    const error = this.speech.error();
    if (this.speech.listening()) return this.speech.transcript() || 'Listening…';
    if (phase === 'loading' || (phase === 'thinking' && !this.assistant.modelReady())) {
      return `Loading the model · ${Math.round(this.assistant.progress() * 100)}%`;
    }
    if (phase === 'thinking') return 'Thinking…';
    const progress = this.assistant.progress();
    if (!this.assistant.modelReady() && progress > 0 && progress < 1) {
      return `Getting ready · downloading the model ${Math.round(progress * 100)}%`;
    }
    if (this.speech.speaking()) return 'Speaking… tap the orb to stop';
    if (error === 'mic-blocked') return 'Microphone blocked — allow it in your browser, or type below';
    if (error === 'no-mic') return 'No microphone found — type your question below';
    if (error === 'network') return 'Voice recognition is offline — type your question below';
    if (!this.speech.canListen) return 'Type your question below';
    return 'Tap the orb to talk, or type below';
  });

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      // Start the model download as soon as the panel opens
      this.assistant.warmUp().catch(() => undefined);
      this.field().nativeElement.focus({ preventScroll: true });
    });

    // Keep the newest message in view
    afterRenderEffect(() => {
      this.assistant.messages();
      this.assistant.phase();
      const el = this.scroller().nativeElement;
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    });

    // Fake a voice level while speaking: a wobble plus a pulse on each spoken word
    let raf = 0;
    effect(() => {
      const speaking = this.speech.speaking();
      untracked(() => {
        cancelAnimationFrame(raf);
        if (!speaking) {
          this.speakLevel.set(0);
          return;
        }
        const tick = (now: number) => {
          const wobble = 0.22 + 0.12 * Math.sin(now / 90) * Math.sin(now / 230);
          const pulse = Math.max(0, 0.45 - (now - this.speech.lastBoundary) / 500);
          this.speakLevel.set(Math.min(1, wobble + pulse));
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      });
    });
    destroyRef.onDestroy(() => {
      if (raf) cancelAnimationFrame(raf);
    });
  }

  protected submit(event: Event) {
    event.preventDefault();
    const text = this.draft().trim();
    if (!text || this.busy()) return;
    this.draft.set('');
    // Clear the field itself too: the [value] binding can miss a set-and-reset within one tick
    this.field().nativeElement.value = '';
    void this.assistant.ask(text);
  }

  /** The orb is the voice button: talk, stop listening, or stop speaking. */
  protected async orbPressed() {
    if (this.speech.speaking()) {
      this.speech.stopSpeaking();
      return;
    }
    if (this.speech.listening()) {
      this.speech.stopListening();
      return;
    }
    if (!this.speech.canListen || this.assistant.phase() !== 'idle') return;
    this.assistant.warmUp().catch(() => undefined);
    const heard = await this.speech.listen();
    if (heard) void this.assistant.ask(heard);
  }

  protected pick(id: string) {
    if (!this.busy()) this.assistant.askEntry(id);
  }

  /** Site links go through the router (and smooth-scroll to sections) instead of reloading the page. */
  protected follow(event: MouseEvent, href: string) {
    if (/^https?:/.test(href)) return;
    event.preventDefault();

    const [path, id] = href.split('#');
    const scroll = () => {
      const target = id ? document.getElementById(id) : null;
      if (target) this.smoothScroll.scrollTo(target.getBoundingClientRect().top + window.scrollY);
    };
    const onPage = this.router.url.split('#')[0].split('?')[0] === (path || '/');
    if (onPage) scroll();
    else void this.router.navigateByUrl(path || '/').then(() => setTimeout(scroll, 350));

    // On small screens the panel covers the page; get out of the way
    if (window.matchMedia('(max-width: 639px)').matches) this.assistant.close();
  }
}
