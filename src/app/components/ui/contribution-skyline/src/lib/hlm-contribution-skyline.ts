import {
	afterNextRender,
	afterRenderEffect,
	ChangeDetectionStrategy,
	Component,
	computed,
	DestroyRef,
	effect,
	ElementRef,
	inject,
	input,
	model,
	output,
	PLATFORM_ID,
	signal,
	untracked,
	viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideBox, lucideGrid2x2 } from '@ng-icons/lucide';
import { hlm } from '@spartan-ng/helm/utils';
import type { ClassValue } from 'clsx';
import {
	barHeight,
	buildGrid,
	type Cam,
	camera,
	computeStats,
	dayMs,
	easeInOutCubic,
	ELEV_3D,
	ELEV_RANGE,
	generateContributions,
	lerp,
	luminance,
	mixRGB,
	monthLabels,
	type PaletteInput,
	project,
	resolvePalette,
	type RGB,
	riseAt,
	type SkylineDay,
	smoothstep,
	YAW_3D,
	YAW_RANGE,
} from './contribution-skyline.utils';
import { HlmSkylineStat } from './hlm-skyline-stat';

/**
 * Contribution Skyline — a year of activity as a GitHub-style heat map that
 * folds up into an isometric skyline, and back down again.
 *
 * It is one scene, not two charts. Every day is a box on a grid; the 2D view
 * is that grid seen straight down, the 3D view is the same grid seen from the
 * corner. Switching views swings one camera between the two while each week's
 * bars rise (or settle) in a wave from the oldest week to the newest.
 *
 * Hover or tap a day for its count, arrow keys walk the grid, hover a legend
 * swatch to isolate that level, and in 3D drag to orbit (double-click resets).
 * Palette and theme changes blend rather than flip.
 *
 * Pass `data` as `{ date, count }[]`; without it a seeded sample year is generated.
 * Project `[hlmSkylineTitle]` content to replace the heading.
 */

export type SkylineView = '2d' | '3d';

type SkylineTheme = { dark: boolean; swatches: string[]; accent: string };

type Engine = {
	kick: () => void;
	load: () => void;
	retheme: () => void;
	tipWidth: (w: number) => void;
};

const FG_FALLBACK: RGB = [23, 23, 23];
const BG_FALLBACK: RGB = [255, 255, 255];
const EASE = 'cubic-bezier(0.65, 0, 0.35, 1)';
const HINTS = ['Hover a day for details · arrow keys to explore', 'Drag to orbit · double-click to reset'];

// Any CSS colour → sRGB, by letting the browser paint it. Handles oklch, color-mix, names…
let probe: CanvasRenderingContext2D | null = null;
const toRGB = (color: string, fallback: RGB | null): RGB | null => {
	if (!probe) {
		const c = document.createElement('canvas');
		c.width = c.height = 1;
		probe = c.getContext('2d', { willReadFrequently: true });
	}
	if (!probe) return fallback;
	probe.clearRect(0, 0, 1, 1);
	probe.fillStyle = 'rgba(0,0,0,0)';
	probe.fillStyle = color;
	probe.fillRect(0, 0, 1, 1);
	const d = probe.getImageData(0, 0, 1, 1).data;
	if (d[3] < 8) return fallback;
	return [d[0], d[1], d[2]];
};

const rgbString = (r: number, g: number, b: number) =>
	'rgb(' + Math.round(r) + ',' + Math.round(g) + ',' + Math.round(b) + ')';

const pointInQuad = (p: Float32Array, o: number, x: number, y: number): boolean => {
	let sign = 0;
	for (let k = 0; k < 4; k++) {
		const ax = p[o + k * 2];
		const ay = p[o + k * 2 + 1];
		const bx = p[o + ((k + 1) % 4) * 2];
		const by = p[o + ((k + 1) % 4) * 2 + 1];
		const cross = (bx - ax) * (y - ay) - (by - ay) * (x - ax);
		if (Math.abs(cross) < 1e-9) continue;
		const s = cross > 0 ? 1 : -1;
		if (sign === 0) sign = s;
		else if (s !== sign) return false;
	}
	return sign !== 0;
};

const quadPath = (ctx: CanvasRenderingContext2D, p: Float32Array, o: number, r: number) => {
	if (r < 0.3) {
		ctx.moveTo(p[o], p[o + 1]);
		ctx.lineTo(p[o + 2], p[o + 3]);
		ctx.lineTo(p[o + 4], p[o + 5]);
		ctx.lineTo(p[o + 6], p[o + 7]);
		ctx.closePath();
		return;
	}
	ctx.moveTo((p[o + 6] + p[o]) / 2, (p[o + 7] + p[o + 1]) / 2);
	for (let k = 0; k < 4; k++) {
		const b = (k + 1) % 4;
		ctx.arcTo(p[o + k * 2], p[o + k * 2 + 1], p[o + b * 2], p[o + b * 2 + 1], r);
	}
	ctx.closePath();
};

