import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CursorService {
  isMenuOpen = signal(false);

  setMenuOpen(isOpen: boolean) {
    this.isMenuOpen.set(isOpen);
  }
}
