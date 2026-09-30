import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideSparkles, lucideX } from '@ng-icons/lucide';
import { AssistantService } from '../../lib/assistant/assistant.service';
import { AssistantPanel } from './assistant-panel';

/**
 * Floating "Ask AI" button. The panel (orb, chat, model) is deferred: its code
 * is prefetched when the browser is idle, but nothing heavy loads until opened.
 */
@Component({
  selector: 'app-assistant',
  imports: [NgIcon, AssistantPanel],
  providers: [provideIcons({ lucideSparkles, lucideX })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="group/ai fixed right-4 bottom-4 z-[60] inline-flex h-12 cursor-pointer items-center gap-2.5 rounded-full border border-border bg-background/80 pr-4 pl-1.5 shadow-lg shadow-black/10 backdrop-blur-md transition-[background-color,scale] duration-200 hover:bg-muted active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground sm:right-6 sm:bottom-6"
      aria-haspopup="dialog"
      [attr.aria-expanded]="assistant.open()"
      (click)="assistant.toggle()"
    >
      <!-- A tiny version of the orb: its three colours, turning -->
      <span class="relative grid size-9 place-items-center" aria-hidden="true">
        <span
          class="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,#9c43fe,#4cc2e9,#101499,#9c43fe)] blur-[1.5px] motion-safe:animate-[spin_4s_linear_infinite] group-hover/ai:[animation-duration:1.5s]"
        ></span>
        <span class="absolute inset-[4px] rounded-full bg-background"></span>
        <ng-icon
          [name]="assistant.open() ? 'lucideX' : 'lucideSparkles'"
          size="0.95rem"
          class="relative transition-transform duration-300 group-hover/ai:rotate-12"
        />
      </span>
      <span class="text-sm font-medium">{{ assistant.open() ? 'Close' : 'Ask AI' }}</span>
    </button>

    @defer (when assistant.open(); prefetch on idle) {
      @if (assistant.open()) {
        <app-assistant-panel />
      }
    }
  `,
})
export class AssistantLauncher {
  protected readonly assistant = inject(AssistantService);
}
