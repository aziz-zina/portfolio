import { NgZone } from '@angular/core';
import type * as THREE from 'three';

// A distant, narrow camera keeps perspective gentle: the ring's near side
// doesn't balloon as it swings towards the viewer
const FOV = 34;
const CAMERA_Z = 11;
const COLOR_A = '#3185FF';
const COLOR_B = '#FC413E';

/** Ring plane tilt: nearly edge-on, and slanted so it cuts across the text. */
const TILT_X = 0.2;
const TILT_Z = -0.2;

/**
 * Bands of the ring, Saturn-style: a faint inner ring, a dense bright one, a
 * gap, an outer ring, and a sparse haze of dust around it all. `share` is the
 * fraction of particles in each band.
 */
const BANDS = [
  { inner: 2.05, outer: 2.6, share: 0.14, thickness: 0.03, size: 0.8, alpha: 0.55 },
  { inner: 2.7, outer: 3.45, share: 0.42, thickness: 0.035, size: 1, alpha: 1 },
  { inner: 3.65, outer: 4.3, share: 0.3, thickness: 0.035, size: 0.9, alpha: 0.8 },
  { inner: 1.2, outer: 5.4, share: 0.14, thickness: 0.35, size: 0.75, alpha: 0.35 },
];
const COUNT = 3400;
const OUTER = 4.3;

/**
 * A planetary ring orbiting the hero text.
 *
 * The same ring is drawn on two canvases: one behind the text and one in
 * front of it. Each keeps only its half (split at the ring's centre depth), so
 * the ring passes behind the headline at the top and in front of it at the
 * bottom — the text reads as the planet it orbits.
 *
 * Orbits run on the GPU with Kepler-ish speeds (inner particles are faster).
 * Particles are soft dots and a few four-point stars, drawn analytically in
 * the fragment shader so their edges stay crisp at any size.
 */
const VERTEX_SHADER = /* glsl */ `
  attribute float aRadius;
  attribute float aAngle;
  attribute float aHeight;
  attribute float aSize;
  attribute float aSeed;
  attribute float aShape;  // 0 = dot, 1 = star
  attribute float aAlpha;

  uniform float uTime;
  uniform float uScale;
  uniform float uPixelRatio;
  uniform float uMotion;   // 0 when reduced motion is on
  uniform float uSide;     // -1 = behind the text, 1 = in front
  uniform float uCenterZ;  // view-space depth of the ring's centre
  uniform float uSpan;     // screen-space half-width used for the colour gradient
  uniform vec4 uTextBox;   // text block in clip space: centre xy, half-extents zw
  uniform vec3 uColorA;
  uniform vec3 uColorB;

  varying vec3 vColor;
  varying float vAlpha;
  varying float vSize;
  varying float vShape;

  void main() {
    float t = uTime * uMotion;
    float angle = aAngle + t * 0.16 * pow(aRadius / 2.05, -1.5);
    vec3 pos = vec3(cos(angle) * aRadius, aHeight, sin(angle) * aRadius);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);

    // Only draw the half of the ring that belongs on this canvas
    if ((mv.z - uCenterZ) * uSide < 0.0) {
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      gl_PointSize = 0.0;
      return;
    }

    gl_Position = projectionMatrix * mv;

    float near = clamp((mv.z - uCenterZ) / 3.0 * 0.5 + 0.5, 0.0, 1.0);
    float twinkle = 1.0 - 0.35 * uMotion * (0.5 + 0.5 * sin(uTime * 1.7 + aSeed * 40.0));
    float size = aSize * uScale * uPixelRatio * mix(0.75, 1.2, near) * twinkle / -mv.z;
    gl_PointSize = max(size, 1.0);
    vSize = gl_PointSize;
    vAlpha = aAlpha * mix(0.45, 1.0, near);

    // In front of the text, particles thin out as they cross the words so they stay readable
    if (uSide > 0.0) {
      vec2 ndc = gl_Position.xy / gl_Position.w;
      vec2 outside = abs(ndc - uTextBox.xy) - uTextBox.zw;
      float dist = max(outside.x, outside.y);
      vAlpha *= mix(0.22, 1.0, smoothstep(-0.02, 0.08, dist));
    }

    float across = clamp(gl_Position.x / gl_Position.w / uSpan * 0.5 + 0.5, 0.0, 1.0);
    vColor = mix(uColorA, uColorB, smoothstep(0.1, 0.9, across));
    vShape = aShape;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  varying float vSize;
  varying float vShape;

  float rhombus(vec2 p, float a, float b) {
    p = abs(p);
    return (p.x / a + p.y / b - 1.0) / length(vec2(1.0 / a, 1.0 / b));
  }

  void main() {
    vec2 p = gl_PointCoord * 2.0 - 1.0;
    float d = vShape > 0.5
      ? min(rhombus(p, 1.0, 0.24), rhombus(p, 0.24, 1.0))
      : length(p) - 0.55;
    // One pixel of smoothing, measured in point-sprite units
    float alpha = clamp(0.5 - d / (2.0 / vSize), 0.0, 1.0) * vAlpha;
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(vColor, alpha);
  }
`;