@Component({
	selector: 'hlm-contribution-skyline',
	imports: [NgIcon, HlmSkylineStat],
	providers: [provideIcons({ lucideGrid2x2, lucideBox })],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		'data-slot': 'contribution-skyline',
		'[class]': '_computedClass()',
	},
	template: `
		<header class="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
			<h3 class="m-0 text-[15px] leading-snug font-normal">
				<ng-content select="[hlmSkylineTitle]">
					<span class="font-semibold tabular-nums">{{ nf().format(stats().total) }}</span>
					{{ noun(stats().total) }} in the last year
				</ng-content>
			</h3>
			@if (showToggle()) {
				<div role="group" aria-label="Chart view" class="border-border relative inline-flex rounded-md border p-0.5">
					<span
						aria-hidden="true"
						class="bg-foreground absolute top-0.5 bottom-0.5 left-0.5 w-8 rounded transition-transform duration-500 motion-reduce:transition-none"
						[style.transform]="is3d() ? 'translateX(100%)' : 'translateX(0)'"
						[style.transition-timing-function]="ease"
					></span>
					@for (v of views; track v) {
						<button
							type="button"
							[attr.aria-pressed]="view() === v"
							[attr.aria-label]="v === '2d' ? 'Flat heat map' : '3D skyline'"
							[title]="v === '2d' ? 'Flat heat map' : '3D skyline'"
							(click)="view.set(v)"
							class="outline-foreground relative z-10 grid h-7 w-8 cursor-pointer place-items-center rounded border-0 bg-transparent p-0 transition-colors duration-500 focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none"
							[class.text-background]="view() === v"
							[class.text-muted-foreground]="view() !== v"
						>
							<ng-icon [name]="v === '2d' ? 'lucideGrid2x2' : 'lucideBox'" size="14px" />
						</button>
					}
				</div>
			}
		</header>

		<div class="border-border relative rounded-lg border">
			<div class="relative px-3 pt-3 sm:px-4 sm:pt-4">
				<div
					#stage
					class="outline-foreground relative w-full overflow-hidden rounded-md outline-offset-4 has-[:focus-visible]:outline-2"
					style="height: 150px"
				>
					<canvas
						#canvas
						tabindex="0"
						role="img"
						[attr.aria-label]="canvasLabel()"
						class="absolute top-0 left-0 block max-w-none outline-none"
						[style.touch-action]="is3d() && orbit() ? 'pan-y' : 'auto'"
					></canvas>

					@if (showStats() && corners()) {
						<div
							[attr.aria-hidden]="!is3d()"
							class="pointer-events-none absolute top-1 right-1 flex flex-col items-end gap-5 transition-[opacity,transform] motion-reduce:transition-none"
							[style.opacity]="is3d() ? 1 : 0"
							[style.transform]="is3d() ? 'translateY(0)' : 'translateY(-10px)'"
							[style.transition-duration]="is3d() ? '600ms' : '300ms'"
							[style.transition-delay]="is3d() ? round(duration() * 0.55) + 'ms' : '0ms'"
							[style.transition-timing-function]="ease"
						>
							@for (b of statBlocks().slice(0, 2); track b.label) {
								<hlm-skyline-stat
									[label]="b.label"
									[value]="b.value"
									[unit]="b.unit"
									[sub]="b.sub"
									[accent]="theme().accent"
									[size]="bigSize()"
									align="end"
								/>
							}
						</div>
						<div
							[attr.aria-hidden]="!is3d()"
							class="pointer-events-none absolute bottom-1 left-1 flex flex-col items-start gap-5 transition-[opacity,transform] motion-reduce:transition-none"
							[style.opacity]="is3d() ? 1 : 0"
							[style.transform]="is3d() ? 'translateY(0)' : 'translateY(10px)'"
							[style.transition-duration]="is3d() ? '600ms' : '300ms'"
							[style.transition-delay]="is3d() ? round(duration() * 0.65) + 'ms' : '0ms'"
							[style.transition-timing-function]="ease"
						>
							@for (b of statBlocks().slice(2); track b.label) {
								<hlm-skyline-stat
									[label]="b.label"
									[value]="b.value"
									[unit]="b.unit"
									[sub]="b.sub"
									[accent]="theme().accent"
									[size]="bigSize()"
									align="start"
								/>
							}
						</div>
					}
				</div>

				<div
					#tip
					role="tooltip"
					[attr.aria-hidden]="active() < 0"
					class="bg-foreground text-background pointer-events-none absolute top-3 left-3 z-20 rounded-md px-2.5 py-1.5 text-[12px] leading-none whitespace-nowrap shadow-lg transition-opacity duration-150 motion-reduce:transition-none sm:top-4 sm:left-4"
					[style.opacity]="active() >= 0 ? 1 : 0"
				>
					@if (activeCell(); as c) {
						<strong class="font-semibold">{{ c.count ? nf().format(c.count) + ' ' + noun(c.count) : 'No ' + plural() }}</strong>
						<span class="opacity-75"> on {{ dfy().format(dayMs(c.date)) }}</span>
					} @else {
						&nbsp;
					}
					<span
						aria-hidden="true"
						class="border-t-foreground absolute top-full -ml-[5px] h-0 w-0 border-x-[5px] border-t-[5px] border-x-transparent [left:var(--arrow,50%)]"
					></span>
				</div>
			</div>

			@if (showStats()) {
				<div
					[attr.aria-hidden]="!showRow()"
					class="grid transition-[grid-template-rows,opacity] motion-reduce:transition-none"
					[style.grid-template-rows]="showRow() ? '1fr' : '0fr'"
					[style.opacity]="showRow() ? 1 : 0"
					[style.transition-duration]="duration() + 'ms'"
					[style.transition-timing-function]="ease"
				>
					<div class="min-h-0 overflow-hidden">
						<div class="grid grid-cols-2 gap-x-4 gap-y-4 px-3 pt-4 pb-1 sm:px-4 md:grid-cols-4">
							@for (b of statBlocks(); track b.label) {
								<hlm-skyline-stat
									[label]="b.label"
									[value]="b.value"
									[unit]="b.unit"
									[sub]="b.sub"
									[accent]="theme().accent"
									[size]="28"
									align="stack"
								/>
							}
						</div>
					</div>
				</div>
			}

			<div
				class="text-muted-foreground flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-3 pt-3 pb-3 text-[12px] sm:px-4"
			>
				@if (footer() === undefined) {
					<span class="relative grid flex-1">
						@for (h of hints; track h) {
							<span
								[attr.aria-hidden]="h !== hint()"
								class="transition-opacity duration-500 [grid-area:1/1] motion-reduce:transition-none"
								[style.opacity]="h === hint() ? 1 : 0"
							>
								{{ h }}
							</span>
						}
					</span>
				} @else {
					<span class="flex-1">{{ footer() }}</span>
				}
				@if (showLegend()) {
					<div class="flex items-center gap-1.5" (mouseleave)="legendLevel.set(-1)">
						<span class="mr-0.5">Less</span>
						@for (c of theme().swatches; track $index; let i = $index) {
							<button
								type="button"
								[attr.aria-label]="'Highlight ' + levelNames()[i].toLowerCase() + ' days'"
								[attr.aria-pressed]="legendLevel() === i"
								[title]="levelNames()[i]"
								(mouseenter)="legendLevel.set(i)"
								(focus)="legendLevel.set(i)"
								(blur)="legendLevel.set(-1)"
								(click)="toggleLegend(i)"
								class="outline-foreground size-[11px] cursor-pointer rounded-[2px] border-0 p-0 shadow-[inset_0_0_0_1px_rgba(127,127,127,0.12)] transition-[background-color,transform] duration-500 hover:scale-125 focus-visible:outline-2 focus-visible:outline-offset-1 motion-reduce:transition-none"
								[style.background]="c"
							></button>
						}
						<span class="ml-0.5">More</span>
					</div>
				}
			</div>
		</div>

		<p aria-live="polite" class="sr-only">{{ announce() }}</p>
	`,
})
export class HlmContributionSkyline {
	private readonly _host = inject<ElementRef<HTMLElement>>(ElementRef);

