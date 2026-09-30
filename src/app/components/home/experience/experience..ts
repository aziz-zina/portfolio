import { isPlatformBrowser, NgOptimizedImage } from "@angular/common";
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  PLATFORM_ID,
  QueryList,
  ViewChild,
  ViewChildren,
  computed,
  inject,
  signal,
} from "@angular/core";
import { provideIcons } from "@ng-icons/core";
import { lucideArrowLeft, lucideArrowRight } from "@ng-icons/lucide";
import { HlmIconImports } from "@spartan-ng/helm/icon";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SmoothScrollService } from "../../../lib/scroll/smooth-scroll.service";
import { SectionTitle } from "../../../shared/components/section-title/section-title";
import { EXPERIENCE_DATA, type ExperienceItem } from "../../../shared/data/experience.data";

gsap.registerPlugin(ScrollTrigger);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Pin + scroll-through only where the whole section fits on screen; smaller
 * screens get the normal, click-to-switch layout.
 */
const PIN_QUERY = "(min-width: 1024px) and (min-height: 760px)";

/** Scroll distance given to each role while pinned, in viewport heights. */
const SCROLL_PER_ROLE = 0.7;

/** Arrow keys move through the role list (vertical list, but left/right work too). */
const KEY_STEP: Record<string, number> = {
  ArrowDown: 1,
  ArrowRight: 1,
  ArrowUp: -1,
  ArrowLeft: -1,
};

/** "2024-01" → months since year 0, for arithmetic on the timeline. */
function monthIndex(value: string): number {
  const [year, month] = value.split("-").map(Number);
  return year * 12 + month - 1;
}


