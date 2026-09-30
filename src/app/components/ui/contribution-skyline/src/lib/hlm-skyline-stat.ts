import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** One figure in the skyline's stats: stacked in the row under the chart, or pinned to a corner in 3D. */
@Component({
	selector: 'hlm-skyline-stat',
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'block min-w-0' },
	template: `
		@if (align() === 'stack') {
			<div class="text-muted-foreground text-[13px] leading-tight">{{ label() }}</div>
			<div class="mt-1 flex items-baseline gap-1.5">
				<span
					class="font-semibold tracking-[-0.02em] tabular-nums transition-colors duration-500 motion-reduce:transition-none"
					style="line-height: 1"
					[style.color]="accent()"
					[style.font-size.px]="size()"
				>
					{{ value() }}
				</span>
				<span class="text-[14px]">{{ unit() }}</span>
			</div>
			<div class="text-muted-foreground mt-0.5 truncate text-[12px]">{{ sub() }}</div>
		} @else {
			<div class="grid grid-cols-[auto_auto] items-end gap-x-2" [style.justify-content]="align()">
				@if (align() === 'end') {
					<div class="text-muted-foreground text-right text-[13px] leading-tight">{{ label() }}</div>
					<div></div>
				} @else {
					<div class="text-muted-foreground col-span-2 text-[13px] leading-tight">{{ label() }}</div>
				}
				<div
					class="text-right font-semibold tracking-[-0.02em] tabular-nums transition-colors duration-500 motion-reduce:transition-none"
					style="line-height: 0.95"
					[style.color]="accent()"
					[style.font-size.px]="size()"
				>
					{{ value() }}
				</div>
				<div class="pb-[0.15em] leading-tight">
					<div class="text-[15px]">{{ unit() }}</div>
					<div class="text-muted-foreground text-[13px] whitespace-nowrap">{{ sub() }}</div>
				</div>
			</div>
		}
	`,
})
export class HlmSkylineStat {
	public readonly label = input.required<string>();
	public readonly value = input.required<string>();
	public readonly unit = input.required<string>();
	public readonly sub = input.required<string>();
	public readonly accent = input.required<string>();
	public readonly size = input.required<number>();
	public readonly align = input.required<'start' | 'end' | 'stack'>();
}