	/** One entry per day, `YYYY-MM-DD`. Repeated dates add up. Omit for a generated sample year. */
	public readonly data = input<SkylineDay[] | undefined>(undefined);
	/** Last day shown. Defaults to the latest date in `data`, or today. */
	public readonly endDate = input<string | Date | undefined>(undefined);
	/** Two-way bindable view. The 3D view rises out of the flat one when it first scrolls into sight. */
	public readonly view = model<SkylineView>('3d');
	/** A preset, four colours, or `{ light, dark }` sets of four. */
	public readonly palette = input<PaletteInput>('github');
	/** Singular noun for a unit of activity. */
	public readonly unit = input('contribution');
	/** Plural noun. Defaults to `unit + "s"`. */
	public readonly unitPlural = input<string | undefined>(undefined);
	/** Multiplies bar heights in 3D. */
	public readonly heightScale = input(1);
	/** Morph length, ms. */
	public readonly duration = input(1300);
	/** 0 puts Sunday on the top row, 1 puts Monday there. */
	public readonly weekStart = input<0 | 1>(0);
	/** Drag to orbit in 3D. */
	public readonly orbit = input(true);
	public readonly showStats = input(true);
	public readonly showLegend = input(true);
	public readonly showToggle = input(true);
	/** Replaces the hint under the chart. `null` renders none. */
	public readonly footer = input<string | null | undefined>(undefined);
	public readonly locale = input('en-US');
	/** Seed for the generated sample year. */
	public readonly seed = input(7);
	public readonly userClass = input<ClassValue>('', { alias: 'class' });

	public readonly cellClick = output<SkylineDay>();

	protected readonly _computedClass = computed(() =>
		hlm(
			'border-border bg-background text-foreground relative block w-full rounded-xl border p-4 font-sans sm:p-5',
			this.userClass(),
		),
	);

	protected readonly ease = EASE;
	protected readonly hints = HINTS;
	protected readonly views: SkylineView[] = ['2d', '3d'];
	protected readonly dayMs = dayMs;
	protected readonly round = Math.round;

	private readonly _endKey = computed(() => {
		const end = this.endDate();
		return end == null ? null : dayMs(end);
	});

	protected readonly skyline = computed(() => {
		const data = this.data();
		const dates = (data ?? []).map((d) => dayMs(d.date)).filter(Number.isFinite);
		const end = this._endKey() ?? (dates.length ? Math.max(...dates) : dayMs(new Date()));
		const days = data ?? generateContributions(end, this.seed());
		const grid = buildGrid(days, end, this.weekStart());
		return { ...grid, stats: computeStats(grid.cells), months: monthLabels(grid.cells, grid.weeks, this.locale()) };
	});

	protected readonly theme = signal<SkylineTheme>(this._initialTheme());
	protected readonly width = signal(0);
	protected readonly active = signal(-1);
	protected readonly legendLevel = signal(-1);
	protected readonly announce = signal('');

	protected readonly stats = computed(() => this.skyline().stats);
	protected readonly activeCell = computed(() => (this.active() >= 0 ? this.skyline().cells[this.active()] : undefined));
	protected readonly is3d = computed(() => this.view() === '3d');
	protected readonly plural = computed(() => this.unitPlural() ?? this.unit() + 's');
	protected readonly nf = computed(() => new Intl.NumberFormat(this.locale()));
	private readonly _df = computed(
		() => new Intl.DateTimeFormat(this.locale(), { month: 'short', day: 'numeric', timeZone: 'UTC' }),
	);
	protected readonly dfy = computed(
		() => new Intl.DateTimeFormat(this.locale(), { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }),
	);
	private readonly _dfl = computed(
		() =>
			new Intl.DateTimeFormat(this.locale(), {
				weekday: 'long',
				month: 'long',
				day: 'numeric',
				year: 'numeric',
				timeZone: 'UTC',
			}),
	);

