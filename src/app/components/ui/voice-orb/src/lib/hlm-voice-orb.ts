import { isPlatformBrowser } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	ElementRef,
	PLATFORM_ID,
	afterNextRender,
	computed,
	effect,
	inject,
	input,
	output,
	untracked,
} from '@angular/core';
import { hlm } from '@spartan-ng/helm/utils';
import type { ClassValue } from 'clsx';
import { Mesh, Program, Renderer, Triangle, Vec3 } from 'ogl';

/**
 * Voice-powered orb: a glowing, noise-shaped ring rendered in a WebGL shader.
 *
 * With `enableVoiceControl` it listens to the microphone and swirls, warps and
 * speeds up with the input level. `level` (0–1) drives the same response from
 * outside — e.g. while synthesized speech plays, which can't be analysed.
 */

const VERTEX = /* glsl */ `
	precision highp float;
	attribute vec2 position;
	attribute vec2 uv;
	varying vec2 vUv;
	void main() {
		vUv = uv;
		gl_Position = vec4(position, 0.0, 1.0);
	}
`;

const FRAGMENT = /* glsl */ `
	precision highp float;

	uniform float iTime;
	uniform vec3 iResolution;
	uniform float hue;
	uniform float hover;
	uniform float rot;
	uniform float hoverIntensity;
	varying vec2 vUv;

	vec3 rgb2yiq(vec3 c) {
		float y = dot(c, vec3(0.299, 0.587, 0.114));
		float i = dot(c, vec3(0.596, -0.274, -0.322));
		float q = dot(c, vec3(0.211, -0.523, 0.312));
		return vec3(y, i, q);
	}

	vec3 yiq2rgb(vec3 c) {
		float r = c.x + 0.956 * c.y + 0.621 * c.z;
		float g = c.x - 0.272 * c.y - 0.647 * c.z;
		float b = c.x - 1.106 * c.y + 1.703 * c.z;
		return vec3(r, g, b);
	}

	vec3 adjustHue(vec3 color, float hueDeg) {
		float hueRad = hueDeg * 3.14159265 / 180.0;
		vec3 yiq = rgb2yiq(color);
		float cosA = cos(hueRad);
		float sinA = sin(hueRad);
		float i = yiq.y * cosA - yiq.z * sinA;
		float q = yiq.y * sinA + yiq.z * cosA;
		yiq.y = i;
		yiq.z = q;
		return yiq2rgb(yiq);
	}

	vec3 hash33(vec3 p3) {
		p3 = fract(p3 * vec3(0.1031, 0.11369, 0.13787));
		p3 += dot(p3, p3.yxz + 19.19);
		return -1.0 + 2.0 * fract(vec3(p3.x + p3.y, p3.x + p3.z, p3.y + p3.z) * p3.zyx);
	}

	float snoise3(vec3 p) {
		const float K1 = 0.333333333;
		const float K2 = 0.166666667;
		vec3 i = floor(p + (p.x + p.y + p.z) * K1);
		vec3 d0 = p - (i - (i.x + i.y + i.z) * K2);
		vec3 e = step(vec3(0.0), d0 - d0.yzx);
		vec3 i1 = e * (1.0 - e.zxy);
		vec3 i2 = 1.0 - e.zxy * (1.0 - e);
		vec3 d1 = d0 - (i1 - K2);
		vec3 d2 = d0 - (i2 - K1);
		vec3 d3 = d0 - 0.5;
		vec4 h = max(0.6 - vec4(dot(d0, d0), dot(d1, d1), dot(d2, d2), dot(d3, d3)), 0.0);
		vec4 n = h * h * h * h * vec4(dot(d0, hash33(i)), dot(d1, hash33(i + i1)), dot(d2, hash33(i + i2)), dot(d3, hash33(i + 1.0)));
		return dot(vec4(31.316), n);
	}

	vec4 extractAlpha(vec3 colorIn) {
		float a = max(max(colorIn.r, colorIn.g), colorIn.b);
		return vec4(colorIn.rgb / (a + 1e-5), a);
	}

	const vec3 baseColor1 = vec3(0.611765, 0.262745, 0.996078);
	const vec3 baseColor2 = vec3(0.298039, 0.760784, 0.913725);
	const vec3 baseColor3 = vec3(0.062745, 0.078431, 0.600000);
	const float innerRadius = 0.6;
	const float noiseScale = 0.65;

	float light1(float intensity, float attenuation, float dist) {
		return intensity / (1.0 + dist * attenuation);
	}

	float light2(float intensity, float attenuation, float dist) {
		return intensity / (1.0 + dist * dist * attenuation);
	}

	vec4 draw(vec2 uv) {
		vec3 color1 = adjustHue(baseColor1, hue);
		vec3 color2 = adjustHue(baseColor2, hue);
		vec3 color3 = adjustHue(baseColor3, hue);

		float ang = atan(uv.y, uv.x);
		float len = length(uv);
		float invLen = len > 0.0 ? 1.0 / len : 0.0;

		float n0 = snoise3(vec3(uv * noiseScale, iTime * 0.5)) * 0.5 + 0.5;
		float r0 = mix(mix(innerRadius, 1.0, 0.4), mix(innerRadius, 1.0, 0.6), n0);
		float d0 = distance(uv, (r0 * invLen) * uv);
		float v0 = light1(1.0, 10.0, d0);
		v0 *= smoothstep(r0 * 1.05, r0, len);
		float cl = cos(ang + iTime * 2.0) * 0.5 + 0.5;

		float a = iTime * -1.0;
		vec2 pos = vec2(cos(a), sin(a)) * r0;
		float d = distance(uv, pos);
		float v1 = light2(1.5, 5.0, d);
		v1 *= light1(1.0, 50.0, d0);

		float v2 = smoothstep(1.0, mix(innerRadius, 1.0, n0 * 0.5), len);
		float v3 = smoothstep(innerRadius, mix(innerRadius, 1.0, 0.5), len);

		vec3 col = mix(color1, color2, cl);
		col = mix(color3, col, v0);
		col = (col + v1) * v2 * v3;
		col = clamp(col, 0.0, 1.0);

		return extractAlpha(col);
	}

	vec4 mainImage(vec2 fragCoord) {
		vec2 center = iResolution.xy * 0.5;
		float size = min(iResolution.x, iResolution.y);
		vec2 uv = (fragCoord - center) / size * 2.0;

		float s = sin(rot);
		float c = cos(rot);
		uv = vec2(c * uv.x - s * uv.y, s * uv.x + c * uv.y);

		uv.x += hover * hoverIntensity * 0.1 * sin(uv.y * 10.0 + iTime);
		uv.y += hover * hoverIntensity * 0.1 * sin(uv.x * 10.0 + iTime);

		return draw(uv);
	}

	void main() {
		vec2 fragCoord = vUv * iResolution.xy;
		vec4 col = mainImage(fragCoord);
		gl_FragColor = vec4(col.rgb * col.a, col.a);
	}
`;

