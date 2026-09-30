import { Injectable } from "@angular/core";
import type Lenis from "lenis";

/**
 * Shares the app-wide Lenis instance (created in `app.ts`) so components can
 * scroll programmatically without fighting the smooth-scroll loop.
 */
@Injectable({ providedIn: "root" })
export class SmoothScrollService {
  lenis: Lenis | null = null;

  scrollTo(y: number, onComplete?: () => void) {
    if (this.lenis) {
      this.lenis.scrollTo(y, { duration: 0.9, onComplete: () => onComplete?.() });
      return;
    }
    window.scrollTo({ top: y, behavior: "smooth" });
    if (onComplete) setTimeout(onComplete, 700);
  }
}