@Component({
  selector: "app-experience",
  standalone: true,
  imports: [SectionTitle, NgOptimizedImage, HlmIconImports],
  providers: [provideIcons({ lucideArrowLeft, lucideArrowRight })],
  templateUrl: "./experience.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Experience implements AfterViewInit, OnDestroy {
  private readonly platform = inject(PLATFORM_ID);
  private readonly smoothScroll = inject(SmoothScrollService);

  @ViewChild("section") section!: ElementRef<HTMLElement>;
  @ViewChild("tablist") tablist!: ElementRef<HTMLElement>;
  @ViewChild("indicator") indicator!: ElementRef<HTMLElement>;
  @ViewChild("card") card!: ElementRef<HTMLElement>;
  @ViewChildren("tab") tabs!: QueryList<ElementRef<HTMLButtonElement>>;
  @ViewChildren("panel") panels!: QueryList<ElementRef<HTMLElement>>;

  private gsapContext: gsap.Context | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private reduceMotion = false;
  private mm: gsap.MatchMedia | null = null;
  private pinTrigger: ScrollTrigger | null = null;
  /** True while we're scrolling to a role the user clicked — ignore scroll-driven switching meanwhile. */
  private scrollingToRole = false;

  /** Whether the section is currently scroll-driven (pinned). Drives the "scroll" hint. */
  readonly pinned = signal(false);

  readonly selected = signal(0);

  @ViewChild("playhead") playhead!: ElementRef<HTMLElement>;
  @ViewChild("timeline") timeline!: ElementRef<HTMLElement>;

  readonly experience = signal<ExperienceItem[]>(EXPERIENCE_DATA);

  // ── Stack ↔ highlights linking ──────────────────────────────────

  /** Tool under the pointer (or keyboard focus). */
  private readonly hoverSkill = signal<string | null>(null);
  /** Tool tapped/clicked, so it stays lit on touch screens. */
  private readonly pinnedSkill = signal<string | null>(null);
  /** Index of the highlight row under the pointer. */
  readonly hoverRow = signal<number | null>(null);

  readonly activeSkill = computed(() => this.hoverSkill() ?? this.pinnedSkill());

  /** Tools lit by the current focus: the active tool, or the tools behind the hovered row. */
  readonly litSkills = computed(() => {
    const skill = this.activeSkill();
    if (skill) return new Set([skill]);
    const row = this.hoverRow();
    const item = this.experience()[this.selected()];
    return new Set(row === null ? [] : (item.highlights[row]?.tags ?? []));
  });

  /** Whether anything is being explored — everything unlit then fades back. */
  readonly exploring = computed(() => this.litSkills().size > 0);

  isRowLit(row: number, tags: string[]): boolean {
    const skill = this.activeSkill();
    return skill ? tags.includes(skill) : this.hoverRow() === row;
  }

  enterSkill(skill: string) {
    this.hoverSkill.set(skill);
  }

  leaveSkill() {
    this.hoverSkill.set(null);
  }

  toggleSkill(skill: string) {
    this.pinnedSkill.update((s) => (s === skill ? null : skill));
  }

  private resetExplore() {
    this.hoverSkill.set(null);
    this.pinnedSkill.set(null);
    this.hoverRow.set(null);
  }

  /** Soft glow that follows the pointer across the card (CSS vars, no change detection). */
  onCardPointer(event: PointerEvent) {
    const card = this.card.nativeElement;
    const rect = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    card.style.setProperty("--my", `${event.clientY - rect.top}px`);
  }

  /**
   * Career bar: each role as a slice of the span from the first job to today.
   * Very short stints get a minimum width so they stay clickable.
   */
  readonly timelineData = computed(() => {
    const items = this.experience();
    const now = new Date();
    const nowIndex = now.getFullYear() * 12 + now.getMonth();
    const first = Math.min(...items.map((it) => monthIndex(it.start)));
    const span = Math.max(1, nowIndex + 1 - first);
    const pct = (month: number) => ((month - first) / span) * 100;

    const segments = items.map((it) => {
      const start = monthIndex(it.start);
      // End month is exclusive so back-to-back roles sit side by side instead of overlapping
      const end = it.end ? Math.max(monthIndex(it.end), start + 1) : nowIndex + 1;
      return { left: pct(start), width: pct(end) - pct(start) };
    });

    // A label on every January in range, plus the start year
    const firstYear = Math.floor(first / 12);
    const years = Array.from(
      { length: now.getFullYear() - firstYear + 1 },
      (_, i) => firstYear + i,
    ).map((year) => ({
      year,
      left: Math.max(0, pct(year * 12)),
    }));

    return { segments, years };
  });

  /** "2024-01" → "Jan 2024". Fixed month names so SSR and browser render identically. */
  formatMonth(value: string): string {
    const [year, month] = value.split("-").map(Number);
    return `${MONTHS[month - 1]} ${year}`;
  }

  /** Compact range for the list: "2024 – 2026", "2026 – Now", or "2022" for a same-year stint. */
  yearRange(item: ExperienceItem): string {
    const start = item.start.slice(0, 4);
    if (!item.end) return `${start} – Now`;
    const end = item.end.slice(0, 4);
    return start === end ? start : `${start} – ${end}`;
  }

  /** Inclusive duration, LinkedIn-style: "2 yrs 6 mos", "2 mos". */
  duration(start: string, end: string | null): string {
    const [sy, sm] = start.split("-").map(Number);
    const now = new Date();
    const [ey, em] = end
      ? end.split("-").map(Number)
      : [now.getFullYear(), now.getMonth() + 1];
    const total = Math.max(1, (ey - sy) * 12 + (em - sm) + 1);
    const years = Math.floor(total / 12);
    const months = total % 12;
    const parts: string[] = [];
    if (years) parts.push(`${years} yr${years > 1 ? "s" : ""}`);
    if (months) parts.push(`${months} mo${months > 1 ? "s" : ""}`);
    return parts.join(" ");
  }

  // ── Interaction ───────────────────────────────────────────────────

  select(index: number, focusTab = false) {
    const prev = this.selected();
    if (index === prev || index < 0 || index >= this.experience().length) {
      return;
    }

    this.selected.set(index);
    this.resetExplore();
    if (focusTab) {
      this.tabs.get(index)?.nativeElement.focus({ preventScroll: true });
    }
    if (!isPlatformBrowser(this.platform)) return;

    this.moveIndicator();
    if (this.reduceMotion) return;

    // New content slides in from the direction you're moving through the timeline
    const panel = this.panels.get(index)?.nativeElement;
    if (!panel) return;
    const dir = index > prev ? 1 : -1;

    gsap.fromTo(
      panel.querySelectorAll("[data-anim]"),
      { y: 14 * dir, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.45,
        ease: "power3.out",
        stagger: 0.05,
        overwrite: true,
        // Hand opacity back to CSS so the explore dimming works afterwards
        clearProps: "opacity,transform",
      },
    );
    gsap.fromTo(
      panel.querySelectorAll("[data-chip]"),
      { scale: 0.85, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        duration: 0.3,
        ease: "back.out(2)",
        stagger: 0.025,
        delay: 0.2,
        overwrite: true,
        clearProps: "opacity,transform",
      },
    );
  }

  /**
   * User picked a role (click, keys, arrows, timeline). When pinned, scroll to
   * that role's slice of the pin so scroll position and selection stay in sync.
   */
  goTo(index: number, focusTab = false) {
    this.select(index, focusTab);
    const st = this.pinTrigger;
    if (!st) return;

    const n = this.experience().length;
    const y = st.start + ((index + 0.5) / n) * (st.end - st.start);
    this.scrollingToRole = true;
    this.smoothScroll.scrollTo(y, () => (this.scrollingToRole = false));
  }

  onTabKeydown(event: KeyboardEvent) {
    const last = this.experience().length - 1;
    let next: number;
    if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    else if (event.key in KEY_STEP) {
      next = gsap.utils.clamp(0, last, this.selected() + KEY_STEP[event.key]);
    } else return;

    event.preventDefault();
    this.goTo(next, true);
  }

  // ── Lifecycle ─────────────────────────────────────────────────────

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platform)) return;

    this.reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    this.moveIndicator(true);
    // Keep the highlight glued to the active row when text wraps / fonts load
    this.resizeObserver = new ResizeObserver(() => this.moveIndicator(true));
    this.resizeObserver.observe(this.tablist.nativeElement);

    this.initPin();

    if (this.reduceMotion) return;

    this.gsapContext = gsap.context(() => {
      gsap
        .timeline({
          scrollTrigger: {
            trigger: this.section.nativeElement,
            start: "top 70%",
            once: true,
          },
          defaults: { ease: "power3.out" },
        })
        .from(this.indicator.nativeElement, { opacity: 0, duration: 0.6 }, 0)
        .from(
          this.tabs.map((t) => t.nativeElement),
          {
            x: -16,
            opacity: 0,
            duration: 0.6,
            stagger: 0.07,
            clearProps: "opacity,transform",
          },
          0,
        )
        .from(
          this.card.nativeElement,
          { y: 24, opacity: 0, duration: 0.7, clearProps: "opacity,transform" },
          0.15,
        )
        // Career bar fills in left → right, oldest role first
        .from(
          [...this.timeline.nativeElement.querySelectorAll("[data-segment]")].reverse(),
          {
            scaleX: 0,
            transformOrigin: "left center",
            duration: 0.5,
            stagger: 0.12,
            ease: "power2.out",
            clearProps: "transform",
          },
          0.4,
        )
        .from(this.playhead.nativeElement, { scale: 0, duration: 0.4, ease: "back.out(3)" }, 0.9);
    });
  }

  ngOnDestroy() {
    this.mm?.revert();
    this.resizeObserver?.disconnect();
    this.gsapContext?.revert();
  }

  /**
   * Pins the section and splits the pinned scroll into one equal slice per
   * role: scrolling moves through the roles, then the page carries on.
   */
  private initPin() {
    const n = this.experience().length;
    this.mm = gsap.matchMedia();
    this.mm.add(PIN_QUERY, () => {
      this.pinTrigger = ScrollTrigger.create({
        trigger: this.section.nativeElement,
        start: "top top",
        end: () => `+=${n * window.innerHeight * SCROLL_PER_ROLE}`,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          if (this.scrollingToRole) return;
          this.select(Math.min(n - 1, Math.floor(self.progress * n)));
        },
      });
      this.pinned.set(true);

      return () => {
        this.pinTrigger = null;
        this.pinned.set(false);
      };
    });
  }

  /** Slides the highlight card behind the active row, and the playhead to its slice of the timeline. */
  private moveIndicator(immediate = false) {
    const tab = this.tabs?.get(this.selected())?.nativeElement;
    if (!tab) return;
    const duration = immediate || this.reduceMotion ? 0 : 0.45;

    gsap.to(this.indicator.nativeElement, {
      y: tab.offsetTop,
      height: tab.offsetHeight,
      visibility: "visible",
      duration,
      ease: "power3.out",
      overwrite: "auto",
    });

    const seg = this.timelineData().segments[this.selected()];
    gsap.to(this.playhead.nativeElement, {
      left: `${seg.left + seg.width / 2}%`,
      visibility: "visible",
      duration: duration * 1.2,
      ease: "power3.inOut",
      overwrite: "auto",
    });
  }
}