@Component({
	selector: 'hlm-voice-orb',
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		'data-slot': 'voice-orb',
		'aria-hidden': 'true',
		'[class]': '_computedClass()',
	},
	template: '',
})
export class HlmVoiceOrb {
	private readonly _host = inject<ElementRef<HTMLElement>>(ElementRef);
	private readonly _browser = isPlatformBrowser(inject(PLATFORM_ID));

	/** Hue shift in degrees applied to the orb's purple/cyan palette. */
	public readonly hue = input(0);
	/** Listen to the microphone and react to its level. */
	public readonly enableVoiceControl = input(false);
	public readonly voiceSensitivity = input(1.5);
	public readonly maxRotationSpeed = input(1.2);
	public readonly maxHoverIntensity = input(0.8);
	/** External activity level, 0–1, combined with the microphone level. */
	public readonly level = input(0);
	public readonly userClass = input<ClassValue>('', { alias: 'class' });

	/** Emits when the microphone goes from quiet to voice or back. */
	public readonly voiceDetected = output<boolean>();

	protected readonly _computedClass = computed(() => hlm('relative block size-full', this.userClass()));

	private _audioContext: AudioContext | null = null;
	private _analyser: AnalyserNode | null = null;
	private _source: MediaStreamAudioSourceNode | null = null;
	private _stream: MediaStream | null = null;
	private _samples: Uint8Array<ArrayBuffer> | null = null;
	private _micRequest = 0;

	constructor() {
		const destroyRef = inject(DestroyRef);

		afterNextRender(() => {
			const stop = this._start();
			destroyRef.onDestroy(() => stop?.());
		});

		// Microphone follows the input; a newer request supersedes a pending one
		effect(() => {
			const enabled = this.enableVoiceControl();
			if (!this._browser) return;
			untracked(() => (enabled ? void this._startMicrophone() : this._stopMicrophone()));
		});
		destroyRef.onDestroy(() => this._stopMicrophone());
	}