	protected readonly corners = computed(() => this.showStats() && this.width() >= 560);
	protected readonly bigSize = computed(() => Math.round(Math.max(30, Math.min(56, this.width() * 0.058))));
	protected readonly showRow = computed(() => this.showStats() && !(this.is3d() && this.corners()));
	protected readonly hint = computed(() => HINTS[this.is3d() && this.orbit() ? 1 : 0]);
	protected readonly levelNames = computed(() => ['No ' + this.plural(), 'Light', 'Moderate', 'Heavy', 'Heaviest']);

	protected readonly statBlocks = computed(() => {
		const s = this.stats();
		const nf = this.nf();
		const days = (n: number) => (n === 1 ? 'day' : 'days');
		return [
			{ label: '1 year total', value: nf.format(s.total), unit: this.noun(s.total), sub: this._range(s.first, s.last, true) },
			{
				label: 'Busiest day',
				value: nf.format(s.busiest.count),
				unit: this.noun(s.busiest.count),
				sub: s.busiest.date ? this._df().format(dayMs(s.busiest.date)) : '—',
			},
			{ label: 'Longest streak', value: nf.format(s.longest.days), unit: days(s.longest.days), sub: this._range(s.longest.start, s.longest.end) },
			{ label: 'Current streak', value: nf.format(s.current.days), unit: days(s.current.days), sub: this._range(s.current.start, s.current.end) },
		];
	});

	protected readonly canvasLabel = computed(() => {
		const s = this.stats();
		return (
			this.nf().format(s.total) +
			' ' +
			this.noun(s.total) +
			' between ' +
			this._range(s.first, s.last, true) +
			', shown as a ' +
			(this.is3d() ? '3D skyline' : 'heat map') +
			'. Use the arrow keys to read individual days.'
		);
	});

	private readonly _stage = viewChild.required<ElementRef<HTMLDivElement>>('stage');
	private readonly _canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
	private readonly _tip = viewChild.required<ElementRef<HTMLDivElement>>('tip');
	private _engine: Engine | null = null;

	constructor() {
		const destroyRef = inject(DestroyRef);

		const browser = isPlatformBrowser(inject(PLATFORM_ID));

		afterNextRender(() => {
			if (!browser) return;
			const stop = this._mount();
			destroyRef.onDestroy(() => stop?.());
		});

		effect(() => {
			this.view();
			this.legendLevel();
			untracked(() => this._engine?.kick());
		});

		effect(() => {
			this.skyline();
			this.heightScale();
			untracked(() => this._engine?.load());
		});

		effect(() => {
			this.palette();
			untracked(() => this._engine?.retheme());
		});

		// The tooltip's width is needed to keep it inside the card; measure it when its text changes.
		afterRenderEffect(() => {
			const a = this.active();
			this.skyline();
			const tip = this._tip().nativeElement;
			if (a >= 0 && browser) untracked(() => this._engine?.tipWidth(tip.offsetWidth));
		});
	}

	protected noun(n: number): string {
		return n === 1 ? this.unit() : this.plural();
	}

	protected toggleLegend(i: number) {
		this.legendLevel.update((l) => (l === i ? -1 : i));
	}

	private _initialTheme(): SkylineTheme {
		const p = resolvePalette(this.palette(), false);
		return { dark: false, swatches: ['#ebedf0', ...p], accent: p[3] };
	}

	private _range(a: string | null, b: string | null, withYear = false): string {
		if (!a || !b) return '—';
		const f = withYear ? this.dfy() : this._df();
		return f.format(dayMs(a)) + ' — ' + f.format(dayMs(b));
	}

	private _describe(i: number): string {
		const c = this.skyline().cells[i];
		if (!c) return '';
		return (
			(c.count ? this.nf().format(c.count) + ' ' + this.noun(c.count) : 'No ' + this.plural()) +
			' on ' +
			this._dfl().format(dayMs(c.date))
		);
	}