export class HeroScene {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private backRenderer!: THREE.WebGLRenderer;
  private frontRenderer!: THREE.WebGLRenderer;
  private ring!: THREE.Points;
  private material!: THREE.ShaderMaterial;
  private animationId: number | null = null;
  private mouseX = 0;
  private mouseY = 0;
  private tiltX = 0;
  private tiltY = 0;
  private resizeListener: () => void;
  private mouseMoveListener: (event: MouseEvent) => void;

  constructor(
    private back: HTMLDivElement,
    private front: HTMLDivElement,
    private text: HTMLElement,
    private ngZone: NgZone,
    private THREE: typeof import('three')
  ) {
    this.resizeListener = this.onResize.bind(this);
    this.mouseMoveListener = this.onMouseMove.bind(this);
    this.init();
  }

  private init() {
    const THREE = this.THREE;
    const width = this.back.clientWidth;
    const height = this.back.clientHeight;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(FOV, width / height, 0.1, 1000);
    this.camera.position.z = CAMERA_Z;

    this.backRenderer = this.createRenderer(this.back, width, height);
    this.frontRenderer = this.createRenderer(this.front, width, height);

    this.material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms: {
        uTime: { value: 0 },
        uScale: { value: this.pointScale(height) },
        uPixelRatio: { value: this.backRenderer.getPixelRatio() },
        uMotion: { value: reduceMotion ? 0 : 1 },
        uSide: { value: -1 },
        uCenterZ: { value: -CAMERA_Z },
        uSpan: { value: 0.85 },
        uTextBox: { value: new THREE.Vector4(0, 0, 0, 0) },
        uColorA: { value: new THREE.Color(COLOR_A) },
        uColorB: { value: new THREE.Color(COLOR_B) },
      },
      transparent: true,
      depthWrite: false,
    });

    this.createRing();
    this.fitToViewport(width, height);
    this.measureText();
    // Web fonts can shift the headline once they load
    document.fonts?.ready.then(() => this.measureText());
    this.startAnimation();
    this.addEventListeners();
  }

  private createRenderer(container: HTMLDivElement, width: number, height: number) {
    const renderer = new this.THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    return renderer;
  }

  /** World-unit point size → pixels at distance 1, for the current viewport height. */
  private pointScale(height: number) {
    return height / 2 / Math.tan(((FOV / 2) * Math.PI) / 180);
  }

  /** Shrink the ring on narrow screens so its outer edge stays in view. */
  private fitToViewport(width: number, height: number) {
    const halfWidth = Math.tan(((FOV / 2) * Math.PI) / 180) * CAMERA_Z * (width / height);
    // Portrait screens let the ring run a little past the edges so it still reads as an orbit
    const reach = width < height ? 1.2 : 0.9;
    const scale = Math.min(1, (halfWidth * reach) / OUTER);
    this.ring.scale.setScalar(scale);
  }

  /** Where the headline sits on screen, in clip space, for the front-side fade. */
  private measureText() {
    const box = this.back.getBoundingClientRect();
    const rect = this.text.getBoundingClientRect();
    if (!box.width || !box.height || !rect.width) return;
    const cx = ((rect.left + rect.width / 2 - box.left) / box.width) * 2 - 1;
    const cy = -(((rect.top + rect.height / 2 - box.top) / box.height) * 2 - 1);
    this.material.uniforms['uTextBox'].value.set(cx, cy, rect.width / box.width, rect.height / box.height);
  }

  private createRing() {
    const THREE = this.THREE;
    const radii = new Float32Array(COUNT);
    const angles = new Float32Array(COUNT);
    const heights = new Float32Array(COUNT);
    const sizes = new Float32Array(COUNT);
    const seeds = new Float32Array(COUNT);
    const shapes = new Float32Array(COUNT);
    const alphas = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      let pick = Math.random();
      const band = BANDS.find((b) => (pick -= b.share) < 0) ?? BANDS[1];
      // Area-uniform across the band, so it doesn't bunch up at the inner edge
      const r2 = band.inner ** 2 + Math.random() * (band.outer ** 2 - band.inner ** 2);
      radii[i] = Math.sqrt(r2);
      angles[i] = Math.random() * Math.PI * 2;
      heights[i] = (Math.random() + Math.random() - 1) * band.thickness;
      seeds[i] = Math.random();
      const star = Math.random() < 0.08;
      shapes[i] = star ? 1 : 0;
      sizes[i] = (star ? 0.07 + Math.random() * 0.04 : 0.024 + Math.random() * 0.026) * band.size;
      alphas[i] = band.alpha;
    }

    const geometry = new THREE.BufferGeometry();
    // Positions come from the shader; this only sets the vertex count
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3));
    geometry.setAttribute('aRadius', new THREE.BufferAttribute(radii, 1));
    geometry.setAttribute('aAngle', new THREE.BufferAttribute(angles, 1));
    geometry.setAttribute('aHeight', new THREE.BufferAttribute(heights, 1));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    geometry.setAttribute('aShape', new THREE.BufferAttribute(shapes, 1));
    geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));

    this.ring = new THREE.Points(geometry, this.material);
    // Every vertex sits at the origin before the shader moves it, so skip culling
    this.ring.frustumCulled = false;
    this.ring.rotation.set(TILT_X, 0, TILT_Z);
    this.scene.add(this.ring);
  }

  private startAnimation() {
    this.ngZone.runOutsideAngular(() => {
      const uniforms = this.material.uniforms;
      const animate = (time: number) => {
        this.animationId = requestAnimationFrame(animate);
        uniforms['uTime'].value = time * 0.001;

        // The ring leans gently towards the pointer
        this.tiltX += (-this.mouseY * 0.1 - this.tiltX) * 0.05;
        this.tiltY += (this.mouseX * 0.12 - this.tiltY) * 0.05;
        this.ring.rotation.set(TILT_X + this.tiltX, this.tiltY, TILT_Z);

        uniforms['uSide'].value = -1;
        this.backRenderer.render(this.scene, this.camera);
        uniforms['uSide'].value = 1;
        this.frontRenderer.render(this.scene, this.camera);
      };
      animate(0);
    });
  }

  private addEventListeners() {
    window.addEventListener('resize', this.resizeListener);
    window.addEventListener('mousemove', this.mouseMoveListener);
  }

  private onResize() {
    const width = this.back.clientWidth;
    const height = this.back.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.backRenderer.setSize(width, height);
    this.frontRenderer.setSize(width, height);
    this.material.uniforms['uScale'].value = this.pointScale(height);
    this.fitToViewport(width, height);
    this.measureText();
  }

  private onMouseMove(event: MouseEvent) {
    this.mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  public dispose() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }

    window.removeEventListener('resize', this.resizeListener);
    window.removeEventListener('mousemove', this.mouseMoveListener);

    this.ring?.geometry.dispose();
    this.material?.dispose();

    for (const [renderer, container] of [
      [this.backRenderer, this.back],
      [this.frontRenderer, this.front],
    ] as const) {
      if (!renderer) continue;
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    }
  }
}