	private _start(): (() => void) | undefined {
		const container = this._host.nativeElement;
		let renderer: Renderer;
		try {
			renderer = new Renderer({ alpha: true, premultipliedAlpha: false, antialias: true, dpr: Math.min(2, window.devicePixelRatio || 1) });
		} catch {
			return; // No WebGL: the orb simply doesn't render
		}
		const gl = renderer.gl;
		gl.clearColor(0, 0, 0, 0);
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		gl.canvas.style.display = 'block';
		container.appendChild(gl.canvas);

		const program = new Program(gl, {
			vertex: VERTEX,
			fragment: FRAGMENT,
			uniforms: {
				iTime: { value: 0 },
				iResolution: { value: new Vec3(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height) },
				hue: { value: this.hue() },
				hover: { value: 0 },
				rot: { value: 0 },
				hoverIntensity: { value: 0 },
			},
		});
		const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

		const resize = () => {
			const width = container.clientWidth;
			const height = container.clientHeight;
			if (!width || !height) return;
			renderer.setSize(width, height);
			program.uniforms['iResolution'].value.set(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height);
		};
		const observer = new ResizeObserver(resize);
		observer.observe(container);
		resize();

		const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const timeScale = reduceMotion ? 0.25 : 1;
		const baseRotationSpeed = 0.3;
		let last = 0;
		let rotation = 0;
		let smoothed = 0;
		let detected = false;
		let raf = 0;

		const frame = (now: number) => {
			raf = requestAnimationFrame(frame);
			const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
			last = now;

			const mic = this._micLevel();
			const voice = mic > 0.1;
			if (voice !== detected) {
				detected = voice;
				this.voiceDetected.emit(voice);
			}

			// Ease so external levels (which can jump) don't make the orb twitch
			const target = Math.max(mic, this.level());
			smoothed += (target - smoothed) * Math.min(1, dt * 12);

			if (smoothed > 0.05) rotation += dt * (baseRotationSpeed + smoothed * this.maxRotationSpeed() * 2) * timeScale;

			program.uniforms['iTime'].value = (now / 1000) * timeScale;
			program.uniforms['hue'].value = this.hue();
			program.uniforms['rot'].value = rotation;
			program.uniforms['hover'].value = Math.min(smoothed * 2, 1);
			program.uniforms['hoverIntensity'].value = Math.min(smoothed * this.maxHoverIntensity() * 0.8, this.maxHoverIntensity());

			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
			renderer.render({ scene: mesh });
		};
		raf = requestAnimationFrame(frame);

		return () => {
			cancelAnimationFrame(raf);
			observer.disconnect();
			gl.canvas.remove();
			gl.getExtension('WEBGL_lose_context')?.loseContext();
		};
	}

	/** RMS of the microphone spectrum, boosted by `voiceSensitivity`, 0–1. */
	private _micLevel(): number {
		if (!this._analyser || !this._samples) return 0;
		this._analyser.getByteFrequencyData(this._samples);
		let sum = 0;
		for (const value of this._samples) sum += (value / 255) ** 2;
		const rms = Math.sqrt(sum / this._samples.length);
		return Math.min(rms * this.voiceSensitivity() * 3, 1);
	}

	private async _startMicrophone() {
		const request = ++this._micRequest;
		this._stopMicrophone();
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
			});
			// Turned off (or restarted) while the permission prompt was open
			if (request !== this._micRequest || !this.enableVoiceControl()) {
				stream.getTracks().forEach((track) => track.stop());
				return;
			}
			const context = new AudioContext();
			if (context.state === 'suspended') await context.resume();
			const analyser = context.createAnalyser();
			analyser.fftSize = 512;
			analyser.smoothingTimeConstant = 0.3;
			analyser.minDecibels = -90;
			analyser.maxDecibels = -10;
			const source = context.createMediaStreamSource(stream);
			source.connect(analyser);

			this._stream = stream;
			this._audioContext = context;
			this._analyser = analyser;
			this._source = source;
			this._samples = new Uint8Array(analyser.frequencyBinCount);
		} catch {
			// Permission denied or no microphone: the orb still animates from `level`
		}
	}

	private _stopMicrophone() {
		this._stream?.getTracks().forEach((track) => track.stop());
		this._source?.disconnect();
		this._analyser?.disconnect();
		if (this._audioContext && this._audioContext.state !== 'closed') void this._audioContext.close();
		this._stream = null;
		this._source = null;
		this._analyser = null;
		this._audioContext = null;
		this._samples = null;
	}
}
