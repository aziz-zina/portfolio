import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CursorService {
  /** Fullscreen menu is open — it's dark in both themes, so the cursor goes white. */
  isMenuOpen = signal(false);

  /** Pointer is over a surface that inverts the theme (the footer) — the cursor inverts too. */
  isOverInverse = signal(false);

  setMenuOpen(isOpen: boolean) {
    this.isMenuOpen.set(isOpen);
  }

  setOverInverse(isOver: boolean) {
    this.isOverInverse.set(isOver);
  }
}