	/** Builds the canvas engine once per mount; it reads inputs through signals so it never goes stale. */
	private _mount(): (() => void) | undefined {
		const root = this._host.nativeElement;
		const stage = this._stage().nativeElement;
		const canvas = this._canvas().nativeElement;
		const tip = this._tip().nativeElement;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const target3d = () => (this.view() === '3d' ? 1 : 0);
		const emitClick = (i: number) => {
			const c = this.skyline().cells[i];
			if (c) this.cellClick.emit({ date: c.date, count: c.count });
		};

		const reduceMq = window.matchMedia('(prefers-reduced-motion: reduce)');
		const darkMq = window.matchMedia('(prefers-color-scheme: dark)');
		let reduced = reduceMq.matches;

		// morph: t is linear time 0 (2D) → 1 (3D); the camera eases it, the bars wave it
		let t = 0;
		let target = 0;
		let entered = false;
		// orbit offsets, eased toward their goals
		let yaw = 0;
		let elev = 0;
		let yawGoal = 0;
		let elevGoal = 0;
		// layout
		let W = 0;
		let H2 = 0;
		let H3 = 0;
		let Hmax = 0;
		let lastH = -1;
		let dpr = 1;
		let gutter = 30;
		let labelW = 30;
		let font = '10px sans-serif';
		// colours: [empty, l1, l2, l3, l4] × rgb, eased toward the goal
		const col = new Float32Array(15);
		const colGoal = new Float32Array(15);
		let colReady = false;
		let fg: RGB = FG_FALLBACK;
		let bg: RGB = BG_FALLBACK;
		let isDark = false;
		// cells
		let n = 0;
		let weeks = 0;
		let wk = new Float32Array(0);
		let dy = new Float32Array(0);
		let lv = new Uint8Array(0);
		let hgt = new Float32Array(0);
		let zs = new Float32Array(0);
		let hover = new Float32Array(0);
		let dim = new Float32Array(0);
		let polys = new Float32Array(0);
		let faces = new Uint8Array(0);
		let order: number[] = [];
		let months: { week: number; label: string }[] = [];
		let weekdayRows: { day: number; label: string }[] = [];
		// interaction
		let hovered = -1;
		let pinned = -1;
		let activeIdx = -1;
		let tipW = 0;
		let raf = 0;
		let last = 0;

		const load = () => {
			const m = this.skyline();
			n = m.cells.length;
			weeks = m.weeks;
			if (wk.length !== n) {
				wk = new Float32Array(n);
				dy = new Float32Array(n);
				lv = new Uint8Array(n);
				hgt = new Float32Array(n);
				zs = new Float32Array(n);
				hover = new Float32Array(n);
				dim = new Float32Array(n);
				polys = new Float32Array(n * 24);
				faces = new Uint8Array(n);
				order = Array.from({ length: n }, (_, i) => i);
			}
			const scale = this.heightScale();
			for (let i = 0; i < n; i++) {
				const c = m.cells[i];
				wk[i] = c.week;
				dy[i] = c.day;
				lv[i] = c.level;
				hgt[i] = barHeight(c.count, m.max, scale);
			}
			months = m.months;
			const wf = new Intl.DateTimeFormat(this.locale(), { weekday: 'short', timeZone: 'UTC' });
			weekdayRows = [];
			for (let d = 0; d < 7 && d < n; d++) {
				const dow = new Date(dayMs(m.cells[d].date)).getUTCDay();
				if (dow === 1 || dow === 3 || dow === 5) weekdayRows.push({ day: d, label: wf.format(dayMs(m.cells[d].date)) });
			}
			if (hovered >= n) hovered = -1;
			if (pinned >= n) pinned = -1;
		};

		const retheme = () => {
			const cs = getComputedStyle(root);
			fg = toRGB(cs.color, FG_FALLBACK) ?? FG_FALLBACK;
			const b = toRGB(cs.backgroundColor, null);
			bg = b ?? (luminance(fg) > 0.5 ? [10, 10, 10] : BG_FALLBACK);
			isDark = luminance(bg) < 0.45;
			font = '400 10px ' + (cs.fontFamily || 'sans-serif');
			const pal = resolvePalette(this.palette(), isDark);
			const empty = mixRGB(bg, fg, isDark ? 0.11 : 0.075);
			const all: RGB[] = [empty, ...pal.map((c) => toRGB(c, FG_FALLBACK) ?? FG_FALLBACK)];
			for (let k = 0; k < 5; k++) for (let ch = 0; ch < 3; ch++) colGoal[k * 3 + ch] = all[k][ch];
			if (!colReady || reduced) {
				col.set(colGoal);
				colReady = true;
			}
			ctx.font = font;
			labelW = Math.ceil(Math.max(20, ...weekdayRows.map((r) => ctx.measureText(r.label).width))) + 8;
			const sw = all.map((c) => rgbString(c[0], c[1], c[2]));
			this.theme.update((prev) =>
				prev.dark === isDark && prev.swatches.join() === sw.join() ? prev : { dark: isDark, swatches: sw, accent: sw[4] },
			);
			kick();
		};

		// Projected extent of the scene for camera e, with each bar at zs[i] (or fully risen).
		const extent = (cam: Cam, e: number, full: boolean) => {
			const w = lerp(0.78, 0.9, e);
			const off = (1 - w) / 2;
			let minx = Infinity;
			let maxx = -Infinity;
			let miny = Infinity;
			let maxy = -Infinity;
			const add = (x: number, y: number, z: number) => {
				const p = project(cam, x, y, z);
				if (p[0] < minx) minx = p[0];
				if (p[0] > maxx) maxx = p[0];
				if (p[1] < miny) miny = p[1];
				if (p[1] > maxy) maxy = p[1];
			};
			for (let i = 0; i < n; i++) {
				const x0 = wk[i] + off;
				const y0 = dy[i] + off;
				const z = full ? hgt[i] * e : zs[i];
				add(x0, y0, z);
				add(x0 + w, y0, z);
				add(x0, y0 + w, z);
				add(x0 + w, y0 + w, 0);
				add(x0, y0 + w, 0);
				add(x0 + w, y0, 0);
			}
			// room for the month labels that run along the front edge in 3D
			add(0, 7 + 1.5 * e, 0);
			add(weeks, 7 + 1.5 * e, 0);
			return { minx, maxx, miny, maxy };
		};

		const relayout = () => {
			const w = Math.round(stage.clientWidth);
			if (!w || !n) return;
			W = w;
			// Narrow cards give the weekday names' column to the grid instead; rows get too tight to label.
			gutter = W < 520 ? 0 : labelW;
			dpr = Math.min(2, window.devicePixelRatio || 1);
			const b2 = extent(camera(0), 0, true);
			H2 = 20 + 4 + ((b2.maxy - b2.miny) / (b2.maxx - b2.minx)) * (W - gutter - 4);
			const b3 = extent(camera(1), 1, true);
			const natural = ((b3.maxy - b3.miny) / (b3.maxx - b3.minx)) * (W - 40) + 40;
			H3 = Math.max(Math.min(natural, W * 0.72, 620), Math.min(natural, 240));
			Hmax = Math.ceil(Math.max(H2, H3));
			canvas.width = Math.round(W * dpr);
			canvas.height = Math.round(Hmax * dpr);
			canvas.style.width = W + 'px';
			canvas.style.height = Hmax + 'px';
			lastH = -1;
			this.width.set(W);
			draw();
		};

		const draw = () => {
			if (!W || !n) return;
			const e = easeInOutCubic(t);
			const cam = camera(e, yaw, elev);
			const Hc = lerp(H2, H3, e);
			if (Math.abs(Hc - lastH) > 0.2) {
				stage.style.height = Hc.toFixed(1) + 'px';
				lastH = Hc;
			}
			for (let i = 0; i < n; i++) zs[i] = riseAt(t, wk[i], weeks, dy[i]) * hgt[i];
			const b = extent(cam, e, false);
			const pad = lerp(2, 20, e);
			const left = pad + gutter * (1 - e);
			const top = pad + 20 * (1 - e);
			const aw = W - left - pad;
			const ah = Hc - top - pad;
			const bw = Math.max(1e-6, b.maxx - b.minx);
			const bh = Math.max(1e-6, b.maxy - b.miny);
			const s = Math.min(aw / bw, ah / bh);
			const ox = left + (aw - bw * s) / 2 - b.minx * s;
			const oy = top + (ah - bh * s) / 2 - b.miny * s;
			const { cs, sn, se, ce } = cam;
			const px = (x: number, y: number) => ox + (x * cs - y * sn) * s;
			const py = (x: number, y: number, z: number) => oy + ((x * sn + y * cs) * se - z * ce) * s;

			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			ctx.clearRect(0, 0, W, Hmax);

			order.sort((a, c) => (wk[a] + 0.5) * sn + (dy[a] + 0.5) * cs - ((wk[c] + 0.5) * sn + (dy[c] + 0.5) * cs));

			const w = lerp(0.78, 0.9, e);
			const off = (1 - w) / 2;
			const radius = lerp(0.17, 0.03, e) * s;
			const outline = (1 - e) * 0.07;
			const lift = 0.7 * e;
			const ex = col[0];
			const ey = col[1];
			const ez = col[2];

			for (let k = 0; k < n; k++) {
				const i = order[k];
				const x0 = wk[i] + off;
				const y0 = dy[i] + off;
				const x1 = x0 + w;
				const y1 = y0 + w;
				const z = zs[i] + hover[i] * lift;
				const o = i * 24;
				// top
				polys[o] = px(x0, y0);
				polys[o + 1] = py(x0, y0, z);
				polys[o + 2] = px(x1, y0);
				polys[o + 3] = py(x1, y0, z);
				polys[o + 4] = px(x1, y1);
				polys[o + 5] = py(x1, y1, z);
				polys[o + 6] = px(x0, y1);
				polys[o + 7] = py(x0, y1, z);
				// +y face (left on screen)
				polys[o + 8] = px(x0, y1);
				polys[o + 9] = py(x0, y1, 0);
				polys[o + 10] = px(x1, y1);
				polys[o + 11] = py(x1, y1, 0);
				polys[o + 12] = polys[o + 4];
				polys[o + 13] = polys[o + 5];
				polys[o + 14] = polys[o + 6];
				polys[o + 15] = polys[o + 7];
				// +x face (right on screen)
				polys[o + 16] = px(x1, y0);
				polys[o + 17] = py(x1, y0, 0);
				polys[o + 18] = polys[o + 10];
				polys[o + 19] = polys[o + 11];
				polys[o + 20] = polys[o + 4];
				polys[o + 21] = polys[o + 5];
				polys[o + 22] = polys[o + 2];
				polys[o + 23] = polys[o + 3];

				const tall = z * ce * s;
				let f = 0;
				if (tall > 0.35 && w * cs * s > 0.35) f |= 1;
				if (tall > 0.35 && w * sn * s > 0.35) f |= 2;
				faces[i] = f;

				const L = lv[i] * 3;
				let r = col[L];
				let g = col[L + 1];
				let bl = col[L + 2];
				const d = dim[i];
				if (d > 0.002) {
					r += (ex - r) * 0.72 * d;
					g += (ey - g) * 0.72 * d;
					bl += (ez - bl) * 0.72 * d;
				}
				const hv = hover[i];
				if (hv > 0.002) {
					const m = 0.16 * hv;
					r += (fg[0] - r) * m;
					g += (fg[1] - g) * m;
					bl += (fg[2] - bl) * m;
				}
				if (f & 1) {
					ctx.beginPath();
					quadPath(ctx, polys, o + 8, 0);
					ctx.fillStyle = rgbString(r * 0.84, g * 0.84, bl * 0.84);
					ctx.fill();
				}
				if (f & 2) {
					ctx.beginPath();
					quadPath(ctx, polys, o + 16, 0);
					ctx.fillStyle = rgbString(r * 0.68, g * 0.68, bl * 0.68);
					ctx.fill();
				}
				ctx.beginPath();
				quadPath(ctx, polys, o, radius);
				ctx.fillStyle = rgbString(r, g, bl);
				ctx.fill();
				if (outline > 0.004) {
					ctx.strokeStyle = 'rgba(' + fg[0] + ',' + fg[1] + ',' + fg[2] + ',' + outline.toFixed(3) + ')';
					ctx.lineWidth = 1;
					ctx.stroke();
				}
				if (hv > 0.02) {
					ctx.strokeStyle = 'rgba(' + fg[0] + ',' + fg[1] + ',' + fg[2] + ',' + (0.85 * hv).toFixed(3) + ')';
					ctx.lineWidth = 1.5;
					ctx.stroke();
				}
			}

			// Labels: along the top and left in 2D, along the front edge in 3D. They fade, never pop.
			const muted = mixRGB(bg, fg, 0.55);
			const mutedRgb = Math.round(muted[0]) + ',' + Math.round(muted[1]) + ',' + Math.round(muted[2]);
			ctx.font = font;
			const a2 = 1 - smoothstep(0, 0.4, e);
			const a3 = smoothstep(0.62, 1, e);
			if (a2 > 0.004) {
				ctx.fillStyle = 'rgba(' + mutedRgb + ',' + a2.toFixed(3) + ')';
				ctx.textAlign = 'left';
				ctx.textBaseline = 'bottom';
				let edge = -Infinity;
				for (const m of months) {
					const x = px(m.week + off, -0.3);
					const tw = ctx.measureText(m.label).width;
					if (x < edge || x + tw > W) continue;
					ctx.fillText(m.label, x, py(m.week + off, -0.3, 0) - 3);
					edge = x + tw + 6;
				}
				ctx.textAlign = 'right';
				ctx.textBaseline = 'middle';
				if (gutter > 0)
					for (const r of weekdayRows) ctx.fillText(r.label, px(0, r.day + 0.5) - 6, py(0, r.day + 0.5, 0));
			}
			if (a3 > 0.004) {
				ctx.fillStyle = 'rgba(' + mutedRgb + ',' + a3.toFixed(3) + ')';
				ctx.textAlign = 'left';
				ctx.textBaseline = 'top';
				let edge = -Infinity;
				for (const m of months) {
					const x = px(m.week + 0.5, 7.3);
					const tw = ctx.measureText(m.label).width;
					if (x < edge || x + tw > W) continue;
					ctx.fillText(m.label, x, py(m.week + 0.5, 7.3, 0) + 2);
					edge = x + tw + 10;
				}
			}

			// Tooltip rides the active cell through morphs and orbits.
			if (activeIdx >= 0 && activeIdx < n) {
				const i = activeIdx;
				const z = zs[i] + hover[i] * lift;
				const tx = px(wk[i] + 0.5, dy[i] + 0.5);
				const ty = Math.min(
					py(wk[i] + off, dy[i] + off, z),
					py(wk[i] + off + w, dy[i] + off, z),
					py(wk[i] + off, dy[i] + off + w, z),
				);
				const half = tipW / 2;
				const cx = Math.min(W - half - 2, Math.max(half + 2, tx));
				tip.style.transform =
					'translate(' + (cx - half).toFixed(1) + 'px,' + (ty - 8).toFixed(1) + 'px) translateY(-100%)';
				tip.style.setProperty('--arrow', (tx - cx + half).toFixed(1) + 'px');
			}
		};

		const tick = (now: number) => {
			raf = 0;
			const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
			last = now;
			let moving = false;

			if (t !== target) {
				const step = reduced ? 1 : (dt * 1000) / Math.max(1, this.duration());
				t = target > t ? Math.min(target, t + step) : Math.max(target, t - step);
				moving = true;
			}

			const ko = reduced ? 1 : 1 - Math.exp(-dt * 12);
			yaw += (yawGoal - yaw) * ko;
			elev += (elevGoal - elev) * ko;
			if (Math.abs(yawGoal - yaw) > 1e-4 || Math.abs(elevGoal - elev) > 1e-4) moving = true;
			else {
				yaw = yawGoal;
				elev = elevGoal;
			}

			const kc = reduced ? 1 : 1 - Math.exp(-dt * 7);
			for (let k = 0; k < 15; k++) {
				const d = colGoal[k] - col[k];
				if (Math.abs(d) > 0.4) {
					col[k] += d * kc;
					moving = true;
				} else col[k] = colGoal[k];
			}

			const kh = reduced ? 1 : 1 - Math.exp(-dt * 16);
			const kd = reduced ? 1 : 1 - Math.exp(-dt * 10);
			const leg = this.legendLevel();
			for (let i = 0; i < n; i++) {
				const hg = i === activeIdx ? 1 : 0;
				const dg = leg >= 0 && lv[i] !== leg ? 1 : 0;
				const h = hover[i];
				const d = dim[i];
				if (h !== hg) {
					hover[i] = Math.abs(hg - h) < 0.003 ? hg : h + (hg - h) * kh;
					moving = true;
				}
				if (d !== dg) {
					dim[i] = Math.abs(dg - d) < 0.003 ? dg : d + (dg - d) * kd;
					moving = true;
				}
			}

			draw();
			if (moving) raf = requestAnimationFrame(tick);
		};

		const kick = () => {
			if (raf) return;
			last = performance.now();
			raf = requestAnimationFrame(tick);
		};

		// The active day is the hovered one, else the pinned one (tap, click or keyboard).
		const refreshActive = () => {
			const next = hovered >= 0 ? hovered : pinned;
			if (next === activeIdx) return;
			activeIdx = next;
			this.active.set(next);
			kick();
		};

		const hit = (x: number, y: number): number => {
			for (let k = n - 1; k >= 0; k--) {
				const i = order[k];
				const o = i * 24;
				if (pointInQuad(polys, o, x, y)) return i;
				if (faces[i] & 1 && pointInQuad(polys, o + 8, x, y)) return i;
				if (faces[i] & 2 && pointInQuad(polys, o + 16, x, y)) return i;
			}
			return -1;
		};

		const local = (ev: PointerEvent | MouseEvent) => {
			const r = canvas.getBoundingClientRect();
			return [ev.clientX - r.left, ev.clientY - r.top] as const;
		};

		const idleCursor = () => (this.orbit() && target === 1 ? 'grab' : 'default');

		let drag: {
			id: number;
			x: number;
			y: number;
			yaw: number;
			elev: number;
			moved: boolean;
			orbit: boolean;
			mouse: boolean;
		} | null = null;

		const onDown = (ev: PointerEvent) => {
			if (ev.button !== 0) return;
			const can = this.orbit() && target === 1;
			drag = {
				id: ev.pointerId,
				x: ev.clientX,
				y: ev.clientY,
				yaw: yawGoal,
				elev: elevGoal,
				moved: false,
				orbit: can,
				mouse: ev.pointerType === 'mouse',
			};
			if (can) {
				try {
					canvas.setPointerCapture(ev.pointerId);
				} catch {
					/* capture is a nicety */
				}
			}
		};

		const onMove = (ev: PointerEvent) => {
			if (drag && drag.orbit && ev.pointerId === drag.id) {
				const dx = ev.clientX - drag.x;
				const dyy = ev.clientY - drag.y;
				if (drag.moved || Math.hypot(dx, dyy) > 4) {
					drag.moved = true;
					yawGoal = Math.min(YAW_RANGE[1] - YAW_3D, Math.max(YAW_RANGE[0] - YAW_3D, drag.yaw + dx * 0.006));
					if (drag.mouse)
						elevGoal = Math.min(ELEV_RANGE[1] - ELEV_3D, Math.max(ELEV_RANGE[0] - ELEV_3D, drag.elev + dyy * 0.004));
					canvas.style.cursor = 'grabbing';
					hovered = -1;
					refreshActive();
					kick();
					return;
				}
			}
			if (ev.pointerType !== 'mouse') return;
			const [x, y] = local(ev);
			const i = hit(x, y);
			if (i !== hovered) {
				hovered = i;
				refreshActive();
			}
			canvas.style.cursor = this.orbit() && target === 1 ? 'grab' : i >= 0 ? 'pointer' : 'default';
		};

		const onUp = (ev: PointerEvent) => {
			if (!drag || ev.pointerId !== drag.id) return;
			const wasMoved = drag.moved;
			drag = null;
			if (canvas.hasPointerCapture(ev.pointerId)) canvas.releasePointerCapture(ev.pointerId);
			canvas.style.cursor = idleCursor();
			if (wasMoved) return;
			const [x, y] = local(ev);
			const i = hit(x, y);
			pinned = i === pinned ? -1 : i;
			if (ev.pointerType !== 'mouse') hovered = -1;
			refreshActive();
			if (i >= 0) emitClick(i);
		};

		const onCancel = () => {
			drag = null;
		};

		const onLeave = () => {
			if (drag) return;
			hovered = -1;
			refreshActive();
		};

		const onDbl = () => {
			yawGoal = 0;
			elevGoal = 0;
			kick();
		};

		const onKey = (ev: KeyboardEvent) => {
			const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Escape', 'Enter', ' '];
			if (!keys.includes(ev.key) || !n) return;
			ev.preventDefault();
			if (ev.key === 'Escape') {
				pinned = -1;
				hovered = -1;
				refreshActive();
				return;
			}
			let i = pinned >= 0 ? pinned : activeIdx >= 0 ? activeIdx : n - 1;
			if (ev.key === 'Enter' || ev.key === ' ') {
				emitClick(i);
				return;
			}
			if (pinned >= 0 || activeIdx >= 0) {
				if (ev.key === 'ArrowLeft') i -= 7;
				if (ev.key === 'ArrowRight') i += 7;
				if (ev.key === 'ArrowUp') i -= 1;
				if (ev.key === 'ArrowDown') i += 1;
				if (ev.key === 'Home') i = 0;
				if (ev.key === 'End') i = n - 1;
			}
			i = Math.max(0, Math.min(n - 1, i));
			pinned = i;
			hovered = -1;
			refreshActive();
			this.announce.set(this._describe(i));
		};

		const onBlur = () => {
			pinned = -1;
			refreshActive();
		};

		const setTarget = () => {
			const goal = target3d();
			if (!entered) return;
			if (goal !== target) {
				target = goal;
				if (goal === 0) {
					yawGoal = 0;
					elevGoal = 0;
				}
				canvas.style.cursor = idleCursor();
				kick();
			}
		};

		load();
		retheme();
		relayout();

		// The 3D view rises out of the flat one the first time it is seen.
		const enter = () => {
			if (entered) return;
			entered = true;
			if (reduced) t = target3d();
			setTarget();
		};
		let io: IntersectionObserver | null = null;
		if ('IntersectionObserver' in window) {
			io = new IntersectionObserver(
				(entries) => {
					if (entries.some((en) => en.isIntersecting)) {
						enter();
						io?.disconnect();
					}
				},
				{ threshold: 0.35 },
			);
			io.observe(stage);
		} else enter();

		const ro = new ResizeObserver(() => {
			if (Math.round(stage.clientWidth) !== W) relayout();
		});
		ro.observe(stage);

		const mo = new MutationObserver(retheme);
		mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style', 'data-theme'] });
		const onReduce = () => {
			reduced = reduceMq.matches;
			kick();
		};
		reduceMq.addEventListener('change', onReduce);
		darkMq.addEventListener('change', retheme);

		canvas.addEventListener('pointerdown', onDown);
		canvas.addEventListener('pointermove', onMove);
		canvas.addEventListener('pointerup', onUp);
		canvas.addEventListener('pointercancel', onCancel);
		canvas.addEventListener('pointerleave', onLeave);
		canvas.addEventListener('dblclick', onDbl);
		canvas.addEventListener('keydown', onKey);
		canvas.addEventListener('blur', onBlur);

		this._engine = {
			kick: () => {
				setTarget();
				kick();
			},
			load: () => {
				load();
				retheme();
				relayout();
			},
			retheme,
			tipWidth: (w: number) => {
				tipW = w;
				draw();
			},
		};

		return () => {
			if (raf) cancelAnimationFrame(raf);
			io?.disconnect();
			ro.disconnect();
			mo.disconnect();
			reduceMq.removeEventListener('change', onReduce);
			darkMq.removeEventListener('change', retheme);
			canvas.removeEventListener('pointerdown', onDown);
			canvas.removeEventListener('pointermove', onMove);
			canvas.removeEventListener('pointerup', onUp);
			canvas.removeEventListener('pointercancel', onCancel);
			canvas.removeEventListener('pointerleave', onLeave);
			canvas.removeEventListener('dblclick', onDbl);
			canvas.removeEventListener('keydown', onKey);
			canvas.removeEventListener('blur', onBlur);
			this._engine = null;
		};
	}
}
