import { ElementRef, Renderer2, effect, inject } from '@angular/core';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function hlm(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function classes(...inputs: (ClassValue | (() => ClassValue))[]) {
	const el = inject(ElementRef);
	const renderer = inject(Renderer2);
	let previousClasses: string[] = [];

	effect(() => {
		const resolved = clsx(inputs.map((input) => (typeof input === 'function' ? input() : input)));
		const newClasses = resolved.split(' ').filter(Boolean);

		previousClasses.forEach((c) => renderer.removeClass(el.nativeElement, c));
		newClasses.forEach((c) => renderer.addClass(el.nativeElement, c));

		previousClasses = newClasses;
	});
}
