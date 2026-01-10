import { ChangeDetectionStrategy, Component, ElementRef, input, output, ViewChild } from '@angular/core';

@Component({
  selector: 'app-hamburger-button',
  standalone: true,
  template: `
    <button
      #buttonElement
      (click)="toggle.emit()"
      class="fixed cursor-pointer top-6 right-6 md:top-8 md:right-8 z-[60] w-12 h-12 rounded-full bg-zinc-900 text-white flex flex-col items-center justify-center gap-1.5 shadow-lg transition-all duration-500 hover:scale-110 hover:bg-black"
      [class.opacity-100]="isVisible()"
      [class.pointer-events-auto]="isVisible()"
      [class.opacity-0]="!isVisible()"
      [class.pointer-events-none]="!isVisible()"
    >
      <span class="w-5 h-0.5 bg-white rounded-full transition-all duration-300" [class.rotate-45]="isOpen()" [class.translate-y-2]="isOpen()"></span>
      <span class="w-5 h-0.5 bg-white rounded-full transition-all duration-300" [class.opacity-0]="isOpen()"></span>
      <span class="w-5 h-0.5 bg-white rounded-full transition-all duration-300" [class.-rotate-45]="isOpen()" [class.-translate-y-2]="isOpen()"></span>
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HamburgerButton {
  isVisible = input.required<boolean>();
  isOpen = input.required<boolean>();
  toggle = output<void>();

  @ViewChild('buttonElement') buttonElement!: ElementRef<HTMLButtonElement>;
}
